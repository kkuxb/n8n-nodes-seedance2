import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeExecutionData, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { createOperationProperties } from './description/create.operation';
import { imageOperationProperties } from './description/image.operation';
import { getOperationProperties } from './description/get.operation';
import { listOperationProperties } from './description/list.operation';
import { deleteOperationProperties } from './description/delete.operation';
import { buildCreatePayload, buildCreateRequestSummary, mapCreateResponse } from './shared/mappers/createPayload';
import { buildSeedreamImagePayload, mapSeedreamRecommendedSize } from './shared/mappers/seedreamImagePayload';
import { mapSeedreamImageResponse } from './shared/mappers/seedreamImageResult';
import { buildAggregatedListOutput, mapTaskResponse, selectSingleTaskResponse } from './shared/mappers/task';
import { getFriendlyDeleteError, normalizeSeedanceError } from './shared/mappers/errors';
import { pollTaskUntilSettled } from './shared/polling/getTaskPolling';
import { getSeedanceDeleteTaskEndpoint, getSeedanceOperationEndpoint } from './shared/transport/endpoints';
import { downloadSeedanceVideo, seedanceApiRequest } from './shared/transport/request';
import type { SeedanceCreateInput } from './shared/validators/create';
import { validateSeedreamImageInput } from './shared/validators/seedreamImage';
import type { SeedreamImagePayloadInput, SeedreamImageReferenceInput } from './shared/types';

export class Seedance implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Seedance',
		name: 'seedance',
		icon: 'file:seedance.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["generationMode"] === "image" ? ($parameter["imageOperation"] === "imageToImage" ? "图生图" : "文生图") : $parameter["operation"] === "create" ? "创建任务" : $parameter["operation"] === "get" ? "查询任务" : $parameter["operation"] === "list" ? "获取任务列表" : "取消 / 删除任务"}}',
		description: '在 n8n 中创建、查询和管理 Seedance 2.0 视频任务，并规划接入 Seedream 5.0 lite 图片生成。注意：生成结果 URL 默认仅 24 小时有效，请及时下载转存。',
		defaults: {
			name: 'Seedance',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'seedanceApi',
				displayName: 'Seedance 凭证',
				required: true,
				testedBy: 'seedanceApi',
			},
		],
		properties: [
			{
				displayName: '生成模式',
				name: 'generationMode',
				type: 'options',
				noDataExpression: true,
				default: 'video',
				options: [
					{
						name: '视频生成',
						value: 'video',
						description: '创建、查询、列表和取消或删除 Seedance 视频任务',
					},
					{
						name: '图像生成',
						value: 'image',
						description: '使用 Seedream 5.0 lite 生成图片',
					},
				],
			},
			{
				displayName: '操作',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'create',
				displayOptions: {
					show: {
						generationMode: ['video'],
					},
				},
				options: [
					{
						name: '创建任务',
						value: 'create',
						description: '创建 Seedance 2.0 文生视频任务',
						action: '创建视频生成任务',
					},
					{
						name: '查询任务',
						value: 'get',
						description: '根据任务 ID 查询 Seedance 任务状态',
						action: '查询视频生成任务',
					},
					{
						name: '获取任务列表',
						value: 'list',
						description: '获取最近 7 天内的任务列表',
						action: '获取视频生成任务列表',
					},
					{
						name: '取消 / 删除任务',
						value: 'delete',
						description: '取消排队中任务或删除已结束记录',
						action: '取消或删除任务',
					},
				],
			},
			...createOperationProperties,
			...imageOperationProperties,
			...getOperationProperties,
			...listOperationProperties,
			...deleteOperationProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const processBinaryImage = async (itemIndex: number, binaryProp: string) => {
			this.helpers.assertBinaryData(itemIndex, binaryProp);
			
			const itemBinary = items[itemIndex].binary?.[binaryProp];
			const mimeType = itemBinary?.mimeType ?? '';
			const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/gif'];
			
			if (!supportedMimeTypes.includes(mimeType)) {
				throw new NodeOperationError(this.getNode(), '不支持的图片格式。请使用 jpeg, png, webp, bmp, tiff 或 gif。', { itemIndex });
			}

			const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryProp);
			
			if (binaryData.length > 30 * 1024 * 1024) {
				throw new NodeOperationError(this.getNode(), '图片大小超出 30MB 限制。', { itemIndex });
			}

			return {
				type: 'binary' as const,
				data: binaryData.toString('base64'),
				mimeType,
			};
		};

		const processSeedreamBinaryReference = async (
			itemIndex: number,
			binaryProp: string,
		): Promise<SeedreamImageReferenceInput> => {
			this.helpers.assertBinaryData(itemIndex, binaryProp);
			const itemBinary = items[itemIndex].binary?.[binaryProp];
			const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryProp);

			return {
				source: 'binary',
				value: binaryData.toString('base64'),
				mimeType: itemBinary?.mimeType,
				byteLength: binaryData.length,
			};
		};

		const collectSeedreamReferenceImages = async (
			itemIndex: number,
			imageOperation: string,
		): Promise<SeedreamImageReferenceInput[]> => {
			if (imageOperation === 'textToImage') {
				return [];
			}

			const referenceImageSource = this.getNodeParameter(
				'referenceImageSource',
				itemIndex,
				'none',
			) as string;

			if (referenceImageSource === 'none') {
				return [];
			}

			if (referenceImageSource === 'url') {
				return (this.getNodeParameter('referenceImageUrl', itemIndex, '') as string)
					.split(',')
					.map((value) => value.trim())
					.filter((value) => value.length > 0)
					.map((value) => ({
						source: 'url' as const,
						value,
					}));
			}

			if (referenceImageSource === 'base64') {
				return [
					{
						source: 'base64',
						value: this.getNodeParameter('referenceImageBase64', itemIndex, '') as string,
					},
				];
			}

			if (referenceImageSource === 'binary') {
				const binaryProps = (this.getNodeParameter(
					'referenceImageBinaryProperty',
					itemIndex,
					'data',
				) as string)
					.split(',')
					.map((value) => value.trim())
					.filter((value) => value.length > 0);

				const references: SeedreamImageReferenceInput[] = [];
				for (const binaryProp of binaryProps) {
					references.push(await processSeedreamBinaryReference(itemIndex, binaryProp));
				}
				return references;
			}

			const referenceImagesCollection = this.getNodeParameter('referenceImages', itemIndex, {}) as IDataObject;
			const referenceItems = Array.isArray(referenceImagesCollection.items)
				? (referenceImagesCollection.items as IDataObject[])
				: [];
			const referenceImages: SeedreamImageReferenceInput[] = [];

			for (const referenceItem of referenceItems) {
				const source = referenceItem.source as string;

				if (source === 'binary') {
					referenceImages.push(
						await processSeedreamBinaryReference(
							itemIndex,
							(referenceItem.binaryProperty as string | undefined) ?? 'data',
						),
					);
				} else if (source === 'base64') {
					referenceImages.push({
						source: 'base64',
						value: (referenceItem.base64 as string | undefined) ?? '',
					});
				} else {
					referenceImages.push({
						source: 'url',
						value: (referenceItem.url as string | undefined) ?? '',
					});
				}
			}

			return referenceImages;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;
            const node = this.getNode();

			try {
				const generationMode = this.getNodeParameter('generationMode', itemIndex, 'video') as string;
				const imageOperation = this.getNodeParameter('imageOperation', itemIndex, '') as string;

				if (generationMode === 'image' || operation === 'generateImage') {
					const resolvedImageOperation = imageOperation || 'textToImage';
					const referenceImages = await collectSeedreamReferenceImages(itemIndex, resolvedImageOperation);
					const sequentialImageGeneration = this.getNodeParameter(
						'sequentialImageGeneration',
						itemIndex,
						'disabled',
					) as SeedreamImagePayloadInput['sequentialImageGeneration'];
					const maxImages = this.getNodeParameter('maxImages', itemIndex, 15) as number;
					const imageInput: SeedreamImagePayloadInput = {
						model: this.getNodeParameter('imageModel', itemIndex) as SeedreamImagePayloadInput['model'],
						prompt: this.getNodeParameter('imagePrompt', itemIndex, '') as string,
						referenceImages,
						sequentialImageGeneration,
						...(sequentialImageGeneration === 'auto' ? { maxImages } : {}),
						imageResolution: this.getNodeParameter(
							'imageResolution',
							itemIndex,
							'2K',
						) as SeedreamImagePayloadInput['imageResolution'],
						imageAspectRatio: this.getNodeParameter(
							'imageAspectRatio',
							itemIndex,
							'1:1',
						) as SeedreamImagePayloadInput['imageAspectRatio'],
						webSearch: this.getNodeParameter('webSearch', itemIndex, false) as boolean,
						optimizePromptMode: 'standard',
					};

					if (resolvedImageOperation === 'textToImage') {
						imageInput.referenceImages = [];
					}

					validateSeedreamImageInput(imageInput);

					const payload = buildSeedreamImagePayload(imageInput);
					const response = await seedanceApiRequest(this, {
						method: 'POST',
						path: getSeedanceOperationEndpoint('generateImage'),
						body: payload,
					});
					const mapped = mapSeedreamImageResponse(response, {
						model: imageInput.model,
						prompt: imageInput.prompt,
						size: mapSeedreamRecommendedSize(imageInput.imageResolution, imageInput.imageAspectRatio),
						referenceCount: imageInput.referenceImages?.length ?? 0,
						sequentialImageGeneration: imageInput.sequentialImageGeneration,
						...(imageInput.maxImages ? { maxImages: imageInput.maxImages } : {}),
						webSearch: imageInput.webSearch,
						optimizePromptMode: imageInput.optimizePromptMode,
					});

					returnData.push({
						json: mapped.json,
						...(mapped.binary ? { binary: mapped.binary as INodeExecutionData['binary'] } : {}),
						pairedItem: { item: itemIndex },
					});

					continue;
				}

				if (operation === 'create') {
					const advancedOptions = this.getNodeParameter('advancedOptions', itemIndex, {}) as IDataObject;

					const createMode = this.getNodeParameter('createMode', itemIndex, 't2v') as 't2v' | 'i2v_first' | 'i2v_first_last';
					const createInput: SeedanceCreateInput = {
						createMode,
						model: this.getNodeParameter('model', itemIndex) as string,
						prompt: this.getNodeParameter('prompt', itemIndex, '') as string,
						resolution: this.getNodeParameter('resolution', itemIndex) as string,
						ratio: this.getNodeParameter('ratio', itemIndex) as string,
						seed: (advancedOptions.seed as number | undefined) ?? -1,
						watermark: (advancedOptions.watermark as boolean | undefined) ?? false,
						executionExpiresAfter:
							(advancedOptions.executionExpiresAfter as number | undefined) ?? 172800,
						returnLastFrame:
							(advancedOptions.returnLastFrame as boolean | undefined) ?? false,
						generateAudio: this.getNodeParameter('generateAudio', itemIndex) as boolean,
					};

					if (createMode === 'i2v_first' || createMode === 'i2v_first_last') {
						const inputMethod = this.getNodeParameter('firstFrameInputMethod', itemIndex, 'url') as string;
						if (inputMethod === 'url') {
							createInput.firstFrameImage = {
								type: 'url',
								data: this.getNodeParameter('firstFrameImageUrl', itemIndex) as string,
							};
						} else if (inputMethod === 'binary') {
							const binaryProp = this.getNodeParameter('firstFrameBinaryProperty', itemIndex, 'data') as string;
							createInput.firstFrameImage = await processBinaryImage(itemIndex, binaryProp);
						}
					}

					if (createMode === 'i2v_first_last') {
						const inputMethod = this.getNodeParameter('lastFrameInputMethod', itemIndex, 'url') as string;
						if (inputMethod === 'url') {
							createInput.lastFrameImage = {
								type: 'url',
								data: this.getNodeParameter('lastFrameImageUrl', itemIndex) as string,
							};
						} else if (inputMethod === 'binary') {
							const binaryProp = this.getNodeParameter('lastFrameBinaryProperty', itemIndex, 'data') as string;
							createInput.lastFrameImage = await processBinaryImage(itemIndex, binaryProp);
						}
					}

					const durationValue = this.getNodeParameter('duration', itemIndex) as number;

					if (typeof durationValue === 'number' && Number.isFinite(durationValue)) {
						createInput.duration = durationValue;
					}

					const payload = buildCreatePayload(createInput);
					const requestSummary = buildCreateRequestSummary(createInput);
					const response = await seedanceApiRequest(this, {
						method: 'POST',
						path: getSeedanceOperationEndpoint('createTask'),
						body: payload,
					});

					returnData.push({
						json: mapCreateResponse(response as Parameters<typeof mapCreateResponse>[0], requestSummary),
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				if (operation === 'get') {
					const taskId = this.getNodeParameter('taskId', itemIndex) as string;
					const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex, true) as boolean;

					if (waitForCompletion === true) {
						const downloadVideo = this.getNodeParameter('downloadVideo', itemIndex, false) as boolean;
						const waitTimeoutMinutes = Number(
							this.getNodeParameter('waitTimeoutMinutes', itemIndex, 20),
						);

						if (!Number.isFinite(waitTimeoutMinutes) || waitTimeoutMinutes < 1) {
							throw new NodeOperationError(
								node,
								'最长等待时间必须是大于等于 1 的有限分钟数。',
								{ itemIndex },
							);
						}

						const taskResult = await pollTaskUntilSettled(this, {
								taskId,
								timeoutMs: waitTimeoutMinutes * 60_000,
							});

						const executionData: INodeExecutionData = {
							json: taskResult,
							pairedItem: { item: itemIndex },
						};

						if (
							downloadVideo === true &&
							taskResult.status === 'succeeded' &&
							typeof taskResult.videoUrl === 'string' &&
							taskResult.videoUrl !== ''
						) {
							const videoBinary = await downloadSeedanceVideo(this, taskResult.videoUrl, taskId);
							executionData.binary = {
								video: {
									data: videoBinary.data,
									mimeType: videoBinary.mimeType,
									fileName: videoBinary.fileName,
								},
							};
						}

						returnData.push(executionData);

						continue;
					}

					const response = await seedanceApiRequest(this, {
						method: 'GET',
						path: getSeedanceOperationEndpoint('getTask'),
						qs: { id: taskId },
					});

					let taskResponse;
					try {
						taskResponse = selectSingleTaskResponse(
							response as Parameters<typeof selectSingleTaskResponse>[0],
							taskId,
						);
					} catch (error) {
						throw new NodeOperationError(node, (error as Error).message, { itemIndex });
					}

					returnData.push({
						json: mapTaskResponse(taskResponse),
						pairedItem: { item: itemIndex },
					});
					
					continue;
				}

				if (operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', itemIndex, true) as boolean;
					const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

					const qs: IDataObject = {};

					if (additionalFields.status) {
						qs['filter.status'] = additionalFields.status;
					}
					if (additionalFields.taskIds) {
						qs['filter.task_ids'] = (additionalFields.taskIds as string)
							.split(',')
							.map((id) => id.trim())
							.filter((id) => id.length > 0);
					}
					if (additionalFields.model) {
						qs['filter.model'] = additionalFields.model;
					}
					if (additionalFields.serviceTier) {
						qs['filter.service_tier'] = additionalFields.serviceTier;
					}

					let page_num = 1;
					const page_size = returnAll ? 100 : (this.getNodeParameter('pageSize', itemIndex, 20) as number);

					if (!returnAll) {
						page_num = this.getNodeParameter('pageNum', itemIndex, 1) as number;
					}

					let loop = true;
					let safetyCounter = 0;
					const aggregatedTasks = [] as Parameters<typeof mapTaskResponse>[0][];

					while (loop && safetyCounter < 10) {
						qs.page_num = page_num;
						qs.page_size = page_size;

						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const response = await seedanceApiRequest<{ items?: any[] }>(this, {
							method: 'GET',
							path: getSeedanceOperationEndpoint('listTasks'),
							qs,
						});

						const tasks = response.items || [];
						for (const task of tasks) {
							aggregatedTasks.push(task);
						}

						if (!returnAll || tasks.length < page_size) {
							loop = false;
						} else {
							page_num++;
						}

						safetyCounter++;
					}

					returnData.push(
						buildAggregatedListOutput({
							tasks: aggregatedTasks,
							returnAll,
							pageNum: returnAll ? 1 : page_num,
							pageSize: page_size,
							itemIndex,
						}),
					);

					continue;
				}

				if (operation === 'delete') {
					const taskId = this.getNodeParameter('taskId', itemIndex) as string;
					
					await seedanceApiRequest(this, {
						method: 'DELETE',
						path: getSeedanceDeleteTaskEndpoint(taskId),
					});

					returnData.push({
						json: {
							success: true,
							taskId,
							action: 'deleted_or_cancelled',
							message: '已向 Seedance 提交取消或删除请求。实际结果取决于任务当前状态。',
						},
						pairedItem: { item: itemIndex },
					});

					continue;
				}
			} catch (error) {
				let normalized = normalizeSeedanceError(error);

				if (operation === 'delete') {
					const taskId = this.getNodeParameter('taskId', itemIndex, '') as string;
					normalized = getFriendlyDeleteError(normalized, taskId);
				}

				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: normalized,
							status: 'failed',
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeOperationError(node, normalized.message, { itemIndex });
			}
		}

		return [returnData];
	}
}
