import type { IDataObject } from 'n8n-workflow';

import {
	SEEDANCE_VIDEO_AUDIO_MAX_BYTES,
	SEEDANCE_VIDEO_AUDIO_MIME_TYPES,
	SEEDANCE_VIDEO_IMAGE_MAX_BYTES,
	SEEDANCE_VIDEO_IMAGE_MIME_TYPES,
	SEEDANCE_VIDEO_LOCAL_REQUEST_MAX_BYTES,
} from '../constants';
import {
	getSeedanceVideoModelCapabilities,
	getSeedanceVideoParameterPolicy,
	isSeedanceVideoModel,
	SEEDANCE_2_5_MODEL,
	type SeedanceCreateMode,
	type SeedanceMultimodalTaskIntent,
	type SeedanceOutputFormat,
} from '../videoModels';

export type { SeedanceCreateMode } from '../videoModels';

export interface SeedanceImageInput {
	type: 'url' | 'binary';
	data: string;
	mimeType?: string;
	byteLength?: number;
	encodedByteLength?: number;
}

export type SeedanceReferenceMaterialType = 'image' | 'video' | 'audio';

export type SeedanceReferenceMaterialSource = 'url' | 'binary' | 'asset';

export interface SeedanceReferenceMaterialInput {
	materialType: SeedanceReferenceMaterialType;
	materialSource: SeedanceReferenceMaterialSource;
	value: string;
	mimeType?: string;
	byteLength?: number;
	encodedByteLength?: number;
}

export interface SeedanceCreateInput extends IDataObject {
	createMode: SeedanceCreateMode;
	model: string;
	prompt?: string;
	multimodalTaskIntent?: SeedanceMultimodalTaskIntent;
	firstFrameImage?: SeedanceImageInput;
	lastFrameImage?: SeedanceImageInput;
	referenceMaterials?: SeedanceReferenceMaterialInput[];
	resolution?: string;
	ratio?: string;
	duration?: number;
	outputFormat?: SeedanceOutputFormat;
	watermark?: boolean;
	executionExpiresAfter?: number;
	returnLastFrame?: boolean;
	generateAudio?: boolean;
}

const MULTIMODAL_TASK_INTENTS: readonly SeedanceMultimodalTaskIntent[] = [
	'reference_generation',
	'video_edit',
	'video_extension',
];

function includesValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
	return typeof value === 'string' && values.includes(value);
}

function formatBytesAsMb(bytes: number): number {
	return bytes / 1024 / 1024;
}

function getLocalRequestContribution(referenceMaterial: SeedanceReferenceMaterialInput): number {
	if (referenceMaterial.materialSource !== 'binary') {
		return 0;
	}

	if (typeof referenceMaterial.encodedByteLength === 'number') {
		return referenceMaterial.encodedByteLength;
	}

	if (referenceMaterial.value.startsWith('data:')) {
		return referenceMaterial.value.length;
	}

	return 0;
}

function validateBinaryReferenceMaterial(referenceMaterial: SeedanceReferenceMaterialInput): void {
	if (referenceMaterial.materialSource !== 'binary') {
		return;
	}

	if (referenceMaterial.materialType === 'image') {
		if (!includesValue(SEEDANCE_VIDEO_IMAGE_MIME_TYPES, referenceMaterial.mimeType)) {
			throw new Error('多模态 binary 参考图片 MIME 类型必须是 jpeg、png、webp、bmp、tiff、gif、heic 或 heif。');
		}

		if (
			typeof referenceMaterial.byteLength === 'number' &&
			referenceMaterial.byteLength > SEEDANCE_VIDEO_IMAGE_MAX_BYTES
		) {
			throw new Error('多模态 binary 参考图片单张不能超过 30MB。');
		}
	} else if (referenceMaterial.materialType === 'audio') {
		if (!includesValue(SEEDANCE_VIDEO_AUDIO_MIME_TYPES, referenceMaterial.mimeType)) {
			throw new Error('多模态 binary 参考音频 MIME 类型必须是 wav 或 mp3。');
		}

		if (
			typeof referenceMaterial.byteLength === 'number' &&
			referenceMaterial.byteLength > SEEDANCE_VIDEO_AUDIO_MAX_BYTES
		) {
			throw new Error('多模态 binary 参考音频单段不能超过 15MB。');
		}
	}
}

function getTaskIntent(input: SeedanceCreateInput): SeedanceMultimodalTaskIntent {
	if (input.multimodalTaskIntent !== undefined && MULTIMODAL_TASK_INTENTS.includes(input.multimodalTaskIntent)) {
		return input.multimodalTaskIntent;
	}

	return 'reference_generation';
}

function usesMultimodalTaskIntent(input: SeedanceCreateInput): boolean {
	return input.model === SEEDANCE_2_5_MODEL && input.createMode === 'multimodal_reference';
}

function getNormalizedRatio(
	input: SeedanceCreateInput,
	policy: ReturnType<typeof getSeedanceVideoParameterPolicy>,
): string {
	if (policy.forcedRatio !== undefined) {
		return policy.forcedRatio;
	}

	if (input.ratio !== undefined && policy.ratios.includes(input.ratio)) {
		return input.ratio;
	}

	return policy.defaultRatio;
}

function getNormalizedDuration(
	input: SeedanceCreateInput,
	policy: ReturnType<typeof getSeedanceVideoParameterPolicy>,
): number {
	if (policy.forcedDuration !== undefined) {
		return policy.forcedDuration;
	}

	if (input.duration !== undefined && policy.durations.includes(input.duration)) {
		return input.duration;
	}

	return policy.defaultDuration;
}

export function normalizeSeedanceCreateInput(input: SeedanceCreateInput): SeedanceCreateInput {
	if (!isSeedanceVideoModel(input.model)) {
		return { ...input };
	}

	const taskIntent = usesMultimodalTaskIntent(input) ? getTaskIntent(input) : 'reference_generation';
	const policy = getSeedanceVideoParameterPolicy(input.model, input.createMode, taskIntent);
	const normalizedInput: SeedanceCreateInput = {
		...input,
		multimodalTaskIntent: taskIntent,
		resolution: policy.capabilities.resolutions.includes(input.resolution ?? '')
			? input.resolution
			: policy.capabilities.defaultResolution,
		ratio: getNormalizedRatio(input, policy),
		duration: getNormalizedDuration(input, policy),
	};

	if (policy.capabilities.outputFormats.length > 0) {
		normalizedInput.outputFormat = policy.capabilities.outputFormats.includes(
			input.outputFormat as SeedanceOutputFormat,
		)
			? input.outputFormat
			: policy.capabilities.outputFormats[0];
	} else {
		delete normalizedInput.outputFormat;
	}

	if (!usesMultimodalTaskIntent(input)) {
		delete normalizedInput.multimodalTaskIntent;
	}

	return normalizedInput;
}

export function validateCreateInput(input: SeedanceCreateInput): void {
	if (typeof input.model !== 'string' || input.model.trim() === '') {
		throw new Error('请选择模型。');
	}

	if (!isSeedanceVideoModel(input.model)) {
		throw new Error('当前仅支持 Seedance 2.5、Seedance 2.0 和 Seedance 2.0 Fast 模型。');
	}

	let taskIntent: SeedanceMultimodalTaskIntent = 'reference_generation';
	if (usesMultimodalTaskIntent(input)) {
		taskIntent = input.multimodalTaskIntent ?? 'reference_generation';

		if (!MULTIMODAL_TASK_INTENTS.includes(taskIntent)) {
			throw new Error('多模态任务意图不受支持。');
		}
	}

	const capabilities = getSeedanceVideoModelCapabilities(input.model);
	const policy = getSeedanceVideoParameterPolicy(input.model, input.createMode, taskIntent);

	if (input.createMode === 't2v') {
		if (typeof input.prompt !== 'string' || input.prompt.trim() === '') {
			throw new Error('文生视频模式下，请输入提示词。');
		}
	} else if (input.createMode === 'i2v_first') {
		if (!input.firstFrameImage || !input.firstFrameImage.data.trim()) {
			throw new Error('首帧图生视频模式下，必须提供首帧图片。');
		}
	} else if (input.createMode === 'i2v_first_last') {
		if (!input.firstFrameImage || !input.firstFrameImage.data.trim()) {
			throw new Error('首尾帧图生视频模式下，必须提供首帧图片。');
		}
		if (!input.lastFrameImage || !input.lastFrameImage.data.trim()) {
			throw new Error('首尾帧图生视频模式下，必须提供尾帧图片。');
		}
	} else if (input.createMode === 'multimodal_reference') {
		validateReferenceMaterials(input, capabilities, taskIntent);
	} else {
		throw new Error('创建模式不受支持。');
	}

	if (typeof input.resolution === 'string' && !capabilities.resolutions.includes(input.resolution)) {
		throw new Error(`${capabilities.name} 仅支持 ${capabilities.resolutions.join('、')} 分辨率。`);
	}

	if (typeof input.ratio === 'string' && !policy.ratios.includes(input.ratio)) {
		throw new Error(`${capabilities.name} 当前任务仅支持 ${policy.ratios.join('、')} 宽高比。`);
	}

	if (typeof input.duration === 'number') {
		if (!Number.isInteger(input.duration)) {
			throw new Error('视频时长必须是整数秒。');
		}

		if (!policy.durations.includes(input.duration)) {
			throw new Error(`${capabilities.name} 当前任务的视频时长仅支持 ${formatDurationPolicy(policy.durations)}。`);
		}
	}

	if (typeof input.outputFormat === 'string' && !capabilities.outputFormats.includes(input.outputFormat)) {
		if (capabilities.outputFormats.length === 0) {
			throw new Error(`${capabilities.name} 不支持设置输出格式。`);
		}

		throw new Error(`${capabilities.name} 仅支持 ${capabilities.outputFormats.join('、')} 输出格式。`);
	}

	if (
		typeof input.executionExpiresAfter === 'number' &&
		(!Number.isInteger(input.executionExpiresAfter) ||
			input.executionExpiresAfter < 3600 ||
			input.executionExpiresAfter > 259200)
	) {
		throw new Error('任务超时时间必须是 3600 到 259200 之间的整数秒。');
	}
}

function validateReferenceMaterials(
	input: SeedanceCreateInput,
	capabilities: ReturnType<typeof getSeedanceVideoModelCapabilities>,
	taskIntent: SeedanceMultimodalTaskIntent,
): void {
	const referenceMaterials = Array.isArray(input.referenceMaterials) ? input.referenceMaterials : [];
	const imageCount = referenceMaterials.filter((item) => item.materialType === 'image').length;
	const videoCount = referenceMaterials.filter((item) => item.materialType === 'video').length;
	const audioCount = referenceMaterials.filter((item) => item.materialType === 'audio').length;

	if (referenceMaterials.length === 0) {
		throw new Error('多模态参考生视频模式下，请至少提供 1 个参考素材。');
	}

	if (!capabilities.allowsAudioOnlyReference && imageCount + videoCount === 0) {
		throw new Error(`${capabilities.name} 不支持纯音频参考，请至少提供 1 个参考图片或视频。`);
	}

	if ((taskIntent === 'video_edit' || taskIntent === 'video_extension') && videoCount === 0) {
		throw new Error('视频编辑或视频延长任务必须至少提供 1 个参考视频。');
	}

	if (imageCount > capabilities.maximumReferenceImages) {
		throw new Error(
			`${capabilities.name} 多模态参考生视频最多支持 ${capabilities.maximumReferenceImages} 张参考图片。`,
		);
	}

	if (videoCount > capabilities.maximumReferenceVideos) {
		throw new Error(
			`${capabilities.name} 多模态参考生视频最多支持 ${capabilities.maximumReferenceVideos} 个参考视频。`,
		);
	}

	if (audioCount > capabilities.maximumReferenceAudios) {
		throw new Error(
			`${capabilities.name} 多模态参考生视频最多支持 ${capabilities.maximumReferenceAudios} 段参考音频。`,
		);
	}

	for (const referenceMaterial of referenceMaterials) {
		if (typeof referenceMaterial.value !== 'string' || referenceMaterial.value.trim() === '') {
			throw new Error('参考素材的来源值不能为空，请填写素材URL、属性名或素材ID。');
		}

		if (referenceMaterial.materialType === 'video' && referenceMaterial.materialSource === 'binary') {
			throw new Error('视频参考素材不支持 Binary 文件来源，请使用 URL链接或火山方舟素材库。');
		}

		validateBinaryReferenceMaterial(referenceMaterial);
	}

	const localRequestBytes = referenceMaterials.reduce(
		(total, referenceMaterial) => total + getLocalRequestContribution(referenceMaterial),
		0,
	);

	if (localRequestBytes > SEEDANCE_VIDEO_LOCAL_REQUEST_MAX_BYTES) {
		throw new Error(
			`多模态本地 binary/data URL 请求体可计算部分不能超过 64MB，当前约 ${formatBytesAsMb(localRequestBytes).toFixed(1)}MB。`,
		);
	}
}

function formatDurationPolicy(durations: readonly number[]): string {
	if (durations.length === 1 && durations[0] === -1) {
		return '自动';
	}

	const concreteDurations = durations.filter((duration) => duration !== -1);
	return `${concreteDurations[0]} 到 ${concreteDurations.at(-1)} 秒，或自动`;
}
