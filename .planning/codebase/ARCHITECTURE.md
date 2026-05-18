<!-- refreshed: 2026-05-18 -->
# Architecture

**Analysis Date:** 2026-05-18

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                 n8n Community Node Package                  │
│        package registry metadata in `package.json`          │
├──────────────────────┬────────────────┬─────────────────────┤
│  Node Type & Runtime │ UI Descriptions │ Credential Type     │
│ `nodes/Seedance/`    │ `description/`  │ `credentials/`      │
│ `Seedance.node.ts`   │ operation files │ registered in       │
│                      │                │ `package.json`      │
└──────────┬───────────┴───────┬────────┴──────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Domain Layer                      │
│ `nodes/Seedance/shared/`                                    │
│ mappers, validators, polling, transport, constants, types   │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 External Ark / Volcengine APIs              │
│ task APIs and image generation APIs via n8n httpRequest     │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    n8n Execution Output                     │
│ JSON task/image metadata and optional binary video/image    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `Seedance` node class | Declares n8n node metadata, dispatches item execution by generation mode and operation, handles `continueOnFail()` behavior, and returns `INodeExecutionData[][]`. | `nodes/Seedance/Seedance.node.ts` |
| Operation descriptions | Own n8n parameter schemas and `displayOptions` for create, get, list, delete, and image operations. | `nodes/Seedance/description/*.operation.ts` |
| Transport helpers | Load n8n credentials, build auth headers, build endpoint URLs, execute JSON requests, and download video binaries. | `nodes/Seedance/shared/transport/request.ts` |
| Endpoint helpers | Centralize API path keys, delete path construction, URL normalization, and API version access. | `nodes/Seedance/shared/transport/endpoints.ts` |
| Video payload mapper | Validate video create input, build Ark content payloads, build request summaries, and map create responses. | `nodes/Seedance/shared/mappers/createPayload.ts` |
| Task mapper | Normalize task/list responses, derive terminal/success/failure/poll flags, and build aggregated list output. | `nodes/Seedance/shared/mappers/task.ts` |
| Image payload mapper | Normalize image references, map recommended image sizes, and build Seedream image request payloads. | `nodes/Seedance/shared/mappers/seedreamImagePayload.ts` |
| Image result mapper | Map image API responses into n8n JSON plus binary image attachments. | `nodes/Seedance/shared/mappers/seedreamImageResult.ts` |
| Error mapper | Normalize API/download errors and specialize delete/download messages. | `nodes/Seedance/shared/mappers/errors.ts` |
| Polling helper | Poll get-task API until terminal status or timeout, with injectable clock/sleep for tests. | `nodes/Seedance/shared/polling/getTaskPolling.ts` |
| Validators | Enforce video and image input constraints before request payload construction. | `nodes/Seedance/shared/validators/*.ts` |
| Shared types/constants | Define operation keys, request contracts, image contracts, task statuses, model IDs, limits, and supported size tables. | `nodes/Seedance/shared/types.ts`, `nodes/Seedance/shared/constants.ts` |
| Tests | Exercise built `dist/` modules with Node's built-in test runner and focused execution-context fakes. | `test/*.test.ts` |

## Pattern Overview

**Overall:** Single n8n node entry point with stateless shared functional modules.

**Key Characteristics:**
- Use `nodes/Seedance/Seedance.node.ts` as the only runtime entry point registered through `package.json`.
- Keep n8n UI parameter declarations in `nodes/Seedance/description/*.operation.ts`; keep behavior in `Seedance.node.ts` and `nodes/Seedance/shared/`.
- Keep shared modules pure where possible: mappers and validators accept plain input objects and return plain `IDataObject`, binary attachment objects, or errors.
- Route external calls through `seedanceApiRequest()` and `downloadSeedanceVideo()` in `nodes/Seedance/shared/transport/request.ts`.
- Use `nodes/Seedance/shared/types.ts` and `nodes/Seedance/shared/constants.ts` as the shared contract boundary between entry point, transport, validators, and mappers.

## Layers

**Package Registration:**
- Purpose: Tell n8n and npm where the built node and credential files live.
- Location: `package.json`
- Contains: `main`, `files`, `scripts`, and `n8n.credentials` / `n8n.nodes` package metadata.
- Depends on: Built files under `dist/` produced from `credentials/**/*.ts` and `nodes/**/*.ts`.
- Used by: n8n community node loading and package publishing.

**Node Entry Layer:**
- Purpose: Provide the `INodeType` implementation and runtime operation dispatcher.
- Location: `nodes/Seedance/Seedance.node.ts`
- Contains: `description: INodeTypeDescription`, `execute()`, local binary-reference helpers, and per-operation branches.
- Depends on: `nodes/Seedance/description/*.operation.ts`, `nodes/Seedance/shared/**`, and `n8n-workflow`.
- Used by: n8n runtime through `dist/nodes/Seedance/Seedance.node.js`.

**Description Layer:**
- Purpose: Define n8n UI fields and visibility rules.
- Location: `nodes/Seedance/description/`
- Contains: `createOperationProperties`, `getOperationProperties`, `listOperationProperties`, `deleteOperationProperties`, and `imageOperationProperties`.
- Depends on: `n8n-workflow` types and selected constants from `nodes/Seedance/shared/constants.ts`.
- Used by: `nodes/Seedance/Seedance.node.ts` property spread.

**Shared Domain Layer:**
- Purpose: Keep request payload construction, response mapping, validation, polling, and error shaping reusable and directly testable.
- Location: `nodes/Seedance/shared/`
- Contains: `mappers/`, `validators/`, `polling/`, `transport/`, `constants.ts`, and `types.ts`.
- Depends on: `n8n-workflow` types and internal constants/types.
- Used by: `nodes/Seedance/Seedance.node.ts` and tests under `test/`.

**Transport Layer:**
- Purpose: Convert node execution context plus operation options into n8n HTTP requests.
- Location: `nodes/Seedance/shared/transport/`
- Contains: Credential loading, auth header construction, endpoint URL construction, request execution, video download.
- Depends on: `nodes/Seedance/shared/constants.ts`, `nodes/Seedance/shared/types.ts`, and `nodes/Seedance/shared/mappers/errors.ts`.
- Used by: `nodes/Seedance/Seedance.node.ts` and `nodes/Seedance/shared/polling/getTaskPolling.ts`.

**Test Layer:**
- Purpose: Verify built JavaScript outputs and public helper contracts.
- Location: `test/`
- Contains: Node test files importing from `../dist/...`.
- Depends on: `node:test`, `node:assert/strict`, and built files generated by `npm run build`.
- Used by: Manual or package-script test execution outside `package.json` scripts.

## Data Flow

### Image Generation Path

1. n8n calls `Seedance.execute()` and the node reads `generationMode` / `imageOperation` from each input item (`nodes/Seedance/Seedance.node.ts:108`, `nodes/Seedance/Seedance.node.ts:244`, `nodes/Seedance/Seedance.node.ts:249`).
2. Reference images are collected from URL, base64, binary, or fixed collection parameters, and binary references are read through n8n helpers (`nodes/Seedance/Seedance.node.ts:152`).
3. Input is validated and converted into the external image request shape (`nodes/Seedance/Seedance.node.ts:288`, `nodes/Seedance/shared/validators/seedreamImage.ts:28`, `nodes/Seedance/shared/mappers/seedreamImagePayload.ts:49`).
4. The request is sent through the shared transport layer to the image endpoint (`nodes/Seedance/Seedance.node.ts:291`, `nodes/Seedance/shared/transport/endpoints.ts:8`, `nodes/Seedance/shared/transport/request.ts:54`).
5. The response is mapped into JSON plus `binary.imageN` attachments and appended with `pairedItem` (`nodes/Seedance/Seedance.node.ts:296`, `nodes/Seedance/shared/mappers/seedreamImageResult.ts:61`).

### Video Create Path

1. `Seedance.execute()` enters the `operation === 'create'` branch (`nodes/Seedance/Seedance.node.ts:317`).
2. Parameter values and optional first/last frame binary data are normalized into `SeedanceCreateInput` (`nodes/Seedance/Seedance.node.ts:321`, `nodes/Seedance/Seedance.node.ts:345`, `nodes/Seedance/Seedance.node.ts:358`).
3. `buildCreatePayload()` validates input and maps prompt/images/options into Ark content payload structure (`nodes/Seedance/Seedance.node.ts:368`, `nodes/Seedance/shared/mappers/createPayload.ts:27`, `nodes/Seedance/shared/validators/create.ts:34`).
4. `seedanceApiRequest()` posts the payload to the task creation endpoint (`nodes/Seedance/Seedance.node.ts:370`, `nodes/Seedance/shared/transport/endpoints.ts:4`, `nodes/Seedance/shared/transport/request.ts:54`).
5. `mapCreateResponse()` returns a normalized task summary with raw response retained (`nodes/Seedance/Seedance.node.ts:377`, `nodes/Seedance/shared/mappers/createPayload.ts:101`).

### Video Get / Wait / Download Path

1. `Seedance.execute()` enters the `operation === 'get'` branch and reads `taskId` plus wait/download options (`nodes/Seedance/Seedance.node.ts:383`).
2. When wait mode is enabled, `pollTaskUntilSettled()` loops with `GET_TASK_POLL_INTERVAL_MS` until terminal status or timeout (`nodes/Seedance/Seedance.node.ts:401`, `nodes/Seedance/shared/polling/getTaskPolling.ts:15`, `nodes/Seedance/shared/polling/getTaskPolling.ts:37`).
3. Each poll uses `seedanceApiRequest()`, `selectSingleTaskResponse()`, and `mapTaskResponse()` (`nodes/Seedance/shared/polling/getTaskPolling.ts:51`, `nodes/Seedance/shared/mappers/task.ts:59`, `nodes/Seedance/shared/mappers/task.ts:110`).
4. When download is enabled and the task succeeded with a video URL, `downloadSeedanceVideo()` downloads and attaches `binary.video` (`nodes/Seedance/Seedance.node.ts:417`, `nodes/Seedance/shared/transport/request.ts:86`).
5. When wait mode is disabled, the branch performs one GET request, selects one task response, maps it, and returns it (`nodes/Seedance/Seedance.node.ts:432`, `nodes/Seedance/Seedance.node.ts:439`, `nodes/Seedance/Seedance.node.ts:446`).

### Video List Path

1. `Seedance.execute()` enters the `operation === 'list'` branch and builds query filters from `additionalFields` (`nodes/Seedance/Seedance.node.ts:456`).
2. Pagination runs with a maximum of 10 loop iterations, using page size 100 for `returnAll` and configured page values otherwise (`nodes/Seedance/Seedance.node.ts:479`, `nodes/Seedance/Seedance.node.ts:492`).
3. Each page is fetched through `seedanceApiRequest()` (`nodes/Seedance/Seedance.node.ts:494`).
4. `buildAggregatedListOutput()` maps all collected tasks into one n8n output item with `json.tasks` (`nodes/Seedance/Seedance.node.ts:515`, `nodes/Seedance/shared/mappers/task.ts:80`).

### Video Delete Path

1. `Seedance.execute()` enters the `operation === 'delete'` branch and reads `taskId` (`nodes/Seedance/Seedance.node.ts:527`).
2. `getSeedanceDeleteTaskEndpoint()` appends the URL-encoded task ID to the task endpoint (`nodes/Seedance/Seedance.node.ts:531`, `nodes/Seedance/shared/transport/endpoints.ts:32`).
3. `seedanceApiRequest()` sends the DELETE request and the node returns a success envelope (`nodes/Seedance/Seedance.node.ts:530`, `nodes/Seedance/Seedance.node.ts:535`).

**State Management:**
- Runtime state is per-execution and per-item inside `Seedance.execute()` in `nodes/Seedance/Seedance.node.ts`.
- Shared modules are stateless except constants in `nodes/Seedance/shared/constants.ts`.
- Polling state is local to `pollTaskUntilSettled()` in `nodes/Seedance/shared/polling/getTaskPolling.ts`.
- No repository-level cache, database, or module-level mutable singleton is used by node execution.

## Key Abstractions

**n8n Node Type:**
- Purpose: Register the node with n8n and implement execution.
- Examples: `nodes/Seedance/Seedance.node.ts`
- Pattern: Class implementing `INodeType` with `description` metadata and `execute()`.

**Operation Property Arrays:**
- Purpose: Keep UI field definitions separated by operation.
- Examples: `nodes/Seedance/description/create.operation.ts`, `nodes/Seedance/description/image.operation.ts`, `nodes/Seedance/description/get.operation.ts`, `nodes/Seedance/description/list.operation.ts`, `nodes/Seedance/description/delete.operation.ts`
- Pattern: Named `INodeProperties[]` exports spread into `description.properties`.

**Request Functions Contract:**
- Purpose: Allow transport and polling helpers to use only `getCredentials` and `helpers` from the n8n execution context.
- Examples: `nodes/Seedance/shared/types.ts:129`, `nodes/Seedance/shared/transport/request.ts:54`, `nodes/Seedance/shared/polling/getTaskPolling.ts:38`
- Pattern: Narrow `Pick<IExecuteFunctions, 'getCredentials' | 'helpers'>` type.

**Mapper Functions:**
- Purpose: Convert between node-friendly input/output and external API payload/response shapes.
- Examples: `nodes/Seedance/shared/mappers/createPayload.ts`, `nodes/Seedance/shared/mappers/task.ts`, `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`, `nodes/Seedance/shared/mappers/seedreamImageResult.ts`
- Pattern: Pure functions with explicit input interfaces and `IDataObject` outputs.

**Validators:**
- Purpose: Enforce supported model, size, duration, seed, reference-image, and sequential generation constraints before requests.
- Examples: `nodes/Seedance/shared/validators/create.ts`, `nodes/Seedance/shared/validators/seedreamImage.ts`
- Pattern: Throw `Error` with user-facing messages; caller wraps through n8n error handling.

**Endpoint Keys:**
- Purpose: Keep operation-to-path mapping centralized and type checked.
- Examples: `nodes/Seedance/shared/types.ts:18`, `nodes/Seedance/shared/transport/endpoints.ts:10`
- Pattern: `SeedanceOperationKey` union plus `Record<SeedanceOperationKey, string>`.

## Entry Points

**Published n8n Node:**
- Location: `dist/nodes/Seedance/Seedance.node.js` registered from `package.json:35` and `package.json:51`
- Triggers: n8n loads the package node listed under `n8n.nodes`.
- Responsibilities: Execute user workflows through the compiled version of `nodes/Seedance/Seedance.node.ts`.

**TypeScript Node Source:**
- Location: `nodes/Seedance/Seedance.node.ts`
- Triggers: TypeScript build from `npm run build` and n8n-node dev mode from `npm run dev`.
- Responsibilities: Source of the node class, metadata, and execution dispatch.

**Credential Registration:**
- Location: `credentials/SeedanceApi.credentials.ts` registered from `package.json:48`
- Triggers: n8n credential loader uses compiled `dist/credentials/SeedanceApi.credentials.js`.
- Responsibilities: Provide the `seedanceApi` credential type consumed through `SEEDANCE_CREDENTIAL_TYPE` in `nodes/Seedance/shared/constants.ts:1`.

**Development Server:**
- Location: `scripts/dev.mjs`
- Triggers: `npm run dev` from `package.json:41`.
- Responsibilities: Run `n8n-node dev --external-n8n` and a pinned local n8n runtime for manual testing.

**Test Files:**
- Location: `test/*.test.ts`
- Triggers: Node test runner invocation after build.
- Responsibilities: Import `../dist/...` modules and verify mapper, transport, polling, and execute behavior.

## Architectural Constraints

- **Threading:** Node execution uses the Node.js event loop through async/await. Polling waits with `setTimeout()` in `nodes/Seedance/shared/polling/getTaskPolling.ts`.
- **Global state:** Module-level state is constant-only in `nodes/Seedance/shared/constants.ts` and endpoint maps in `nodes/Seedance/shared/transport/endpoints.ts`.
- **Circular imports:** Not detected in the inspected import graph. Dependencies flow from `Seedance.node.ts` into `description/` and `shared/`; `shared/` modules do not import `Seedance.node.ts`.
- **Build output boundary:** Tests import built `dist/` modules, while TypeScript sources live in `nodes/` and `credentials/`. Run `npm run build` before executing tests that import `../dist/...`.
- **Credential safety:** Runtime API keys are loaded through n8n credentials in `nodes/Seedance/shared/transport/request.ts`. Do not hardcode secrets in `nodes/Seedance/shared/constants.ts` or tests.
- **Binary data handling:** Binary input/output is owned by `Seedance.execute()` and n8n helpers in `nodes/Seedance/Seedance.node.ts`; shared mappers only receive base64 strings or return binary attachment objects.

## Anti-Patterns

### Bypassing Shared Transport

**What happens:** External API requests are centralized through `seedanceApiRequest()` and `downloadSeedanceVideo()` in `nodes/Seedance/shared/transport/request.ts`.
**Why it's wrong:** Direct `this.helpers.httpRequest()` calls in new operation branches duplicate credential/header/error behavior and can diverge from `normalizeSeedanceError()` in `nodes/Seedance/shared/mappers/errors.ts`.
**Do this instead:** Add endpoint keys in `nodes/Seedance/shared/types.ts` and `nodes/Seedance/shared/transport/endpoints.ts`, then call `seedanceApiRequest()` from `nodes/Seedance/Seedance.node.ts`.

### Mixing UI Descriptions With Runtime Behavior

**What happens:** `nodes/Seedance/description/*.operation.ts` files export `INodeProperties[]` only; runtime behavior is in `nodes/Seedance/Seedance.node.ts` and `nodes/Seedance/shared/`.
**Why it's wrong:** Adding execution logic to description files makes UI schema modules depend on runtime helpers and complicates test isolation.
**Do this instead:** Put new field schemas in `nodes/Seedance/description/<operation>.operation.ts` and put behavior in a mapper, validator, polling, or transport helper under `nodes/Seedance/shared/`.

### Recreating API Shape In Tests

**What happens:** Tests import built public modules from `../dist/...` and fake n8n execution contexts where needed, such as `test/seedanceGenerateImageExecute.test.ts`.
**Why it's wrong:** Testing private copies of payload logic misses regressions in the compiled package surface.
**Do this instead:** Build first and test through compiled entry points or exported helpers in `dist/nodes/Seedance/**`.

## Error Handling

**Strategy:** Shared helpers throw normalized error shapes or `Error`; `Seedance.execute()` catches per-item failures, specializes delete errors, respects `continueOnFail()`, and otherwise throws `NodeOperationError`.

**Patterns:**
- Transport catches HTTP errors and throws `normalizeSeedanceError()` from `nodes/Seedance/shared/mappers/errors.ts`.
- Download failures are converted to `Error` with expiry hints by `normalizeSeedanceDownloadError()` in `nodes/Seedance/shared/mappers/errors.ts`.
- Delete errors pass through `getFriendlyDeleteError()` in `nodes/Seedance/shared/mappers/errors.ts`.
- Mapper/validator errors are caught in `nodes/Seedance/Seedance.node.ts` and rethrown as `NodeOperationError` unless `continueOnFail()` is enabled.

## Cross-Cutting Concerns

**Logging:** No application logging framework is used in runtime node code. Development-process logging is limited to `scripts/dev.mjs`.
**Validation:** Video validation is in `nodes/Seedance/shared/validators/create.ts`; image validation is in `nodes/Seedance/shared/validators/seedreamImage.ts`; wait timeout validation is inline in `nodes/Seedance/Seedance.node.ts`.
**Authentication:** n8n credentials provide `apiKey`; transport builds `Authorization: Bearer ...` headers in `nodes/Seedance/shared/transport/request.ts`.
**External APIs:** Endpoint paths are centralized in `nodes/Seedance/shared/transport/endpoints.ts`; base URL and model/version constants are centralized in `nodes/Seedance/shared/constants.ts`.
**Binary data:** Input binary image validation/conversion happens in `nodes/Seedance/Seedance.node.ts`; output image/video binary attachments are returned through n8n `binary` properties.

---

*Architecture analysis: 2026-05-18*
