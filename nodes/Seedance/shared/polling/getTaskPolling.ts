import { setTimeout as defaultSleep } from 'node:timers/promises';

import type { IDataObject } from 'n8n-workflow';

import {
	appendTaskWaitMetadata,
	mapTaskResponse,
	selectSingleTaskResponse,
	type SeedanceTaskListResponse,
	type SeedanceTaskResponse,
	type SeedanceTaskWaitMetadata,
} from '../mappers/task';
import { getSeedanceOperationEndpoint } from '../transport/endpoints';
import { seedanceApiRequest } from '../transport/request';
import type { SeedanceRequestFunctions } from '../types';

export const GET_TASK_POLL_INTERVAL_MS = 20_000;

export interface PollTaskUntilSettledOptions {
	taskId: string;
	timeoutMs: number;
	now?: () => number;
	sleep?: (intervalMs: number) => Promise<void>;
}

function buildWaitResult(
	mappedTask: IDataObject,
	metadata: SeedanceTaskWaitMetadata,
): IDataObject & SeedanceTaskWaitMetadata {
	return appendTaskWaitMetadata(mappedTask, metadata);
}

export async function pollTaskUntilSettled(
	executor: SeedanceRequestFunctions,
	options: PollTaskUntilSettledOptions,
): Promise<IDataObject & SeedanceTaskWaitMetadata> {
	if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
		throw new Error('Polling timeoutMs must be a positive finite number.');
	}

	const now = options.now ?? Date.now;
	const sleep = options.sleep ?? defaultSleep;
	const startedAt = now();
	let pollCount = 0;

	while (true) {
		const response = await seedanceApiRequest<
			SeedanceTaskResponse | SeedanceTaskListResponse
		>(executor, {
			method: 'GET',
			path: getSeedanceOperationEndpoint('getTask'),
			qs: { id: options.taskId },
		});
		pollCount += 1;

		const taskResponse = selectSingleTaskResponse(response, options.taskId);
		const mappedTask = mapTaskResponse(taskResponse);
		const waitedMs = Math.max(0, now() - startedAt);

		if (mappedTask.shouldPoll !== true) {
			return buildWaitResult(mappedTask, {
				timedOut: false,
				pollCount,
				waitedMs,
			});
		}

		if (waitedMs + GET_TASK_POLL_INTERVAL_MS >= options.timeoutMs) {
			return buildWaitResult(mappedTask, {
				timedOut: true,
				pollCount,
				waitedMs,
			});
		}

		await sleep(GET_TASK_POLL_INTERVAL_MS);
	}
}

export const pollGetTaskUntilSettled = pollTaskUntilSettled;
