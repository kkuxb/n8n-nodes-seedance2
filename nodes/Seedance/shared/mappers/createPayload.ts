import type { IDataObject } from 'n8n-workflow';

import type { SeedanceCreateInput } from '../validators/create';
import { validateCreateInput } from '../validators/create';

export interface SeedanceCreateRequestSummary extends IDataObject {
	model: string;
	prompt?: string;
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
		model: input.model,
		prompt: input.prompt,
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
