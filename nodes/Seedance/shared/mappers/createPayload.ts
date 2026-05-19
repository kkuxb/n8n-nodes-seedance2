import type { IDataObject } from 'n8n-workflow';

import type {
	SeedanceCreateInput,
	SeedanceReferenceMaterialInput,
	SeedanceReferenceMaterialSource,
	SeedanceReferenceMaterialType,
} from '../validators/create';
import { validateCreateInput } from '../validators/create';

type SeedanceReferenceRole = 'reference_image' | 'reference_video' | 'reference_audio';
type SeedanceReferenceContentType = 'image_url' | 'video_url' | 'audio_url';

interface SeedanceReferenceContentMapping {
	contentType: SeedanceReferenceContentType;
	role: SeedanceReferenceRole;
	contentKey: SeedanceReferenceContentType;
}

const REFERENCE_CONTENT_MAPPINGS: Record<
	SeedanceReferenceMaterialType,
	SeedanceReferenceContentMapping
> = {
	image: {
		contentType: 'image_url',
		role: 'reference_image',
		contentKey: 'image_url',
	},
	video: {
		contentType: 'video_url',
		role: 'reference_video',
		contentKey: 'video_url',
	},
	audio: {
		contentType: 'audio_url',
		role: 'reference_audio',
		contentKey: 'audio_url',
	},
};

export interface SeedanceReferenceRequestSummary extends IDataObject {
	index: number;
	type: SeedanceReferenceMaterialType;
	role: SeedanceReferenceRole;
	source: SeedanceReferenceMaterialSource;
}

export interface SeedanceCreateRequestSummary extends IDataObject {
	createMode: string;
	model: string;
	prompt?: string;
	referenceCount?: number;
	referenceTypes?: string[];
	referenceSources?: string[];
	referenceSummaries?: SeedanceReferenceRequestSummary[];
	resolution?: string;
	ratio?: string;
	duration?: number;
	seed?: number;
	watermark?: boolean;
	executionExpiresAfter?: number;
	returnLastFrame?: boolean;
	generateAudio?: boolean;
}

export interface SeedanceCreateResponse {
	id?: string;
	status?: string;
	created_at?: number;
	createdAt?: number;
	[key: string]: IDataObject | string | number | boolean | null | undefined | Array<IDataObject | string | number | boolean>;
}

function normalizeReferenceMaterialValue(referenceMaterial: SeedanceReferenceMaterialInput): string {
	const trimmedValue = referenceMaterial.value.trim();

	if (referenceMaterial.materialSource === 'asset') {
		return trimmedValue.startsWith('asset://') ? trimmedValue : `asset://${trimmedValue}`;
	}

	return trimmedValue;
}

function buildReferenceContentItem(referenceMaterial: SeedanceReferenceMaterialInput): IDataObject {
	const mapping = REFERENCE_CONTENT_MAPPINGS[referenceMaterial.materialType];
	const url = normalizeReferenceMaterialValue(referenceMaterial);

	return {
		type: mapping.contentType,
		role: mapping.role,
		[mapping.contentKey]: { url },
	};
}

function buildReferenceSummaryItem(
	referenceMaterial: SeedanceReferenceMaterialInput,
	index: number,
): SeedanceReferenceRequestSummary {
	const mapping = REFERENCE_CONTENT_MAPPINGS[referenceMaterial.materialType];

	return {
		index,
		type: referenceMaterial.materialType,
		role: mapping.role,
		source: referenceMaterial.materialSource,
	};
}

export function buildCreatePayload(input: SeedanceCreateInput): IDataObject {
	validateCreateInput(input);

	const content: Array<IDataObject> = [];
	
	if (typeof input.prompt === 'string' && input.prompt.trim() !== '') {
		content.push({
			type: 'text',
			text: input.prompt,
		});
	}

	if (input.firstFrameImage && input.firstFrameImage.data.trim() !== '') {
		const url = input.firstFrameImage.type === 'binary' 
			? `data:${input.firstFrameImage.mimeType};base64,${input.firstFrameImage.data}`
			: input.firstFrameImage.data;
		
		content.push({
			type: 'image_url',
			role: 'first_frame',
			image_url: { url },
		});
	}

	if (input.lastFrameImage && input.lastFrameImage.data.trim() !== '') {
		const url = input.lastFrameImage.type === 'binary' 
			? `data:${input.lastFrameImage.mimeType};base64,${input.lastFrameImage.data}`
			: input.lastFrameImage.data;
		
		content.push({
			type: 'image_url',
			role: 'last_frame',
			image_url: { url },
		});
	}

	if (input.createMode === 'multimodal_reference') {
		for (const referenceMaterial of input.referenceMaterials ?? []) {
			content.push(buildReferenceContentItem(referenceMaterial));
		}
	}

	const payload: IDataObject = {
		model: input.model,
		content,
	};

	if (input.resolution) payload.resolution = input.resolution;
	if (input.ratio) payload.ratio = input.ratio;
	if (typeof input.duration === 'number') payload.duration = input.duration;
	if (typeof input.seed === 'number') payload.seed = input.seed;
	if (typeof input.watermark === 'boolean') payload.watermark = input.watermark;
	if (typeof input.executionExpiresAfter === 'number') {
		payload.execution_expires_after = input.executionExpiresAfter;
	}
	if (typeof input.returnLastFrame === 'boolean') payload.return_last_frame = input.returnLastFrame;
	if (typeof input.generateAudio === 'boolean') payload.generate_audio = input.generateAudio;

	return payload;
}

export function buildCreateRequestSummary(input: SeedanceCreateInput): SeedanceCreateRequestSummary {
	validateCreateInput(input);

	return {
		createMode: input.createMode,
		model: input.model,
		prompt: input.prompt,
		...(input.createMode === 'multimodal_reference'
			? {
					referenceCount: input.referenceMaterials?.length ?? 0,
					referenceTypes: Array.from(
						new Set((input.referenceMaterials ?? []).map((item) => item.materialType)),
					),
					referenceSources: Array.from(
						new Set((input.referenceMaterials ?? []).map((item) => item.materialSource)),
					),
					referenceSummaries: (input.referenceMaterials ?? []).map((item, index) =>
						buildReferenceSummaryItem(item, index + 1),
					),
				}
			: {}),
		...(input.resolution ? { resolution: input.resolution } : {}),
		...(input.ratio ? { ratio: input.ratio } : {}),
		...(typeof input.duration === 'number' ? { duration: input.duration } : {}),
		...(typeof input.seed === 'number' ? { seed: input.seed } : {}),
		...(typeof input.watermark === 'boolean' ? { watermark: input.watermark } : {}),
		...(typeof input.executionExpiresAfter === 'number'
			? { executionExpiresAfter: input.executionExpiresAfter }
			: {}),
		...(typeof input.returnLastFrame === 'boolean' ? { returnLastFrame: input.returnLastFrame } : {}),
		...(typeof input.generateAudio === 'boolean' ? { generateAudio: input.generateAudio } : {}),
	};
}

export function mapCreateResponse(
	response: SeedanceCreateResponse,
	requestSummary: SeedanceCreateRequestSummary,
): IDataObject {
	const taskId = typeof response.id === 'string' ? response.id : undefined;
	const createdAt =
		typeof response.created_at === 'number'
			? response.created_at
			: typeof response.createdAt === 'number'
				? response.createdAt
				: undefined;

	return {
		taskId,
		status: typeof response.status === 'string' ? response.status : 'queued',
		...(createdAt !== undefined ? { createdAt } : {}),
		requestSummary,
		raw: response,
	};
}
