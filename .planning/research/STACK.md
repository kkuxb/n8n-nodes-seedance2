# Technology Stack

**Project:** n8n-nodes-seedance2 v1.3 - Seedance 2.0 multimodal reference video generation
**Researched:** 2026-05-18
**Research question:** What stack additions or changes are needed for Seedance 2.0 multimodal reference video generation?
**Overall confidence:** MEDIUM

## Recommendation

Do not add new runtime libraries for v1.3. The new Seedance 2.0 multimodal reference video feature should extend the existing TypeScript + n8n community node + direct Volcengine Ark REST stack with new internal types, request mappers, validators, UI descriptions, and regression tests.

The official Volcengine page requested for this research is the right primary source, but the accessible text extract is JavaScript-rendered and did not expose the complete request field tables or examples. Treat the endpoint family and current integration approach as stable enough to plan, but verify exact v1.3 body fields, reference item roles/types, media limits, and binary/data URL support against the live official docs or a real API call before implementing final payload names.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | 5.8.3 | Implement node descriptions, typed payload builders, validators, and response mappers | Already used throughout the node; new multimodal request shaping needs stronger local types, not a new framework. |
| n8n-workflow | ^2.13.1 | n8n node contracts, binary helpers, HTTP request option types, `NodeOperationError` | Existing dependency gives the required execution, credential, HTTP, and binary APIs. |
| @n8n/node-cli | ^0.23.1 | Build, lint, local community-node development | Keep the current n8n community node packaging path. No feature requirement justifies changing build tooling. |
| Node.js | 22.x | Runtime and test environment | Required by `package.json` and `.nvmrc`; continue to use Node built-ins and n8n helpers. |

### API Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Volcengine Ark REST API | Official Seedance 2.0 v1.3 docs current as of 2026-05-18 | Create multimodal video generation tasks | Existing project already uses direct REST against `https://ark.cn-beijing.volces.com`; v1.3 should add payload support, not a vendor SDK. |
| `SeedanceApi` n8n credential | Existing project credential | API key storage and Bearer auth | Existing validated credential is shared by video and image features. No new credential type is needed unless official docs introduce a distinct auth scope, which was not visible in the extracted doc. |
| `/api/v3/contents/generations/tasks` | Existing endpoint family | Async create/get/list/delete/wait lifecycle | Existing lifecycle is already built around this task endpoint. Add multimodal create payload variants while preserving get/list/delete/wait/download behavior. |

### New Internal Code, Not New Packages

| Addition | Location | Purpose | Why |
|----------|----------|---------|-----|
| `SeedanceVideoReferenceInput` / normalized reference types | `nodes/Seedance/shared/types.ts` or a new video-specific shared type module | Represent URL/binary/reference metadata before official payload mapping | Keeps request construction typed and testable without exposing raw API structures directly in node execution. |
| Multimodal video payload mapper | Extend `nodes/Seedance/shared/mappers/createPayload.ts` or split to `seedanceVideoPayload.ts` | Convert n8n UI inputs into the official `content`/reference payload | The existing mapper already owns create-task body shaping; v1.3 should preserve that boundary. |
| Multimodal video validators | Extend `nodes/Seedance/shared/validators/create.ts` or split to `seedanceVideo.ts` | Enforce supported modes, reference counts, media types, required fields, and size limits | Validation belongs before HTTP request submission so n8n users get clear local errors. Exact limits require official verification. |
| Reference UI controls | `nodes/Seedance/description/create.operation.ts` | Add n8n-friendly URL/binary multi-value inputs for supported reference media | Reuse the shipped Seedream URL/binary normalization pattern where official Seedance 2.0 supports equivalent media forms. |
| Execute collection helpers | `nodes/Seedance/Seedance.node.ts` | Read binary properties, collect ordered references, pass typed input to mapper | Existing execution path already collects first/last frame images and Seedream references. Extend it additively. |
| Regression tests | `test/*.test.ts` using `node:test` | Lock payload shape, reference normalization, lifecycle compatibility, hidden stale-field behavior | Existing test style is sufficient; no Jest/Vitest dependency should be added. |

### Binary and Media Handling

| Capability | Stack Decision | Rationale |
|------------|----------------|-----------|
| URL references | Reuse string inputs and comma/Chinese-comma splitting pattern | Already validated for Seedream references and fits n8n workflow ergonomics. |
| Binary references | Use n8n `assertBinaryData()` and `getBinaryDataBuffer()` | Existing code already uses these helpers; avoid direct filesystem access and upload middleware. |
| Data URL conversion | Use only if official v1.3 docs or API verification confirms Seedance 2.0 accepts data URLs for the relevant reference type | Current first/last frame code converts binary to `data:<mime>;base64,...`; exact support for new multimodal reference fields could not be verified from the extracted official page. |
| MIME validation | Start from n8n binary `mimeType`; maintain explicit allowlists after official verification | No `file-type`, `mime`, `sharp`, or `ffmpeg` package is needed unless the official API requires local transcoding, which is not established. |
| Large file handling | Keep binary size validation local; do not add storage/cache | n8n already supplies binary buffers. If official docs require asset upload for large media, add a REST upload endpoint integration rather than a new storage subsystem. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Volcengine access | Direct HTTP via n8n `helpers.httpRequest` | Volcengine SDK | Current project has no SDK dependency, n8n helper integration already handles credentials/options, and SDK support for this exact v1.3 page was not verified. |
| HTTP client | n8n `helpers.httpRequest` | `axios`, `node-fetch`, `got` | Adds dependency and bypasses established n8n request conventions without adding needed capability. |
| Binary processing | n8n binary helpers + Buffer | `form-data`, `multer`, temp files | The feature is request payload shaping, not an inbound upload server. Add upload only if official docs require a separate Ark asset flow. |
| Media inspection/transcoding | Validate declared MIME/size | `sharp`, `ffmpeg`, `file-type` | No verified requirement for local conversion. Avoid media processing dependencies in a community node unless official limits make them necessary. |
| Test framework | Node.js built-in test runner | Jest/Vitest/Mocha | Existing tests use `node:test` and compiled `dist`; new coverage can follow the same pattern. |
| Background execution | Existing wait/polling helpers | Queue, database, scheduler | n8n owns workflow execution; existing task wait/download lifecycle is validated and should remain unchanged. |

## Installation

No package installation is recommended for the new capability.

```bash
# Keep existing dependencies.
npm install

# Existing verification path after implementation.
npm run build
node --test test/*.test.ts
```

Do not change `package.json` for v1.3 unless live official-doc/API verification proves a new upload, signing, or media processing capability is required.

## Integration Points

| Existing Surface | v1.3 Change |
|------------------|-------------|
| `nodes/Seedance/description/create.operation.ts` | Add multimodal reference controls behind video create mode, using URL/binary source choices and ordered multi-value inputs. |
| `nodes/Seedance/shared/validators/create.ts` | Add mode/reference validation and official limit checks. Keep current model, resolution, duration, seed, timeout validation. |
| `nodes/Seedance/shared/mappers/createPayload.ts` | Add or delegate multimodal `content` construction. Keep current first/last frame behavior compatible. |
| `nodes/Seedance/Seedance.node.ts` | Collect new reference inputs and pass typed data to mapper; reuse binary helper logic where possible. |
| `nodes/Seedance/shared/transport/endpoints.ts` | Probably unchanged if v1.3 create still uses the task endpoint. Add endpoints only if official docs require asset upload or another resource. |
| `credentials/SeedanceApi.credentials.ts` | No expected change; continue Bearer API key auth. |
| `test/createPayload.test.ts` and video regression tests | Add focused cases for multimodal references, binary normalization, URL ordering, stale hidden fields, and existing lifecycle non-regression. |

## What Not To Add

| Do Not Add | Reason |
|------------|--------|
| A new n8n credential type | The milestone explicitly preserves shared `SeedanceApi` credentials, and no separate auth requirement was verified. |
| A separate Seedance 2.0 node | Existing project decision is one `Seedance` node with mode-first UX; v1.3 should be additive. |
| Volcengine SDK | Direct REST is already implemented and easier to test inside n8n. |
| Generic multimodal AI orchestration libraries | This is a specific Volcengine payload integration, not an agent/RAG workflow. |
| Local database, cache, or queue | n8n and the Volcengine task API already provide the lifecycle model. |
| `axios`, `node-fetch`, `got` | n8n HTTP helpers are already the integration boundary. |
| `sharp`, `ffmpeg`, upload middleware | Not justified unless official docs require local preprocessing or multipart upload. |
| New environment variables | API key belongs in n8n credentials; no production `.env` is needed. |

## Official-Doc Verification Needed Before Implementation

The linked official page should be rechecked in a browser or through live API experiments before final coding of exact body names. Specific items requiring verification:

- Exact request field names for multimodal references in Seedance 2.0 v1.3.
- Supported reference item media types: image only, video, audio, text, or other asset classes.
- Whether binary-derived `data:` URLs are accepted for each reference type, or whether references must be public URLs / Volcengine asset IDs.
- Reference roles and ordering semantics beyond current `first_frame` / `last_frame`.
- Count, size, duration, MIME, resolution, and aspect-ratio limits for each media type.
- Whether the same create endpoint remains sufficient or an official asset upload endpoint is required.
- Whether response fields add new downloadable artifacts besides `video_url` and optional last frame.

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| Official Volcengine Seedance 2.0 v1.3 multimodal reference video documentation: https://www.volcengine.com/docs/82379/1520757?lang=zh | MEDIUM | Primary required source. Page is official and reachable, but field tables/examples were not extractable from the available text because the useful content appears JavaScript-rendered. Exact fields require live official-doc/API verification. |
| Existing project stack: `.planning/codebase/STACK.md` | HIGH | Current local codebase map of versions, runtime, build, and test tooling. |
| Existing project integrations: `.planning/codebase/INTEGRATIONS.md` | HIGH | Current local map of Volcengine base URL, task endpoints, credential strategy, and no-SDK transport. |
| Current package metadata: `package.json` | HIGH | Confirms Node 22, npm 11.12.1, TypeScript 5.8.3, n8n-workflow ^2.13.1, @n8n/node-cli ^0.23.1, and no test-framework/runtime HTTP dependencies. |
| Existing implementation files under `nodes/Seedance/**` and `test/**` | HIGH | Confirms current binary handling, create payload mapper, validators, endpoint helpers, and Node test runner pattern. |
