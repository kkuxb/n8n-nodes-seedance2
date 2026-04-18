import type { INodeProperties } from 'n8n-workflow';

const getDisplayOptions = {
	show: {
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
	{
		displayName: '等待任务完成',
		name: 'waitForCompletion',
		type: 'boolean',
		default: true,
		description:
			'Whether 默认开启等待模式。启用后节点会每 20 秒查询一次，最多等待 20 分钟；轮询期间会阻塞当前执行，直到任务进入终态或超时。',
		displayOptions: getDisplayOptions,
	},
	{
		displayName: '最长等待时间（分钟）',
		name: 'waitTimeoutMinutes',
		type: 'number',
		default: 20,
		typeOptions: {
			minValue: 1,
			numberPrecision: 0,
		},
		description:
			'等待模式下，节点会每 20 秒重新查询一次；超过这里设置的分钟数后返回当前最新任务状态，而不是无限等待。默认 20 分钟。',
		displayOptions: {
			show: {
				...getDisplayOptions.show,
				waitForCompletion: [true],
			},
		},
	},
	{
		displayName: '下载视频',
		name: 'downloadVideo',
		type: 'boolean',
		default: false,
		description: '仅在等待任务成功完成后下载视频，并将结果附加到 binary.video。',
		displayOptions: {
			show: {
				...getDisplayOptions.show,
				waitForCompletion: [true],
			},
		},
	},
];
