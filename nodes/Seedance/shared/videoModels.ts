export const SEEDANCE_2_5_MODEL = 'doubao-seedance-2-5-260628';

export const SEEDANCE_2_0_MODEL = 'doubao-seedance-2-0-260128';

export const SEEDANCE_2_0_FAST_MODEL = 'doubao-seedance-2-0-fast-260128';

export const SEEDANCE_VIDEO_MODEL_IDS = [SEEDANCE_2_5_MODEL, SEEDANCE_2_0_MODEL, SEEDANCE_2_0_FAST_MODEL] as const;

export type SeedanceVideoModel = (typeof SEEDANCE_VIDEO_MODEL_IDS)[number];

export type SeedanceCreateMode = 't2v' | 'i2v_first' | 'i2v_first_last' | 'multimodal_reference';

export type SeedanceMultimodalTaskIntent = 'reference_generation' | 'video_edit' | 'video_extension';

export type SeedanceOutputFormat = 'mp4' | 'mov';

export const SEEDANCE_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'] as const;

export interface SeedanceVideoModelCapabilities {
	id: SeedanceVideoModel;
	name: string;
	description: string;
	resolutions: readonly string[];
	defaultResolution: string;
	minimumDuration: number;
	maximumDuration: number;
	defaultDuration: number;
	maximumReferenceImages: number;
	maximumReferenceVideos: number;
	maximumReferenceAudios: number;
	allowsAudioOnlyReference: boolean;
	outputFormats: readonly SeedanceOutputFormat[];
}

export interface SeedanceVideoParameterPolicy {
	capabilities: SeedanceVideoModelCapabilities;
	ratios: readonly string[];
	durations: readonly number[];
	defaultRatio: string;
	defaultDuration: number;
	forcedRatio?: string;
	forcedDuration?: number;
}

const SEEDANCE_VIDEO_MODEL_CAPABILITIES: Record<SeedanceVideoModel, SeedanceVideoModelCapabilities> = {
	[SEEDANCE_2_5_MODEL]: {
		id: SEEDANCE_2_5_MODEL,
		name: 'Seedance 2.5',
		description: `模型 ID：${SEEDANCE_2_5_MODEL}`,
		resolutions: ['480p', '720p'],
		defaultResolution: '720p',
		minimumDuration: 4,
		maximumDuration: 30,
		defaultDuration: -1,
		maximumReferenceImages: 30,
		maximumReferenceVideos: 10,
		maximumReferenceAudios: 10,
		allowsAudioOnlyReference: true,
		outputFormats: ['mp4', 'mov'],
	},
	[SEEDANCE_2_0_MODEL]: {
		id: SEEDANCE_2_0_MODEL,
		name: 'Seedance 2.0',
		description: `模型 ID：${SEEDANCE_2_0_MODEL}`,
		resolutions: ['480p', '720p', '1080p', '4k'],
		defaultResolution: '720p',
		minimumDuration: 4,
		maximumDuration: 15,
		defaultDuration: 5,
		maximumReferenceImages: 9,
		maximumReferenceVideos: 3,
		maximumReferenceAudios: 3,
		allowsAudioOnlyReference: false,
		outputFormats: [],
	},
	[SEEDANCE_2_0_FAST_MODEL]: {
		id: SEEDANCE_2_0_FAST_MODEL,
		name: 'Seedance 2.0 Fast',
		description: `模型 ID：${SEEDANCE_2_0_FAST_MODEL}`,
		resolutions: ['480p', '720p'],
		defaultResolution: '720p',
		minimumDuration: 4,
		maximumDuration: 15,
		defaultDuration: 5,
		maximumReferenceImages: 9,
		maximumReferenceVideos: 3,
		maximumReferenceAudios: 3,
		allowsAudioOnlyReference: false,
		outputFormats: [],
	},
};

function buildDurationValues(minimum: number, maximum: number): number[] {
	const durations: number[] = [];

	for (let duration = minimum; duration <= maximum; duration++) {
		durations.push(duration);
	}

	durations.push(-1);
	return durations;
}

export function isSeedanceVideoModel(model: string): model is SeedanceVideoModel {
	return (SEEDANCE_VIDEO_MODEL_IDS as readonly string[]).includes(model);
}

export function getSeedanceVideoModelCapabilities(model: SeedanceVideoModel): SeedanceVideoModelCapabilities {
	return SEEDANCE_VIDEO_MODEL_CAPABILITIES[model];
}

export function getSeedanceVideoParameterPolicy(
	model: SeedanceVideoModel,
	createMode: SeedanceCreateMode,
	taskIntent: SeedanceMultimodalTaskIntent = 'reference_generation',
): SeedanceVideoParameterPolicy {
	const capabilities = getSeedanceVideoModelCapabilities(model);
	const durations = buildDurationValues(capabilities.minimumDuration, capabilities.maximumDuration);
	const policy: SeedanceVideoParameterPolicy = {
		capabilities,
		ratios: SEEDANCE_RATIOS,
		durations,
		defaultRatio: 'adaptive',
		defaultDuration: capabilities.defaultDuration,
	};

	if (model !== SEEDANCE_2_5_MODEL) {
		return policy;
	}

	const isFrameMode = createMode === 'i2v_first' || createMode === 'i2v_first_last';
	const isConstrainedMultimodalMode = createMode === 'multimodal_reference' && taskIntent !== 'reference_generation';

	if (isFrameMode || isConstrainedMultimodalMode) {
		policy.ratios = ['adaptive'];
		policy.forcedRatio = 'adaptive';
	}

	if (createMode === 'multimodal_reference' && taskIntent === 'video_edit') {
		policy.durations = [-1];
		policy.forcedDuration = -1;
	}

	return policy;
}
