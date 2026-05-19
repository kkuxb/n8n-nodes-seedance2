/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createPayloadModule = await import('../dist/nodes/Seedance/shared/mappers/createPayload.js');
const constantsModule = await import('../dist/nodes/Seedance/shared/constants.js');
const requestModule = await import('../dist/nodes/Seedance/shared/transport/request.js');
const endpointsModule = await import('../dist/nodes/Seedance/shared/transport/endpoints.js');
const pollingModule = await import('../dist/nodes/Seedance/shared/polling/getTaskPolling.js');
const nodeModule = await import('../dist/nodes/Seedance/Seedance.node.js');

const { buildCreatePayload } = createPayloadModule;
const { SEEDANCE_TASK_STATUSES } = constantsModule;
const { normalizeSeedanceDownloadError } = await import('../dist/nodes/Seedance/shared/mappers/errors.js');
const { getSeedanceOperationEndpoint, getSeedanceDeleteTaskEndpoint } = endpointsModule;
const { GET_TASK_POLL_INTERVAL_MS } = pollingModule;
const { Seedance } = nodeModule;

function createVideoExecutionContext(parameters: Record<string, unknown>) {
	const calls: Array<Record<string, unknown>> = [];
	const requestedParameters: string[] = [];
	const assertedBinaryProperties: string[] = [];

	return {
		calls,
		requestedParameters,
		assertedBinaryProperties,
		context: {
			getInputData() {
				return [{ json: {} }];
			},
			getNodeParameter(name: string, _itemIndex: number, fallback?: unknown) {
				requestedParameters.push(name);

				if (
					(name.startsWith('firstFrame') || name.startsWith('lastFrame')) &&
					fallback === undefined
				) {
					throw new Error(`Unexpected frame parameter read: ${name}`);
				}

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
					return {
						id: 'task_123',
						status: 'queued',
						created_at: 1710000000,
					};
				},
				assertBinaryData(_itemIndex: number, binaryPropertyName: string) {
					assertedBinaryProperties.push(binaryPropertyName);
					throw new Error(`Unexpected binary read: ${binaryPropertyName}`);
				},
			},
		},
	};
}

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

test('multimodal reference create stays bounded to prompt content before payload phase', () => {
	const payload = buildCreatePayload({
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-fast-260128',
		prompt: 'Use the references as style guidance',
		referenceMaterials: [
			{
				materialType: 'image',
				materialSource: 'url',
				value: 'https://example.com/style.png',
			},
			{
				materialType: 'video',
				materialSource: 'asset',
				value: 'asset://video_asset',
			},
		],
	});

	assert.deepEqual(payload.content, [
		{ type: 'text', text: 'Use the references as style guidance' },
	]);
	assert.equal(JSON.stringify(payload).includes('first_frame'), false);
	assert.equal(JSON.stringify(payload).includes('last_frame'), false);
	assert.equal(JSON.stringify(payload).includes('reference_image'), false);
	assert.equal(JSON.stringify(payload).includes('reference_video'), false);
});

test('existing first-frame and text-to-video payload contracts remain stable', () => {
	const textPayload = buildCreatePayload({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-260128',
		prompt: 'A calm lake',
	});
	const firstFramePayload = buildCreatePayload({
		createMode: 'i2v_first',
		model: 'doubao-seedance-2-0-260128',
		prompt: '',
		firstFrameImage: {
			type: 'url',
			data: 'https://example.com/frame.png',
		},
	});

	assert.deepEqual(textPayload.content, [{ type: 'text', text: 'A calm lake' }]);
	assert.deepEqual(firstFramePayload.content, [
		{
			type: 'image_url',
			role: 'first_frame',
			image_url: { url: 'https://example.com/frame.png' },
		},
	]);
});

test('multimodal reference create executes without first or last frame reads', async () => {
	const { calls, requestedParameters, assertedBinaryProperties, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: 'Use the references as style guidance',
		referenceMaterials: {
			items: [
				{
					materialType: 'image',
					materialSource: 'url',
					materialUrl: 'https://example.com/style.png',
				},
				{
					materialType: 'video',
					videoMaterialSource: 'asset',
					materialUrl: 'https://example.com/stale-hidden-image-url.png',
					videoAssetId: 'asset://video_asset',
				},
			],
		},
		resolution: '720p',
		ratio: 'adaptive',
		duration: 5,
		generateAudio: false,
		advancedOptions: {},
	});

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;
	const contentRoles = ((body.content as Array<Record<string, unknown>>) ?? []).map(
		(contentItem) => contentItem.role,
	);

	assert.equal(result[0][0].json.taskId, 'task_123');
	assert.deepEqual(body.content, [{ type: 'text', text: 'Use the references as style guidance' }]);
	assert.equal(contentRoles.includes('first_frame'), false);
	assert.equal(contentRoles.includes('last_frame'), false);
	assert.equal(contentRoles.includes('reference_image'), false);
	assert.equal(contentRoles.includes('reference_video'), false);
	assert.equal(requestedParameters.some((name) => name.startsWith('firstFrame')), false);
	assert.equal(requestedParameters.some((name) => name.startsWith('lastFrame')), false);
	assert.deepEqual(assertedBinaryProperties, []);
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
