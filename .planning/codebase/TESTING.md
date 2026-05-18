# Testing Patterns

**Analysis Date:** 2026-05-18

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`)
- Config: Not detected. There is no `jest.config.*`, `vitest.config.*`, or Node test config file.
- Test files import compiled JavaScript from `dist/`, so source changes must be built before running tests. Examples: `test/createPayload.test.ts`, `test/request.test.ts`, and `test/seedanceGenerateImageExecute.test.ts`.

**Assertion Library:**
- Node.js built-in strict assertions from `node:assert/strict`.

**Run Commands:**
```bash
npm run build && node --test test/*.test.ts              # Run all tests after compiling dist
node --watch --test test/*.test.ts                       # Watch mode; requires current dist output
node --test --experimental-test-coverage test/*.test.ts  # Coverage; manual only, no repo threshold
```

`package.json` defines `build`, `dev`, `lint`, and `lint:fix`, but no `test` script. Add a `test` script in `package.json` before relying on `npm test`.

## Test File Organization

**Location:**
- Tests live in the top-level `test/` directory and are separate from implementation files in `nodes/`.
- Test coverage is organized by behavior or contract, not by mirroring every source file exactly.

**Naming:**
- Use `[subject].test.ts`: `test/createPayload.test.ts`, `test/taskMapper.test.ts`, `test/taskPolling.test.ts`.
- Use regression or flow suffixes for cross-cutting behavior: `test/seedanceVideoRegression.test.ts`, `test/seedanceDownloadFlow.test.ts`, `test/seedreamImageOperationContract.test.ts`.

**Structure:**
```text
test/
├── createPayload.test.ts
├── request.test.ts
├── seedanceDownload.test.ts
├── seedanceDownloadFlow.test.ts
├── seedanceGenerateImageExecute.test.ts
├── seedanceGetWaitMode.test.ts
├── seedanceVideoRegression.test.ts
├── seedreamImageOperationContract.test.ts
├── seedreamImagePayload.test.ts
├── seedreamImageResult.test.ts
├── seedreamImageValidation.test.ts
├── taskMapper.test.ts
└── taskPolling.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import test from 'node:test';
import assert from 'node:assert/strict';

const payloadModule = await import('../dist/nodes/Seedance/shared/mappers/seedreamImagePayload.js');

const { buildSeedreamImagePayload } = payloadModule;

function baseInput(overrides = {}) {
  return {
    model: 'doubao-seedream-5-0-260128',
    prompt: 'A quiet lake at sunrise',
    referenceImages: [],
    ...overrides,
  };
}

test('prompt-only payload defaults to b64_json and omits image', () => {
  const payload = buildSeedreamImagePayload(baseInput());

  assert.equal(payload.response_format, 'b64_json');
  assert.equal('image' in payload, false);
});
```

**Patterns:**
- Start each test file with the n8n restricted-import lint disable because tests import compiled `dist` modules directly: `test/request.test.ts`, `test/taskMapper.test.ts`, `test/seedreamImageValidation.test.ts`.
- Use top-level `await import('../dist/...js')` rather than static relative imports from `nodes/`.
- Keep tests flat with individual `test()` calls instead of nested `describe()` blocks.
- Use Chinese test names where they describe user-facing Chinese behavior, matching existing files such as `test/createPayload.test.ts` and `test/seedanceDownloadFlow.test.ts`.
- Assert exact payload shapes with `assert.deepEqual` and scalar fields with `assert.equal`.
- Use `assert.match` for user-facing error message fragments and retention warnings.

## Mocking

**Framework:** Hand-written fakes only. No Jest, Vitest, Sinon, or n8n test harness detected.

**Patterns:**
```typescript
function createExecutionContext(parameters: Record<string, unknown>, responses: Array<Record<string, unknown>>) {
  const calls: Array<Record<string, unknown>> = [];

  return {
    calls,
    context: {
      getInputData() {
        return [{ json: {} }];
      },
      getNodeParameter(name: string, _itemIndex: number, fallback?: unknown) {
        return Object.prototype.hasOwnProperty.call(parameters, name) ? parameters[name] : fallback;
      },
      getNode() {
        return { name: 'Seedance', type: 'seedance', position: [0, 0], parameters };
      },
      continueOnFail() {
        return false;
      },
      async getCredentials() {
        return { apiKey: 'test-api-key' };
      },
      helpers: {
        async httpRequest(options: Record<string, unknown>) {
          calls.push(options);
          const next = responses.shift();
          if (!next) throw new Error('Unexpected extra request');
          return next;
        },
      },
    },
  };
}
```

This pattern appears in `test/seedanceGenerateImageExecute.test.ts`, `test/seedanceGetWaitMode.test.ts`, and `test/seedanceDownloadFlow.test.ts`.

**What to Mock:**
- Mock n8n execution context methods (`getInputData`, `getNodeParameter`, `getNode`, `continueOnFail`, `getCredentials`) when testing `Seedance.prototype.execute.call(context)` from `test/seedanceGenerateImageExecute.test.ts`, `test/seedanceGetWaitMode.test.ts`, and `test/seedanceDownloadFlow.test.ts`.
- Mock `helpers.httpRequest` with a queued `responses` array and capture `calls` to assert method, URL, querystring, body, and download options.
- Mock binary helpers (`assertBinaryData`, `getBinaryDataBuffer`) only for binary workflows, as in `test/seedanceGenerateImageExecute.test.ts`.
- Mock time and sleep for polling by injecting `now` and `sleep`, as in `test/taskPolling.test.ts`.

**What NOT to Mock:**
- Do not mock pure mappers, validators, or endpoint helpers. Test them directly through `buildCreatePayload`, `mapTaskResponse`, `validateSeedreamImageInput`, `buildSeedanceEndpointUrl`, and `normalizeSeedanceError` in `test/createPayload.test.ts`, `test/taskMapper.test.ts`, `test/seedreamImageValidation.test.ts`, and `test/request.test.ts`.
- Do not mock compiled `dist` modules in current tests; dynamic imports exercise the emitted JavaScript that n8n packages.

## Fixtures and Factories

**Test Data:**
```typescript
function baseInput(overrides = {}) {
  return {
    model: 'doubao-seedream-5-0-260128',
    prompt: 'A quiet lake at sunrise',
    referenceImages: [],
    sequentialImageGeneration: 'disabled',
    imageResolution: '2K',
    imageAspectRatio: '1:1',
    watermark: false,
    webSearch: false,
    optimizePromptMode: 'standard',
    ...overrides,
  };
}
```

**Location:**
- Fixtures are inline helper functions in each test file. Examples: `baseInput` in `test/seedreamImagePayload.test.ts`, `validInput` and `binaryReference` in `test/seedreamImageValidation.test.ts`, `requestSummary` in `test/seedreamImageResult.test.ts`, and `createExecutionContext` in execution-flow tests.
- There is no shared fixture directory. Add shared fixtures only if duplication becomes large across `test/seedanceGenerateImageExecute.test.ts`, `test/seedanceGetWaitMode.test.ts`, and `test/seedanceDownloadFlow.test.ts`.

## Coverage

**Requirements:** None enforced. No coverage threshold or coverage configuration was detected in `package.json`, `eslint.config.mjs`, or standalone test config files.

**View Coverage:**
```bash
npm run build && node --test --experimental-test-coverage test/*.test.ts
```

Coverage currently centers on payload construction, response mapping, validation, transport option shaping, polling, node description contracts, and node execute flows.

## Test Types

**Unit Tests:**
- Test pure helpers directly: `test/createPayload.test.ts`, `test/seedreamImagePayload.test.ts`, `test/seedreamImageResult.test.ts`, `test/seedreamImageValidation.test.ts`, `test/taskMapper.test.ts`, `test/request.test.ts`.
- Prefer exact object assertions for API payload and n8n output contracts.

**Integration Tests:**
- Use hand-built n8n execution contexts to call `Seedance.prototype.execute.call(context)`: `test/seedanceGenerateImageExecute.test.ts`, `test/seedanceGetWaitMode.test.ts`, `test/seedanceDownloadFlow.test.ts`, `test/seedreamImageOperationContract.test.ts`.
- Assert both output items and captured HTTP request options so behavior remains stable across mapper and execution layers.

**E2E Tests:**
- Not used. No browser, live n8n instance, or live Seedance/Seedream API tests were detected.

## Common Patterns

**Async Testing:**
```typescript
test('waitForCompletion=true 时走等待分支并返回轮询元数据', async () => {
  const { calls, context } = createExecutionContext(
    { operation: 'get', taskId: 'task_wait', waitForCompletion: true, waitTimeoutMinutes: 20 },
    [{ id: 'task_wait', status: 'succeeded' }],
  );

  const result = await Seedance.prototype.execute.call(context);

  assert.equal(result[0][0].json.status, 'succeeded');
  assert.equal(calls.length, 1);
});
```

Use this pattern for n8n execution paths in `test/seedanceGetWaitMode.test.ts` and `test/seedanceDownloadFlow.test.ts`.

**Error Testing:**
```typescript
await assert.rejects(
  () => Seedance.prototype.execute.call(context),
  (error: unknown) => {
    const message = String((error as { message?: unknown }).message ?? error);
    assert.match(message, /all failed/);
    return true;
  },
);
```

Use `assert.throws` for synchronous validators and mappers in `test/createPayload.test.ts`, `test/seedreamImageValidation.test.ts`, `test/seedreamImageResult.test.ts`, and `test/taskMapper.test.ts`. Use `assert.rejects` for async execution and download paths in `test/seedanceGenerateImageExecute.test.ts`, `test/seedanceDownload.test.ts`, and `test/seedanceDownloadFlow.test.ts`.

---

*Testing analysis: 2026-05-18*
