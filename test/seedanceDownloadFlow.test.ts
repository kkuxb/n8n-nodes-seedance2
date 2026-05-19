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

					if (next.__error) {
						throw next.__error;
					}

					return next;
				},
				assertBinaryData() {
					throw new Error('assertBinaryData should not run in download flow tests');
				},
				async getBinaryDataBuffer() {
					throw new Error('getBinaryDataBuffer should not run in download flow tests');
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

test('wait + download + succeeded 返回原 json 并附加 binary.video', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_download_success',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
			downloadVideo: true,
		},
		[
			{
				id: 'task_download_success',
				status: 'succeeded',
				content: {
					video_url: 'https://example.com/assets/task_download_success.mp4',
				},
			},
			{
				body: Buffer.from('video-binary-content'),
				headers: {
					'content-type': 'video/mp4',
				},
			},
		],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];

	assert.equal(output.json.taskId, 'task_download_success');
	assert.equal(output.json.status, 'succeeded');
	assert.equal(output.json.videoUrl, 'https://example.com/assets/task_download_success.mp4');
	assert.equal(output.binary?.video?.mimeType, 'video/mp4');
	assert.equal(output.binary?.video?.fileName, 'task_download_success.mp4');
	assert.equal(output.binary?.video?.data, Buffer.from('video-binary-content').toString('base64'));
	assert.equal(calls.length, 2);
	assert.equal(calls[1].url, 'https://example.com/assets/task_download_success.mp4');
	assert.deepEqual(calls[1].headers, {});
	assert.equal(calls[1].sendCredentialsOnCrossOriginRedirect, false);
});

test('wait + download + 非 succeeded 终态不会触发下载', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_failed',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
			downloadVideo: true,
		},
		[{ id: 'task_failed', status: 'failed' }],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];

	assert.equal(output.json.status, 'failed');
	assert.equal(output.binary, undefined);
	assert.equal(calls.length, 1);
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
});

test('wait + download 失败时抛出原始错误并保留 24 hours 提示', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_expired_asset',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
			downloadVideo: true,
		},
		[
			{
				id: 'task_expired_asset',
				status: 'succeeded',
				content: {
					video_url: 'https://example.com/assets/task_expired_asset.mp4',
				},
			},
			{
				__error: {
					response: {
						statusCode: 404,
						body: {
							error: {
								message: 'provider said asset not found',
							},
						},
					},
				},
			},
		],
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as Error).message ?? error);
			assert.match(message, /asset not found/);
			assert.match(message, /24 hours/);
			return true;
		},
	);

	assert.equal(calls.length, 2);
});

test('wait + download 失败时顶层抛错使用归一化后的可读消息', async () => {
	const { context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_expired_asset_message',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
			downloadVideo: true,
		},
		[
			{
				id: 'task_expired_asset_message',
				status: 'succeeded',
				content: {
					video_url: 'https://example.com/assets/task_expired_asset_message.mp4',
				},
			},
			{
				__error: {
					response: {
						statusCode: 403,
						body: {
							error: {
								message: 'Request failed with status code 403',
							},
						},
					},
				},
			},
		],
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String(
				(error as { message?: unknown; description?: unknown }).message ??
					(error as { description?: unknown }).description ??
					error,
			);
			assert.match(message, /Request failed with status code 403/);
			assert.match(message, /24 hours/);
			return true;
		},
	);
});

test('wait disabled 时即使 downloadVideo=true 也不会下载', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_immediate_download_disabled',
			waitForCompletion: false,
			downloadVideo: true,
		},
		[
			{
				id: 'task_immediate_download_disabled',
				status: 'succeeded',
				content: {
					video_url: 'https://example.com/assets/task_immediate_download_disabled.mp4',
				},
			},
		],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];

	assert.equal(output.json.status, 'succeeded');
	assert.equal(output.binary, undefined);
	assert.equal(calls.length, 1);
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
});

test('succeeded 但 downloadVideo=false 时不会下载', async () => {
	const { calls, context } = createExecutionContext(
		{
			operation: 'get',
			taskId: 'task_success_download_false',
			waitForCompletion: true,
			waitTimeoutMinutes: 20,
			downloadVideo: false,
		},
		[
			{
				id: 'task_success_download_false',
				status: 'succeeded',
				content: {
					video_url: 'https://example.com/assets/task_success_download_false.mp4',
				},
			},
		],
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];

	assert.equal(output.json.status, 'succeeded');
	assert.equal(output.json.videoUrl, 'https://example.com/assets/task_success_download_false.mp4');
	assert.equal(output.binary, undefined);
	assert.equal(calls.length, 1);
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
});

test('succeeded 但 videoUrl 为空或缺失时不会下载', async () => {
	for (const content of [{ video_url: '' }, {}]) {
		const { calls, context } = createExecutionContext(
			{
				operation: 'get',
				taskId: 'task_success_without_video_url',
				waitForCompletion: true,
				waitTimeoutMinutes: 20,
				downloadVideo: true,
			},
			[
				{
					id: 'task_success_without_video_url',
					status: 'succeeded',
					content,
				},
			],
		);

		const result = await Seedance.prototype.execute.call(context);
		const output = result[0][0];

		assert.equal(output.json.status, 'succeeded');
		assert.equal(output.binary, undefined);
		assert.equal(calls.length, 1);
		assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
	}
});

test('timeout running 任务即使 downloadVideo=true 也不会下载', async () => {
	await withImmediatePollingTime(async () => {
		const { calls, context } = createExecutionContext(
			{
				operation: 'get',
				taskId: 'task_download_timeout',
				waitForCompletion: true,
				waitTimeoutMinutes: 1,
				downloadVideo: true,
			},
			[
				{ id: 'task_download_timeout', status: 'queued' },
				{ id: 'task_download_timeout', status: 'running' },
				{ id: 'task_download_timeout', status: 'running' },
			],
		);

		const result = await Seedance.prototype.execute.call(context);
		const output = result[0][0];

		assert.equal(output.json.status, 'running');
		assert.equal(output.json.timedOut, true);
		assert.equal(output.binary, undefined);
		assert.equal(calls.length, 3);
		assert.equal(calls.every((call) => String(call.url).includes('/api/v3/contents/generations/tasks')), true);
	});
});
