/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createPayloadModule = await import('../dist/nodes/Seedance/shared/mappers/createPayload.js');
const constantsModule = await import('../dist/nodes/Seedance/shared/constants.js');
const requestModule = await import('../dist/nodes/Seedance/shared/transport/request.js');
const endpointsModule = await import('../dist/nodes/Seedance/shared/transport/endpoints.js');
const pollingModule = await import('../dist/nodes/Seedance/shared/polling/getTaskPolling.js');

const { buildCreatePayload } = createPayloadModule;
const { SEEDANCE_TASK_STATUSES } = constantsModule;
const { normalizeSeedanceDownloadError } = await import('../dist/nodes/Seedance/shared/mappers/errors.js');
const { getSeedanceOperationEndpoint, getSeedanceDeleteTaskEndpoint } = endpointsModule;
const { GET_TASK_POLL_INTERVAL_MS } = pollingModule;

test('video create defaults remain unchanged after image additions', () => {
	const payload = buildCreatePayload({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-fast-260128',
		prompt: 'A cinematic river scene',
		resolution: '720p',
		ratio: '16:9',
		duration: 5,
		generateAudio: false,
		watermark: true,
		returnLastFrame: false,
		executionExpiresAfter: 172800,
		mode: 'text_to_video',
	});

	assert.equal(payload.content[0].text, 'A cinematic river scene');
	assert.equal(payload.duration, 5);
	assert.equal(payload.model, 'doubao-seedance-2-0-fast-260128');
	assert.equal(payload.watermark, true);
});

test('video payload preserves explicit watermark=false for default-off requests', () => {
	const payload = buildCreatePayload({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-fast-260128',
		prompt: 'A cinematic river scene',
		watermark: false,
	});

	assert.equal(payload.watermark, false);
});

test('video polling and endpoint contracts stay stable', () => {
	assert.equal(GET_TASK_POLL_INTERVAL_MS, 20_000);
	assert.equal(getSeedanceOperationEndpoint('createTask'), '/api/v3/contents/generations/tasks');
	assert.equal(getSeedanceOperationEndpoint('getTask'), '/api/v3/contents/generations/tasks');
	assert.equal(getSeedanceOperationEndpoint('listTasks'), '/api/v3/contents/generations/tasks');
	assert.equal(getSeedanceDeleteTaskEndpoint('task_123'), '/api/v3/contents/generations/tasks/task_123');
	assert.deepEqual(SEEDANCE_TASK_STATUSES, [
		'queued',
		'running',
		'cancelled',
		'succeeded',
		'failed',
		'expired',
	]);
});

test('video download warning still keeps the explicit 24 hours message', () => {
	const error = normalizeSeedanceDownloadError({
		response: {
			statusCode: 403,
			body: {
				error: {
					message: 'upstream CDN returned forbidden for expired asset',
				},
			},
		},
	});

	assert.match(error.message, /24 hours/);
	assert.match(error.message, /expired asset/);
});
