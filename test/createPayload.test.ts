/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createOperationModule = await import('../dist/nodes/Seedance/description/create.operation.js');
const createPayloadModule = await import('../dist/nodes/Seedance/shared/mappers/createPayload.js');

const { createOperationProperties } = createOperationModule;
const { buildCreatePayload, buildCreateRequestSummary, mapCreateResponse } = createPayloadModule;

function getCreateModeProperty() {
	const createModeProperty = createOperationProperties.find(
		(property) => property.name === 'createMode',
	);

	assert.ok(createModeProperty);
	return createModeProperty;
}

function getReferenceMaterialsProperty() {
	const referenceMaterialsProperty = createOperationProperties.find(
		(property) => property.name === 'referenceMaterials',
	);

	assert.ok(referenceMaterialsProperty);
	return referenceMaterialsProperty;
}

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

test('创建模式追加多模态参考生视频且默认仍为文生视频', () => {
	const createModeProperty = getCreateModeProperty();

	assert.equal(createModeProperty.default, 't2v');
	assert.deepEqual(
		createModeProperty.options.map((option: { name: string; value: string }) => ({
			name: option.name,
			value: option.value,
		})),
		[
			{ name: '文生视频', value: 't2v' },
			{ name: '首帧图生视频', value: 'i2v_first' },
			{ name: '首尾帧图生视频', value: 'i2v_first_last' },
			{ name: '多模态参考生视频', value: 'multimodal_reference' },
		],
	);
});

test('多模态参考素材表单使用锁定字段名且不包含标签字段', () => {
	const referenceMaterialsProperty = getReferenceMaterialsProperty();
	const itemGroup = referenceMaterialsProperty.options[0];
	const values = itemGroup.values as Array<{
		displayName: string;
		name: string;
		default?: unknown;
		options?: Array<{ name: string; value: string }>;
	}>;

	assert.equal(referenceMaterialsProperty.displayName, '参考素材');
	assert.equal(referenceMaterialsProperty.type, 'fixedCollection');
	assert.deepEqual(referenceMaterialsProperty.displayOptions, {
		show: {
			generationMode: ['video'],
			operation: ['create'],
			createMode: ['multimodal_reference'],
		},
	});
	assert.deepEqual(
		values.map((value) => value.displayName),
		['素材类型', '素材来源', '素材来源', '素材URL', '素材URL', '属性名', '素材ID', '素材ID'],
	);
	assert.equal(values.some((value) => /标签|备注|名称/.test(value.displayName)), false);

	const materialType = values.find((value) => value.name === 'materialType');
	assert.ok(materialType);
	assert.equal(materialType.default, 'image');
	assert.deepEqual(materialType.options, [
		{ name: '图片', value: 'image' },
		{ name: '视频', value: 'video' },
		{ name: '音频', value: 'audio' },
	]);

	const materialSource = values.find((value) => value.name === 'materialSource');
	assert.ok(materialSource);
	assert.equal(materialSource.default, 'url');
	assert.deepEqual(materialSource.options, [
		{ name: 'URL链接', value: 'url' },
		{ name: 'Binary文件', value: 'binary' },
		{ name: '火山方舟素材库', value: 'asset' },
	]);

	const videoMaterialSource = values.find((value) => value.name === 'videoMaterialSource');
	assert.ok(videoMaterialSource);
	assert.deepEqual(videoMaterialSource.options, [
		{ name: 'URL链接', value: 'url' },
		{ name: '火山方舟素材库', value: 'asset' },
	]);
});

test('首尾帧字段不会在多模态参考生视频模式显示', () => {
	for (const propertyName of [
		'firstFrameInputMethod',
		'firstFrameImageUrl',
		'firstFrameBinaryProperty',
		'lastFrameInputMethod',
		'lastFrameImageUrl',
		'lastFrameBinaryProperty',
	]) {
		const property = createOperationProperties.find((item) => item.name === propertyName);
		assert.ok(property);
		assert.equal(
			property.displayOptions.show.createMode.includes('multimodal_reference'),
			false,
			`${propertyName} should not show in multimodal mode`,
		);
	}
});

test('真人脸限制提示放在图片相关取值字段描述中', () => {
	const notice = 'Seedance 2.0 当前只接受两类真人脸参考素材';
	const referenceMaterialsProperty = getReferenceMaterialsProperty();
	const values = referenceMaterialsProperty.options[0].values as Array<{
		name: string;
		description?: string;
	}>;

	for (const propertyName of [
		'firstFrameImageUrl',
		'firstFrameBinaryProperty',
		'lastFrameImageUrl',
		'lastFrameBinaryProperty',
	]) {
		const property = createOperationProperties.find((item) => item.name === propertyName);
		assert.ok(property);
		assert.match(property.description, new RegExp(notice));
	}

	for (const fieldName of ['materialUrl', 'binaryProperty', 'assetId']) {
		const field = values.find((value) => value.name === fieldName);
		assert.ok(field);
		assert.match(field.description, new RegExp(notice));
	}

	assert.doesNotMatch(String(getCreateModeProperty().description), new RegExp(notice));
	assert.doesNotMatch(String(referenceMaterialsProperty.description), new RegExp(notice));
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

test('多模态参考生视频按提示词优先和用户素材顺序构造官方 content', () => {
	const payload = buildCreatePayload({
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: '参考素材生成视频',
		referenceMaterials: [
			{
				materialType: 'image',
				materialSource: 'url',
				value: ' https://example.com/image.png ',
			},
			{
				materialType: 'audio',
				materialSource: 'binary',
				value: 'data:audio/wav;base64,audio_base64',
			},
			{
				materialType: 'video',
				materialSource: 'asset',
				value: 'video_asset',
			},
		],
	});

	assert.deepEqual(payload.content, [
		{ type: 'text', text: '参考素材生成视频' },
		{
			type: 'image_url',
			role: 'reference_image',
			image_url: { url: 'https://example.com/image.png' },
		},
		{
			type: 'audio_url',
			role: 'reference_audio',
			audio_url: { url: 'data:audio/wav;base64,audio_base64' },
		},
		{
			type: 'video_url',
			role: 'reference_video',
			video_url: { url: 'asset://video_asset' },
		},
	]);
	assert.equal(JSON.stringify(payload).includes('first_frame'), false);
	assert.equal(JSON.stringify(payload).includes('last_frame'), false);
});

test('多模态参考生视频允许只有图片或只有视频且提示词可选', () => {
	const imagePayload = buildCreatePayload({
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: '',
		referenceMaterials: [
			{
				materialType: 'image',
				materialSource: 'asset',
				value: 'asset://image_asset',
			},
		],
	});
	const videoPayload = buildCreatePayload({
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: '',
		referenceMaterials: [
			{
				materialType: 'video',
				materialSource: 'url',
				value: 'https://example.com/video.mp4',
			},
		],
	});

	assert.deepEqual(imagePayload.content, [
		{
			type: 'image_url',
			role: 'reference_image',
			image_url: { url: 'asset://image_asset' },
		},
	]);
	assert.deepEqual(videoPayload.content, [
		{
			type: 'video_url',
			role: 'reference_video',
			video_url: { url: 'https://example.com/video.mp4' },
		},
	]);
});

test('多模态 request summary 保留聚合字段并新增逐项安全摘要', () => {
	const summary = buildCreateRequestSummary({
		createMode: 'multimodal_reference',
		model: 'doubao-seedance-2-0-260128',
		prompt: '参考素材生成视频',
		referenceMaterials: [
			{
				materialType: 'image',
				materialSource: 'url',
				value: 'https://example.com/private-image.png',
			},
			{
				materialType: 'audio',
				materialSource: 'binary',
				value: 'voice',
			},
			{
				materialType: 'video',
				materialSource: 'asset',
				value: 'asset://private-video-asset',
			},
		],
	});

	assert.equal(summary.createMode, 'multimodal_reference');
	assert.equal(summary.prompt, '参考素材生成视频');
	assert.equal(summary.referenceCount, 3);
	assert.deepEqual(summary.referenceTypes, ['image', 'audio', 'video']);
	assert.deepEqual(summary.referenceSources, ['url', 'binary', 'asset']);
	assert.deepEqual(summary.referenceSummaries, [
		{ index: 1, type: 'image', role: 'reference_image', source: 'url' },
		{ index: 2, type: 'audio', role: 'reference_audio', source: 'binary' },
		{ index: 3, type: 'video', role: 'reference_video', source: 'asset' },
	]);
	assert.equal(JSON.stringify(summary).includes('private-image'), false);
	assert.equal(JSON.stringify(summary).includes('voice'), false);
	assert.equal(JSON.stringify(summary).includes('private-video-asset'), false);
	assert.equal(JSON.stringify(summary).includes('asset://'), false);
});

test('视频参考素材不接受 Binary 文件来源', () => {
	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				referenceMaterials: [
					{
						materialType: 'video',
						materialSource: 'binary',
						value: 'video',
					},
				],
			}),
		/视频参考素材不支持 Binary 文件来源/,
	);
});

test('多模态参考生视频拒绝空素材、只有提示词和只有音频', () => {
	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				prompt: '只有提示词',
				referenceMaterials: [],
			}),
		/至少提供 1 个参考图片或参考视频/,
	);

	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				referenceMaterials: [
					{
						materialType: 'audio',
						materialSource: 'url',
						value: 'https://example.com/audio.wav',
					},
				],
			}),
		/至少提供 1 个参考图片或参考视频/,
	);

	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				referenceMaterials: [
					{
						materialType: 'image',
						materialSource: 'url',
						value: '  ',
					},
				],
			}),
		/参考素材的来源值不能为空/,
	);
});

test('多模态参考生视频执行 Phase 15 数量上限', () => {
	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				referenceMaterials: Array.from({ length: 10 }, (_, index) => ({
					materialType: 'image' as const,
					materialSource: 'url' as const,
					value: `https://example.com/image-${index}.png`,
				})),
			}),
		/最多支持 9 张参考图片/,
	);

	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				referenceMaterials: [
					{
						materialType: 'image',
						materialSource: 'url',
						value: 'https://example.com/image.png',
					},
					...Array.from({ length: 4 }, (_, index) => ({
						materialType: 'video' as const,
						materialSource: 'url' as const,
						value: `https://example.com/video-${index}.mp4`,
					})),
				],
			}),
		/最多支持 3 个参考视频/,
	);

	assert.throws(
		() =>
			buildCreatePayload({
				createMode: 'multimodal_reference',
				model: 'doubao-seedance-2-0-260128',
				referenceMaterials: [
					{
						materialType: 'image',
						materialSource: 'url',
						value: 'https://example.com/image.png',
					},
					...Array.from({ length: 4 }, (_, index) => ({
						materialType: 'audio' as const,
						materialSource: 'url' as const,
						value: `https://example.com/audio-${index}.wav`,
					})),
				],
			}),
		/最多支持 3 段参考音频/,
	);
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
