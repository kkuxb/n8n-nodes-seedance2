/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const requestModule = await import('../dist/nodes/Seedance/shared/transport/request.js');

const { downloadSeedanceVideo } = requestModule;

test('succeeded 下载返回可挂到 binary.video 的结构', async () => {
	const result = await downloadSeedanceVideo(
		{
			async getCredentials() {
				return { apiKey: 'test-api-key' };
			},
			helpers: {
				async httpRequest() {
					return {
						body: Buffer.from('seedance-video-content'),
						headers: {
							'content-type': 'video/mp4',
						},
					};
				},
			},
		} as never,
		'https://example.com/videos/final.mp4',
		'task_success',
	);

	assert.equal(result.mimeType, 'video/mp4');
	assert.equal(result.fileName, 'task_success.mp4');
	assert.equal(result.fileExtension, 'mp4');
	assert.equal(result.data, Buffer.from('seedance-video-content').toString('base64'));
});

test('过期或不可用下载失败保留原始错误并追加 24 hours 提示', async () => {
	await assert.rejects(
		() =>
			downloadSeedanceVideo(
				{
					async getCredentials() {
						return { apiKey: 'test-api-key' };
					},
					helpers: {
						async httpRequest() {
							throw {
								response: {
									statusCode: 403,
									body: {
										error: {
											message: 'upstream CDN returned forbidden for expired asset',
										},
									},
								},
							};
						},
					},
				} as never,
				'https://example.com/videos/expired.mp4',
				'task_expired',
			),
		(error: unknown) => {
			const message = String((error as Error).message ?? error);
			assert.match(message, /expired asset/);
			assert.match(message, /24 hours/);
			return true;
		},
	);
});

test('通用下载失败仍然直接抛错而不是静默降级', async () => {
	await assert.rejects(
		() =>
			downloadSeedanceVideo(
				{
					async getCredentials() {
						return { apiKey: 'test-api-key' };
					},
					helpers: {
						async httpRequest() {
							throw new Error('socket hang up');
						},
					},
				} as never,
				'https://example.com/videos/network.mp4',
			),
		(error: unknown) => {
			assert.match(String((error as Error).message ?? error), /socket hang up/);
			return true;
		},
	);
});
