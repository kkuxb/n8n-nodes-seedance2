/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const validatorModule = await import('../dist/nodes/Seedance/shared/validators/seedreamImage.js');

const { validateSeedreamImageInput } = validatorModule;

function validInput(overrides = {}) {
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

function binaryReference(overrides = {}) {
	return {
		source: 'binary',
		value: 'abc123',
		mimeType: 'image/png',
		byteLength: 1024,
		...overrides,
	};
}

test('prompt-only requests with zero references pass validation', () => {
	assert.doesNotThrow(() => validateSeedreamImageInput(validInput()));
});

test('one binary reference and fourteen URL references pass count validation', () => {
	assert.doesNotThrow(() =>
		validateSeedreamImageInput(validInput({ referenceImages: [binaryReference()] })),
	);

	const fourteenReferences = Array.from({ length: 14 }, (_, index) => ({
		source: 'url',
		value: `https://example.com/${index}.png`,
	}));
	assert.doesNotThrow(() =>
		validateSeedreamImageInput(validInput({ referenceImages: fourteenReferences })),
	);
});

test('fifteen references fail with reference limit message', () => {
	const fifteenReferences = Array.from({ length: 15 }, (_, index) => ({
		source: 'url',
		value: `https://example.com/${index}.png`,
	}));

	assert.throws(
		() => validateSeedreamImageInput(validInput({ referenceImages: fifteenReferences })),
		/1 到 14/,
	);
});

test('binary MIME type must use the Seedream allowlist', () => {
	assert.doesNotThrow(() =>
		validateSeedreamImageInput(
			validInput({
				referenceImages: [
					binaryReference({ mimeType: 'image/jpeg' }),
					binaryReference({ mimeType: 'image/webp' }),
					binaryReference({ mimeType: 'image/bmp' }),
					binaryReference({ mimeType: 'image/tiff' }),
					binaryReference({ mimeType: 'image/gif' }),
				],
			}),
		),
	);

	assert.throws(
		() =>
			validateSeedreamImageInput(
				validInput({ referenceImages: [binaryReference({ mimeType: 'image/svg+xml' })] }),
			),
		/MIME/,
	);
});

test('binary references cannot exceed 10MB', () => {
	assert.throws(
		() =>
			validateSeedreamImageInput(
				validInput({
					referenceImages: [binaryReference({ byteLength: 10 * 1024 * 1024 + 1 })],
				}),
			),
		/10MB/,
	);
});

test('group mode enforces reference count plus maxImages <= 15', () => {
	const fourteenReferences = Array.from({ length: 14 }, (_, index) => ({
		source: 'url',
		value: `https://example.com/${index}.png`,
	}));

	assert.throws(
		() =>
			validateSeedreamImageInput(
				validInput({
					referenceImages: fourteenReferences,
					sequentialImageGeneration: 'auto',
					maxImages: 2,
				}),
			),
		/15/,
	);
});

test('maxImages rejects non-integers and values outside 1 to 15', () => {
	for (const maxImages of [0, 1.5, 16]) {
		assert.throws(
			() =>
				validateSeedreamImageInput(
					validInput({ sequentialImageGeneration: 'auto', maxImages }),
				),
			/1 到 15/,
		);
	}
});

test('invalid resolution or aspect ratio cannot bypass recommended-size contract', () => {
	assert.throws(
		() => validateSeedreamImageInput(validInput({ imageResolution: '4K' })),
		/分辨率/,
	);
	assert.throws(
		() => validateSeedreamImageInput(validInput({ imageAspectRatio: '10:1' })),
		/比例/,
	);
});
