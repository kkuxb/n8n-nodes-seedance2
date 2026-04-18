import type { INodeProperties } from 'n8n-workflow';

const listDisplayOptions = {
	show: {
		resource: ['task'],
		operation: ['list'],
	},
};

export const listOperationProperties: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: true,
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-return-all, n8n-nodes-base/node-param-description-boolean-without-whether
		description: '是否自动拉取所有分页结果。列表操作现在每个输入只返回 1 个 item，请从 json.tasks 读取任务数组。关闭后可指定页码和每页数量。提示：仅支持查询最近 7 天历史，且视频 URL 默认 24 小时后失效。',
		displayOptions: listDisplayOptions,
	},
	{
		displayName: 'Page Number',
		name: 'pageNum',
		type: 'number',
		default: 1,
		displayOptions: {
			show: {
				...listDisplayOptions.show,
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 20,
		displayOptions: {
			show: {
				...listDisplayOptions.show,
				returnAll: [false],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: listDisplayOptions,
		options: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Service Tier',
				name: 'serviceTier',
				type: 'options',
				options: [
					{
						name: 'Default (在线推理)',
						value: 'default',
					},
					{
						name: 'Flex (离线推理)',
						value: 'flex',
					},
				],
				default: 'default',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{
						name: 'Any',
						value: '',
					},
					{
						name: 'Cancelled',
						value: 'cancelled',
					},
					{
						name: 'Expired',
						value: 'expired',
					},
					{
						name: 'Failed',
						value: 'failed',
					},
					{
						name: 'Queued',
						value: 'queued',
					},
					{
						name: 'Running',
						value: 'running',
					},
					{
						name: 'Succeeded',
						value: 'succeeded',
					},
				],
				default: '',
			},
			{
				displayName: 'Task IDs',
				name: 'taskIds',
				type: 'string',
				default: '',
				description: 'Comma-separated task IDs (e.g. id1,id2)',
			},
		],
	},
];
