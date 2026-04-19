/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const resultModule = await import('../dist/nodes/Seedance/shared/mappers/seedreamImageResult.js');

const { mapSeedreamImageResponse } = resultModule;

function requestSummary() {
	return {
		model: 'doubao-seedream-5-0-260128',
		prompt: 'A quiet lake at sunrise',
		size: '2048x2048',
		referenceCount: 0,
		sequentialImageGeneration: 'disabled',
		webSearch: false,
		optimizePromptMode: 'standard',
	};
}

test('single b64_json success maps to binary.image1 and one JSON image row', () => {
	const mapped = mapSeedreamImageResponse(
		{ data: [{ b64_json: 'base64_image_payload', size: '2048x2048' }] },
		requestSummary(),
	);

	assert.equal(mapped.binary?.image1.data, 'base64_image_payload');
	assert.equal(mapped.binary?.image1.mimeType, 'image/png');
	assert.equal(mapped.binary?.image1.fileName, 'seedream-image-1.png');
	assert.deepEqual((mapped.json.images as Array<Record<string, unknown>>)[0], {
		index: 0,
		isSuccess: true,
		binaryPropertyName: 'image1',
		mimeType: 'image/png',
		fileName: 'seedream-image-1.png',
	});
});

test('multiple successful results use binary.image1, binary.image2, and ordered file names', () => {
	const mapped = mapSeedreamImageResponse(
		{ data: [{ b64_json: 'first' }, { b64_json: 'second' }] },
		requestSummary(),
	);

	assert.equal(mapped.binary?.image1.fileName, 'seedream-image-1.png');
	assert.equal(mapped.binary?.image2.fileName, 'seedream-image-2.png');
	assert.deepEqual((mapped.json.images as Array<Record<string, unknown>>).map((image) => image.binaryPropertyName), [
		'image1',
		'image2',
	]);
});

test('mixed success and failure preserves failed image row without throwing', () => {
	const mapped = mapSeedreamImageResponse(
		{
			data: [
				{ b64_json: 'first_image' },
				{ error: { code: 'content_policy', message: 'unsafe prompt' } },
			],
		},
		requestSummary(),
	);

	const images = mapped.json.images as Array<Record<string, unknown>>;
	assert.ok(mapped.binary?.image1);
	assert.equal(images[0].isSuccess, true);
	assert.deepEqual(images[1], {
		index: 1,
		isSuccess: false,
		error: { code: 'content_policy', message: 'unsafe prompt' },
	});
});

test('all-failed response throws one aggregated error with each reason', () => {
	assert.throws(
		() =>
			mapSeedreamImageResponse(
				{
					data: [
						{ error: { code: 'bad_reference', message: 'first failed' } },
						{ error: { code: 'bad_prompt', message: 'second failed' } },
					],
				},
				requestSummary(),
			),
		/error.*first failed.*second failed|first failed.*second failed/,
	);
});

test('mapped JSON includes metadata but excludes raw b64_json', () => {
	const mapped = mapSeedreamImageResponse(
		{
			data: [{ b64_json: 'raw_base64_secret' }],
			usage: { generated_images: 1, total_tokens: 100, tool_usage: { web_search: 1 } },
			tools: [{ type: 'web_search' }],
		},
		{ ...requestSummary(), webSearch: true },
	);

	assert.deepEqual(mapped.json.requestSummary, { ...requestSummary(), webSearch: true });
	assert.deepEqual(mapped.json.usage, {
		generated_images: 1,
		total_tokens: 100,
		tool_usage: { web_search: 1 },
	});
	assert.deepEqual(mapped.json.toolCalls, { web_search: 1 });
	assert.equal(JSON.stringify(mapped.json).includes('raw_base64_secret'), false);
});

test('mapper uses b64_json as fulfillment path and does not require URL', () => {
	const mapped = mapSeedreamImageResponse({ data: [{ b64_json: 'image_without_url' }] }, requestSummary());

	assert.ok(mapped.binary?.image1);
	assert.equal(JSON.stringify(mapped.json).includes('url'), false);
});
