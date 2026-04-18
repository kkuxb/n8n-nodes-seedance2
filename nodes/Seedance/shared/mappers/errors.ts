import type { SeedanceApiErrorPayload, SeedanceApiErrorShape } from '../types';

const FALLBACK_ERROR_CODE = 'SEEDANCE_REQUEST_FAILED';
const FALLBACK_ERROR_MESSAGE = 'Seedance request failed';
const DOWNLOAD_EXPIRY_NOTE = 'Seedance 视频 URL 通常仅在 24 hours 内有效，请尽快下载并保存。';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

export function getFriendlyDeleteError(
	error: SeedanceApiErrorShape,
	taskId: string,
): SeedanceApiErrorShape {
	const message = error.message.toLowerCase();

	if (message.includes('specified action') || message.includes('/api/v3/contents/generations/tasks')) {
		return {
			...error,
			message: `无法取消或删除任务 ${taskId}。当前已按官方要求发送 DELETE /api/v3/contents/generations/tasks/${taskId}，但 Seedance 返回了无效 action 响应，请稍后重试或检查该任务是否仍可取消或删除。`,
		};
	}

	if (message.includes('running') || message.includes('cancelled') || message.includes('invalid_state')) {
		return {
			...error,
			message: `任务 ${taskId} 当前状态不支持 DELETE。Seedance 仅支持取消 queued 任务，或删除 succeeded / failed / expired 记录；running 与 cancelled 状态不可删除。`,
		};
	}

	if (message.includes('not found') || error.statusCode === 404) {
		return {
			...error,
			message: `未找到任务 ${taskId}。请确认 Task ID 正确，并注意 Seedance 仅支持查询最近 7 天内的任务历史。`,
		};
	}

	if (message.includes('invalid task id') || message.includes('invalid id') || message.includes('invalid_argument')) {
		return {
			...error,
			message: `Task ID 格式无效：${taskId}。请提供有效的 Seedance 任务 ID 后重试。`,
		};
	}

	return error;
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

export function normalizeSeedanceDownloadError(error: unknown): Error {
	const normalized = normalizeSeedanceError(error);
	const message = normalized.message;
	const lowered = message.toLowerCase();
	const looksExpired =
		normalized.statusCode === 403 ||
		normalized.statusCode === 404 ||
		lowered.includes('expired') ||
		lowered.includes('expire') ||
		lowered.includes('not found') ||
		lowered.includes('unavailable') ||
		lowered.includes('forbidden') ||
		lowered.includes('invalid url') ||
		lowered.includes('no such key');

	return new Error(looksExpired ? `${message} ${DOWNLOAD_EXPIRY_NOTE}` : message);
}
