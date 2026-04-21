/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = await import('../dist/nodes/Seedance/Seedance.node.js');

const { Seedance } = nodeModule;

function createVideoExecutionContext(
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

const baseVideoParameters = {
	generationMode: 'video',
	operation: 'create',
	createMode: 'reference_images',
	model: 'doubao-seedance-2-0-260128',
	prompt: '',
	resolution: '720p',
	ratio: 'adaptive',
	duration: 5,
	advancedOptions: {},
	generateAudio: true,
	firstFrameInputMethod: 'url',
	firstFrameImageUrl: '',
	firstFrameBinaryProperty: 'data',
	lastFrameInputMethod: 'url',
	lastFrameImageUrl: '',
	lastFrameBinaryProperty: 'data',
};

test('reference_images execute request preserves URL、asset 和 binary 的配置顺序', async () => {
	const { calls, assertedBinaryProperties, context } = createVideoExecutionContext(
		{
			...baseVideoParameters,
			referenceImageItems: {
				items: [
					{ source: 'url', url: 'https://example.com/ref-1.png' },
					{ source: 'url', url: 'asset://library/ref-2' },
					{ source: 'binary', binaryProperty: 'refBinary' },
				],
			},
		},
		[{ id: 'task_ref_image', status: 'queued', created_at: 1710000000 }],
		{
			refBinary: { data: Buffer.from('ref-binary-image'), mimeType: 'image/png' },
		},
	);

	const result = await Seedance.prototype.execute.call(context);
	const request = calls[0];
	const content = (request.body as Record<string, unknown>).content as Array<Record<string, unknown>>;

	assert.equal(result[0][0].json.taskId, 'task_ref_image');
	assert.deepEqual(assertedBinaryProperties, ['refBinary']);
	assert.equal(content.length, 3);
	assert.deepEqual(content[0], {
		type: 'image_url',
		role: 'reference_image',
		image_url: { url: 'https://example.com/ref-1.png' },
	});
	assert.deepEqual(content[1], {
		type: 'image_url',
		role: 'reference_image',
		image_url: { url: 'asset://library/ref-2' },
	});
	assert.deepEqual(content[2], {
		type: 'image_url',
		role: 'reference_image',
		image_url: { url: `data:image/png;base64,${Buffer.from('ref-binary-image').toString('base64')}` },
	});
});

test('reference_images execute rejects empty URL before dispatching create request', async () => {
	const { calls, assertedBinaryProperties, context } = createVideoExecutionContext(
		{
			...baseVideoParameters,
			referenceImageItems: {
				items: [{ source: 'url', url: '   ' }],
			},
		},
		[{ id: 'should_not_be_used', status: 'queued' }],
	);

	await assert.rejects(
		() => Seedance.prototype.execute.call(context),
		/参考图 URL、asset 或 binary 数据不能为空/,
	);

	assert.deepEqual(calls, []);
	assert.deepEqual(assertedBinaryProperties, []);
});

test('legacy t2v create request does not leak reference_image content from hidden state', async () => {
	const { calls, assertedBinaryProperties, context } = createVideoExecutionContext(
		{
			...baseVideoParameters,
			createMode: 't2v',
			prompt: 'A cat running through a meadow',
			referenceImageItems: {
				items: [
					{ source: 'url', url: 'https://example.com/ref-1.png' },
					{ source: 'binary', binaryProperty: 'refBinary' },
				],
			},
		},
		[{ id: 'task_t2v', status: 'queued', created_at: 1710000001 }],
		{
			refBinary: { data: Buffer.from('hidden-ref-binary'), mimeType: 'image/png' },
		},
	);

	await Seedance.prototype.execute.call(context);

	const content = (calls[0].body as Record<string, unknown>).content as Array<Record<string, unknown>>;
	assert.deepEqual(assertedBinaryProperties, []);
	assert.deepEqual(content, [{ type: 'text', text: 'A cat running through a meadow' }]);
	assert.equal(content.some((item) => item.role === 'reference_image'), false);
	assert.equal(content.some((item) => item.role === 'first_frame'), false);
	assert.equal(content.some((item) => item.role === 'last_frame'), false);
});
