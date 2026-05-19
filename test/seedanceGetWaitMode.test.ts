/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = await import('../dist/nodes/Seedance/Seedance.node.js');

const { Seedance } = nodeModule;

type ResponseShape = Record<string, unknown>;

function createExecutionContext(parameters: Record<string, unknown>, responses: ResponseShape[]) {
	const calls: Array<Record<string, unknown>> = [];

	return {
		calls,
		context: {
			getInputData() {
				return [{ json: {} }];
			},
			getNodeParameter(name: string, _itemIndex: number, fallback?: unknown) {
				return Object.prototype.hasOwnProperty.call(parameters, name)
					? parameters[name]
					: fallback;
			},
			getNode() {
				return {
					name: 'Seedance',
					type: 'seedance',
					position: [0, 0],
					parameters,
				};
			},
			continueOnFail() {
				return false;
			},
			async getCredentials() {
				return { apiKey: 'test-api-key' };
			},
			helpers: {
				async httpRequest(options: Record<string, unknown>) {
					calls.push(options);
					const next = responses.shift();

					if (!next) {
						throw new Error('Unexpected extra request');
					}

					return next;
				},
				assertBinaryData() {
					throw new Error('assertBinaryData should not run in get tests');
				},
				async getBinaryDataBuffer() {
					throw new Error('getBinaryDataBuffer should not run in get tests');
				},
			},
		},
	};
}

async function withImmediatePollingTime(callback: () => Promise<void>) {
	const originalDateNow = Date.now;
	const originalSetTimeout = globalThis.setTimeout;
	let now = 0;

	Date.now = () => now;
	globalThis.setTimeout = ((handler: (...args: unknown[]) => void, _timeout?: number, ...args: unknown[]) => {
		now += 20_000;
		handler(...args);
		return 0 as unknown as ReturnType<typeof setTimeout>;
	}) as unknown as typeof setTimeout;

	try {
		await callback();
	} finally {
		Date.now = originalDateNow;
		globalThis.setTimeout = originalSetTimeout;
	}
}

test('waitForCompletion=false 时仅执行一次 GET 且保持即时查询契约', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_immediate',
			waitForCompletion: false,
		},
		[{ id: 'task_immediate', status: 'running' }],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0].json as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assert.equal(calls[0].method, 'GET');
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
	assert.deepEqual(calls[0].qs, { id: 'task_immediate' });
	assert.equal(output.taskId, 'task_immediate');
	assert.equal(output.status, 'running');
	assert.equal(output.shouldPoll, true);
	assert.equal('timedOut' in output, false);
	assert.equal('pollCount' in output, false);
	assert.equal('waitedMs' in output, false);
});

test('waitForCompletion=true 时走等待分支并返回轮询元数据', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_wait',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
		},
		[{ id: 'task_wait', status: 'succeeded' }],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0].json as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assert.equal(output.taskId, 'task_wait');
	assert.equal(output.status, 'succeeded');
	assert.equal(output.timedOut, false);
	assert.equal(output.pollCount, 1);
	assert.equal(typeof output.waitedMs, 'number');
	assert.equal((calls[0].qs as Record<string, unknown>).id, 'task_wait');
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
});

test('waitForCompletion=true 时 failed 多模态任务返回失败终态而不继续轮询', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_multimodal_failed',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
		},
		[
			{
				id: 'task_multimodal_failed',
				model: 'doubao-seedance-2-0-260128',
				status: 'failed',
				error: {
					code: 'INVALID_REFERENCE',
					message: 'reference media rejected',
				},
				content: {
					video_url: '',
				},
			},
		],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0].json as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assert.equal(output.taskId, 'task_multimodal_failed');
	assert.equal(output.model, 'doubao-seedance-2-0-260128');
	assert.equal(output.status, 'failed');
	assert.equal(output.timedOut, false);
	assert.equal(output.pollCount, 1);
	assert.equal(output.isSuccess, false);
	assert.equal(output.isFailure, true);
	assert.equal(output.shouldPoll, false);
	assert.deepEqual(output.error, {
		code: 'INVALID_REFERENCE',
		message: 'reference media rejected',
	});
});

test('waitForCompletion=true 超时时返回最新 running 任务且不附加下载结果', async () => {
	await withImmediatePollingTime(async () => {
		const { calls, context } = createExecutionContext(
			{
				operation: 'get',
				taskId: 'task_multimodal_timeout',
				waitForCompletion: true,
				waitTimeoutMinutes: 1,
				downloadVideo: true,
			},
			[
				{ id: 'task_multimodal_timeout', model: 'doubao-seedance-2-0-260128', status: 'queued' },
				{ id: 'task_multimodal_timeout', model: 'doubao-seedance-2-0-260128', status: 'running' },
				{ id: 'task_multimodal_timeout', model: 'doubao-seedance-2-0-260128', status: 'running' },
			],
		);

		const result = await Seedance.prototype.execute.call(context);
		const output = result[0][0];

		assert.equal(calls.length, 3);
		assert.deepEqual(calls.map((call) => call.qs), [
			{ id: 'task_multimodal_timeout' },
			{ id: 'task_multimodal_timeout' },
			{ id: 'task_multimodal_timeout' },
		]);
		assert.equal(output.json.taskId, 'task_multimodal_timeout');
		assert.equal(output.json.status, 'running');
		assert.equal(output.json.timedOut, true);
		assert.equal(output.json.pollCount, 3);
		assert.equal(output.json.waitedMs, 40_000);
		assert.equal(output.json.shouldPoll, true);
		assert.equal(output.binary, undefined);
	});
});

test('waitForCompletion=true 时非法 timeout 会立即抛出可读错误', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_invalid_timeout',
			waitForCompletion: true,
			waitTimeoutMinutes: Number.NaN,
		},
		[{ id: 'task_invalid_timeout', status: 'queued' }],
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String(
				(error as { message?: unknown; description?: unknown }).message ??
					(error as { description?: unknown }).description ??
					error,
			);
			assert.match(message, /最长等待时间必须是大于等于 1 的有限分钟数/);
			return true;
		},
	);

	assert.equal(calls.length, 0);
});

test('节点描述公开 waitForCompletion 与 waitTimeoutMinutes 参数', () => {
	const seedanceNode = new Seedance();
	const properties = seedanceNode.description.properties as Array<Record<string, unknown>>;
	const waitForCompletion = properties.find((property) => property.name === 'waitForCompletion');
	const waitTimeoutMinutes = properties.find((property) => property.name === 'waitTimeoutMinutes');
	const downloadVideo = properties.find((property) => property.name === 'downloadVideo');

	assert.ok(waitForCompletion);
	assert.ok(waitTimeoutMinutes);
	assert.ok(downloadVideo);
	assert.equal(waitForCompletion?.default, true);
	assert.equal(waitTimeoutMinutes?.default, 20);
	assert.equal(downloadVideo?.default, true);
	assert.match(String(waitForCompletion?.description), /20 秒/);
	assert.match(String(waitTimeoutMinutes?.description), /20 分钟/);
	assert.match(String(downloadVideo?.description), /binary\.video/);
	assert.deepEqual(downloadVideo?.displayOptions, {
		show: {
			generationMode: ['video'],
			operation: ['get'],
			waitForCompletion: [true],
		},
	});
});
