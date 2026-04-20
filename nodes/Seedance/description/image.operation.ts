import type { INodeProperties } from 'n8n-workflow';

import { SEEDREAM_IMAGE_MODEL } from '../shared/constants';

const imageModeDisplayOptions = {
	show: {
		generationMode: ['image'],
	},
};

const imageToImageDisplayOptions = {
	show: {
		...imageModeDisplayOptions.show,
		imageOperation: ['imageToImage'],
	},
};

const allImageOperationDisplayOptions = {
	show: {
		...imageModeDisplayOptions.show,
		imageOperation: ['textToImage', 'imageToImage'],
	},
};

export const imageOperationProperties: INodeProperties[] = [
	{
		displayName: '图像操作',
		name: 'imageOperation',
		type: 'options',
		noDataExpression: true,
		default: 'textToImage',
		displayOptions: imageModeDisplayOptions,
		options: [
			{
				name: '文生图',
				value: 'textToImage',
				description: '仅使用提示词生成图片',
				action: '文生图',
			},
			{
				name: '图生图',
				value: 'imageToImage',
				description: '使用提示词和参考图生成图片',
				action: '图生图',
			},
		],
	},
	{
		displayName: '图片模型',
		name: 'imageModel',
		type: 'options',
		default: SEEDREAM_IMAGE_MODEL,
		options: [
			{
				name: 'Seedream 5.0 Lite',
				value: SEEDREAM_IMAGE_MODEL,
				description: `模型 ID：${SEEDREAM_IMAGE_MODEL}`,
			},
		],
		description: '本里程碑固定使用 Seedream 5.0 lite 图片生成模型。',
		displayOptions: allImageOperationDisplayOptions,
	},
	{
		displayName: '图片提示词',
		name: 'imagePrompt',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: '输入图片生成提示词，建议不超过 300 个汉字或 600 个英文单词。',
		displayOptions: allImageOperationDisplayOptions,
	},
	{
		displayName: '优化提示词',
		name: 'optimizePrompt',
		type: 'boolean',
		default: true,
		description: 'Whether to use Seedream standard prompt optimization.',
		displayOptions: allImageOperationDisplayOptions,
	},
	{
		displayName: '参考图来源',
		name: 'referenceImageSource',
		type: 'options',
		default: 'url',
		options: [
			{ name: '图片 URL', value: 'url' },
			{ name: '二进制数据', value: 'binary' },
		],
		description: '选择参考图来源。可通过下方输入框用英文逗号或中文逗号分隔多个 URL 或 binary 属性名。',
		displayOptions: imageToImageDisplayOptions,
	},
	{
		displayName: '参考图 URL',
		name: 'referenceImageUrl',
		type: 'string',
		default: '',
		description: '可公网访问的参考图片 URL；支持用英文逗号或中文逗号分隔填写多个值，按顺序映射为多张参考图。',
		displayOptions: {
			show: {
				...imageToImageDisplayOptions.show,
				referenceImageSource: ['url'],
			},
		},
	},
	{
		displayName: '参考图 Base64',
		name: 'referenceImageBase64',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		description: '参考图片的 data:image/...;base64,... 字符串或纯 Base64 字符串。',
		displayOptions: {
			show: {
				...imageToImageDisplayOptions.show,
				referenceImageSource: ['base64'],
			},
		},
	},
	{
		displayName: '参考图 Binary 属性',
		name: 'referenceImageBinaryProperty',
		type: 'string',
		default: 'data',
		description: '包含参考图片的输入 binary 属性名；支持用英文逗号或中文逗号分隔填写多个属性名，按顺序读取多张参考图。',
		displayOptions: {
			show: {
				...imageToImageDisplayOptions.show,
				referenceImageSource: ['binary'],
			},
		},
	},
	{
		displayName: '参考图片',
		name: 'referenceImages',
		type: 'fixedCollection',
		default: {},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: '添加参考图片',
		description: '为组图或融合场景添加多张参考图。Seedream 5.0 lite 最多支持 14 张参考图。',
		displayOptions: {
			show: {
				...imageToImageDisplayOptions.show,
				referenceImageSource: ['multiple'],
			},
		},
		options: [
			{
				displayName: '图片',
				name: 'items',
				values: [
					{
						displayName: '来源',
						name: 'source',
						type: 'options',
						default: 'url',
						options: [
							{ name: '图片 URL', value: 'url' },
							{ name: 'Base64', value: 'base64' },
							{ name: '二进制数据', value: 'binary' },
						],
					},
					{
						displayName: '图片 URL',
						name: 'url',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Base64',
						name: 'base64',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Binary 属性',
						name: 'binaryProperty',
						type: 'string',
						default: 'data',
					},
				],
			},
		],
	},
	{
		displayName: '图片分辨率',
		name: 'imageResolution',
		type: 'options',
		default: '2K',
		options: [
			{ name: '2K', value: '2K' },
			{ name: '3K', value: '3K' },
		],
		description: '选择 Seedream 5.0 lite 官方推荐的输出分辨率档位。',
		displayOptions: allImageOperationDisplayOptions,
	},
	{
		displayName: '图片比例',
		name: 'imageAspectRatio',
		type: 'options',
		default: '1:1',
		options: [
			{ name: '1:1', value: '1:1' },
			{ name: '4:3', value: '4:3' },
			{ name: '3:4', value: '3:4' },
			{ name: '16:9', value: '16:9' },
			{ name: '9:16', value: '9:16' },
			{ name: '3:2', value: '3:2' },
			{ name: '2:3', value: '2:3' },
			{ name: '21:9', value: '21:9' },
		],
		description: '选择 Seedream 5.0 lite 官方推荐的输出宽高比例。',
		displayOptions: allImageOperationDisplayOptions,
	},
	{
		displayName: '组图模式',
		name: 'sequentialImageGeneration',
		type: 'boolean',
		default: false,
		description: 'Whether to let the model automatically decide if it should generate a related group of images.',
		displayOptions: allImageOperationDisplayOptions,
	},
	{
		displayName: '最多生成图片数',
		name: 'maxImages',
		type: 'number',
		default: 15,
		typeOptions: {
			minValue: 1,
			maxValue: 15,
			numberPrecision: 0,
		},
		description: '组图模式下最多生成的图片数量。参考图数量与生成图片数量总和不能超过 15。',
		displayOptions: {
			show: {
				...allImageOperationDisplayOptions.show,
				sequentialImageGeneration: [true],
			},
		},
	},
	{
		displayName: '启用联网搜索',
		name: 'webSearch',
		type: 'boolean',
		default: false,
		description: 'Whether to allow Seedream to use web search for more timely image generation context.',
		displayOptions: allImageOperationDisplayOptions,
	},
];
