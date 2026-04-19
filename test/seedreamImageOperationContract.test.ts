/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const nodeModule = await import('../dist/nodes/Seedance/Seedance.node.js');
const constantsModule = await import('../dist/nodes/Seedance/shared/constants.js');
const endpointsModule = await import('../dist/nodes/Seedance/shared/transport/endpoints.js');

const { Seedance } = nodeModule;
const { SEEDREAM_IMAGE_MODEL } = constantsModule;
const { getSeedanceOperationEndpoint } = endpointsModule;

function getProperties(): Array<Record<string, unknown>> {
	return new Seedance().description.properties as Array<Record<string, unknown>>;
}

function findProperty(name: string): Record<string, unknown> {
	const property = getProperties().find((item) => item.name === name);
	assert.ok(property, `Expected property ${name} to exist`);
	return property;
}

function assertGenerateImageOnly(property: Record<string, unknown>) {
	assert.deepEqual(property.displayOptions, {
		show: {
			operation: ['generateImage'],
		},
	});
}

function createExecutionContext(parameters: Record<string, unknown>) {
	return {
		getInputData() {
			return [{ json: {} }];
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
			async httpRequest() {
				return { data: [{ b64_json: 'generated_image' }] };
			},
			assertBinaryData() {
				throw new Error('Image skeleton must not read binary data');
			},
			async getBinaryDataBuffer() {
				throw new Error('Image skeleton must not read binary data');
			},
		},
	};
}

test('operation selector preserves video operations and adds generateImage', () => {
	const operation = findProperty('operation');
	const optionValues = (operation.options as Array<Record<string, unknown>>).map(
		(option) => option.value,
	);

	assert.deepEqual(optionValues, ['create', 'generateImage', 'get', 'list', 'delete']);
	assert.deepEqual((operation.options as Array<Record<string, unknown>>)[1], {
		name: '生成图片',
		value: 'generateImage',
		description: '使用 Seedream 5.0 lite 生成图片',
		action: '生成图片',
	});
});

test('image operation fields are gated to generateImage', () => {
	for (const name of [
		'imageModel',
		'imagePrompt',
		'referenceImageSource',
		'sequentialImageGeneration',
		'maxImages',
		'imageAdvancedOptions',
	]) {
		assertGenerateImageOnly(findProperty(name));
	}
});

test('image model is fixed to Seedream 5.0 lite', () => {
	const imageModel = findProperty('imageModel');

	assert.equal(imageModel.default, 'doubao-seedream-5-0-260128');
	assert.deepEqual(imageModel.options, [
		{
			name: 'Seedream 5.0 Lite',
			value: 'doubao-seedream-5-0-260128',
			description: '模型 ID：doubao-seedream-5-0-260128',
		},
	]);
});

test('image operation does not expose streaming, output format, or watermark fields', () => {
	const propertyNames = getProperties().map((property) => property.name);

	assert.equal(propertyNames.includes('stream'), false);
	assert.equal(propertyNames.includes('output_format'), false);
	assert.equal(propertyNames.includes('outputFormat'), false);
	assert.equal(propertyNames.includes('watermark'), false);
});

test('Seedream image constants and endpoint are exported', () => {
	assert.equal(SEEDREAM_IMAGE_MODEL, 'doubao-seedream-5-0-260128');
	assert.equal(getSeedanceOperationEndpoint('generateImage'), '/api/v3/images/generations');
});

test('generateImage execute path is live and returns binary image output', async () => {
	const result = await Seedance.prototype.execute.call(
		createExecutionContext({
			operation: 'generateImage',
			imageModel: 'doubao-seedream-5-0-260128',
			imagePrompt: 'A quiet lake at sunrise',
			referenceImageSource: 'none',
			sequentialImageGeneration: 'disabled',
			imageResolution: '2K',
			imageAspectRatio: '1:1',
			imageAdvancedOptions: { webSearch: false, optimizePromptMode: 'standard' },
		}),
	);

	assert.equal(result[0][0].binary?.image1.data, 'generated_image');
});

test('node description keeps the 24-hour asset warning explicit', () => {
	const description = new Seedance().description.description;

	assert.match(description, /24 小时|24 hours/);
});
