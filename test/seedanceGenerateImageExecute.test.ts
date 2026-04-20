/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = await import('../dist/nodes/Seedance/Seedance.node.js');

const { Seedance } = nodeModule;

function createExecutionContext(
	parameters: Record<string, unknown>,
	responses: Array<Record<string, unknown>>,
	binary?: Record<string, { data: Buffer; mimeType: string }>,
) {
	const calls: Array<Record<string, unknown>> = [];
	const assertedBinaryProperties: string[] = [];

	return {
		calls,
		assertedBinaryProperties,
		context: {
			getInputData() {
				return [
					{
						json: {},
						binary: Object.fromEntries(
							Object.entries(binary ?? {}).map(([key, value]) => [
								key,
								{ mimeType: value.mimeType },
							]),
						),
					},
				];
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
				assertBinaryData(_itemIndex: number, binaryPropertyName: string) {
					assertedBinaryProperties.push(binaryPropertyName);
					if (!binary?.[binaryPropertyName]) {
						throw new Error(`Missing binary property ${binaryPropertyName}`);
					}
				},
				async getBinaryDataBuffer(_itemIndex: number, binaryPropertyName: string) {
					const itemBinary = binary?.[binaryPropertyName];
					if (!itemBinary) {
						throw new Error(`Missing binary buffer ${binaryPropertyName}`);
					}
					return itemBinary.data;
				},
			},
		},
	};
}

const baseParameters = {
	generationMode: 'image',
	imageOperation: 'textToImage',
	imageModel: 'doubao-seedream-5-0-260128',
	imagePrompt: 'A quiet lake at sunrise',
	referenceImageSource: 'none',
	sequentialImageGeneration: 'disabled',
	maxImages: 15,
	imageResolution: '2K',
	imageAspectRatio: '1:1',
	webSearch: false,
	optimizePrompt: true,
};

test('prompt-only image generation returns one item with binary.image1', async () => {
	const { calls, context } = createExecutionContext(baseParameters, [
		{ data: [{ b64_json: 'RAW_BASE64_SENTINEL' }], usage: { generated_images: 1 } },
	]);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];

	assert.equal(result[0].length, 1);
	assert.deepEqual(output.pairedItem, { item: 0 });
	assert.equal(output.binary?.image1.data, 'RAW_BASE64_SENTINEL');
	assert.equal(output.binary?.image1.mimeType, 'image/png');
	assert.equal((output.json.requestSummary as Record<string, unknown>).size, '2048x2048');
	assert.equal(JSON.stringify(output.json).includes('RAW_BASE64_SENTINEL'), false);
	assert.match(String(calls[0].url), /\/api\/v3\/images\/generations$/);
	assert.equal((calls[0].body as Record<string, unknown>).response_format, 'b64_json');
});

test('multiple successful images stay in one output item with binary.image1 and binary.image2', async () => {
	const { context } = createExecutionContext(baseParameters, [
		{ data: [{ b64_json: 'first_success' }, { b64_json: 'second_success' }] },
	]);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];

	assert.equal(result[0].length, 1);
	assert.equal(output.binary?.image1.data, 'first_success');
	assert.equal(output.binary?.image2.data, 'second_success');
});

test('image-to-image with comma-separated URL values posts ordered URL array', async () => {
	const { calls, context } = createExecutionContext(
		{
			...baseParameters,
			imageOperation: 'imageToImage',
			referenceImageSource: 'url',
			referenceImageUrl: ' https://example.com/a.png, ,https://example.com/b.png ',
		},
		[{ data: [{ b64_json: 'generated_image' }] }],
	);

	await Seedance.prototype.execute.call(context);

	assert.deepEqual((calls[0].body as Record<string, unknown>).image, [
		'https://example.com/a.png',
		'https://example.com/b.png',
	]);
});

test('image-to-image with comma-separated binary properties posts ordered data URL array', async () => {
	const { calls, assertedBinaryProperties, context } = createExecutionContext(
		{
			...baseParameters,
			imageOperation: 'imageToImage',
			referenceImageSource: 'binary',
			referenceImageBinaryProperty: ' firstImage, secondImage ',
		},
		[{ data: [{ b64_json: 'generated_image' }] }],
		{
			firstImage: { data: Buffer.from('binary-data-1'), mimeType: 'image/png' },
			secondImage: { data: Buffer.from('binary-data-2'), mimeType: 'image/webp' },
		},
	);

	await Seedance.prototype.execute.call(context);

	assert.deepEqual(assertedBinaryProperties, ['firstImage', 'secondImage']);
	assert.deepEqual((calls[0].body as Record<string, unknown>).image, [
		`data:image/png;base64,${Buffer.from('binary-data-1').toString('base64')}`,
		`data:image/webp;base64,${Buffer.from('binary-data-2').toString('base64')}`,
	]);
});

test('mixed reference sources are posted through the image payload layer', async () => {
	const { calls, context } = createExecutionContext(
		{
			...baseParameters,
			imageOperation: 'imageToImage',
			referenceImageSource: 'multiple',
			referenceImages: {
				items: [
					{ source: 'url', url: 'https://example.com/cat.png' },
					{ source: 'base64', base64: 'data:image/jpeg;base64,abc123' },
					{ source: 'binary', binaryProperty: 'sourceImage' },
				],
			},
		},
		[{ data: [{ b64_json: 'generated_image' }] }],
		{ sourceImage: { data: Buffer.from('binary-data'), mimeType: 'image/webp' } },
	);

	await Seedance.prototype.execute.call(context);

	assert.deepEqual((calls[0].body as Record<string, unknown>).image, [
		'https://example.com/cat.png',
		'data:image/jpeg;base64,abc123',
		`data:image/webp;base64,${Buffer.from('binary-data').toString('base64')}`,
	]);
});

test('video operations still use video branches when generationMode is video', async () => {
	const { calls, context } = createExecutionContext(
		{
			generationMode: 'video',
			operation: 'get',
			taskId: 'task_123',
			waitForCompletion: false,
		},
		[
			{
				items: [
					{
						id: 'task_123',
						status: 'queued',
						model: 'doubao-seedance-2-0-fast-260128',
						content: [{ type: 'text', text: 'video prompt' }],
						created_at: 1710000000,
						updated_at: 1710000001,
					},
				],
			},
		],
	);

	const result = await Seedance.prototype.execute.call(context);

	assert.equal(result[0][0].json.taskId, 'task_123');
	assert.match(String(calls[0].url), /\/api\/v3\/contents\/generations\/tasks/);
	assert.deepEqual(calls[0].qs, { id: 'task_123' });
	assert.equal((calls[0].body as Record<string, unknown> | undefined) ?? undefined, undefined);
});

test('partial failure returns one item with successful binary and failed image metadata', async () => {
	const { context } = createExecutionContext(baseParameters, [
		{
			data: [
				{ b64_json: 'ok_image' },
				{ error: { code: 'bad_prompt', message: 'second failed' } },
			],
		},
	]);

	const result = await Seedance.prototype.execute.call(context);
	const output = result[0][0];
	const images = output.json.images as Array<Record<string, unknown>>;

	assert.ok(output.binary?.image1);
	assert.equal(images[0].isSuccess, true);
	assert.deepEqual(images[1].error, { code: 'bad_prompt', message: 'second failed' });
});

test('all-failed image response throws a clear error', async () => {
	const { context } = createExecutionContext(baseParameters, [
		{ data: [{ error: { code: 'bad_prompt', message: 'all failed' } }] },
	]);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		(error: unknown) => {
			const message = String((error as { message?: unknown }).message ?? error);
			assert.match(message, /all failed/);
			return true;
		},
	);
});
