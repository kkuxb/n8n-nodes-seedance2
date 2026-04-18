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
