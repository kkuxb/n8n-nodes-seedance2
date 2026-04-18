/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const taskMapperModule = await import('../dist/nodes/Seedance/shared/mappers/task.js');

const { mapTaskResponse, selectSingleTaskResponse, buildAggregatedListOutput, appendTaskWaitMetadata } = taskMapperModule;

const allStatuses = [
	['queued', false, false, false, true],
	['running', false, false, false, true],
	['cancelled', true, false, true, false],
	['succeeded', true, true, false, false],
	['failed', true, false, true, false],
	['expired', true, false, true, false],
] as const;

for (const [status, isTerminal, isSuccess, isFailure, shouldPoll] of allStatuses) {
	test(`状态 ${status} 映射出正确的衍生布尔字段`, () => {
		const mapped = mapTaskResponse({
			id: 'task_123',
			status,
			created_at: 1710000000,
			updated_at: 1710000001,
		});

		assert.equal(mapped.status, status);
		assert.equal(mapped.isTerminal, isTerminal);
		assert.equal(mapped.isSuccess, isSuccess);
		assert.equal(mapped.isFailure, isFailure);
		assert.equal(mapped.shouldPoll, shouldPoll);
		assert.ok(mapped.raw);
	});
}

test('成功任务映射 video_url、last_frame_url 与 usage', () => {
	const mapped = mapTaskResponse({
		id: 'task_success',
		model: 'doubao-seedance-1-5-pro-251215',
		status: 'succeeded',
		created_at: 1710000000,
		updated_at: 1710000600,
		content: {
			video_url: 'https://example.com/video.mp4',
			last_frame_url: 'https://example.com/last-frame.png',
		},
		usage: {
			completion_tokens: 100,
			total_tokens: 100,
		},
	});

	assert.equal(mapped.videoUrl, 'https://example.com/video.mp4');
	assert.equal(mapped.lastFrameUrl, 'https://example.com/last-frame.png');
	assert.deepEqual(mapped.usage, {
		completion_tokens: 100,
		total_tokens: 100,
	});
	assert.equal(mapped.error, null);
});

test('失败任务映射明确 error code 与 message', () => {
	const mapped = mapTaskResponse({
		id: 'task_failed',
		status: 'failed',
		error: {
			code: 'INVALID_ARGUMENT',
			message: 'prompt is invalid',
		},
	});

	assert.deepEqual(mapped.error, {
		code: 'INVALID_ARGUMENT',
		message: 'prompt is invalid',
	});
	assert.equal(mapped.videoUrl, undefined);
	assert.equal(mapped.isFailure, true);
	assert.match((mapped.retention as { message: string }).message, /7 天/);
	assert.match((mapped.retention as { message: string }).message, /24 小时/);
});

test('单任务响应保持既有映射字段契约', () => {
	const task = selectSingleTaskResponse(
		{
			id: 'task_123',
			status: 'succeeded',
			content: {
				video_url: 'https://example.com/video.mp4',
				last_frame_url: 'https://example.com/last-frame.png',
			},
		},
		'task_123',
	);

	const mapped = mapTaskResponse(task);

	assert.deepEqual(Object.keys(mapped), [
		'taskId',
		'model',
		'status',
		'createdAt',
		'updatedAt',
		'videoUrl',
		'lastFrameUrl',
		'usage',
		'error',
		'isTerminal',
		'isSuccess',
		'isFailure',
		'shouldPoll',
		'retention',
		'raw',
	]);
	assert.equal(mapped.taskId, 'task_123');
	assert.equal(mapped.status, 'succeeded');
	assert.equal(mapped.videoUrl, 'https://example.com/video.mp4');
	assert.equal(mapped.lastFrameUrl, 'https://example.com/last-frame.png');
	assert.equal(mapped.isTerminal, true);
	assert.equal(mapped.isSuccess, true);
	assert.equal(mapped.isFailure, false);
	assert.equal(mapped.shouldPoll, false);
	assert.match((mapped.retention as { message: string }).message, /7 天/);
	assert.ok(mapped.raw);
});

test('等待元数据以 additive 方式追加且保留既有任务映射键', () => {
	const mapped = mapTaskResponse({
		id: 'task_wait',
		status: 'running',
		created_at: 1710000000,
	});
	const originalKeys = Object.keys(mapped);

	const withWaitMetadata = appendTaskWaitMetadata(mapped, {
		timedOut: false,
		pollCount: 2,
		waitedMs: 20_000,
	});

	for (const key of originalKeys) {
		assert.equal(Object.prototype.hasOwnProperty.call(withWaitMetadata, key), true, `missing original key ${key}`);
		assert.deepEqual(withWaitMetadata[key], mapped[key]);
	}

	assert.equal(withWaitMetadata.timedOut, false);
	assert.equal(withWaitMetadata.pollCount, 2);
	assert.equal(withWaitMetadata.waitedMs, 20_000);
	assert.deepEqual(
		Object.keys(withWaitMetadata).slice(originalKeys.length),
		['timedOut', 'pollCount', 'waitedMs'],
	);
});

test('列表响应按 taskId 提取唯一匹配任务', () => {
	const task = selectSingleTaskResponse(
		{
			items: [
				{ id: 'task_001', status: 'queued' },
				{ id: 'task_123', status: 'running' },
			],
		},
		'task_123',
	);

	assert.deepEqual(task, { id: 'task_123', status: 'running' });
});

test('列表响应在没有匹配任务时抛出带 7 天提示的错误', () => {
	assert.throws(
		() =>
			selectSingleTaskResponse(
				{
					items: [{ id: 'task_001', status: 'queued' }],
				},
				'task_404',
			),
		(error: unknown) => {
			assert.ok(error instanceof Error);
			assert.match(error.message, /Task task_404 not found/);
			assert.match(error.message, /7 天|7-day/);
			return true;
		},
	);
});

test('列表响应在出现重复 taskId 时抛出歧义错误', () => {
	assert.throws(
		() =>
			selectSingleTaskResponse(
				{
					items: [
						{ id: 'task_dup', status: 'queued' },
						{ id: 'task_dup', status: 'running' },
					],
				},
				'task_dup',
			),
		(error: unknown) => {
			assert.ok(error instanceof Error);
			assert.match(error.message, /ambiguous/i);
			return true;
		},
	);
});

test('列表聚合输出为单个 item 且 json.tasks 保留映射后的任务数组与元数据', () => {
	const listItem = buildAggregatedListOutput({
		tasks: [
			{ id: 'task_123', status: 'queued' },
			{ id: 'task_456', status: 'succeeded', content: { video_url: 'https://example.com/video.mp4' } },
		],
		returnAll: true,
		pageNum: 1,
		pageSize: 100,
		itemIndex: 0,
	});

	assert.deepEqual(Object.keys(listItem.json as Record<string, unknown>), [
		'tasks',
		'count',
		'returnAll',
		'pageNum',
		'pageSize',
		'retention',
	]);
	assert.equal(Array.isArray((listItem.json as { tasks: unknown[] }).tasks), true);
	assert.equal((listItem.json as { tasks: unknown[] }).tasks.length, 2);
	assert.equal((listItem.json as { count: number }).count, 2);
	assert.equal((listItem.json as { returnAll: boolean }).returnAll, true);
	assert.equal((listItem.json as { pageNum: number }).pageNum, 1);
	assert.equal((listItem.json as { pageSize: number }).pageSize, 100);
	assert.match(((listItem.json as { retention: { message: string } }).retention.message), /7 天/);
	assert.deepEqual(listItem.pairedItem, { item: 0 });

	const tasks = (listItem.json as { tasks: Array<Record<string, unknown>> }).tasks;
	assert.equal(tasks[0].taskId, 'task_123');
	assert.equal(tasks[0].shouldPoll, true);
	assert.equal(tasks[1].taskId, 'task_456');
	assert.equal(tasks[1].isSuccess, true);
});
