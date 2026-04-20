/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const payloadModule = await import('../dist/nodes/Seedance/shared/mappers/seedreamImagePayload.js');
const imageOperationModule = await import('../dist/nodes/Seedance/description/image.operation.js');

const { buildSeedreamImagePayload, mapSeedreamRecommendedSize } = payloadModule;
const { imageOperationProperties } = imageOperationModule;

function baseInput(overrides = {}) {
	return {
		model: 'doubao-seedream-5-0-260128',
		prompt: 'A quiet lake at sunrise',
		referenceImages: [],
		sequentialImageGeneration: 'disabled',
		imageResolution: '2K',
		imageAspectRatio: '1:1',
		webSearch: false,
		optimizePromptMode: 'standard',
		...overrides,
	};
}

test('prompt-only payload defaults to b64_json and omits image', () => {
	const payload = buildSeedreamImagePayload(baseInput());

	assert.equal(payload.model, 'doubao-seedream-5-0-260128');
	assert.equal(payload.prompt, 'A quiet lake at sunrise');
	assert.equal(payload.response_format, 'b64_json');
	assert.equal(payload.sequential_image_generation, 'disabled');
	assert.equal(payload.size, '2048x2048');
	assert.equal('image' in payload, false);
});

test('binary reference becomes a data URL', () => {
	const payload = buildSeedreamImagePayload(
		baseInput({
			referenceImages: [{ source: 'binary', value: 'abc123', mimeType: 'image/png' }],
		}),
	);

	assert.equal(payload.image, 'data:image/png;base64,abc123');
});

test('URL and complete data URL inputs stay unchanged', () => {
	const dataUrl = 'data:image/jpeg;base64,xyz789';
	const payload = buildSeedreamImagePayload(
		baseInput({
			referenceImages: [
				{ source: 'url', value: 'https://example.com/cat.png' },
				{ source: 'base64', value: dataUrl },
			],
		}),
	);

	assert.deepEqual(payload.image, ['https://example.com/cat.png', dataUrl]);
});

test('multiple references preserve normalized order', () => {
	const references = Array.from({ length: 14 }, (_, index) => ({
		source: 'url',
		value: `https://example.com/${index}.png`,
	}));
	const payload = buildSeedreamImagePayload(baseInput({ referenceImages: references }));

	assert.deepEqual(
		payload.image,
		references.map((reference) => reference.value),
	);
});

test('group generation options are omitted when sequential generation is disabled', () => {
	const payload = buildSeedreamImagePayload(baseInput({ maxImages: 7 }));

	assert.equal('sequential_image_generation_options' in payload, false);
});

test('group generation, web search, and prompt optimization map to API fields', () => {
	const payload = buildSeedreamImagePayload(
		baseInput({ sequentialImageGeneration: 'auto', maxImages: 4, webSearch: true }),
	);

	assert.deepEqual(payload.sequential_image_generation_options, { max_images: 4 });
	assert.deepEqual(payload.tools, [{ type: 'web_search' }]);
	assert.deepEqual(payload.optimize_prompt_options, { mode: 'standard' });
});

test('payload keeps b64_json as the primary success path', () => {
	const payload = buildSeedreamImagePayload(baseInput());

	assert.equal(payload.response_format, 'b64_json');
	assert.equal('url' in payload, false);
});

test('recommended size mapping uses official Seedream table', () => {
	assert.equal(mapSeedreamRecommendedSize('3K', '21:9'), '4704x2016');
	assert.equal(mapSeedreamRecommendedSize('2K', '9:16'), '1600x2848');
});

test('image operation exposes resolution and aspect ratio fields instead of size', () => {
	const propertyNames = imageOperationProperties.map((property) => property.name);

	assert.ok(propertyNames.includes('imageResolution'));
	assert.ok(propertyNames.includes('imageAspectRatio'));
	assert.equal(propertyNames.includes('size'), false);
});
