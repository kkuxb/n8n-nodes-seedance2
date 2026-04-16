import type { INodeProperties } from 'n8n-workflow';

const getDisplayOptions = {
	show: {
		resource: ['task'],
		operation: ['get'],
	},
};

export const getOperationProperties: INodeProperties[] = [
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		description: '需要查询的 Seedance 任务 ID（仅支持最近 7 天历史）',
		displayOptions: getDisplayOptions,
	},
];
