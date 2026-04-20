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

function getOptionValues(property: Record<string, unknown>): unknown[] {
	return (property.options as Array<Record<string, unknown>>).map((option) => option.value);
}

function getPropertyIndex(name: string): number {
	const index = getProperties().findIndex((property) => property.name === name);
	assert.notEqual(index, -1, `Expected property ${name} to exist`);
	return index;
}

function isVisibleFor(property: Record<string, unknown>, parameters: Record<string, unknown>): boolean {
	const displayOptions = property.displayOptions as { show?: Record<string, unknown[]> } | undefined;
	const show = displayOptions?.show;

	if (!show) {
		return true;
	}

	return Object.entries(show).every(([name, values]) => values.includes(parameters[name]));
}

function visiblePropertyNames(parameters: Record<string, unknown>): string[] {
	return getProperties()
		.filter((property) => isVisibleFor(property, parameters))
		.map((property) => property.name as string);
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

test('generation mode selector appears before operation and defaults to video', () => {
	const generationMode = findProperty('generationMode');

	assert.ok(getPropertyIndex('generationMode') < getPropertyIndex('operation'));
	assert.equal(generationMode.default, 'video');
	assert.deepEqual(generationMode.options, [
		{
			name: '视频生成',
			value: 'video',
			description: '创建、查询、列表和取消或删除 Seedance 视频任务',
		},
		{
			name: '图像生成',
			value: 'image',
			description: '使用 Seedream 5.0 lite 生成图片',
		},
	]);
});

test('video operation selector is only visible in video mode', () => {
	const operation = findProperty('operation');

	assert.deepEqual(getOptionValues(operation), ['create', 'get', 'list', 'delete']);
	assert.deepEqual(operation.displayOptions, {
		show: {
			generationMode: ['video'],
		},
	});
});

test('image operation selector is only visible in image mode', () => {
	const imageOperation = findProperty('imageOperation');

	assert.deepEqual(imageOperation.displayOptions, {
		show: {
			generationMode: ['image'],
		},
	});
	assert.deepEqual(imageOperation.options, [
		{
			name: '文生图',
			value: 'textToImage',
			description: '仅使用提示词生成图片',
			action: '文生图',
		},
		{
			name: '图生图',
			value: 'imageToImage',
			description: '使用提示词和参考图生成图片',
			action: '图生图',
		},
	]);
});

test('text-to-image visible fields follow the requested mode-first order', () => {
	const visibleNames = visiblePropertyNames({
		generationMode: 'image',
		imageOperation: 'textToImage',
		sequentialImageGeneration: 'auto',
	});

	assert.deepEqual(
		visibleNames.filter((name) =>
			[
				'generationMode',
				'imageOperation',
				'imageModel',
				'imagePrompt',
				'optimizePrompt',
				'imageResolution',
				'imageAspectRatio',
				'sequentialImageGeneration',
				'maxImages',
				'webSearch',
			].includes(name),
		),
		[
			'generationMode',
			'imageOperation',
			'imageModel',
			'imagePrompt',
			'optimizePrompt',
			'imageResolution',
			'imageAspectRatio',
			'sequentialImageGeneration',
			'maxImages',
			'webSearch',
		],
	);
});

test('image-to-image inserts reference controls after prompt optimization', () => {
	const visibleNames = visiblePropertyNames({
		generationMode: 'image',
		imageOperation: 'imageToImage',
		referenceImageSource: 'url',
		sequentialImageGeneration: 'disabled',
	});
	const relevantNames = visibleNames.filter((name) =>
		[
			'optimizePrompt',
			'referenceImageSource',
			'referenceImageUrl',
			'imageResolution',
			'imageAspectRatio',
		].includes(name),
	);

	assert.deepEqual(relevantNames, [
		'optimizePrompt',
		'referenceImageSource',
		'referenceImageUrl',
		'imageResolution',
		'imageAspectRatio',
	]);
	assert.equal(visibleNames.includes('maxImages'), false);
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
			generationMode: 'image',
			imageOperation: 'textToImage',
			imageModel: 'doubao-seedream-5-0-260128',
			imagePrompt: 'A quiet lake at sunrise',
			referenceImageSource: 'none',
			sequentialImageGeneration: 'disabled',
			imageResolution: '2K',
			imageAspectRatio: '1:1',
			webSearch: false,
			optimizePrompt: true,
		}),
	);

	assert.equal(result[0][0].binary?.image1.data, 'generated_image');
});

test('node description keeps the 24-hour asset warning explicit', () => {
	const description = new Seedance().description.description;

	assert.match(description, /24 小时|24 hours/);
});
