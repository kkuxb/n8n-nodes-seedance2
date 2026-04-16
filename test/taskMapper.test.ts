/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const taskMapperModule = await import('../dist/nodes/Seedance/shared/mappers/task.js');

const { mapTaskResponse } = taskMapperModule;

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
