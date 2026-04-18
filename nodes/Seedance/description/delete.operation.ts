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
		description: '输入需要取消或删除的任务 ID。DELETE 会取消 queued 任务，或删除支持删除的 succeeded / failed / expired 记录；running 与 cancelled 状态不支持。',
		displayOptions: deleteDisplayOptions,
	},
];
