import type { INodeProperties } from 'n8n-workflow';

const deleteDisplayOptions = {
	show: {
		resource: ['task'],
		operation: ['delete'],
	},
};

export const deleteOperationProperties: INodeProperties[] = [
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		default: '',
		required: true,
		description: '输入需要取消或删除的任务 ID',
		displayOptions: deleteDisplayOptions,
	},
];
