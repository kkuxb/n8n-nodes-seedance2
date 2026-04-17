import { NodeOperationError, type IDataObject, type IExecuteFunctions, type INodeExecutionData, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { createOperationProperties } from './description/create.operation';
import { getOperationProperties } from './description/get.operation';
import { listOperationProperties } from './description/list.operation';
import { deleteOperationProperties } from './description/delete.operation';
import { buildCreatePayload, buildCreateRequestSummary, mapCreateResponse } from './shared/mappers/createPayload';
import { mapTaskResponse } from './shared/mappers/task';
import { normalizeSeedanceError } from './shared/mappers/errors';
import { getSeedanceOperationEndpoint } from './shared/transport/endpoints';
import { seedanceApiRequest } from './shared/transport/request';
import type { SeedanceCreateInput } from './shared/validators/create';

export class Seedance implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Seedance',
		name: 'seedance',
		icon: 'file:seedance.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] === "create" ? "创建任务" : "查询任务"}}',
		description: '在 n8n 中创建和查询 Seedance 2.0 文生视频任务',
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
				displayName: '资源',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'task',
				options: [
					{
						name: '任务',
						value: 'task',
					},
				],
			},
			{
				displayName: '操作',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'create',
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
				displayOptions: {
					show: {
						resource: ['task'],
					},
				},
			},
			...createOperationProperties,
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

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
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
					const response = await seedanceApiRequest(this, {
						method: 'GET',
						path: getSeedanceOperationEndpoint('getTask'),
						qs: { id: taskId },
					});

					returnData.push({
						json: mapTaskResponse(response as Parameters<typeof mapTaskResponse>[0]),
						pairedItem: { item: itemIndex },
					});
				}
			} catch (error) {
				const normalized = normalizeSeedanceError(error);

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

				throw error;
			}
		}

		return [returnData];
	}
}
