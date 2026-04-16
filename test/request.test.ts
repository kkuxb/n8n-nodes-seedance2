import test from 'node:test';
import assert from 'node:assert/strict';

const constantsModule = await import('../dist/nodes/Seedance/shared/constants.js');
const errorsModule = await import('../dist/nodes/Seedance/shared/mappers/errors.js');
const endpointsModule = await import('../dist/nodes/Seedance/shared/transport/endpoints.js');
const requestModule = await import('../dist/nodes/Seedance/shared/transport/request.js');

const { SEEDANCE_AUTH_HEADER, SEEDANCE_BASE_URL, SEEDANCE_TASK_STATUSES } = constantsModule;
const { normalizeSeedanceError } = errorsModule;
const { buildSeedanceEndpointUrl, getSeedanceOperationEndpoint, normalizeSeedancePath } = endpointsModule;
const { buildSeedanceAuthHeaders, buildSeedanceHttpRequestOptions } = requestModule;

test('从 apiKey 构造 Bearer 鉴权头', () => {
  const headers = buildSeedanceAuthHeaders('secret-key');

  assert.equal(headers[SEEDANCE_AUTH_HEADER], 'Bearer secret-key');
  assert.equal(headers['Content-Type'], 'application/json');
});

test('端点 helper 暴露 Phase 1 create/get path', () => {
  assert.equal(getSeedanceOperationEndpoint('createTask'), '/api/v3/contents/generations/tasks');
  assert.equal(getSeedanceOperationEndpoint('getTask'), '/api/v3/contents/generations/tasks/{id}');
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
      path: getSeedanceOperationEndpoint('getTask').replace('{id}', 'task_123'),
      qs: { verbose: true },
    },
  );

  assert.equal(options.url, 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/task_123');
  assert.deepEqual(options.headers, {
    Authorization: 'Bearer secret-key',
    'Content-Type': 'application/json',
  });
  assert.deepEqual(options.qs, { verbose: true });
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
