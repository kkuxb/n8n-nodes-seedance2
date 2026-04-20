import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';

import type { SEEDANCE_TASK_STATUSES } from './constants';
import type {
  SEEDREAM_IMAGE_ASPECT_RATIOS,
  SEEDREAM_IMAGE_MODEL,
  SEEDREAM_IMAGE_RESOLUTIONS,
  SEEDREAM_REFERENCE_IMAGE_MIME_TYPES,
} from './constants';

export type SeedanceTaskStatus = (typeof SEEDANCE_TASK_STATUSES)[number];

export type SeedanceOperationKey = 'createTask' | 'getTask' | 'listTasks' | 'deleteTask' | 'generateImage';

export type SeedreamImageReferenceSource = 'none' | 'url' | 'base64' | 'binary' | 'multiple';

export type SeedreamSequentialImageGeneration = 'disabled' | 'auto';

export type SeedreamOptimizePromptMode = 'standard';

export type SeedreamImageResolution = (typeof SEEDREAM_IMAGE_RESOLUTIONS)[number];

export type SeedreamImageAspectRatio = (typeof SEEDREAM_IMAGE_ASPECT_RATIOS)[number];

export type SeedreamReferenceImageMimeType = (typeof SEEDREAM_REFERENCE_IMAGE_MIME_TYPES)[number];

export interface SeedreamImageReferenceInput {
  source: 'url' | 'base64' | 'binary';
  value: string;
  mimeType?: string;
  byteLength?: number;
}

export interface SeedreamNormalizedReferenceImage {
  source: 'url' | 'dataUrl';
  value: string;
}

export interface SeedreamImagePayloadInput {
  model: typeof SEEDREAM_IMAGE_MODEL;
  prompt: string;
  referenceImages?: SeedreamImageReferenceInput[];
  sequentialImageGeneration: SeedreamSequentialImageGeneration;
  maxImages?: number;
  imageResolution: SeedreamImageResolution;
  imageAspectRatio: SeedreamImageAspectRatio;
  watermark: boolean;
  webSearch: boolean;
  optimizePromptMode?: SeedreamOptimizePromptMode;
}

export interface SeedreamImageRequestSummary {
  model: string;
  prompt: string;
  size: string;
  referenceCount: number;
  sequentialImageGeneration: SeedreamSequentialImageGeneration;
  maxImages?: number;
  watermark: boolean;
  webSearch: boolean;
  optimizePromptMode?: SeedreamOptimizePromptMode;
}

export interface SeedreamMappedImageResult {
  index: number;
  isSuccess: boolean;
  binaryPropertyName?: string;
  mimeType?: string;
  fileName?: string;
  error?: {
    code?: string;
    message: string;
  };
}

export interface SeedreamImageBinaryAttachment {
  data: string;
  mimeType: string;
  fileName: string;
}

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
