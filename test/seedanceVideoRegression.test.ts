/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createPayloadModule = await import('../dist/nodes/Seedance/shared/mappers/createPayload.js');
const constantsModule = await import('../dist/nodes/Seedance/shared/constants.js');
const endpointsModule = await import('../dist/nodes/Seedance/shared/transport/endpoints.js');
const pollingModule = await import('../dist/nodes/Seedance/shared/polling/getTaskPolling.js');
const nodeModule = await import('../dist/nodes/Seedance/Seedance.node.js');

const { buildCreatePayload } = createPayloadModule;
const { SEEDANCE_TASK_STATUSES } = constantsModule;
const { normalizeSeedanceDownloadError } = await import('../dist/nodes/Seedance/shared/mappers/errors.js');
const { getSeedanceOperationEndpoint, getSeedanceDeleteTaskEndpoint } = endpointsModule;
const { GET_TASK_POLL_INTERVAL_MS } = pollingModule;
const { Seedance } = nodeModule;

function createVideoExecutionContext(
	parameters: Record<string, unknown>,
	binaryData: Record<string, { mimeType?: string; data: string }> = {},
) {
	const calls: Array<Record<string, unknown>> = [];
	const requestedParameters: string[] = [];
	const assertedBinaryProperties: string[] = [];
	const inputBinary = Object.fromEntries(
		Object.entries(binaryData).map(([name, binary]) => [
			name,
			{
				mimeType: binary.mimeType,
			},
		]),
	);

	return {
		calls,
		requestedParameters,
		assertedBinaryProperties,
		context: {
			getInputData() {
				return [{ json: {}, binary: inputBinary }];
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
					if (!Object.prototype.hasOwnProperty.call(binaryData, binaryPropertyName)) {
						throw new Error(`Unexpected binary read: ${binaryPropertyName}`);
					}
				},
				async getBinaryDataBuffer(_itemIndex: number, binaryPropertyName: string) {
					const binary = binaryData[binaryPropertyName];
					if (!binary) {
						throw new Error(`Unexpected binary buffer read: ${binaryPropertyName}`);
					}
					return Buffer.from(binary.data);
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

test('multimodal reference create emits official reference content without frame roles', () => {
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
		{
			type: 'image_url',
			role: 'reference_image',
			image_url: { url: 'https://example.com/style.png' },
		},
		{
			type: 'video_url',
			role: 'reference_video',
			video_url: { url: 'asset://video_asset' },
		},
	]);
	assert.equal(JSON.stringify(payload).includes('first_frame'), false);
	assert.equal(JSON.stringify(payload).includes('last_frame'), false);
	assert.equal(JSON.stringify(payload).includes('reference_image'), true);
	assert.equal(JSON.stringify(payload).includes('reference_video'), true);
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

test('multimodal reference create executes with URL, asset, image binary and audio binary content', async () => {
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
				{
					materialType: 'image',
					materialSource: 'binary',
					binaryProperty: 'imageRef',
				},
				{
					materialType: 'audio',
					materialSource: 'binary',
					binaryProperty: 'audioRef',
				},
			],
		},
		resolution: '720p',
		ratio: 'adaptive',
		duration: 5,
		generateAudio: false,
		advancedOptions: {},
	}, {
		imageRef: {
			mimeType: 'image/png',
			data: 'image-bytes',
		},
		audioRef: {
			mimeType: 'audio/wav',
			data: 'audio-bytes',
		},
	});

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;
	const contentRoles = ((body.content as Array<Record<string, unknown>>) ?? []).map(
		(contentItem) => contentItem.role,
	);
	const outputJson = result[0][0].json as Record<string, unknown>;
	const requestSummary = outputJson.requestSummary as Record<string, unknown>;

	assert.equal(result[0][0].json.taskId, 'task_123');
	assert.deepEqual(body.content, [
		{ type: 'text', text: 'Use the references as style guidance' },
		{
			type: 'image_url',
			role: 'reference_image',
			image_url: { url: 'https://example.com/style.png' },
		},
		{
			type: 'video_url',
			role: 'reference_video',
			video_url: { url: 'asset://video_asset' },
		},
		{
			type: 'image_url',
			role: 'reference_image',
			image_url: {
				url: `data:image/png;base64,${Buffer.from('image-bytes').toString('base64')}`,
			},
		},
		{
			type: 'audio_url',
			role: 'reference_audio',
			audio_url: {
				url: `data:audio/wav;base64,${Buffer.from('audio-bytes').toString('base64')}`,
			},
		},
	]);
	assert.equal(contentRoles.includes('first_frame'), false);
	assert.equal(contentRoles.includes('last_frame'), false);
	assert.equal(contentRoles.includes('reference_image'), true);
	assert.equal(contentRoles.includes('reference_video'), true);
	assert.equal(contentRoles.includes('reference_audio'), true);
	assert.equal(requestedParameters.some((name) => name.startsWith('firstFrame')), false);
	assert.equal(requestedParameters.some((name) => name.startsWith('lastFrame')), false);
	assert.deepEqual(assertedBinaryProperties, ['imageRef', 'audioRef']);
	assert.deepEqual(requestSummary.referenceSummaries, [
		{ index: 1, type: 'image', role: 'reference_image', source: 'url' },
		{ index: 2, type: 'video', role: 'reference_video', source: 'asset' },
		{ index: 3, type: 'image', role: 'reference_image', source: 'binary' },
		{ index: 4, type: 'audio', role: 'reference_audio', source: 'binary' },
	]);
	assert.equal(JSON.stringify(requestSummary).includes('style.png'), false);
	assert.equal(JSON.stringify(requestSummary).includes('video_asset'), false);
	assert.equal(JSON.stringify(requestSummary).includes('imageRef'), false);
	assert.equal(JSON.stringify(requestSummary).includes('audioRef'), false);
	assert.equal(JSON.stringify(requestSummary).includes(Buffer.from('image-bytes').toString('base64')), false);
});

test('multimodal reference create rejects empty active source values before HTTP request', async () => {
	const { calls, context } = createVideoExecutionContext({
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
					materialUrl: '   ',
				},
			],
		},
		resolution: '720p',
		ratio: 'adaptive',
		duration: 5,
		generateAudio: false,
		advancedOptions: {},
	});

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as { message?: unknown }).message ?? error);
			assert.match(message, /参考素材第 1 项的来源值不能为空/);
			return true;
		},
	);
	assert.equal(calls.length, 0);
});

test('multimodal binary reference requires MIME type', async () => {
	const { calls, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: 'Use the references as style guidance',
		referenceMaterials: {
			items: [
				{
					materialType: 'image',
					materialSource: 'binary',
					binaryProperty: 'imageRef',
				},
			],
		},
		resolution: '720p',
		ratio: 'adaptive',
		duration: 5,
		generateAudio: false,
		advancedOptions: {},
	}, {
		imageRef: {
			data: 'image-bytes',
		},
	});

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as { message?: unknown }).message ?? error);
			assert.match(message, /Binary 文件缺少 MIME 类型/);
			return true;
		},
	);
	assert.equal(calls.length, 0);
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
