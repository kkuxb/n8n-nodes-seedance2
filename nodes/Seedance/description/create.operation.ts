import type { INodeProperties } from 'n8n-workflow';

const createDisplayOptions = {
	show: {
		generationMode: ['video'],
		operation: ['create'],
	},
};

const imageFaceReferenceNotice =
	'Seedance 2.0 当前只接受两类真人脸参考素材：Seedream 5.0 Lite 文生图生成的素材，或火山方舟素材库素材。';

export const createOperationProperties: INodeProperties[] = [
	{
		displayName: '模型',
		name: 'model',
		type: 'options',
		default: 'doubao-seedance-2-0-260128',
		options: [
			{
				name: 'Seedance 2.0',
				value: 'doubao-seedance-2-0-260128',
				description: '模型 ID：doubao-seedance-2-0-260128',
			},
			{
				name: 'Seedance 2.0 Fast',
				value: 'doubao-seedance-2-0-fast-260128',
				description: '模型 ID：doubao-seedance-2-0-fast-260128',
			},
		],
		required: true,
		description: '请选择当前节点支持的 Seedance 2.0 系列模型',
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
		displayName: '分辨率',
		name: 'resolution',
		type: 'options',
		default: '720p',
		options: [
			{ name: '480p', value: '480p' },
			{ name: '720p', value: '720p' },
			{ name: '1080p', value: '1080p' },
		],
		description: '生成视频分辨率。Seedance 2.0 支持 480p、720p 和 1080p',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: ['doubao-seedance-2-0-260128'],
			},
		},
	},
	{
		displayName: '分辨率',
		name: 'resolution',
		type: 'options',
		default: '720p',
		options: [
			{ name: '480p', value: '480p' },
			{ name: '720p', value: '720p' },
		],
		description: '生成视频分辨率。Seedance 2.0 Fast 支持 480p 和 720p',
		displayOptions: {
			show: {
				...createDisplayOptions.show,
				model: ['doubao-seedance-2-0-fast-260128'],
			},
		},
	},
	{
		displayName: '宽高比',
		name: 'ratio',
		type: 'options',
		default: 'adaptive',
		options: [
			{ name: '1:1', value: '1:1' },
			{ name: '16:9', value: '16:9' },
			{ name: '21:9', value: '21:9' },
			{ name: '3:4', value: '3:4' },
			{ name: '4:3', value: '4:3' },
			{ name: '9:16', value: '9:16' },
			{ name: '自适应', value: 'adaptive' },
		],
		description: '生成视频宽高比。Seedance 2.0 系列默认推荐使用自适应',
		displayOptions: createDisplayOptions,
	},
	{
		displayName: '视频时长',
		name: 'duration',
		type: 'options',
		default: 5,
		options: [
			{ name: '4 秒', value: 4 },
			{ name: '5 秒', value: 5 },
			{ name: '6 秒', value: 6 },
			{ name: '7 秒', value: 7 },
			{ name: '8 秒', value: 8 },
			{ name: '9 秒', value: 9 },
			{ name: '10 秒', value: 10 },
			{ name: '11 秒', value: 11 },
			{ name: '12 秒', value: 12 },
			{ name: '13 秒', value: 13 },
			{ name: '14 秒', value: 14 },
			{ name: '15 秒', value: 15 },
			{ name: '自动选择', value: -1 },
		],
		description: '生成视频时长。Seedance 2.0 系列支持 4 到 15 秒，或自动选择',
		displayOptions: createDisplayOptions,
	},
	{
		displayName: '生成音频',
		name: 'generateAudio',
		type: 'boolean',
		default: true,
		description: 'Whether 生成音频。Seedance 2.0 系列支持有声或无声视频',
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
				displayName: '随机种子',
				name: 'seed',
				type: 'number',
				default: -1,
				description: '用于控制生成随机性的种子值。设置为 -1 时由模型随机生成',
			},
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
