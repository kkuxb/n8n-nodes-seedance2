import type { IDataObject } from 'n8n-workflow';

export interface SeedanceImageInput {
	type: 'url' | 'binary';
	data: string;
	mimeType?: string;
}

export type SeedanceCreateMode = 't2v' | 'i2v_first' | 'i2v_first_last' | 'multimodal_reference';

export type SeedanceReferenceMaterialType = 'image' | 'video' | 'audio';

export type SeedanceReferenceMaterialSource = 'url' | 'binary' | 'asset';

export interface SeedanceReferenceMaterialInput {
	materialType: SeedanceReferenceMaterialType;
	materialSource: SeedanceReferenceMaterialSource;
	value: string;
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

const SUPPORTED_RESOLUTIONS = ['480p', '720p'];

const SUPPORTED_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'];

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
		}
	}

	if (typeof input.resolution === 'string' && !SUPPORTED_RESOLUTIONS.includes(input.resolution)) {
		throw new Error('当前模型仅支持 480p 和 720p 分辨率。');
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
