import type { IDataObject } from 'n8n-workflow';

import {
	SEEDANCE_VIDEO_AUDIO_MAX_BYTES,
	SEEDANCE_VIDEO_AUDIO_MIME_TYPES,
	SEEDANCE_VIDEO_IMAGE_MAX_BYTES,
	SEEDANCE_VIDEO_IMAGE_MIME_TYPES,
	SEEDANCE_VIDEO_LOCAL_REQUEST_MAX_BYTES,
} from '../constants';

export interface SeedanceImageInput {
	type: 'url' | 'binary';
	data: string;
	mimeType?: string;
	byteLength?: number;
	encodedByteLength?: number;
}

export type SeedanceCreateMode = 't2v' | 'i2v_first' | 'i2v_first_last' | 'multimodal_reference';

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
	firstFrameImage?: SeedanceImageInput;
	lastFrameImage?: SeedanceImageInput;
	referenceMaterials?: SeedanceReferenceMaterialInput[];
	resolution?: string;
	ratio?: string;
	duration?: number;
	seed?: number;
	watermark?: boolean;
	executionExpiresAfter?: number;
	returnLastFrame?: boolean;
	generateAudio?: boolean;
}

const SUPPORTED_MODELS = [
	'doubao-seedance-2-0-260128',
	'doubao-seedance-2-0-fast-260128',
];

const FAST_SEEDANCE_2_MODEL = 'doubao-seedance-2-0-fast-260128';

const SUPPORTED_RESOLUTIONS = ['480p', '720p', '1080p'];

const FAST_MODEL_RESOLUTIONS = ['480p', '720p'];

const SUPPORTED_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'];

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
			throw new Error(
				'多模态 binary 参考图片 MIME 类型必须是 jpeg、png、webp、bmp、tiff、gif、heic 或 heif。',
			);
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

export function validateCreateInput(input: SeedanceCreateInput): void {
	const hasDuration = typeof input.duration === 'number' && Number.isFinite(input.duration);

	if (typeof input.model !== 'string' || input.model.trim() === '') {
		throw new Error('请选择模型。');
	}

	if (!SUPPORTED_MODELS.includes(input.model)) {
		throw new Error('当前仅支持 Seedance 2.0 和 Seedance 2.0 fast 模型。');
	}

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
		const referenceMaterials = Array.isArray(input.referenceMaterials)
			? input.referenceMaterials
			: [];
		const imageCount = referenceMaterials.filter((item) => item.materialType === 'image').length;
		const videoCount = referenceMaterials.filter((item) => item.materialType === 'video').length;
		const audioCount = referenceMaterials.filter((item) => item.materialType === 'audio').length;

		if (imageCount + videoCount === 0) {
			throw new Error('多模态参考生视频模式下，请至少提供 1 个参考图片或参考视频。');
		}

		if (imageCount > 9) {
			throw new Error('多模态参考生视频最多支持 9 张参考图片。');
		}

		if (videoCount > 3) {
			throw new Error('多模态参考生视频最多支持 3 个参考视频。');
		}

		if (audioCount > 3) {
			throw new Error('多模态参考生视频最多支持 3 段参考音频。');
		}

		for (const referenceMaterial of referenceMaterials) {
			if (typeof referenceMaterial.value !== 'string' || referenceMaterial.value.trim() === '') {
				throw new Error('参考素材的来源值不能为空，请填写素材URL、属性名或素材ID。');
			}

			if (
				referenceMaterial.materialType === 'video' &&
				referenceMaterial.materialSource === 'binary'
			) {
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

	if (typeof input.resolution === 'string' && !SUPPORTED_RESOLUTIONS.includes(input.resolution)) {
		throw new Error('当前模型仅支持 480p、720p 和 1080p 分辨率。');
	}

	if (
		input.model === FAST_SEEDANCE_2_MODEL &&
		typeof input.resolution === 'string' &&
		!FAST_MODEL_RESOLUTIONS.includes(input.resolution)
	) {
		throw new Error('Seedance 2.0 Fast 不支持 1080p 分辨率，请选择 480p 或 720p。');
	}

	if (typeof input.ratio === 'string' && !SUPPORTED_RATIOS.includes(input.ratio)) {
		throw new Error('宽高比不在当前模型支持范围内。');
	}

	if (hasDuration && !Number.isInteger(input.duration)) {
		throw new Error('视频时长必须是整数秒。');
	}

	if (
		hasDuration &&
		input.duration !== undefined &&
		input.duration !== -1 &&
		(input.duration < 4 || input.duration > 15)
	) {
		throw new Error('Seedance 2.0 系列的视频时长仅支持 4 到 15 秒，或设置为 -1 自动选择。');
	}

	if (
		typeof input.executionExpiresAfter === 'number' &&
		(!Number.isInteger(input.executionExpiresAfter) ||
			input.executionExpiresAfter < 3600 ||
			input.executionExpiresAfter > 259200)
	) {
		throw new Error('任务超时时间必须是 3600 到 259200 之间的整数秒。');
	}

	if (
		typeof input.seed === 'number' &&
		(!Number.isInteger(input.seed) || input.seed < -1 || input.seed > 4294967295)
	) {
		throw new Error('随机种子必须是 -1 到 4294967295 之间的整数。');
	}
}
