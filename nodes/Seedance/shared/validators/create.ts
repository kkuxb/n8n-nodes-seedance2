import type { IDataObject } from 'n8n-workflow';

export interface SeedanceImageInput {
	type: 'url' | 'binary';
	data: string;
	mimeType?: string;
}

export interface SeedanceCreateInput extends IDataObject {
	createMode: 't2v' | 'i2v_first' | 'i2v_first_last';
	model: string;
	prompt?: string;
	firstFrameImage?: SeedanceImageInput;
	lastFrameImage?: SeedanceImageInput;
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
