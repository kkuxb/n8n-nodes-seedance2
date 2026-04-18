import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';

import type { SEEDANCE_TASK_STATUSES } from './constants';

export type SeedanceTaskStatus = (typeof SEEDANCE_TASK_STATUSES)[number];

export type SeedanceOperationKey = 'createTask' | 'getTask' | 'listTasks' | 'deleteTask';

export interface SeedanceCredentialData {
  apiKey: string;
}

export interface SeedanceRequestContext {
  apiKey: string;
  baseUrl: string;
  headers: Record<string, string>;
}

export interface SeedanceRequestOptions {
  method: IHttpRequestMethods;
  path: string;
  qs?: IDataObject;
  body?: IDataObject;
}

export type SeedanceHttpRequestOptions = IHttpRequestOptions;

export interface SeedanceApiErrorShape {
  code: string;
  message: string;
  statusCode?: number;
  raw?: unknown;
}

export interface SeedanceApiErrorPayload {
  code?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
  };
  [key: string]: unknown;
}

export interface SeedanceVideoDownloadResult {
  data: string;
  mimeType: string;
  fileName: string;
}

export type SeedanceRequestFunctions = Pick<
  IExecuteFunctions,
  'getCredentials' | 'helpers'
>;
