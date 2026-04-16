import type { IDataObject } from 'n8n-workflow';

import {
  SEEDANCE_AUTH_HEADER,
  SEEDANCE_AUTH_SCHEME,
  SEEDANCE_BASE_URL,
  SEEDANCE_CREDENTIAL_TYPE,
} from '../constants';
import { normalizeSeedanceError } from '../mappers/errors';
import { buildSeedanceEndpointUrl } from './endpoints';
import type {
  SeedanceCredentialData,
  SeedanceHttpRequestOptions,
  SeedanceRequestContext,
  SeedanceRequestFunctions,
  SeedanceRequestOptions,
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
