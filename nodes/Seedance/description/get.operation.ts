import type { INodeProperties } from 'n8n-workflow';

const getDisplayOptions = {
	show: {
		resource: ['task'],
		operation: ['get'],
	},
};

export const getOperationProperties: INodeProperties[] = [
	{
		displayName: '任务 ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		description: '请输入需要查询的任务 ID。提示：仅支持查询最近 7 天内的任务，且视频 URL 默认 24 小时后失效。',
		displayOptions: getDisplayOptions,
	},
];
