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

export const SEEDREAM_IMAGE_MODEL = 'doubao-seedream-5-0-260128';

export const SEEDREAM_IMAGE_RESPONSE_FORMAT = 'b64_json';

export const SEEDREAM_REFERENCE_IMAGE_MAX_COUNT = 14;

export const SEEDREAM_REFERENCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const SEEDREAM_REFERENCE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/gif',
] as const;

export const SEEDREAM_IMAGE_RESOLUTIONS = ['2K', '3K'] as const;

export const SEEDREAM_IMAGE_ASPECT_RATIOS = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '3:2',
  '2:3',
  '21:9',
] as const;

export const SEEDREAM_RECOMMENDED_IMAGE_SIZES = {
  '2K': {
    '1:1': '2048x2048',
    '4:3': '2304x1728',
    '3:4': '1728x2304',
    '16:9': '2848x1600',
    '9:16': '1600x2848',
    '3:2': '2496x1664',
    '2:3': '1664x2496',
    '21:9': '3136x1344',
  },
  '3K': {
    '1:1': '3072x3072',
    '4:3': '3456x2592',
    '3:4': '2592x3456',
    '16:9': '4096x2304',
    '9:16': '2304x4096',
    '3:2': '3744x2496',
    '2:3': '2496x3744',
    '21:9': '4704x2016',
  },
} as const;
