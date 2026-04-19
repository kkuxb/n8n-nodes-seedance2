import {
	SEEDREAM_IMAGE_ASPECT_RATIOS,
	SEEDREAM_IMAGE_RESOLUTIONS,
	SEEDREAM_RECOMMENDED_IMAGE_SIZES,
	SEEDREAM_REFERENCE_IMAGE_MAX_BYTES,
	SEEDREAM_REFERENCE_IMAGE_MAX_COUNT,
	SEEDREAM_REFERENCE_IMAGE_MIME_TYPES,
} from '../constants';
import type { SeedreamImagePayloadInput } from '../types';

function includesValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
	return typeof value === 'string' && values.includes(value);
}

function normalizeMaxImages(maxImages: number | undefined): number {
	if (
		typeof maxImages !== 'number' ||
		!Number.isInteger(maxImages) ||
		maxImages < 1 ||
		maxImages > 15
	) {
		throw new Error('组图最多生成图片数 maxImages 必须是 1 到 15 之间的整数。');
	}

	return maxImages;
}

export function validateSeedreamImageInput(input: SeedreamImagePayloadInput): void {
	const referenceImages = input.referenceImages ?? [];
	const referenceCount = referenceImages.length;

	if (referenceCount > SEEDREAM_REFERENCE_IMAGE_MAX_COUNT) {
		throw new Error('Seedream 参考图数量必须为 1 到 14 张，或不提供参考图进行文生图。');
	}

	for (const referenceImage of referenceImages) {
		if (referenceImage.source === 'binary') {
			if (!includesValue(SEEDREAM_REFERENCE_IMAGE_MIME_TYPES, referenceImage.mimeType)) {
				throw new Error('Seedream binary 参考图 MIME 类型必须是 jpeg、png、webp、bmp、tiff 或 gif。');
			}

			if (
				typeof referenceImage.byteLength === 'number' &&
				referenceImage.byteLength > SEEDREAM_REFERENCE_IMAGE_MAX_BYTES
			) {
				throw new Error('Seedream binary 参考图每张不能超过 10MB。');
			}
		}
	}

	if (input.sequentialImageGeneration === 'auto') {
		const maxImages = normalizeMaxImages(input.maxImages);

		if (referenceCount + maxImages > 15) {
			throw new Error('组图模式下参考图数量与最多生成图片数之和不能超过 15。');
		}
	} else if (typeof input.maxImages !== 'undefined') {
		normalizeMaxImages(input.maxImages);
	}

	if (!includesValue(SEEDREAM_IMAGE_RESOLUTIONS, input.imageResolution)) {
		throw new Error('图片分辨率必须是 Seedream 5.0 lite 支持的 2K 或 3K。');
	}

	if (!includesValue(SEEDREAM_IMAGE_ASPECT_RATIOS, input.imageAspectRatio)) {
		throw new Error('图片比例必须是 Seedream 5.0 lite 支持的推荐比例。');
	}

	if (!SEEDREAM_RECOMMENDED_IMAGE_SIZES[input.imageResolution]?.[input.imageAspectRatio]) {
		throw new Error('图片分辨率与比例组合不在 Seedream 5.0 lite 官方推荐尺寸中。');
	}
}
