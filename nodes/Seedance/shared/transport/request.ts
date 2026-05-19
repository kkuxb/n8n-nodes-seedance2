import type { IDataObject } from 'n8n-workflow';

import {
  SEEDANCE_AUTH_HEADER,
  SEEDANCE_AUTH_SCHEME,
  SEEDANCE_BASE_URL,
  SEEDANCE_CREDENTIAL_TYPE,
} from '../constants';
import { normalizeSeedanceDownloadError, normalizeSeedanceError } from '../mappers/errors';
import { buildSeedanceEndpointUrl } from './endpoints';
import type {
  SeedanceCredentialData,
  SeedanceHttpRequestOptions,
  SeedanceRequestContext,
  SeedanceRequestFunctions,
  SeedanceRequestOptions,
  SeedanceBinaryDownloadResult,
  SeedanceVideoDownloadResult,
} from '../types';

export function buildSeedanceAuthHeaders(apiKey: string): Record<string, string> {
  return {
    [SEEDANCE_AUTH_HEADER]: `${SEEDANCE_AUTH_SCHEME} ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function loadSeedanceRequestContext(
  executor: SeedanceRequestFunctions,
): Promise<SeedanceRequestContext> {
  const credentials = (await executor.getCredentials(SEEDANCE_CREDENTIAL_TYPE)) as SeedanceCredentialData;

  return {
    apiKey: credentials.apiKey,
    baseUrl: SEEDANCE_BASE_URL,
    headers: buildSeedanceAuthHeaders(credentials.apiKey),
  };
}

export function buildSeedanceHttpRequestOptions(
  context: SeedanceRequestContext,
  options: SeedanceRequestOptions,
): SeedanceHttpRequestOptions {
  return {
    method: options.method,
    url: buildSeedanceEndpointUrl(options.path, context.baseUrl),
    headers: context.headers,
    ...(options.qs ? { qs: options.qs } : {}),
    ...(options.body ? { body: options.body } : {}),
    json: true,
  };
}

export async function seedanceApiRequest<T = IDataObject>(
  executor: SeedanceRequestFunctions,
  options: SeedanceRequestOptions,
): Promise<T> {
  const context = await loadSeedanceRequestContext(executor);
  const requestOptions = buildSeedanceHttpRequestOptions(context, options);

  try {
    return (await executor.helpers.httpRequest(requestOptions)) as T;
  } catch (error) {
    throw normalizeSeedanceError(error);
  }
}

function getVideoFileExtension(url: string, mimeType: string): string {
	if (mimeType === 'video/mp4') {
		return 'mp4';
	}

	return getUrlFileExtension(url, 'mp4');
}

function getImageFileExtension(url: string, mimeType: string): string {
	const imageMimeExtensions: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/bmp': 'bmp',
		'image/tiff': 'tiff',
		'image/heic': 'heic',
		'image/heif': 'heif',
	};
	const normalizedMimeType = mimeType.split(';')[0]?.trim().toLowerCase() ?? '';

	return imageMimeExtensions[normalizedMimeType] ?? getUrlFileExtension(url, 'png');
}

function getUrlFileExtension(url: string, fallback: string): string {
	try {
		const pathname = new URL(url).pathname;
		const extension = pathname.split('.').pop()?.toLowerCase();

		if (extension && extension.length <= 5) {
			return extension;
		}
	} catch {
		// Ignore URL parsing errors and fall back to the provided extension.
	}

	return fallback;
}

async function downloadSeedanceBinaryAsset(
	executor: SeedanceRequestFunctions,
	url: string,
	fileNameStem: string,
	defaultMimeType: string,
	getFileExtension: (url: string, mimeType: string) => string,
): Promise<SeedanceBinaryDownloadResult> {
	try {
		const response = await executor.helpers.httpRequest({
			method: 'GET',
			url,
			headers: {},
			json: false,
			encoding: 'arraybuffer',
			returnFullResponse: true,
			sendCredentialsOnCrossOriginRedirect: false,
		});

		const body = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body as ArrayBuffer);
		const mimeType =
			typeof response.headers?.['content-type'] === 'string' && response.headers['content-type'] !== ''
				? response.headers['content-type']
				: defaultMimeType;
		const fileExtension = getFileExtension(url, mimeType);

		return {
			data: body.toString('base64'),
			mimeType,
			fileName: `${fileNameStem}.${fileExtension}`,
		};
	} catch (error) {
		throw normalizeSeedanceDownloadError(error);
	}
}

export async function downloadSeedanceVideo(
	executor: SeedanceRequestFunctions,
	videoUrl: string,
	taskId?: string,
): Promise<SeedanceVideoDownloadResult> {
	const safeTaskId = typeof taskId === 'string' && taskId !== '' ? taskId : 'seedance-video';
	const mimeType = 'video/mp4';

	return await downloadSeedanceBinaryAsset(
		executor,
		videoUrl,
		safeTaskId,
		mimeType,
		getVideoFileExtension,
	);
}

export async function downloadSeedanceLastFrame(
	executor: SeedanceRequestFunctions,
	lastFrameUrl: string,
	taskId?: string,
): Promise<SeedanceBinaryDownloadResult> {
	const safeTaskId = typeof taskId === 'string' && taskId !== '' ? taskId : 'seedance-last-frame';
	const mimeType = 'image/png';

	return await downloadSeedanceBinaryAsset(
		executor,
		lastFrameUrl,
		`${safeTaskId}-last-frame`,
		mimeType,
		getImageFileExtension,
	);
}
