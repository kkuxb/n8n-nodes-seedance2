# Codebase Structure

**Analysis Date:** 2026-05-18

## Directory Layout

```text
n8n-nodes-seedance2/
├── credentials/                 # n8n credential type source and credential icons
├── nodes/
│   └── Seedance/                # Seedance n8n node source, icon, UI descriptions, shared logic
│       ├── description/         # Operation-specific n8n parameter schemas
│       └── shared/              # Constants, types, mappers, validators, polling, transport
│           ├── mappers/         # API payload builders and response normalizers
│           ├── polling/         # Task polling helpers
│           ├── transport/       # Endpoint and HTTP request helpers
│           └── validators/      # Input validation helpers
├── scripts/                     # Development helper scripts
├── test/                        # Node test files importing built dist modules
├── .planning/                   # GSD planning and generated codebase map documents
├── package.json                 # npm, n8n package registration, scripts, dependencies
├── package-lock.json            # npm lockfile
├── tsconfig.json                # TypeScript build configuration
├── eslint.config.mjs            # n8n community-node lint configuration entry
├── gulpfile.js                  # Build asset task configuration
├── .prettierrc                  # Formatting configuration
├── .nvmrc                       # Node version hint
└── README.md                    # User-facing package documentation
```

## Directory Purposes

**`credentials/`:**
- Purpose: Contains the n8n credential source registered by the package and credential icon assets.
- Contains: `SeedanceApi.credentials.ts`, `seedance-light.png`, `seedance-dark.png`.
- Key files: `credentials/SeedanceApi.credentials.ts`, `credentials/seedance-light.png`, `credentials/seedance-dark.png`.
- Note: Treat credential files as sensitive-adjacent code. Do not place secret values in this directory.

**`nodes/`:**
- Purpose: Contains source code for n8n node implementations.
- Contains: `nodes/Seedance/` as the single detected node implementation.
- Key files: `nodes/Seedance/Seedance.node.ts`.

**`nodes/Seedance/`:**
- Purpose: Owns the Seedance node class, node icon, node metadata JSON, operation descriptions, and shared implementation modules.
- Contains: `Seedance.node.ts`, `Seedance.node.json`, `seedance.png`, `description/`, `shared/`.
- Key files: `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/Seedance.node.json`.

**`nodes/Seedance/description/`:**
- Purpose: Holds n8n UI parameter declarations grouped by operation.
- Contains: One `*.operation.ts` file per operation group.
- Key files: `nodes/Seedance/description/create.operation.ts`, `nodes/Seedance/description/image.operation.ts`, `nodes/Seedance/description/get.operation.ts`, `nodes/Seedance/description/list.operation.ts`, `nodes/Seedance/description/delete.operation.ts`.

**`nodes/Seedance/shared/`:**
- Purpose: Holds implementation code shared by the node entry point and tests.
- Contains: `constants.ts`, `types.ts`, `mappers/`, `polling/`, `transport/`, `validators/`.
- Key files: `nodes/Seedance/shared/constants.ts`, `nodes/Seedance/shared/types.ts`.

**`nodes/Seedance/shared/mappers/`:**
- Purpose: Converts node inputs to external API payloads and external API responses to n8n output data.
- Contains: Payload builders, task/result mappers, and error normalizers.
- Key files: `nodes/Seedance/shared/mappers/createPayload.ts`, `nodes/Seedance/shared/mappers/task.ts`, `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`, `nodes/Seedance/shared/mappers/seedreamImageResult.ts`, `nodes/Seedance/shared/mappers/errors.ts`.

**`nodes/Seedance/shared/polling/`:**
- Purpose: Holds task polling loops with injectable timing dependencies.
- Contains: `getTaskPolling.ts`.
- Key files: `nodes/Seedance/shared/polling/getTaskPolling.ts`.

**`nodes/Seedance/shared/transport/`:**
- Purpose: Holds API endpoint helpers and n8n HTTP request wrappers.
- Contains: `endpoints.ts`, `request.ts`.
- Key files: `nodes/Seedance/shared/transport/endpoints.ts`, `nodes/Seedance/shared/transport/request.ts`.

**`nodes/Seedance/shared/validators/`:**
- Purpose: Holds validation rules for request input contracts.
- Contains: Video create validation and image generation validation.
- Key files: `nodes/Seedance/shared/validators/create.ts`, `nodes/Seedance/shared/validators/seedreamImage.ts`.

**`scripts/`:**
- Purpose: Contains local development automation.
- Contains: `dev.mjs`, which starts `n8n-node dev --external-n8n` plus a pinned n8n server.
- Key files: `scripts/dev.mjs`.

**`test/`:**
- Purpose: Contains focused tests for compiled modules and node execution behavior.
- Contains: `*.test.ts` files using `node:test` and `node:assert/strict`.
- Key files: `test/createPayload.test.ts`, `test/request.test.ts`, `test/taskPolling.test.ts`, `test/seedanceGenerateImageExecute.test.ts`.

**`.planning/`:**
- Purpose: Contains GSD planning, phase, milestone, debug, quick-task, and codebase mapping artifacts.
- Contains: `.planning/codebase/`, `.planning/phases/`, `.planning/milestones/`, `.planning/debug/`, `.planning/quick/`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `nodes/Seedance/Seedance.node.ts`: TypeScript source for the n8n node class and `execute()` dispatcher.
- `dist/nodes/Seedance/Seedance.node.js`: Built node entry listed by `package.json`.
- `scripts/dev.mjs`: Development runtime entry used by `npm run dev`.

**Package Registration:**
- `package.json`: Registers `main`, `files`, `scripts`, `n8n.credentials`, and `n8n.nodes`.
- `tsconfig.json`: Builds `credentials/**/*.ts` and `nodes/**/*.ts` into `dist/` with `rootDir` set to repository root.

**Configuration:**
- `tsconfig.json`: TypeScript compiler settings for CommonJS ES2022 output.
- `eslint.config.mjs`: ESLint configuration entry for n8n node linting.
- `.prettierrc`: Prettier formatting settings.
- `.nvmrc`: Node version hint.
- `gulpfile.js`: Build asset task configuration.

**Core Logic:**
- `nodes/Seedance/Seedance.node.ts`: Runtime dispatch, binary helper usage, per-item error handling.
- `nodes/Seedance/shared/transport/request.ts`: Credential loading, auth headers, JSON requests, video download.
- `nodes/Seedance/shared/transport/endpoints.ts`: API path mapping and URL construction.
- `nodes/Seedance/shared/mappers/createPayload.ts`: Video create payload and response mapping.
- `nodes/Seedance/shared/mappers/task.ts`: Task response mapping and list aggregation.
- `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`: Image request payload mapping.
- `nodes/Seedance/shared/mappers/seedreamImageResult.ts`: Image response and binary output mapping.
- `nodes/Seedance/shared/mappers/errors.ts`: Error normalization.
- `nodes/Seedance/shared/polling/getTaskPolling.ts`: Wait-mode polling.
- `nodes/Seedance/shared/validators/create.ts`: Video create validation.
- `nodes/Seedance/shared/validators/seedreamImage.ts`: Image generation validation.

**UI Description:**
- `nodes/Seedance/description/create.operation.ts`: Video create parameters.
- `nodes/Seedance/description/get.operation.ts`: Video get/wait/download parameters.
- `nodes/Seedance/description/list.operation.ts`: Video list/filter/pagination parameters.
- `nodes/Seedance/description/delete.operation.ts`: Video delete/cancel parameters.
- `nodes/Seedance/description/image.operation.ts`: Image text-to-image and image-to-image parameters.

**Types and Constants:**
- `nodes/Seedance/shared/types.ts`: Shared TypeScript contracts for operations, requests, image payloads, API errors, and video downloads.
- `nodes/Seedance/shared/constants.ts`: Credential type name, base URL, API version, model IDs, statuses, limits, MIME types, and recommended image sizes.

**Assets:**
- `nodes/Seedance/seedance.png`: Node icon referenced by `nodes/Seedance/Seedance.node.ts`.
- `credentials/seedance-light.png`: Light credential icon.
- `credentials/seedance-dark.png`: Dark credential icon.

**Testing:**
- `test/*.test.ts`: Test files.
- `test/createPayload.test.ts`: Video create description and payload mapper tests.
- `test/request.test.ts`: Transport, endpoint, and error mapper tests.
- `test/taskPolling.test.ts`: Polling tests with fake executor and injectable time.
- `test/seedanceGenerateImageExecute.test.ts`: Node execution tests for image generation.

## Naming Conventions

**Files:**
- `*.node.ts`: n8n node entry point, as in `nodes/Seedance/Seedance.node.ts`.
- `*.node.json`: n8n node metadata, as in `nodes/Seedance/Seedance.node.json`.
- `*.operation.ts`: n8n operation property groups, as in `nodes/Seedance/description/create.operation.ts`.
- `camelCase.ts`: Shared helper modules, as in `nodes/Seedance/shared/mappers/createPayload.ts`.
- `*.test.ts`: Tests under `test/`, as in `test/taskPolling.test.ts`.
- `*.credentials.ts`: n8n credential type source, as in `credentials/SeedanceApi.credentials.ts`.

**Directories:**
- Node implementation directories use PascalCase matching the node display/domain name, as in `nodes/Seedance/`.
- Operation description files live under `nodes/Seedance/description/`.
- Shared implementation categories are lowercase plural directories: `nodes/Seedance/shared/mappers/`, `nodes/Seedance/shared/validators/`.
- Tests live in top-level `test/`, not co-located beside source files.

**Symbols:**
- n8n property arrays use `<operation>OperationProperties`, as in `createOperationProperties`.
- Pure mappers use action prefixes such as `build*`, `map*`, `select*`, `append*`, and `normalize*`.
- Validators use `validate*`, as in `validateCreateInput` and `validateSeedreamImageInput`.
- Constants use uppercase snake case, as in `SEEDANCE_BASE_URL`.
- Types and interfaces use PascalCase domain names, as in `SeedanceCreateInput` and `SeedreamImagePayloadInput`.

## Where to Add New Code

**New Video Operation:**
- Primary code: Add a new branch in `nodes/Seedance/Seedance.node.ts`.
- UI fields: Add `nodes/Seedance/description/<operation>.operation.ts` and spread it into `description.properties` in `nodes/Seedance/Seedance.node.ts`.
- Endpoint key: Extend `SeedanceOperationKey` in `nodes/Seedance/shared/types.ts` and `operationEndpoints` in `nodes/Seedance/shared/transport/endpoints.ts`.
- Payload/response mapping: Add helper functions under `nodes/Seedance/shared/mappers/`.
- Validation: Add validators under `nodes/Seedance/shared/validators/`.
- Tests: Add focused tests under `test/<operation>.test.ts` importing built modules from `../dist/...`.

**New Image Capability:**
- Primary code: Extend the image branch in `nodes/Seedance/Seedance.node.ts`.
- UI fields: Extend `nodes/Seedance/description/image.operation.ts`.
- Payload mapping: Extend `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`.
- Result mapping: Extend `nodes/Seedance/shared/mappers/seedreamImageResult.ts`.
- Validation: Extend `nodes/Seedance/shared/validators/seedreamImage.ts`.
- Types/constants: Extend `nodes/Seedance/shared/types.ts` and `nodes/Seedance/shared/constants.ts`.
- Tests: Add or extend image tests under `test/seedream*.test.ts` or `test/seedanceGenerateImageExecute.test.ts`.

**New API Request Helper:**
- Implementation: Add to `nodes/Seedance/shared/transport/request.ts` when it needs credential/header/request behavior.
- Endpoint mapping: Add to `nodes/Seedance/shared/transport/endpoints.ts` when it needs a new path.
- Types: Add request/response contracts to `nodes/Seedance/shared/types.ts` when shared across modules.
- Tests: Add assertions to `test/request.test.ts` or a new focused `test/<transport-area>.test.ts`.

**New Mapper:**
- Implementation: Add a file under `nodes/Seedance/shared/mappers/` when the mapper owns a distinct API shape.
- Types: Export public input/output contracts from the mapper file or from `nodes/Seedance/shared/types.ts` when multiple modules need them.
- Tests: Add a focused `test/<mapper-name>.test.ts` importing from `../dist/nodes/Seedance/shared/mappers/<mapper-name>.js`.

**New Validator:**
- Implementation: Add a file under `nodes/Seedance/shared/validators/` when validation belongs to a distinct input contract.
- Usage: Call validators before payload construction in `nodes/Seedance/shared/mappers/` or before request execution in `nodes/Seedance/Seedance.node.ts`.
- Tests: Add failure and success cases under `test/`.

**New Credential Field:**
- Implementation: Update `credentials/SeedanceApi.credentials.ts`.
- Transport usage: Read through `loadSeedanceRequestContext()` in `nodes/Seedance/shared/transport/request.ts`.
- Constants/types: Update `SeedanceCredentialData` in `nodes/Seedance/shared/types.ts` and any relevant constants in `nodes/Seedance/shared/constants.ts`.
- Tests: Use fake credentials in transport or execution tests under `test/`.
- Secret handling: Never commit real credential values in `credentials/`, `test/`, `.planning/`, or docs.

**Utilities:**
- Shared helpers: Place in the closest existing shared category under `nodes/Seedance/shared/`.
- Operation-specific helper: Keep private inside `nodes/Seedance/Seedance.node.ts` only when it depends directly on n8n execution context and is not reusable.
- Generic constants: Place in `nodes/Seedance/shared/constants.ts`.
- Generic types: Place in `nodes/Seedance/shared/types.ts`.

**Documentation:**
- User-facing usage docs: Update `README.md`.
- Codebase maps: Update only assigned files under `.planning/codebase/`.
- Planning artifacts: Use `.planning/phases/`, `.planning/milestones/`, `.planning/debug/`, or `.planning/quick/` according to GSD workflow.

## Special Directories

**`dist/`:**
- Purpose: Compiled package output for n8n and tests.
- Generated: Yes.
- Committed: Not detected in `rg --files` output.
- Source mapping: Built from `credentials/**/*.ts` and `nodes/**/*.ts` configured in `tsconfig.json`.

**`node_modules/`:**
- Purpose: Installed npm dependencies.
- Generated: Yes.
- Committed: No.
- Source mapping: Installed from `package-lock.json`.

**`.planning/`:**
- Purpose: GSD planning and codebase map artifacts.
- Generated: Yes.
- Committed: Project-dependent; existing planning files are present in the workspace.
- Source mapping: Do not place runtime source code here.

**`.n8n-dev-server/`:**
- Purpose: Local pinned n8n runtime installed by `scripts/dev.mjs`.
- Generated: Yes.
- Committed: No.
- Source mapping: Managed by `npm run dev`.

**`.npm-n8n-cache/`:**
- Purpose: Local npm cache for the pinned n8n runtime used by `scripts/dev.mjs`.
- Generated: Yes.
- Committed: No.
- Source mapping: Managed by `npm run dev`.

**`.git/`:**
- Purpose: Git repository metadata.
- Generated: Yes.
- Committed: No.
- Source mapping: Do not edit manually.

---

*Structure analysis: 2026-05-18*
