# External Integrations

**Analysis Date:** 2026-05-18

## APIs & External Services

**Volcengine Ark / 火山方舟 AI generation API:**
- Volcengine Ark base API - used for Seedance video task creation, task lookup, task listing, task deletion/cancellation, and Seedream image generation.
  - Base URL: `https://ark.cn-beijing.volces.com`, defined in `nodes/Seedance/shared/constants.ts`.
  - API version constant: `2024-01-01`, defined in `nodes/Seedance/shared/constants.ts`; this value is exposed through `getSeedanceApiVersion()` in `nodes/Seedance/shared/transport/endpoints.ts`.
  - SDK/Client: no vendor SDK; requests use n8n's `executor.helpers.httpRequest` in `nodes/Seedance/shared/transport/request.ts`.
  - Auth: n8n credential type `seedanceApi`; request headers are built as `Authorization: Bearer <apiKey>` in `nodes/Seedance/shared/transport/request.ts`.
- Seedance 2.0 video tasks - managed through `/api/v3/contents/generations/tasks`.
  - Create: `POST /api/v3/contents/generations/tasks`, routed through `getSeedanceOperationEndpoint('createTask')` in `nodes/Seedance/shared/transport/endpoints.ts` and executed in `nodes/Seedance/Seedance.node.ts`.
  - Get: `GET /api/v3/contents/generations/tasks?id=<taskId>`, routed through `getSeedanceOperationEndpoint('getTask')` in `nodes/Seedance/shared/transport/endpoints.ts` and executed in `nodes/Seedance/Seedance.node.ts`.
  - List: `GET /api/v3/contents/generations/tasks` with pagination and filters, routed through `getSeedanceOperationEndpoint('listTasks')` in `nodes/Seedance/shared/transport/endpoints.ts`.
  - Delete/cancel: `DELETE /api/v3/contents/generations/tasks/<taskId>`, built by `getSeedanceDeleteTaskEndpoint()` in `nodes/Seedance/shared/transport/endpoints.ts`.
  - Supported models: `doubao-seedance-2-0-260128` and `doubao-seedance-2-0-fast-260128`, exposed by `nodes/Seedance/description/create.operation.ts` and validated by `nodes/Seedance/shared/validators/create.ts`.
- Seedream 5.0 Lite image generation - handled through `/api/v3/images/generations`.
  - Generate image: `POST /api/v3/images/generations`, routed through `getSeedanceOperationEndpoint('generateImage')` in `nodes/Seedance/shared/transport/endpoints.ts`.
  - Supported model: `doubao-seedream-5-0-260128`, defined as `SEEDREAM_IMAGE_MODEL` in `nodes/Seedance/shared/constants.ts` and exposed by `nodes/Seedance/description/image.operation.ts`.
  - Response format: `b64_json`, defined in `nodes/Seedance/shared/constants.ts` and mapped to n8n binary attachments by `nodes/Seedance/shared/mappers/seedreamImageResult.ts`.
  - Optional web search tool: enabled by the node's `webSearch` parameter in `nodes/Seedance/description/image.operation.ts`, which adds `{ type: 'web_search' }` to the image payload in `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`.

**External media URLs:**
- Public image URLs - accepted as first/last frame inputs for Seedance video generation and as reference images for Seedream image generation in `nodes/Seedance/Seedance.node.ts`.
  - SDK/Client: values are passed through to the Volcengine Ark API payload; no direct fetch happens for input image URLs.
  - Auth: none in this repository.
- Generated video URLs - optionally downloaded when `downloadVideo` is enabled after a successful task lookup in `nodes/Seedance/Seedance.node.ts`.
  - SDK/Client: n8n `executor.helpers.httpRequest` in `downloadSeedanceVideo()` from `nodes/Seedance/shared/transport/request.ts`.
  - Auth: no credentials are sent for downloads; `sendCredentialsOnCrossOriginRedirect` is explicitly false in `nodes/Seedance/shared/transport/request.ts`.

**Documentation links:**
- Volcengine credential documentation - linked from `nodes/Seedance/Seedance.node.json` as `https://www.volcengine.com/docs/82379/1298459`.
- Volcengine primary API documentation - linked from `nodes/Seedance/Seedance.node.json` as `https://www.volcengine.com/docs/82379/1520758`.

## Data Storage

**Databases:**
- None defined by this package.
  - Connection: Not applicable.
  - Client: Not applicable.
- Local development n8n runtime uses n8n's own SQLite path indirectly; `scripts/dev.mjs` only sets `DB_SQLITE_POOL_SIZE=10` and does not define repository-managed database schema or migrations.

**File Storage:**
- n8n binary data - generated Seedream images and optionally downloaded Seedance videos are returned as n8n binary attachments from `nodes/Seedance/Seedance.node.ts`.
- Build output - compiled JavaScript, declarations, source maps, and copied assets are written to `dist` by `tsconfig.json`, `package.json`, and `gulpfile.js`.
- Local development runtime/cache - `.n8n-dev-server`, `.npm-n8n-cache`, and `.n8n-node-cli` are used by `scripts/dev.mjs`; repository `.gitignore` excludes local runtime/cache paths.

**Caching:**
- No application caching layer is implemented.
- npm install cache for the local n8n dev runtime is configured by `scripts/dev.mjs` through `npm_config_cache=.npm-n8n-cache`.

## Authentication & Identity

**Auth Provider:**
- Volcengine Ark API key stored as an n8n credential.
  - Implementation: the node declares required credential type `seedanceApi` in `nodes/Seedance/Seedance.node.ts`; request code loads it via `getCredentials()` in `nodes/Seedance/shared/transport/request.ts`.
  - Credential source file: `credentials/SeedanceApi.credentials.ts` exists and is registered for distribution in `package.json`; contents were not read during this map because credential-like files are treated as sensitive by mapper policy.
  - Header strategy: `buildSeedanceAuthHeaders()` creates Bearer authentication headers in `nodes/Seedance/shared/transport/request.ts`.
- n8n instance authentication is outside this package; no custom user identity, OAuth, session, or token exchange flow is implemented in this repository.

## Monitoring & Observability

**Error Tracking:**
- None detected; no Sentry, OpenTelemetry, Datadog, Honeycomb, or similar integration appears in `package.json` or source imports.

**Logs:**
- Runtime node errors are normalized into structured `SeedanceApiErrorShape` objects in `nodes/Seedance/shared/mappers/errors.ts` and thrown as `NodeOperationError` from `nodes/Seedance/Seedance.node.ts`.
- Local development process logs use `console.log` and `console.error` in `scripts/dev.mjs`.
- API responses may include raw response payloads in node JSON output for create and task operations through mappers such as `nodes/Seedance/shared/mappers/createPayload.ts` and `nodes/Seedance/shared/mappers/task.ts`.

## CI/CD & Deployment

**Hosting:**
- npm package hosting for the community node; `package.json` sets `publishConfig.access` to `public`.
- Runtime hosting is the user's n8n instance; this repo does not define its own hosting platform, Dockerfile, or compose stack.

**CI Pipeline:**
- None detected in the repository scan; no `.github/**` workflow files are present.

## Environment Configuration

**Required env vars:**
- Production package use: none defined by this repository; the API key is configured through n8n credentials rather than environment variables.
- Local development only:
  - `N8N_DEV_RELOAD` - set to `true` by `scripts/dev.mjs`.
  - `DB_SQLITE_POOL_SIZE` - set to `10` by `scripts/dev.mjs`.
  - `N8N_USER_FOLDER` - set to the local `.n8n-node-cli` folder by `scripts/dev.mjs`.
  - `npm_config_cache` - set to `.npm-n8n-cache` for the pinned n8n dev install in `scripts/dev.mjs`.
  - `npm_config_python` or `PYTHON` - optional Windows override checked by `scripts/dev.mjs` when node-gyp/Python compatibility matters.

**Secrets location:**
- Volcengine API key is stored in n8n credentials under credential type `seedanceApi`; request code reads the `apiKey` property as typed in `nodes/Seedance/shared/types.ts`.
- `.env` and `.env.*` are ignored in `.gitignore`; no `.env*` files are present in the repository scan.
- No secrets are committed or required in source-controlled config.

## Webhooks & Callbacks

**Incoming:**
- None. `nodes/Seedance/Seedance.node.ts` implements an execute-only n8n node and does not expose webhook endpoints.

**Outgoing:**
- Volcengine Ark HTTP requests:
  - `POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks` for Seedance video task creation.
  - `GET https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks` for task lookup and task listing.
  - `DELETE https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/<taskId>` for cancel/delete.
  - `POST https://ark.cn-beijing.volces.com/api/v3/images/generations` for Seedream image generation.
- Generated media downloads:
  - `GET <videoUrl>` from task results when `downloadVideo` is enabled; this uses `downloadSeedanceVideo()` in `nodes/Seedance/shared/transport/request.ts`.
- No callback URL registration, webhook subscription, or server-to-server callback handler is implemented.

---

*Integration audit: 2026-05-18*
