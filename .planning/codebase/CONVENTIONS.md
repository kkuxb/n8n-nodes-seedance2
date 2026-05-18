# Coding Conventions

**Analysis Date:** 2026-05-18

## Naming Patterns

**Files:**
- Use lower camelCase or domain nouns for TypeScript modules under `nodes/Seedance/shared/`: `nodes/Seedance/shared/mappers/createPayload.ts`, `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`, `nodes/Seedance/shared/polling/getTaskPolling.ts`.
- Use `[operation].operation.ts` for n8n node property descriptions: `nodes/Seedance/description/create.operation.ts`, `nodes/Seedance/description/image.operation.ts`, `nodes/Seedance/description/get.operation.ts`.
- Use `[subject].test.ts` for test files in `test/`: `test/createPayload.test.ts`, `test/taskPolling.test.ts`, `test/seedanceGenerateImageExecute.test.ts`.
- Keep the n8n node class in `nodes/Seedance/Seedance.node.ts` and node metadata in `nodes/Seedance/Seedance.node.json`.

**Functions:**
- Use lower camelCase verb phrases for public helpers: `buildCreatePayload` in `nodes/Seedance/shared/mappers/createPayload.ts`, `validateSeedreamImageInput` in `nodes/Seedance/shared/validators/seedreamImage.ts`, `pollTaskUntilSettled` in `nodes/Seedance/shared/polling/getTaskPolling.ts`.
- Prefix mapper functions with `map`, payload builders with `build`, validators with `validate`, and normalizers with `normalize`: `mapTaskResponse` in `nodes/Seedance/shared/mappers/task.ts`, `buildSeedanceHttpRequestOptions` in `nodes/Seedance/shared/transport/request.ts`, `normalizeSeedanceError` in `nodes/Seedance/shared/mappers/errors.ts`.
- Keep private helpers unexported and colocated with the exported function they support: `includesValue` and `normalizeMaxImages` in `nodes/Seedance/shared/validators/seedreamImage.ts`, `defaultSleep` and `buildWaitResult` in `nodes/Seedance/shared/polling/getTaskPolling.ts`.

**Variables:**
- Use lower camelCase for internal state and n8n parameters: `returnData`, `itemIndex`, `generationMode`, `referenceImages` in `nodes/Seedance/Seedance.node.ts`.
- Use API field names only at the API boundary or output mapping boundary: `page_num`, `page_size`, `execution_expires_after`, `return_last_frame`, `generate_audio` in `nodes/Seedance/Seedance.node.ts` and `nodes/Seedance/shared/mappers/createPayload.ts`.
- Use descriptive test variable names that expose behavior: `calls`, `assertedBinaryProperties`, `requestedParameters`, `slept` in `test/seedanceGenerateImageExecute.test.ts` and `test/taskPolling.test.ts`.

**Types:**
- Use PascalCase for interfaces and exported type aliases: `SeedanceCreateInput` in `nodes/Seedance/shared/validators/create.ts`, `SeedreamImagePayloadInput` in `nodes/Seedance/shared/types.ts`, `PollTaskUntilSettledOptions` in `nodes/Seedance/shared/polling/getTaskPolling.ts`.
- Use uppercase snake case for constants: `SEEDANCE_BASE_URL`, `SEEDREAM_IMAGE_MODEL`, `GET_TASK_POLL_INTERVAL_MS` in `nodes/Seedance/shared/constants.ts` and `nodes/Seedance/shared/polling/getTaskPolling.ts`.
- Use literal union types for operation keys and constrained option values: `SeedanceOperationKey`, `SeedreamImageReferenceSource`, `SeedreamSequentialImageGeneration` in `nodes/Seedance/shared/types.ts`.

## Code Style

**Formatting:**
- Use Prettier with the repo config in `.prettierrc`: single quotes and trailing commas.
- Preserve TypeScript strictness from `tsconfig.json`: `strict: true`, `target: ES2022`, `module: commonjs`, declarations and source maps enabled.
- Format through the project tooling rather than hand-adjusting indentation. Current files contain both tab-indented sections such as `nodes/Seedance/Seedance.node.ts` and two-space sections such as `nodes/Seedance/shared/types.ts`, so new edits should be normalized by `n8n-node`/Prettier instead of copying mixed local whitespace.

**Linting:**
- Use `npm run lint` for linting; it invokes `n8n-node lint` from `package.json`.
- Use `npm run lint:fix` for automated fixes; it invokes `n8n-node lint --fix` from `package.json`.
- ESLint config is delegated to `@n8n/node-cli` through `eslint.config.mjs`.
- Keep `eslint-disable` comments narrow and tied to n8n-specific exceptions: test files disable `@n8n/community-nodes/no-restricted-imports` at the file top, `nodes/Seedance/Seedance.node.ts` disables `@typescript-eslint/no-explicit-any` for one list response shape, and `nodes/Seedance/description/list.operation.ts` disables two n8n node-param description rules for `returnAll`.

## Import Organization

**Order:**
1. External type/value imports from packages such as `n8n-workflow`.
2. Blank line.
3. Relative value imports from sibling domain modules.
4. Relative type-only imports using `import type`.

Example from `nodes/Seedance/shared/transport/request.ts`:
```typescript
import type { IDataObject } from 'n8n-workflow';

import {
  SEEDANCE_AUTH_HEADER,
  SEEDANCE_AUTH_SCHEME,
  SEEDANCE_BASE_URL,
  SEEDANCE_CREDENTIAL_TYPE,
} from '../constants';
import { normalizeSeedanceDownloadError, normalizeSeedanceError } from '../mappers/errors';
import { buildSeedanceEndpointUrl } from './endpoints';
import type {
  SeedanceCredentialData,
  SeedanceHttpRequestOptions,
  SeedanceRequestContext,
} from '../types';
```

**Path Aliases:**
- Not detected. Use relative imports such as `../constants`, `./endpoints`, and `./shared/mappers/createPayload`.
- Tests import compiled JavaScript from `dist` with dynamic imports, for example `await import('../dist/nodes/Seedance/shared/mappers/createPayload.js')` in `test/createPayload.test.ts`.

## Error Handling

**Patterns:**
- Validators throw plain `Error` with user-readable messages: `validateCreateInput` in `nodes/Seedance/shared/validators/create.ts` and `validateSeedreamImageInput` in `nodes/Seedance/shared/validators/seedreamImage.ts`.
- Transport catches HTTP failures and rethrows normalized error shapes through `normalizeSeedanceError` in `nodes/Seedance/shared/transport/request.ts`.
- Download-specific failures are converted to `Error` with extra expiry context by `normalizeSeedanceDownloadError` in `nodes/Seedance/shared/mappers/errors.ts`.
- The n8n `execute` path catches per-item failures, normalizes them, optionally returns an error item when `continueOnFail()` is true, or throws `NodeOperationError` with `itemIndex` from `nodes/Seedance/Seedance.node.ts`.
- Mapper functions throw plain `Error` when a response contract cannot be satisfied: `selectSingleTaskResponse` in `nodes/Seedance/shared/mappers/task.ts` and `mapSeedreamImageResponse` in `nodes/Seedance/shared/mappers/seedreamImageResult.ts`.

Use this pattern for new execution code in `nodes/Seedance/Seedance.node.ts`:
```typescript
try {
  const response = await seedanceApiRequest(this, options);
  returnData.push({ json: mapper(response), pairedItem: { item: itemIndex } });
} catch (error) {
  const normalized = normalizeSeedanceError(error);
  if (this.continueOnFail()) {
    returnData.push({ json: { error: normalized, status: 'failed' }, pairedItem: { item: itemIndex } });
    continue;
  }
  throw new NodeOperationError(node, normalized.message, { itemIndex });
}
```

## Logging

**Framework:** None detected

**Patterns:**
- Do not add `console` logging in source or tests; no `console.` usage was detected under `nodes/` or `test/`.
- Expose diagnostics through returned JSON fields (`error`, `status`, `requestSummary`, `raw`, `retention`) instead of logs. Examples are `mapCreateResponse` in `nodes/Seedance/shared/mappers/createPayload.ts`, `mapTaskResponse` in `nodes/Seedance/shared/mappers/task.ts`, and `mapSeedreamImageResponse` in `nodes/Seedance/shared/mappers/seedreamImageResult.ts`.

## Comments

**When to Comment:**
- Keep comments sparse and operational. Current comments are mainly lint exceptions and a fallback note in `nodes/Seedance/shared/transport/request.ts`.
- Add a comment only for non-obvious constraints such as external API behavior, n8n lint exceptions, or intentional fallback handling.

**JSDoc/TSDoc:**
- Source files under `nodes/` do not use JSDoc/TSDoc for exported helpers.
- Some tests use JSDoc type annotations only where JavaScript-style helper typing is needed, as in `test/taskPolling.test.ts`.

## Function Design

**Size:** Prefer small pure helpers in `nodes/Seedance/shared/` and keep n8n orchestration in `nodes/Seedance/Seedance.node.ts`. New API mapping, validation, endpoint, and polling logic should be added to `nodes/Seedance/shared/mappers/`, `nodes/Seedance/shared/validators/`, `nodes/Seedance/shared/transport/`, or `nodes/Seedance/shared/polling/` instead of expanding the node file unnecessarily.

**Parameters:** Use a single typed input object for domain payload builders and validators: `SeedanceCreateInput` in `nodes/Seedance/shared/validators/create.ts`, `SeedreamImagePayloadInput` in `nodes/Seedance/shared/types.ts`, and `PollTaskUntilSettledOptions` in `nodes/Seedance/shared/polling/getTaskPolling.ts`.

**Return Values:** Return plain `IDataObject` or typed structures that map directly to n8n output or HTTP request contracts: `buildCreatePayload` returns `IDataObject`, `buildAggregatedListOutput` returns `INodeExecutionData`, and `downloadSeedanceVideo` returns `SeedanceVideoDownloadResult`.

## Module Design

**Exports:** Use named exports only. Examples: `export function buildCreatePayload` in `nodes/Seedance/shared/mappers/createPayload.ts`, `export const imageOperationProperties` in `nodes/Seedance/description/image.operation.ts`, and `export class Seedance` in `nodes/Seedance/Seedance.node.ts`.

**Barrel Files:** Not used. Import directly from the owning module path, such as `./shared/mappers/task` or `../transport/request`.

**Module Boundaries:**
- Put node UI property arrays in `nodes/Seedance/description/*.operation.ts`.
- Put shared constants in `nodes/Seedance/shared/constants.ts`.
- Put request/endpoint code in `nodes/Seedance/shared/transport/`.
- Put response and payload mappers in `nodes/Seedance/shared/mappers/`.
- Put validation code in `nodes/Seedance/shared/validators/`.
- Put polling logic in `nodes/Seedance/shared/polling/`.
- Keep tests in `test/` and import compiled `dist` JavaScript, not TypeScript source.

---

*Convention analysis: 2026-05-18*
