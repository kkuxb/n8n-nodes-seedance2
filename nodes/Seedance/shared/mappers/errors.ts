import type { SeedanceApiErrorPayload, SeedanceApiErrorShape } from '../types';

const FALLBACK_ERROR_CODE = 'SEEDANCE_REQUEST_FAILED';
const FALLBACK_ERROR_MESSAGE = 'Seedance request failed';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

export function normalizeSeedanceError(error: unknown): SeedanceApiErrorShape {
  const raw = error;
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord?.response);
  const responseBody = (response?.body ?? response?.data ?? errorRecord?.body ?? errorRecord?.data) as
    | SeedanceApiErrorPayload
    | undefined;
  const nestedError = asRecord(responseBody?.error);
  const statusCode =
    typeof response?.statusCode === 'number'
      ? response.statusCode
      : typeof errorRecord?.statusCode === 'number'
        ? (errorRecord.statusCode as number)
        : undefined;

  const codeCandidate =
    nestedError?.code ?? responseBody?.code ?? errorRecord?.code ?? errorRecord?.name ?? FALLBACK_ERROR_CODE;
  const messageCandidate =
    nestedError?.message ??
    responseBody?.message ??
    errorRecord?.message ??
    (statusCode ? `Seedance request failed with status ${statusCode}` : FALLBACK_ERROR_MESSAGE);

  return {
    code: typeof codeCandidate === 'string' && codeCandidate !== '' ? codeCandidate : FALLBACK_ERROR_CODE,
    message:
      typeof messageCandidate === 'string' && messageCandidate !== ''
        ? messageCandidate
        : FALLBACK_ERROR_MESSAGE,
    ...(statusCode !== undefined ? { statusCode } : {}),
    raw,
  };
}
