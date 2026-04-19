import type { IDataObject } from 'n8n-workflow';

import type {
	SeedreamImageBinaryAttachment,
	SeedreamImageRequestSummary,
	SeedreamMappedImageResult,
} from '../types';

interface SeedreamRawImageItem {
	b64_json?: unknown;
	size?: unknown;
	url?: unknown;
	error?: {
		code?: unknown;
		message?: unknown;
	};
	[key: string]: unknown;
}

interface SeedreamMappedImageResponse {
	json: IDataObject;
	binary?: Record<string, SeedreamImageBinaryAttachment>;
}

function getResponseData(response: unknown): SeedreamRawImageItem[] {
	if (
		typeof response === 'object' &&
		response !== null &&
		Array.isArray((response as { data?: unknown }).data)
	) {
		return (response as { data: SeedreamRawImageItem[] }).data;
	}

	return [];
}

function getErrorMessage(item: SeedreamRawImageItem, index: number): { code?: string; message: string } {
	const code = typeof item.error?.code === 'string' ? item.error.code : undefined;
	const message =
		typeof item.error?.message === 'string' && item.error.message !== ''
			? item.error.message
			: `第 ${index + 1} 张图片生成失败。`;

	return { ...(code ? { code } : {}), message };
}

function extractToolCalls(response: unknown): unknown {
	if (typeof response !== 'object' || response === null) {
		return undefined;
	}

	const rawResponse = response as { tools?: unknown; usage?: { tool_usage?: unknown } };

	if (typeof rawResponse.usage?.tool_usage !== 'undefined') {
		return rawResponse.usage.tool_usage;
	}

	return rawResponse.tools;
}

export function mapSeedreamImageResponse(
	response: unknown,
	requestSummary: SeedreamImageRequestSummary,
): SeedreamMappedImageResponse {
	const data = getResponseData(response);
	const images: SeedreamMappedImageResult[] = [];
	const binary: Record<string, SeedreamImageBinaryAttachment> = {};
	let successCount = 0;

	data.forEach((item, index) => {
		if (typeof item.b64_json === 'string' && item.b64_json !== '') {
			successCount++;
			const binaryPropertyName = `image${successCount}`;
			const mimeType = 'image/png';
			const fileName = `seedream-image-${successCount}.png`;

			binary[binaryPropertyName] = {
				data: item.b64_json,
				mimeType,
				fileName,
			};

			images.push({
				index,
				isSuccess: true,
				binaryPropertyName,
				mimeType,
				fileName,
			});

			return;
		}

		images.push({
			index,
			isSuccess: false,
			error: getErrorMessage(item, index),
		});
	});

	if (successCount === 0) {
		const reasons = images
			.map((image) => `#${image.index + 1}: ${image.error?.message ?? '未知错误'}`)
			.join('; ');

		throw new Error(`Seedream 图片生成全部失败：${reasons || '未返回成功图片。'}`);
	}

	const rawResponse = typeof response === 'object' && response !== null ? response as IDataObject : {};
	const json: IDataObject = {
		requestSummary: requestSummary as unknown as IDataObject,
		images: images as unknown as IDataObject[],
	};

	if (typeof rawResponse.usage !== 'undefined') {
		json.usage = rawResponse.usage;
	}

	const toolCalls = extractToolCalls(response);
	if (typeof toolCalls !== 'undefined') {
		json.toolCalls = toolCalls as IDataObject;
	}

	return {
		json,
		binary,
	};
}
