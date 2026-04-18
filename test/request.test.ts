/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const constantsModule = await import('../dist/nodes/Seedance/shared/constants.js');
const errorsModule = await import('../dist/nodes/Seedance/shared/mappers/errors.js');
const endpointsModule = await import('../dist/nodes/Seedance/shared/transport/endpoints.js');
const requestModule = await import('../dist/nodes/Seedance/shared/transport/request.js');

const { SEEDANCE_AUTH_HEADER, SEEDANCE_BASE_URL, SEEDANCE_TASK_STATUSES } = constantsModule;
const { normalizeSeedanceError, getFriendlyDeleteError, normalizeSeedanceDownloadError } = errorsModule;
const { buildSeedanceEndpointUrl, getSeedanceDeleteTaskEndpoint, getSeedanceOperationEndpoint, normalizeSeedancePath } = endpointsModule;
const { buildSeedanceAuthHeaders, buildSeedanceHttpRequestOptions, downloadSeedanceVideo } = requestModule;

test('从 apiKey 构造 Bearer 鉴权头', () => {
  const headers = buildSeedanceAuthHeaders('secret-key');

  assert.equal(headers[SEEDANCE_AUTH_HEADER], 'Bearer secret-key');
  assert.equal(headers['Content-Type'], 'application/json');
});

test('端点 helper 暴露 Phase 1 create/get path', () => {
  assert.equal(getSeedanceOperationEndpoint('createTask'), '/api/v3/contents/generations/tasks');
  assert.equal(getSeedanceOperationEndpoint('getTask'), '/api/v3/contents/generations/tasks');
  assert.equal(normalizeSeedancePath('api/v3/contents/generations/tasks'), '/api/v3/contents/generations/tasks');
  assert.equal(
    buildSeedanceEndpointUrl(getSeedanceOperationEndpoint('createTask'), SEEDANCE_BASE_URL),
    'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
  );
});

test('共享状态常量暴露稳定任务状态集合', () => {
  assert.deepEqual(SEEDANCE_TASK_STATUSES, [
    'queued',
    'running',
    'cancelled',
    'succeeded',
    'failed',
    'expired',
  ]);
});

test('request options 复用共享 header 与 url 构造', () => {
  const options = buildSeedanceHttpRequestOptions(
    {
      apiKey: 'secret-key',
      baseUrl: SEEDANCE_BASE_URL,
      headers: buildSeedanceAuthHeaders('secret-key'),
    },
    {
      method: 'GET',
      path: getSeedanceOperationEndpoint('getTask'),
      qs: { id: 'task_123' },
    },
  );

  assert.equal(options.url, 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks');
  assert.deepEqual(options.headers, {
    Authorization: 'Bearer secret-key',
    'Content-Type': 'application/json',
  });
  assert.deepEqual(options.qs, { id: 'task_123' });
});

test('DELETE 请求使用官方 tasks/{id} 路径', () => {
  const options = buildSeedanceHttpRequestOptions(
    {
      apiKey: 'secret-key',
      baseUrl: SEEDANCE_BASE_URL,
      headers: buildSeedanceAuthHeaders('secret-key'),
    },
    {
      method: 'DELETE',
      path: getSeedanceDeleteTaskEndpoint('task_123'),
    },
  );

  assert.equal(options.method, 'DELETE');
  assert.equal(options.url, 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/task_123');
  assert.equal(options.qs, undefined);
});

test('错误归一化优先读取 response.body.error 中的 code 与 message', () => {
  const normalized = normalizeSeedanceError({
    response: {
      statusCode: 429,
      body: {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
        },
      },
    },
  });

  assert.equal(normalized.code, 'RATE_LIMITED');
  assert.equal(normalized.message, 'Too many requests');
  assert.equal(normalized.statusCode, 429);
  assert.ok(normalized.raw);
});

test('错误归一化可回退到扁平 body 与原始 message', () => {
  const apiError = normalizeSeedanceError({
    statusCode: 400,
    body: {
      code: 'INVALID_ARGUMENT',
      message: 'id is required',
    },
  });

  assert.equal(apiError.code, 'INVALID_ARGUMENT');
  assert.equal(apiError.message, 'id is required');
  assert.equal(apiError.statusCode, 400);

  const networkError = normalizeSeedanceError(new Error('socket hang up'));

  assert.equal(networkError.code, 'Error');
  assert.equal(networkError.message, 'socket hang up');
});

test('删除错误提示会友好化常见 invalid action 场景', () => {
  const normalized = normalizeSeedanceError({
    response: {
      statusCode: 400,
      body: {
        error: {
          code: 'BadRequest',
          message: 'The specified action /api/v3/contents/generations/tasks is invalid',
        },
      },
    },
  });

  const friendly = getFriendlyDeleteError(normalized, 'task_123');

  assert.match(friendly.message, /DELETE/);
  assert.match(friendly.message, /task_123/);
  assert.match(friendly.message, /取消或删除/);
  assert.match(friendly.message, /tasks\/task_123/);
});

test('删除错误提示会覆盖不支持状态与历史记录缺失场景', () => {
  const running = getFriendlyDeleteError(
    normalizeSeedanceError({ statusCode: 400, body: { code: 'INVALID_STATE', message: 'running task cannot be deleted' } }),
    'task_running',
  );
  assert.match(running.message, /running|运行中/);

  const missing = getFriendlyDeleteError(
    normalizeSeedanceError({ statusCode: 404, body: { code: 'NOT_FOUND', message: 'task not found' } }),
    'task_missing',
  );
  assert.match(missing.message, /task_missing/);
  assert.match(missing.message, /7 天/);

  const malformed = getFriendlyDeleteError(
    normalizeSeedanceError({ statusCode: 400, body: { code: 'INVALID_ARGUMENT', message: 'invalid task id format' } }),
    'bad id',
  );
  assert.match(malformed.message, /Task ID/);
});

test('下载错误提示保留原始信息并追加 24 hours 提示', () => {
	const downloadError = normalizeSeedanceDownloadError({
		response: {
			statusCode: 404,
			body: {
				error: {
					code: 'NotFound',
					message: 'video asset not found',
				},
			},
		},
	});

	assert.match(downloadError.message, /video asset not found/);
	assert.match(downloadError.message, /24 hours/);
});

test('视频下载 helper 返回 binary-ready 结构', async () => {
	const result = await downloadSeedanceVideo(
		{
			async getCredentials() {
				return { apiKey: 'test-api-key' };
			},
			helpers: {
				async httpRequest() {
					return {
						body: Buffer.from('video-bytes'),
						headers: {
							'content-type': 'video/mp4',
						},
					};
				},
			},
		} as never,
		'https://example.com/task_123.mp4',
		'task_123',
	);

	assert.equal(result.mimeType, 'video/mp4');
	assert.equal(result.fileName, 'task_123.mp4');
	assert.equal(result.fileExtension, 'mp4');
	assert.equal(result.data, Buffer.from('video-bytes').toString('base64'));
});
