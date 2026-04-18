/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const pollingModule = await import('../dist/nodes/Seedance/shared/polling/getTaskPolling.js');

const { pollGetTaskUntilSettled, GET_TASK_POLL_INTERVAL_MS } = pollingModule;

/** @typedef {{ [key: string]: unknown }} JsonObject */
/** @typedef {{ qs?: JsonObject }} RequestCall */

/**
 * @param {JsonObject[]} responses
 */
function createExecutor(responses) {
	/** @type {RequestCall[]} */
	const calls = [];

	return {
		calls,
		executor: {
			async getCredentials() {
				return { apiKey: 'test-api-key' };
			},
			helpers: {
				async httpRequest(options) {
					calls.push(options);
					const next = responses.shift();

					if (!next) {
						throw new Error('Unexpected extra polling request');
					}

					return next;
				},
			},
		},
	};
}

test('轮询 queued/running 并在 succeeded 终态停止，pollCount 包含初始请求', async () => {
	let now = 1_000;
	const slept = [];
	const { executor, calls } = createExecutor([
		{ id: 'task_123', status: 'queued' },
		{ id: 'task_123', status: 'running' },
		{ id: 'task_123', status: 'succeeded' },
	]);

	const result = await pollGetTaskUntilSettled(executor, {
		taskId: 'task_123',
		timeoutMs: 60_000,
		now: () => now,
		sleep: async (intervalMs) => {
			slept.push(intervalMs);
			now += intervalMs;
		},
	});

	assert.equal(GET_TASK_POLL_INTERVAL_MS, 20_000);
	assert.equal(result.status, 'succeeded');
	assert.equal(result.timedOut, false);
	assert.equal(result.pollCount, 3);
	assert.equal(result.waitedMs, 40_000);
	assert.deepEqual(slept, [20_000, 20_000]);
	assert.equal(calls.length, 3);
	assert.deepEqual(calls.map((call) => call.qs), [
		{ id: 'task_123' },
		{ id: 'task_123' },
		{ id: 'task_123' },
	]);
});

test('timeout 返回最新 running 映射任务并设置 timedOut，不抛错或多睡一次', async () => {
	let now = 5_000;
	const slept = [];
	const { executor, calls } = createExecutor([
		{ id: 'task_timeout', status: 'queued' },
		{ id: 'task_timeout', status: 'running' },
	]);

	const result = await pollGetTaskUntilSettled(executor, {
		taskId: 'task_timeout',
		timeoutMs: 40_000,
		now: () => now,
		sleep: async (intervalMs) => {
			slept.push(intervalMs);
			now += intervalMs;
		},
	});

	assert.equal(result.status, 'running');
	assert.equal(result.shouldPoll, true);
	assert.equal(result.timedOut, true);
	assert.equal(result.pollCount, 2);
	assert.equal(result.waitedMs, 20_000);
	assert.deepEqual(slept, [20_000]);
	assert.equal(calls.length, 2);
});

test('unknown 状态立即返回 timedOut=false 且不进入额外 sleep 周期', async () => {
	let now = 10_000;
	const slept = [];
	const { executor, calls } = createExecutor([{ id: 'task_unknown', status: 'unknown' }]);

	const result = await pollGetTaskUntilSettled(executor, {
		taskId: 'task_unknown',
		timeoutMs: 60_000,
		now: () => now,
		sleep: async (intervalMs) => {
			slept.push(intervalMs);
			now += intervalMs;
		},
	});

	assert.equal(result.status, 'unknown');
	assert.equal(result.shouldPoll, false);
	assert.equal(result.timedOut, false);
	assert.equal(result.pollCount, 1);
	assert.equal(result.waitedMs, 0);
	assert.deepEqual(slept, []);
	assert.equal(calls.length, 1);
});
