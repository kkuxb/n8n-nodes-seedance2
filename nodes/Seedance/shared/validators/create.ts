import type { IDataObject } from 'n8n-workflow';

export interface SeedanceImageInput {
	type: 'url' | 'binary';
	data: string;
	mimeType?: string;
}

export interface SeedanceVideoReferenceInput {
	url: string;
}

export interface SeedanceCreateInput extends IDataObject {
	createMode: 't2v' | 'i2v_first' | 'i2v_first_last' | 'reference_images' | 'reference_videos';
	model: string;
	prompt?: string;
	firstFrameImage?: SeedanceImageInput;
	lastFrameImage?: SeedanceImageInput;
	referenceImages?: SeedanceImageInput[];
	referenceVideos?: SeedanceVideoReferenceInput[];
	referenceAudio?: Array<{ url: string }>;
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

const SUPPORTED_RESOLUTIONS_BY_MODEL: Record<string, string[]> = {
	'doubao-seedance-2-0-260128': ['480p', '720p', '1080p'],
	'doubao-seedance-2-0-fast-260128': ['480p', '720p'],
};

const SUPPORTED_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'];

export function validateCreateInput(input: SeedanceCreateInput): void {
	const hasDuration = typeof input.duration === 'number' && Number.isFinite(input.duration);
	const hasFirstFrameImage = !!input.firstFrameImage?.data.trim();
	const hasLastFrameImage = !!input.lastFrameImage?.data.trim();
	const referenceImages = input.referenceImages ?? [];
	const referenceVideos = input.referenceVideos ?? [];
	const hasReferenceImages = referenceImages.length > 0;
	const hasReferenceVideos = referenceVideos.length > 0;

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
		if (!hasFirstFrameImage) {
			throw new Error('首帧图生视频模式下，必须提供首帧图片。');
		}
	} else if (input.createMode === 'i2v_first_last') {
		if (!hasFirstFrameImage) {
			throw new Error('首尾帧图生视频模式下，必须提供首帧图片。');
		}
		if (!hasLastFrameImage) {
			throw new Error('首尾帧图生视频模式下，必须提供尾帧图片。');
		}
	} else if (input.createMode === 'reference_images') {
		if (referenceImages.length < 1 || referenceImages.length > 9) {
			throw new Error('参考图生视频模式下，必须提供 1 到 9 张参考图。');
		}

		for (const referenceImage of referenceImages) {
			if (typeof referenceImage.data !== 'string' || referenceImage.data.trim() === '') {
				throw new Error('参考图 URL、asset 或 binary 数据不能为空。');
			}
		}
	} else if (input.createMode === 'reference_videos') {
		if (referenceVideos.length < 1 || referenceVideos.length > 3) {
			throw new Error('参考视频生视频模式下，必须提供 1 到 3 个参考视频。');
		}

		for (const referenceVideo of referenceVideos) {
			if (typeof referenceVideo.url !== 'string' || referenceVideo.url.trim() === '') {
				throw new Error('参考视频 URL 或 asset 不能为空。');
			}

			if (/^(data:video\/|base64:|binary:)/i.test(referenceVideo.url.trim())) {
				throw new Error('当前不支持 binary/base64 参考视频输入。');
			}
		}
	}

	if (hasReferenceImages && hasReferenceVideos) {
		throw new Error('参考图与参考视频模式不能混用。');
	}

	if ((hasReferenceImages || hasReferenceVideos) && (hasFirstFrameImage || hasLastFrameImage)) {
		throw new Error('首帧/首尾帧模式与参考模式不能混用。');
	}

	if ((input.referenceAudio?.length ?? 0) > 0) {
		throw new Error('当前不支持参考音频输入。');
	}

	if (
		typeof input.resolution === 'string' &&
		!SUPPORTED_RESOLUTIONS_BY_MODEL[input.model]?.includes(input.resolution)
	) {
		if (input.model === 'doubao-seedance-2-0-260128') {
			throw new Error('Seedance 2.0 模型仅支持 480p、720p 和 1080p 分辨率。');
		}

		throw new Error('Seedance 2.0 Fast 模型仅支持 480p 和 720p 分辨率。');
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
