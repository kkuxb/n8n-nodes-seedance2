import type { IDataObject } from 'n8n-workflow';

import {
	SEEDREAM_IMAGE_RESPONSE_FORMAT,
	SEEDREAM_RECOMMENDED_IMAGE_SIZES,
} from '../constants';
import type {
	SeedreamImageAspectRatio,
	SeedreamImagePayloadInput,
	SeedreamImageReferenceInput,
	SeedreamImageResolution,
	SeedreamNormalizedReferenceImage,
} from '../types';

function isDataUrl(value: string): boolean {
	return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value.trim());
}

export function mapSeedreamRecommendedSize(
	resolution: SeedreamImageResolution,
	aspectRatio: SeedreamImageAspectRatio,
): string {
	return SEEDREAM_RECOMMENDED_IMAGE_SIZES[resolution][aspectRatio];
}

export function normalizeSeedreamReferenceImage(
	referenceImage: SeedreamImageReferenceInput,
): SeedreamNormalizedReferenceImage {
	const value = referenceImage.value.trim();

	if (referenceImage.source === 'url') {
		return { source: 'url', value };
	}

	if (isDataUrl(value)) {
		return { source: 'dataUrl', value };
	}

	if (!referenceImage.mimeType) {
		throw new Error('Base64 或 binary 参考图必须提供 MIME 类型。');
	}

	return {
		source: 'dataUrl',
		value: `data:${referenceImage.mimeType};base64,${value}`,
	};
}

export function buildSeedreamImagePayload(input: SeedreamImagePayloadInput): IDataObject {
	const normalizedReferences = (input.referenceImages ?? []).map(normalizeSeedreamReferenceImage);
	const payload: IDataObject = {
		model: input.model,
		prompt: input.prompt,
		size: mapSeedreamRecommendedSize(input.imageResolution, input.imageAspectRatio),
		response_format: SEEDREAM_IMAGE_RESPONSE_FORMAT,
		sequential_image_generation: input.sequentialImageGeneration,
		optimize_prompt_options: {
			mode: input.optimizePromptMode,
		},
	};

	if (normalizedReferences.length === 1) {
		payload.image = normalizedReferences[0].value;
	} else if (normalizedReferences.length > 1) {
		payload.image = normalizedReferences.map((referenceImage) => referenceImage.value);
	}

	if (input.sequentialImageGeneration === 'auto') {
		payload.sequential_image_generation_options = {
			max_images: input.maxImages,
		};
	}

	if (input.webSearch) {
		payload.tools = [{ type: 'web_search' }];
	}

	return payload;
}
