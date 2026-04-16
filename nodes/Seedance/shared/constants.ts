export const SEEDANCE_CREDENTIAL_TYPE = 'seedanceApi';

export const SEEDANCE_BASE_URL = 'https://ark.cn-beijing.volces.com';

export const SEEDANCE_API_VERSION = '2024-01-01';

export const SEEDANCE_TASK_STATUSES = [
  'queued',
  'running',
  'cancelled',
  'succeeded',
  'failed',
  'expired',
] as const;

export const SEEDANCE_TERMINAL_TASK_STATUSES = [
  'cancelled',
  'succeeded',
  'failed',
  'expired',
] as const;

export const SEEDANCE_AUTH_HEADER = 'Authorization';

export const SEEDANCE_AUTH_SCHEME = 'Bearer';
