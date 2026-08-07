import type { INodeProperties } from 'n8n-workflow';

import {
	getSeedanceVideoModelCapabilities,
	SEEDANCE_2_0_FAST_MODEL,
	SEEDANCE_2_0_MODEL,
	SEEDANCE_2_5_MODEL,
	SEEDANCE_RATIOS,
	SEEDANCE_VIDEO_MODEL_IDS,
} from '../shared/videoModels';

const createDisplayOptions = {
	show: {
		generationMode: ['video'],
		operation: ['create'],
	},
};

const imageFaceReferenceNotice =
	'Seedance 2.x 不支持直接上传未经授权的真人人脸参考素材，请使用平台信任的模型产物、预置虚拟人像或已授权真人素材。';

const modelOptions = SEEDANCE_VIDEO_MODEL_IDS.map((model) => {
	const capabilities = getSeedanceVideoModelCapabilities(model);

	return {
		name: capabilities.name,
		value: capabilities.id,
		description: capabilities.description,
	};
});

const ratioOptions = SEEDANCE_RATIOS.map((ratio) => ({
	name: ratio === 'adaptive' ? '自适应' : ratio,
	value: ratio,
}));

function buildResolutionOptions(
	model: (typeof SEEDANCE_VIDEO_MODEL_IDS)[number],
): Array<{ name: string; value: string }> {
	return getSeedanceVideoModelCapabilities(model).resolutions.map((resolution) => ({
		name: resolution === '4k' ? '4K' : resolution,
		value: resolution,
	}));
}

function buildDurationOptions(
	model: (typeof SEEDANCE_VIDEO_MODEL_IDS)[number],
): Array<{ name: string; value: number }> {
	const capabilities = getSeedanceVideoModelCapabilities(model);
	const options = [];

	for (let duration = capabilities.minimumDuration; duration <= capabilities.maximumDuration; duration++) {
		options.push({ name: `${duration} 秒`, value: duration });
	}

	options.push({ name: '自动', value: -1 });
	return options;
}

export const createOperationProperties: INodeProperties[] = [
	{
		displayName: '模型',
		name: 'model',
		type: 'options',
		default: SEEDANCE_2_5_MODEL,
		options: modelOptions,
		required: true,
		description: '选择视频生成模型。新建节点默认使用 Seedance 2.5',
		displayOptions: createDisplayOptions,
	},
	{
		displayName: '创建模式',
		name: 'createMode',
		type: 'options',
		default: 't2v',
		options: [
			{ name: '文生视频', value: 't2v' },
			{ name: '首帧图生视频', value: 'i2v_first' },
			{ name: '首尾帧图生视频', value: 'i2v_first_last' },
			{
				name: '多模态参考生视频',
				value: 'multimodal_reference',
				description: '使用参考图片、视频、音频和可选提示词生成视频',
			},
		],
		description: '选择视频生成的方式',
		displayOptions: createDisplayOptions,
	},
	{
		displayName: '提示词',
		name: 'prompt',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: '请输入视频提示词；图生和多模态参考生视频模式下提示词为可选',
		displayOptions: createDisplayOptions,
	},
	{
		displayName: '首帧图片输入方式',
		name: 'firstFrameInputMethod',
		type: 'options',
		default: 'url',
		options: [
			{ name: '图片 URL', value: 'url' },
			{ name: 'Binary文件', value: 'binary' },
		],
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['i2v_first', 'i2v_first_last'],
			},
		},
	},
	{
		displayName: '首帧图片 URL',
		name: 'firstFrameImageUrl',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['i2v_first', 'i2v_first_last'],
				firstFrameInputMethod: ['url'],
			},
		},
		description: `可公网访问的首帧图片 URL。${imageFaceReferenceNotice}`,
	},
	{
		displayName: '首帧二进制属性名',
		name: 'firstFrameBinaryProperty',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['i2v_first', 'i2v_first_last'],
				firstFrameInputMethod: ['binary'],
			},
		},
		description: `包含首帧图片的输入 binary 属性名，默认 data。${imageFaceReferenceNotice}`,
	},
	{
		displayName: '尾帧图片输入方式',
		name: 'lastFrameInputMethod',
		type: 'options',
		default: 'url',
		options: [
			{ name: '图片 URL', value: 'url' },
			{ name: 'Binary文件', value: 'binary' },
		],
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['i2v_first_last'],
			},
		},
	},
	{
		displayName: '尾帧图片 URL',
		name: 'lastFrameImageUrl',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['i2v_first_last'],
				lastFrameInputMethod: ['url'],
			},
		},
		description: `可公网访问的尾帧图片 URL。${imageFaceReferenceNotice}`,
	},
	{
		displayName: '尾帧二进制属性名',
		name: 'lastFrameBinaryProperty',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['i2v_first_last'],
				lastFrameInputMethod: ['binary'],
			},
		},
		description: `包含尾帧图片的输入 binary 属性名，默认 data。${imageFaceReferenceNotice}`,
	},
	{
		displayName: '参考素材',
		name: 'referenceMaterials',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: '添加参考素材',
		description: '添加多模态参考生视频使用的图片、视频或音频素材。',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				createMode: ['multimodal_reference'],
			},
		},
		options: [
			{
				displayName: '素材',
				name: 'items',
				values: [
					{
						displayName: '素材类型',
						name: 'materialType',
						type: 'options',
						default: 'image',
						options: [
							{ name: '图片', value: 'image' },
							{ name: '视频', value: 'video' },
							{ name: '音频', value: 'audio' },
						],
					},
					{
						displayName: '素材来源',
						name: 'materialSource',
						type: 'options',
						default: 'url',
						options: [
							{ name: 'URL链接', value: 'url' },
							{ name: 'Binary文件', value: 'binary' },
							{ name: '火山方舟素材库', value: 'asset' },
						],
						displayOptions: {
							show: {
								materialType: ['image', 'audio'],
							},
						},
					},
					{
						displayName: '素材来源',
						name: 'videoMaterialSource',
						type: 'options',
						default: 'url',
						options: [
							{ name: 'URL链接', value: 'url' },
							{ name: '火山方舟素材库', value: 'asset' },
						],
						displayOptions: {
							show: {
								materialType: ['video'],
							},
						},
					},
					{
						displayName: '素材URL',
						name: 'materialUrl',
						type: 'string',
						default: '',
						description: `填写可公网访问的素材 URL。图片素材如包含真人脸，${imageFaceReferenceNotice}`,
						displayOptions: {
							show: {
								materialSource: ['url'],
							},
						},
					},
					{
						displayName: '素材URL',
						name: 'videoMaterialUrl',
						type: 'string',
						default: '',
						description: '填写可公网访问的视频素材 URL。',
						displayOptions: {
							show: {
								videoMaterialSource: ['url'],
							},
						},
					},
					{
						displayName: '属性名',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
						description: `填写 n8n 输入 item 中的 binary 属性名，默认 data；这不是上传控件。图片素材如包含真人脸，${imageFaceReferenceNotice}`,
						displayOptions: {
							show: {
								materialType: ['image', 'audio'],
								materialSource: ['binary'],
							},
						},
					},
					{
						displayName: '素材ID',
						name: 'assetId',
						type: 'string',
						default: '',
						description: `填写火山方舟素材库的素材 ID，支持裸 ID 或 asset://... URI。图片素材如包含真人脸，${imageFaceReferenceNotice}`,
						displayOptions: {
							show: {
								materialSource: ['asset'],
							},
						},
					},
					{
						displayName: '素材ID',
						name: 'videoAssetId',
						type: 'string',
						default: '',
						description: '填写火山方舟素材库的视频素材 ID，支持裸 ID 或 asset://... URI。',
						displayOptions: {
							show: {
								videoMaterialSource: ['asset'],
							},
						},
					},
				],
			},
		],
	},
	{
		displayName: '任务意图',
		name: 'multimodalTaskIntent',
		type: 'options',
		default: 'reference_generation',
		options: [
			{
				name: '参考生成',
				value: 'reference_generation',
				description: '根据参考素材生成新视频，可自由选择宽高比和时长',
			},
			{
				name: '视频编辑',
				value: 'video_edit',
				description: '编辑参考视频，宽高比和时长由输入视频自动确定',
			},
			{
				name: '视频延长',
				value: 'video_extension',
				description: '延长参考视频，宽高比由输入视频自动确定',
			},
		],
		description: '用于提前确定 Seedance 2.5 多模态任务的有效参数，不会发送给官方 API',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['multimodal_reference'],
			},
		},
	},
	{
		displayName: '分辨率',
		name: 'resolution',
		type: 'options',
		default: '720p',
		options: buildResolutionOptions(SEEDANCE_2_5_MODEL),
		description: '生成视频分辨率。Seedance 2.5 支持 480p 和 720p',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
			},
		},
	},
	{
		displayName: '分辨率',
		name: 'resolution',
		type: 'options',
		default: '720p',
		options: buildResolutionOptions(SEEDANCE_2_0_MODEL),
		description: '生成视频分辨率。Seedance 2.0 支持 480p、720p、1080p 和 4k',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_0_MODEL],
			},
		},
	},
	{
		displayName: '分辨率',
		name: 'resolution',
		type: 'options',
		default: '720p',
		options: buildResolutionOptions(SEEDANCE_2_0_FAST_MODEL),
		description: '生成视频分辨率。Seedance 2.0 Fast 支持 480p 和 720p',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_0_FAST_MODEL],
			},
		},
	},
	{
		displayName: '宽高比',
		name: 'ratio',
		type: 'options',
		default: 'adaptive',
		options: ratioOptions,
		description: '生成视频宽高比，默认使用自适应',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_0_MODEL, SEEDANCE_2_0_FAST_MODEL],
			},
		},
	},
	{
		displayName: '宽高比',
		name: 'ratio',
		type: 'options',
		default: 'adaptive',
		options: ratioOptions,
		description: '生成视频宽高比，默认使用自适应',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['t2v'],
			},
		},
	},
	{
		displayName: '宽高比',
		name: 'ratio',
		type: 'options',
		default: 'adaptive',
		options: ratioOptions,
		description: '参考生成可选择固定宽高比或自适应',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['multimodal_reference'],
				multimodalTaskIntent: ['reference_generation'],
			},
		},
	},
	{
		displayName: '宽高比',
		name: 'forcedRatio',
		type: 'options',
		default: 'adaptive',
		options: [{ name: '自适应（该任务要求）', value: 'adaptive' }],
		description: '官方要求该任务使用自适应宽高比',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['i2v_first', 'i2v_first_last'],
			},
		},
	},
	{
		displayName: '宽高比',
		name: 'forcedRatio',
		type: 'options',
		default: 'adaptive',
		options: [{ name: '自适应（该任务要求）', value: 'adaptive' }],
		description: '官方要求视频编辑和视频延长任务使用自适应宽高比',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['multimodal_reference'],
				multimodalTaskIntent: ['video_edit', 'video_extension'],
			},
		},
	},
	{
		displayName: '视频时长',
		name: 'duration',
		type: 'options',
		default: 5,
		options: buildDurationOptions(SEEDANCE_2_0_MODEL),
		description: '支持 4 到 15 秒，或由模型自动选择',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_0_MODEL, SEEDANCE_2_0_FAST_MODEL],
			},
		},
	},
	{
		displayName: '视频时长',
		name: 'duration',
		type: 'options',
		default: -1,
		options: buildDurationOptions(SEEDANCE_2_5_MODEL),
		description: '支持 4 到 30 秒，或由模型自动选择',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['t2v', 'i2v_first', 'i2v_first_last'],
			},
		},
	},
	{
		displayName: '视频时长',
		name: 'duration',
		type: 'options',
		default: -1,
		options: buildDurationOptions(SEEDANCE_2_5_MODEL),
		description: '支持 4 到 30 秒，或由模型自动选择',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['multimodal_reference'],
				multimodalTaskIntent: ['reference_generation'],
			},
		},
	},
	{
		displayName: '视频时长',
		name: 'extensionDuration',
		type: 'options',
		default: -1,
		options: buildDurationOptions(SEEDANCE_2_5_MODEL),
		description: '视频延长默认使用自动，也可选择 4 到 30 秒。',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['multimodal_reference'],
				multimodalTaskIntent: ['video_extension'],
			},
		},
	},
	{
		displayName: '视频时长',
		name: 'forcedDuration',
		type: 'options',
		default: -1,
		options: [{ name: '自动（该任务要求）', value: -1 }],
		description: '官方要求视频编辑任务由输入视频自动确定时长',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
				createMode: ['multimodal_reference'],
				multimodalTaskIntent: ['video_edit'],
			},
		},
	},
	{
		displayName: '输出格式',
		name: 'outputFormat',
		type: 'options',
		default: 'mp4',
		options: [
			{ name: 'MP4', value: 'mp4' },
			{ name: 'MOV', value: 'mov' },
		],
		description: 'Seedance 2.5 支持 MP4 和适合专业后期处理的 MOV 格式',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: [SEEDANCE_2_5_MODEL],
			},
		},
	},
	{
		displayName: '生成音频',
		name: 'generateAudio',
		type: 'boolean',
		default: true,
		description: 'Whether 生成与画面同步的音频。Seedance 2.x 支持有声或无声视频',
		displayOptions: createDisplayOptions,
	},
	{
		displayName: '高级选项',
		name: 'advancedOptions',
		type: 'collection',
		placeholder: '添加高级选项',
		default: {},
		displayOptions: createDisplayOptions,
		options: [
			{
				displayName: '添加水印',
				name: 'watermark',
				type: 'boolean',
				default: false,
				description: 'Whether 为生成视频添加水印',
			},
			{
				displayName: '返回尾帧图',
				name: 'returnLastFrame',
				type: 'boolean',
				default: false,
				description: 'Whether 在任务查询结果中返回生成视频的尾帧图地址',
			},
			{
				displayName: '任务超时时间',
				name: 'executionExpiresAfter',
				type: 'options',
				default: 172800,
				options: [
					{ name: '1 小时', value: 3600 },
					{ name: '6 小时', value: 21600 },
					{ name: '24 小时', value: 86400 },
					{ name: '48 小时', value: 172800 },
					{ name: '72 小时', value: 259200 },
				],
				description: '任务超时阈值，超过后任务会被标记为 expired',
			},
		],
	},
];
