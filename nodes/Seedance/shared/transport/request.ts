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

	try {
		const pathname = new URL(url).pathname;
		const extension = pathname.split('.').pop()?.toLowerCase();

		if (extension && extension.length <= 5) {
			return extension;
		}
	} catch {
		// Ignore URL parsing errors and fall back to mp4.
	}

	return 'mp4';
}

export async function downloadSeedanceVideo(
	executor: SeedanceRequestFunctions,
	videoUrl: string,
	taskId?: string,
): Promise<SeedanceVideoDownloadResult> {
	try {
		const response = await executor.helpers.httpRequest({
			method: 'GET',
			url: videoUrl,
			json: false,
			encoding: 'arraybuffer',
			returnFullResponse: true,
		});

		const body = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body as ArrayBuffer);
		const mimeType =
			typeof response.headers?.['content-type'] === 'string' && response.headers['content-type'] !== ''
				? response.headers['content-type']
				: 'video/mp4';
		const fileExtension = getVideoFileExtension(videoUrl, mimeType);
		const safeTaskId = typeof taskId === 'string' && taskId !== '' ? taskId : 'seedance-video';

		return {
			data: body.toString('base64'),
			mimeType,
			fileName: `${safeTaskId}.${fileExtension}`,
		};
	} catch (error) {
		throw normalizeSeedanceDownloadError(error);
	}
}
