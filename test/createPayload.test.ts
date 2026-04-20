/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createOperationModule = await import('../dist/nodes/Seedance/description/create.operation.js');
const createPayloadModule = await import('../dist/nodes/Seedance/shared/mappers/createPayload.js');

const { createOperationProperties } = createOperationModule;
const { buildCreatePayload, buildCreateRequestSummary, mapCreateResponse } = createPayloadModule;

test('顶层的默认视频时长为 5 秒', () => {
	const durationProperty = createOperationProperties.find(
		(property) => property.name === 'duration',
	);

	assert.ok(durationProperty);
	assert.equal(durationProperty.default, 5);
});

test('模型字段仍然仅暴露 Seedance 2.0 系列下拉选项', () => {
	const modelProperty = createOperationProperties.find((property) => property.name === 'model');

	assert.ok(modelProperty);
	assert.equal(modelProperty.type, 'options');
	assert.deepEqual(modelProperty.options, [
		{
			name: 'Seedance 2.0',
			value: 'doubao-seedance-2-0-260128',
			description: '模型 ID：doubao-seedance-2-0-260128',
		},
		{
			name: 'Seedance 2.0 Fast',
			value: 'doubao-seedance-2-0-fast-260128',
			description: '模型 ID：doubao-seedance-2-0-fast-260128',
		},
	]);
});

test('常用选项被直接暴露在根层，不再收进 collection', () => {
	const props = createOperationProperties.map((property) => property.name);
	assert.ok(props.includes('resolution'));
	assert.ok(props.includes('ratio'));
	assert.ok(props.includes('duration'));
	assert.ok(props.includes('generateAudio'));
	assert.equal(props.includes('commonOptions'), false);
});

test('高级选项只包含 4 个进阶参数', () => {
	const advancedOptionsProperty = createOperationProperties.find(
		(property) => property.name === 'advancedOptions',
	);

	assert.ok(advancedOptionsProperty);
	assert.deepEqual(
		advancedOptionsProperty.options.map((property: { name: string }) => property.name),
		['seed', 'watermark', 'returnLastFrame', 'executionExpiresAfter'],
	);
});

test('视频高级选项中的水印默认值为 false', () => {
	const advancedOptionsProperty = createOperationProperties.find(
		(property) => property.name === 'advancedOptions',
	);

	assert.ok(advancedOptionsProperty);
	const watermarkProperty = advancedOptionsProperty.options.find(
		(property: { name: string }) => property.name === 'watermark',
	);

	assert.ok(watermarkProperty);
	assert.equal(watermarkProperty.default, false);
});

test('视频 create payload 在显式关闭水印时仍会传递 watermark=false', () => {
	const payload = buildCreatePayload({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-260128',
		prompt: '无水印视频',
		watermark: false,
	});

	assert.equal(payload.watermark, false);
});

test('文生 create payload 自动构造 text content 项', () => {
	const payload = buildCreatePayload({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-260128',
		prompt: '一只小猫对着镜头打哈欠',
		resolution: '720p',
		ratio: 'adaptive',
		duration: 5,
		seed: 11,
		watermark: true,
		executionExpiresAfter: 7200,
		returnLastFrame: true,
		generateAudio: true,
	});

	assert.equal(payload.model, 'doubao-seedance-2-0-260128');
	assert.deepEqual(payload.content, [{ type: 'text', text: '一只小猫对着镜头打哈欠' }]);
	assert.equal(payload.duration, 5);
	assert.equal(payload.ratio, 'adaptive');
	assert.equal(payload.return_last_frame, true);
	assert.equal(payload.generate_audio, true);
	assert.equal('service_tier' in payload, false);
	assert.equal('frames' in payload, false);
});

test('首帧图生模式自动构造 first_frame role 的图片', () => {
	const payload = buildCreatePayload({
		createMode: 'i2v_first',
		model: 'doubao-seedance-2-0-260128',
		prompt: 'A cat',
		firstFrameImage: {
			type: 'url',
			data: 'http://example.com/cat.jpg',
		},
	});
	assert.deepEqual(payload.content, [
		{ type: 'text', text: 'A cat' },
		{ type: 'image_url', role: 'first_frame', image_url: { url: 'http://example.com/cat.jpg' } },
	]);
});

test('首尾帧图生模式构造首尾两张图片，并支持 Base64', () => {
	const payload = buildCreatePayload({
		createMode: 'i2v_first_last',
		model: 'doubao-seedance-2-0-260128',
		prompt: '',
		firstFrameImage: {
			type: 'binary',
			data: 'base64_first',
			mimeType: 'image/png',
		},
		lastFrameImage: {
			type: 'binary',
			data: 'base64_last',
			mimeType: 'image/jpeg',
		},
	});
	assert.deepEqual(payload.content, [
		{ type: 'image_url', role: 'first_frame', image_url: { url: 'data:image/png;base64,base64_first' } },
		{ type: 'image_url', role: 'last_frame', image_url: { url: 'data:image/jpeg;base64,base64_last' } },
	]);
});

test('不支持的 1080p 分辨率会抛出明确错误', () => {
	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 't2v',
				model: 'doubao-seedance-2-0-260128',
				prompt: '城市夜景',
				resolution: '1080p',
			}),
		/480p 和 720p/,
	);
});

test('不支持的模型会抛出明确错误', () => {
	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 't2v',
				model: 'doubao-seedance-1-5-pro-251215',
				prompt: '城市夜景',
			}),
		/仅支持 Seedance 2.0 和 Seedance 2.0 fast/,
	);
});

test('create request summary 保留轮询需要的关键输入摘要', () => {
	const summary = buildCreateRequestSummary({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-fast-260128',
		prompt: '海边日落延时摄影',
		duration: -1,
		watermark: false,
		generateAudio: true,
	});

	assert.equal(summary.model, 'doubao-seedance-2-0-fast-260128');
	assert.equal(summary.prompt, '海边日落延时摄影');
	assert.equal(summary.duration, -1);
	assert.equal(summary.generateAudio, true);
});

test('create 响应映射返回 taskId 与 requestSummary', () => {
	const summary = buildCreateRequestSummary({
		createMode: 't2v',
		model: 'doubao-seedance-2-0-260128',
		prompt: '宇航员漫步月球',
		duration: 5,
	});

	const mapped = mapCreateResponse(
		{
			id: 'task_123',
			status: 'queued',
			created_at: 1710000000,
		},
		summary,
	);

	assert.equal(mapped.taskId, 'task_123');
	assert.equal(mapped.status, 'queued');
	assert.equal(mapped.createdAt, 1710000000);
	assert.deepEqual(mapped.requestSummary, summary);
	assert.ok(mapped.raw);
});
