/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createPayloadModule = await import('../dist/nodes/Seedance/shared/mappers/createPayload.js');

const { buildCreatePayload, buildCreateRequestSummary, mapCreateResponse } = createPayloadModule;

test('文生 create payload 自动构造 text content 项', () => {
	const payload = buildCreatePayload({
		model: 'doubao-seedance-1-5-pro-251215',
		prompt: '一只小猫对着镜头打哈欠',
		resolution: '720p',
		ratio: '16:9',
		duration: 5,
		seed: 11,
		watermark: true,
		serviceTier: 'default',
		executionExpiresAfter: 7200,
		returnLastFrame: true,
		generateAudio: false,
	});

	assert.equal(payload.model, 'doubao-seedance-1-5-pro-251215');
	assert.deepEqual(payload.content, [{ type: 'text', text: '一只小猫对着镜头打哈欠' }]);
	assert.equal(payload.duration, 5);
	assert.equal(payload.service_tier, 'default');
	assert.equal(payload.return_last_frame, true);
	assert.equal(payload.generate_audio, false);
});

test('duration 与 frames 互斥时抛出明确错误', () => {
	assert.throws(
		() =>
			buildCreatePayload({
				model: 'doubao-seedance-1-5-pro-251215',
				prompt: '城市夜景',
				duration: 5,
				frames: 57,
			}),
		/error/i,
	);
});

test('create request summary 保留后续轮询需要的关键输入摘要', () => {
	const summary = buildCreateRequestSummary({
		model: 'doubao-seedance-1-5-pro-251215',
		prompt: '海边日落延时摄影',
		frames: 57,
		watermark: false,
		serviceTier: 'flex',
	});

	assert.equal(summary.model, 'doubao-seedance-1-5-pro-251215');
	assert.equal(summary.prompt, '海边日落延时摄影');
	assert.equal(summary.frames, 57);
	assert.equal(summary.serviceTier, 'flex');
});

test('create 响应映射返回 taskId 与 requestSummary', () => {
	const summary = buildCreateRequestSummary({
		model: 'doubao-seedance-1-5-pro-251215',
		prompt: '宇航员漫步月球',
		duration: 5,
	});

	const mapped = mapCreateResponse(
		{
			id: 'task_123',
			status: 'queued',
			created_at: 1710000000,
		},
		summary,
	);

	assert.equal(mapped.taskId, 'task_123');
	assert.equal(mapped.status, 'queued');
	assert.equal(mapped.createdAt, 1710000000);
	assert.deepEqual(mapped.requestSummary, summary);
	assert.ok(mapped.raw);
});
