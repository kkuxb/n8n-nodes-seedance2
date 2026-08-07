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
	binaryData: Record<string, { mimeType?: string; data?: string; buffer?: Buffer }> = {},
	options: {
		forbidFrameParameterReads?: boolean;
		responses?: Array<Record<string, unknown>>;
	} = {},
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
					options.forbidFrameParameterReads !== false &&
					(name.startsWith('firstFrame') || name.startsWith('lastFrame')) &&
					fallback === undefined
				) {
					throw new Error(`Unexpected frame parameter read: ${name}`);
				}

				return Object.prototype.hasOwnProperty.call(parameters, name) ? parameters[name] : fallback;
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
				async httpRequest(requestOptions: Record<string, unknown>) {
					calls.push(requestOptions);
					const next = options.responses?.shift();

					if (next) {
						return next;
					}

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
					return binary.buffer ?? Buffer.from(binary.data ?? '');
				},
			},
		},
	};
}

function staleMultimodalSavedWorkflowFields() {
	return {
		referenceMaterials: {
			items: [
				{
					materialType: 'image',
					materialSource: 'url',
					materialUrl: 'https://example.com/stale-reference.png',
				},
				{
					materialType: 'video',
					videoMaterialSource: 'asset',
					videoAssetId: 'stale-video-asset',
				},
				{
					materialType: 'audio',
					materialSource: 'url',
					materialUrl: 'https://example.com/stale-audio.wav',
				},
			],
		},
	};
}

function assertNoMultimodalReferenceRoles(body: Record<string, unknown>) {
	const bodyJson = JSON.stringify(body);

	assert.equal(bodyJson.includes('reference_image'), false);
	assert.equal(bodyJson.includes('reference_video'), false);
	assert.equal(bodyJson.includes('reference_audio'), false);
}

function contentRoles(body: Record<string, unknown>) {
	return ((body.content as Array<Record<string, unknown>>) ?? []).map((contentItem) => contentItem.role);
}

function assertCreateTaskPost(call: Record<string, unknown>) {
	assert.equal(call.method, 'POST');
	assert.match(String(call.url), /\/api\/v3\/contents\/generations\/tasks$/);
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

test('old t2v execute payload ignores stale multimodal saved workflow fields', async () => {
	const { calls, requestedParameters, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 't2v',
		model: 'doubao-seedance-2-0-260128',
		prompt: 'A calm lake at sunset',
		resolution: '720p',
		ratio: '16:9',
		duration: 5,
		generateAudio: false,
		advancedOptions: {},
		...staleMultimodalSavedWorkflowFields(),
	});

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assertCreateTaskPost(calls[0]);
	assert.deepEqual(body, {
		model: 'doubao-seedance-2-0-260128',
		content: [{ type: 'text', text: 'A calm lake at sunset' }],
		resolution: '720p',
		ratio: '16:9',
		duration: 5,
		watermark: false,
		execution_expires_after: 172800,
		return_last_frame: false,
		generate_audio: false,
	});
	assertNoMultimodalReferenceRoles(body);
	assert.deepEqual(contentRoles(body), [undefined]);
	assert.equal(requestedParameters.includes('referenceMaterials'), false);
	assert.equal(result[0][0].json.taskId, 'task_123');
});

test('old first-frame execute payload keeps first_frame and ignores stale multimodal fields', async () => {
	const { calls, requestedParameters, context } = createVideoExecutionContext(
		{
			generationMode: 'video',
			operation: 'create',
			createMode: 'i2v_first',
			model: 'doubao-seedance-2-0-260128',
			prompt: 'Continue from the provided frame',
			firstFrameInputMethod: 'url',
			firstFrameImageUrl: 'https://example.com/first-frame.png',
			resolution: '720p',
			ratio: '16:9',
			duration: 5,
			generateAudio: false,
			advancedOptions: {},
			...staleMultimodalSavedWorkflowFields(),
		},
		{},
		{ forbidFrameParameterReads: false },
	);

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assertCreateTaskPost(calls[0]);
	assert.deepEqual(body, {
		model: 'doubao-seedance-2-0-260128',
		content: [
			{ type: 'text', text: 'Continue from the provided frame' },
			{
				type: 'image_url',
				role: 'first_frame',
				image_url: { url: 'https://example.com/first-frame.png' },
			},
		],
		resolution: '720p',
		ratio: '16:9',
		duration: 5,
		watermark: false,
		execution_expires_after: 172800,
		return_last_frame: false,
		generate_audio: false,
	});
	assertNoMultimodalReferenceRoles(body);
	assert.deepEqual(contentRoles(body), [undefined, 'first_frame']);
	assert.equal(requestedParameters.includes('referenceMaterials'), false);
	assert.equal(
		requestedParameters.some((name) => name.startsWith('lastFrame')),
		false,
	);
	assert.equal(result[0][0].json.taskId, 'task_123');
});

test('old first-last-frame execute payload keeps frame roles and ignores stale multimodal fields', async () => {
	const { calls, requestedParameters, context } = createVideoExecutionContext(
		{
			generationMode: 'video',
			operation: 'create',
			createMode: 'i2v_first_last',
			model: 'doubao-seedance-2-0-260128',
			prompt: 'Move between the two provided frames',
			firstFrameInputMethod: 'url',
			firstFrameImageUrl: 'https://example.com/first-frame.png',
			lastFrameInputMethod: 'url',
			lastFrameImageUrl: 'https://example.com/last-frame.png',
			resolution: '720p',
			ratio: '16:9',
			duration: 5,
			generateAudio: false,
			advancedOptions: {},
			...staleMultimodalSavedWorkflowFields(),
		},
		{},
		{ forbidFrameParameterReads: false },
	);

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assertCreateTaskPost(calls[0]);
	assert.deepEqual(body, {
		model: 'doubao-seedance-2-0-260128',
		content: [
			{ type: 'text', text: 'Move between the two provided frames' },
			{
				type: 'image_url',
				role: 'first_frame',
				image_url: { url: 'https://example.com/first-frame.png' },
			},
			{
				type: 'image_url',
				role: 'last_frame',
				image_url: { url: 'https://example.com/last-frame.png' },
			},
		],
		resolution: '720p',
		ratio: '16:9',
		duration: 5,
		watermark: false,
		execution_expires_after: 172800,
		return_last_frame: false,
		generate_audio: false,
	});
	assertNoMultimodalReferenceRoles(body);
	assert.deepEqual(contentRoles(body), [undefined, 'first_frame', 'last_frame']);
	assert.equal(requestedParameters.includes('referenceMaterials'), false);
	assert.equal(result[0][0].json.taskId, 'task_123');
});

test('multimodal reference create executes with URL, asset, image binary and audio binary content', async () => {
	const { calls, requestedParameters, assertedBinaryProperties, context } = createVideoExecutionContext(
		{
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
		},
		{
			imageRef: {
				mimeType: 'image/png',
				data: 'image-bytes',
			},
			audioRef: {
				mimeType: 'audio/wav',
				data: 'audio-bytes',
			},
		},
	);

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;
	const contentRoles = ((body.content as Array<Record<string, unknown>>) ?? []).map((contentItem) => contentItem.role);
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
	assert.equal(
		requestedParameters.some((name) => name.startsWith('firstFrame')),
		false,
	);
	assert.equal(
		requestedParameters.some((name) => name.startsWith('lastFrame')),
		false,
	);
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
	assert.equal(JSON.stringify(requestSummary).includes('image/png'), false);
	assert.equal(JSON.stringify(requestSummary).includes('audio/wav'), false);
	assert.equal(JSON.stringify(requestSummary).includes('byteLength'), false);
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
	const { calls, context } = createVideoExecutionContext(
		{
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
		},
		{
			imageRef: {
				data: 'image-bytes',
			},
		},
	);

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

test('multimodal binary image rejects unsupported MIME before HTTP request', async () => {
	const { calls, context } = createVideoExecutionContext(
		{
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
		},
		{
			imageRef: {
				mimeType: 'application/pdf',
				data: 'not-an-image',
			},
		},
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as { message?: unknown }).message ?? error);
			assert.match(message, /参考图片 MIME 类型必须是 jpeg、png、webp、bmp、tiff、gif、heic 或 heif/);
			return true;
		},
	);
	assert.equal(calls.length, 0);
});

test('multimodal binary image rejects over-limit file before HTTP request', async () => {
	const { calls, context } = createVideoExecutionContext(
		{
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
		},
		{
			imageRef: {
				mimeType: 'image/png',
				buffer: Buffer.alloc(31 * 1024 * 1024),
			},
		},
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as { message?: unknown }).message ?? error);
			assert.match(message, /参考图片单张不能超过 30MB/);
			return true;
		},
	);
	assert.equal(calls.length, 0);
});

test('multimodal binary audio rejects unsupported MIME and over-limit file before HTTP request', async () => {
	for (const [binary, expectedMessage] of [
		[{ mimeType: 'audio/ogg', data: 'not-wav-or-mp3' }, /参考音频 MIME 类型必须是 wav 或 mp3/],
		[{ mimeType: 'audio/wav', buffer: Buffer.alloc(16 * 1024 * 1024) }, /参考音频单段不能超过 15MB/],
	] as const) {
		const { calls, context } = createVideoExecutionContext(
			{
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
							materialUrl: 'https://cdn.example.com/reference',
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
			},
			{
				audioRef: binary,
			},
		);

		await assert.rejects(
			() => Seedance.prototype.execute.call(context),
			(error: unknown) => {
				const message = String((error as { message?: unknown }).message ?? error);
				assert.match(message, expectedMessage);
				return true;
			},
		);
		assert.equal(calls.length, 0);
	}
});

test('multimodal locally computable request-size overflow fails before HTTP request', async () => {
	const twentyFiveMb = Buffer.alloc(25 * 1024 * 1024);
	const { calls, context } = createVideoExecutionContext(
		{
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
						binaryProperty: 'imageA',
					},
					{
						materialType: 'image',
						materialSource: 'binary',
						binaryProperty: 'imageB',
					},
				],
			},
			resolution: '720p',
			ratio: 'adaptive',
			duration: 5,
			generateAudio: false,
			advancedOptions: {},
		},
		{
			imageA: {
				mimeType: 'image/png',
				buffer: twentyFiveMb,
			},
			imageB: {
				mimeType: 'image/png',
				buffer: twentyFiveMb,
			},
		},
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as { message?: unknown }).message ?? error);
			assert.match(message, /请求体可计算部分不能超过 64MB/);
			return true;
		},
	);
	assert.equal(calls.length, 0);
});

test('extensionless signed URL and asset references reach create body without probing', async () => {
	const { calls, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: 'Use remote references exactly as provided',
		referenceMaterials: {
			items: [
				{
					materialType: 'image',
					materialSource: 'url',
					materialUrl: 'https://cdn.example.com/signed-image?X-Amz-Signature=abc',
				},
				{
					materialType: 'audio',
					materialSource: 'url',
					materialUrl: 'https://cdn.example.com/audio-stream?id=123',
				},
				{
					materialType: 'video',
					videoMaterialSource: 'asset',
					videoAssetId: 'remote_video_asset',
				},
			],
		},
		resolution: '720p',
		ratio: 'adaptive',
		duration: 5,
		generateAudio: false,
		advancedOptions: {},
	});

	await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assert.deepEqual(body.content, [
		{ type: 'text', text: 'Use remote references exactly as provided' },
		{
			type: 'image_url',
			role: 'reference_image',
			image_url: {
				url: 'https://cdn.example.com/signed-image?X-Amz-Signature=abc',
			},
		},
		{
			type: 'audio_url',
			role: 'reference_audio',
			audio_url: { url: 'https://cdn.example.com/audio-stream?id=123' },
		},
		{
			type: 'video_url',
			role: 'reference_video',
			video_url: { url: 'asset://remote_video_asset' },
		},
	]);
});

test('execute-level create body uses official fields and excludes deferred options', async () => {
	const { calls, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 't2v',
		model: 'doubao-seedance-2-0-260128',
		prompt: '一只小猫对着镜头打哈欠',
		resolution: '1080p',
		ratio: '16:9',
		duration: 5,
		generateAudio: true,
		advancedOptions: {
			seed: 11,
			watermark: true,
			returnLastFrame: true,
			executionExpiresAfter: 7200,
		},
	});

	await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;
	const bodyJson = JSON.stringify(body);

	assert.equal(body.resolution, '1080p');
	assert.equal(body.ratio, '16:9');
	assert.equal(body.duration, 5);
	assert.equal('seed' in body, false);
	assert.equal(body.watermark, true);
	assert.equal(body.execution_expires_after, 7200);
	assert.equal(body.return_last_frame, true);
	assert.equal(body.generate_audio, true);
	assert.deepEqual(body.content, [{ type: 'text', text: '一只小猫对着镜头打哈欠' }]);
	assert.equal(bodyJson.includes('--resolution'), false);
	assert.equal(bodyJson.includes('--ratio'), false);
	assert.equal(bodyJson.includes('--duration'), false);
	assert.equal(bodyJson.includes('--seed'), false);
	assert.equal(bodyJson.includes('camera_fixed'), false);
	assert.equal(bodyJson.includes('web_search'), false);
	assert.equal(bodyJson.includes('safety_identifier'), false);
	assert.equal(bodyJson.includes('"tools"'), false);
});

test('new Seedance 2.5 text-to-video execution uses automatic defaults and MP4', async () => {
	const { calls, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 't2v',
		model: 'doubao-seedance-2-5-260628',
		prompt: 'A sunrise over the city',
		generateAudio: true,
		advancedOptions: {},
	});

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assertCreateTaskPost(calls[0]);
	assert.equal(body.model, 'doubao-seedance-2-5-260628');
	assert.equal(body.resolution, '720p');
	assert.equal(body.ratio, 'adaptive');
	assert.equal(body.duration, -1);
	assert.equal(body.output_format, 'mp4');
	assert.equal(result[0][0].json.taskId, 'task_123');
});

test('Seedance 2.5 first-frame execution normalizes stale fixed ratio to adaptive', async () => {
	const { calls, context } = createVideoExecutionContext(
		{
			generationMode: 'video',
			operation: 'create',
			createMode: 'i2v_first',
			model: 'doubao-seedance-2-5-260628',
			prompt: 'Animate the frame',
			firstFrameInputMethod: 'url',
			firstFrameImageUrl: 'https://example.com/first.png',
			resolution: '720p',
			ratio: '16:9',
			duration: 30,
			outputFormat: 'mov',
			generateAudio: false,
			advancedOptions: {},
		},
		{},
		{ forbidFrameParameterReads: false },
	);

	await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assert.equal(body.ratio, 'adaptive');
	assert.equal(body.duration, 30);
	assert.equal(body.output_format, 'mov');
	assert.deepEqual(contentRoles(body), [undefined, 'first_frame']);
});

test('Seedance 2.5 video-edit intent locks ratio and duration before submission', async () => {
	const { calls, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-5-260628',
		multimodalTaskIntent: 'video_edit',
		prompt: 'Edit the referenced video',
		referenceMaterials: {
			items: [
				{
					materialType: 'video',
					videoMaterialSource: 'url',
					videoMaterialUrl: 'https://example.com/reference.mp4',
				},
			],
		},
		resolution: '720p',
		ratio: '16:9',
		duration: 12,
		outputFormat: 'mov',
		generateAudio: true,
		advancedOptions: {},
	});

	const result = await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;
	const summary = result[0][0].json.requestSummary as Record<string, unknown>;

	assert.equal(body.ratio, 'adaptive');
	assert.equal(body.duration, -1);
	assert.equal(body.output_format, 'mov');
	assert.equal('multimodalTaskIntent' in body, false);
	assert.equal(summary.multimodalTaskIntent, 'video_edit');
	assert.deepEqual(contentRoles(body), [undefined, 'reference_video']);
});

test('Seedance 2.5 video-extension intent starts from its independent automatic duration', async () => {
	const { calls, context } = createVideoExecutionContext({
		generationMode: 'video',
		operation: 'create',
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-5-260628',
		multimodalTaskIntent: 'video_extension',
		prompt: 'Extend the referenced video',
		referenceMaterials: {
			items: [
				{
					materialType: 'video',
					videoMaterialSource: 'url',
					videoMaterialUrl: 'https://example.com/reference.mp4',
				},
			],
		},
		resolution: '720p',
		ratio: '16:9',
		duration: 12,
		extensionDuration: -1,
		outputFormat: 'mp4',
		generateAudio: true,
		advancedOptions: {},
	});

	await Seedance.prototype.execute.call(context);
	const body = calls[0].body as Record<string, unknown>;

	assert.equal(body.ratio, 'adaptive');
	assert.equal(body.duration, -1);
	assert.deepEqual(contentRoles(body), [undefined, 'reference_video']);
});

test('list operation sends locked filters and returns one aggregated tasks item', async () => {
	const { calls, context } = createVideoExecutionContext(
		{
			generationMode: 'video',
			operation: 'list',
			returnAll: false,
			pageNum: 2,
			pageSize: 25,
			additionalFields: {
				status: 'succeeded',
				taskIds: ' task_a, ,task_b ',
				model: 'doubao-seedance-2-0-260128',
				serviceTier: 'standard',
			},
		},
		{},
		{
			responses: [
				{
					items: [
						{
							id: 'task_a',
							status: 'succeeded',
							content: { video_url: 'https://example.com/a.mp4' },
						},
						{ id: 'task_b', status: 'running' },
					],
				},
			],
		},
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0].json as Record<string, unknown>;
	const tasks = output.tasks as Array<Record<string, unknown>>;

	assert.equal(calls.length, 1);
	assert.equal(calls[0].method, 'GET');
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks$/);
	assert.deepEqual(calls[0].qs, {
		'filter.status': 'succeeded',
		'filter.task_ids': ['task_a', 'task_b'],
		'filter.model': 'doubao-seedance-2-0-260128',
		'filter.service_tier': 'standard',
		page_num: 2,
		page_size: 25,
	});
	assert.equal(result[0].length, 1);
	assert.equal(output.count, 2);
	assert.equal(output.returnAll, false);
	assert.equal(output.pageNum, 2);
	assert.equal(output.pageSize, 25);
	assert.match(String((output.retention as Record<string, unknown>).message), /7 天/);
	assert.equal(tasks[0].taskId, 'task_a');
	assert.equal(tasks[0].isSuccess, true);
	assert.equal(tasks[1].taskId, 'task_b');
	assert.equal(tasks[1].shouldPoll, true);
});

test('delete operation sends locked path and returns success envelope', async () => {
	const { calls, context } = createVideoExecutionContext(
		{
			generationMode: 'video',
			operation: 'delete',
			taskId: 'task delete/123',
		},
		{},
		{ responses: [{}] },
	);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0].json as Record<string, unknown>;

	assert.equal(calls.length, 1);
	assert.equal(calls[0].method, 'DELETE');
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks\/task%20delete%2F123$/);
	assert.deepEqual(output, {
		success: true,
		taskId: 'task delete/123',
		action: 'deleted_or_cancelled',
		message: '已向 Seedance 提交取消或删除请求。实际结果取决于任务当前状态。',
	});
	assert.deepEqual(result[0][0].pairedItem, { item: 0 });
});

test('video polling and endpoint contracts stay stable', () => {
	assert.equal(GET_TASK_POLL_INTERVAL_MS, 20_000);
	assert.equal(getSeedanceOperationEndpoint('createTask'), '/api/v3/contents/generations/tasks');
	assert.equal(getSeedanceOperationEndpoint('getTask'), '/api/v3/contents/generations/tasks');
	assert.equal(getSeedanceOperationEndpoint('listTasks'), '/api/v3/contents/generations/tasks');
	assert.equal(getSeedanceDeleteTaskEndpoint('task_123'), '/api/v3/contents/generations/tasks/task_123');
	assert.deepEqual(SEEDANCE_TASK_STATUSES, ['queued', 'running', 'cancelled', 'succeeded', 'failed', 'expired']);
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
