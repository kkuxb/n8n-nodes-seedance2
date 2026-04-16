import type { IDataObject } from 'n8n-workflow';

export interface SeedanceCreateInput extends IDataObject {
	model: string;
	prompt: string;
	resolution?: string;
	ratio?: string;
	duration?: number;
	frames?: number;
	seed?: number;
	watermark?: boolean;
	serviceTier?: string;
	executionExpiresAfter?: number;
	returnLastFrame?: boolean;
	generateAudio?: boolean;
}

export function validateCreateInput(input: SeedanceCreateInput): void {
	const hasDuration = typeof input.duration === 'number' && Number.isFinite(input.duration);
	const hasFrames = typeof input.frames === 'number' && Number.isFinite(input.frames);

	if (typeof input.model !== 'string' || input.model.trim() === '') {
		throw new Error('Model is required for Seedance create operation.');
	}

	if (typeof input.prompt !== 'string' || input.prompt.trim() === '') {
		throw new Error('Prompt is required for Seedance create operation.');
	}

	if (hasDuration && hasFrames) {
		throw new Error('Duration and frames are mutually exclusive. Set only one of them.');
	}

	if (hasDuration && !Number.isInteger(input.duration)) {
		throw new Error('Duration must be an integer number of seconds.');
	}

	if (hasFrames && !Number.isInteger(input.frames)) {
		throw new Error('Frames must be an integer.');
	}

	if (
		typeof input.executionExpiresAfter === 'number' &&
		(!Number.isInteger(input.executionExpiresAfter) ||
			input.executionExpiresAfter < 3600 ||
			input.executionExpiresAfter > 259200)
	) {
		throw new Error('Execution Expires After must be an integer between 3600 and 259200 seconds.');
	}

	if (
		typeof input.seed === 'number' &&
		(!Number.isInteger(input.seed) || input.seed < -1 || input.seed > 4294967295)
	) {
		throw new Error('Seed must be an integer between -1 and 4294967295.');
	}

	if (!hasDuration && !hasFrames) {
		return;
	}
}
