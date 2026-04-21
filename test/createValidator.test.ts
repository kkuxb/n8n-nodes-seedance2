/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const createValidatorModule = await import('../dist/nodes/Seedance/shared/validators/create.js');

const { validateCreateInput } = createValidatorModule;

test('reference_images 支持 1-9 张参考图且可省略提示词', () => {
	assert.doesNotThrow(() =>
		validateCreateInput({
			createMode: 'reference_images',
			model: 'doubao-seedance-2-0-260128',
			prompt: '',
			referenceImages: [
				{ type: 'url', data: 'https://example.com/ref-1.png' },
				{ type: 'binary', data: 'base64-image', mimeType: 'image/png' },
			],
		}),
	);
});

test('reference_videos 支持 1-3 个 URL 或 asset 字符串且可省略提示词', () => {
	assert.doesNotThrow(() =>
		validateCreateInput({
			createMode: 'reference_videos',
			model: 'doubao-seedance-2-0-fast-260128',
			prompt: '',
			referenceVideos: [
				{ url: 'https://example.com/ref-video.mp4' },
				{ url: 'asset://video_asset_123' },
			],
		}),
	);
});

test('reference_images 在缺少素材、超限或混合模式时会被拒绝', () => {
	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				referenceImages: [],
			}),
		/必须提供 1 到 9 张参考图/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				referenceImages: Array.from({ length: 10 }, (_, index) => ({
					type: 'url' as const,
					data: `https://example.com/ref-${index}.png`,
				})),
			}),
		/必须提供 1 到 9 张参考图/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				referenceImages: [{ type: 'url', data: 'https://example.com/ref.png' }],
				referenceVideos: [{ url: 'https://example.com/ref-video.mp4' }],
			}),
		/不能混用/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				firstFrameImage: { type: 'url', data: 'https://example.com/first.png' },
				referenceImages: [{ type: 'url', data: 'https://example.com/ref.png' }],
			}),
		/不能混用/,
	);
});

test('reference_images 会拒绝空 URL、空白 asset 占位和空 binary 占位', () => {
	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				referenceImages: [{ type: 'url', data: '' }],
			}),
		/参考图 URL、asset 或 binary 数据不能为空/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				referenceImages: [{ type: 'url', data: '   ' }],
			}),
		/参考图 URL、asset 或 binary 数据不能为空/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_images',
				model: 'doubao-seedance-2-0-260128',
				referenceImages: [{ type: 'binary', data: '' }],
			}),
		/参考图 URL、asset 或 binary 数据不能为空/,
	);
});

test('reference_videos 在缺少素材、超限、非法占位和 binary/base64 视频时会被拒绝', () => {
	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_videos',
				model: 'doubao-seedance-2-0-260128',
				referenceVideos: [],
			}),
		/必须提供 1 到 3 个参考视频/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_videos',
				model: 'doubao-seedance-2-0-260128',
				referenceVideos: Array.from({ length: 4 }, (_, index) => ({
					url: `https://example.com/ref-${index}.mp4`,
				})),
			}),
		/必须提供 1 到 3 个参考视频/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_videos',
				model: 'doubao-seedance-2-0-260128',
				referenceVideos: [{ url: '' }],
			}),
		/参考视频 URL 或 asset 不能为空/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_videos',
				model: 'doubao-seedance-2-0-260128',
				referenceVideos: [{ url: 'data:video/mp4;base64,AAAA' }],
			}),
		/binary\/base64 参考视频/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_videos',
				model: 'doubao-seedance-2-0-260128',
				referenceVideos: [{ url: 'binary:video' }],
			}),
		/binary\/base64 参考视频/,
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'reference_videos',
				model: 'doubao-seedance-2-0-260128',
				referenceVideos: [{ url: 'https://example.com/ref-video.mp4' }],
				referenceAudio: [{ url: 'https://example.com/ref-audio.mp3' }],
			}),
		/不支持参考音频/,
	);
});

test('旧的 create mode 校验在新增参考模式后仍保持不变', () => {
	assert.throws(
		() =>
			validateCreateInput({
				createMode: 't2v',
				model: 'doubao-seedance-2-0-260128',
				prompt: '',
			}),
		/文生视频模式下，请输入提示词/,
	);

	assert.doesNotThrow(() =>
		validateCreateInput({
			createMode: 'i2v_first',
			model: 'doubao-seedance-2-0-260128',
			firstFrameImage: { type: 'url', data: 'https://example.com/first.png' },
		}),
	);

	assert.throws(
		() =>
			validateCreateInput({
				createMode: 'i2v_first_last',
				model: 'doubao-seedance-2-0-260128',
				firstFrameImage: { type: 'url', data: 'https://example.com/first.png' },
			}),
		/必须提供尾帧图片/,
	);
});
