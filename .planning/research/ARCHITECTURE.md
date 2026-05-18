# Architecture Patterns

**Domain:** Seedance 2.0 multimodal reference video generation in an existing n8n community node
**Project:** n8n-nodes-seedance2 v1.3
**Researched:** 2026-05-18
**Overall confidence:** MEDIUM

## Official Documentation Status

The primary official Volcengine page was checked first:

- https://www.volcengine.com/docs/82379/1520757?lang=zh

The page is accessible, but the captured HTML body is JavaScript-rendered and does not expose the detailed request/response tables, examples, or exact field constraints. It does expose the official navigation for the video-generation API lifecycle and the page title "创建视频生成任务 API", with "最近更新时间：2026.05.11 14:44:55".

Related official lifecycle pages were also checked:

- Create task: https://www.volcengine.com/docs/82379/1520757?lang=zh
- Query task: https://www.volcengine.com/docs/82379/1521309?lang=zh, updated 2026.04.25 18:45:21
- List tasks: https://www.volcengine.com/docs/82379/1521675?lang=zh, updated 2026.05.07 16:36:49
- Cancel/delete task: https://www.volcengine.com/docs/82379/1521720?lang=zh, updated 2026.04.25 18:45:06
- Base URL/auth page: https://www.volcengine.com/docs/82379/1298459?lang=zh, updated 2026.03.13 15:51:27

Exact Seedance 2.0 multimodal request fields, allowed media roles, media count limits, mime limits, callback fields, and whether task query uses `?id=` or `/{id}` must be verified against the live official documentation or a live API request before implementation is marked complete. Third-party mirrors and indexed snippets were not treated as authoritative for exact field names.

## Recommended Architecture

Integrate v1.3 as an additive extension of the existing video `create` operation, not as a new n8n node and not as a separate lifecycle. The current node already has the right macro-architecture: one `Seedance` node, one credential type, shared operation descriptions, pure mappers/validators, shared transport, polling, and execute-level tests. The v1.3 change should preserve that structure and only widen the video create request contract from "prompt plus optional first/last images" to "prompt plus ordered multimodal references".

```text
n8n item
  |
  v
Seedance.execute()
  |
  |-- generationMode=video, operation=create
  |     |
  |     |-- collect reference parameters and binary inputs
  |     |-- normalize references to internal typed references
  |     |-- validate multimodal rules and model constraints
  |     |-- build official Seedance content payload
  |     |-- POST create task through shared transport
  |     |-- map task creation response with request summary
  |
  |-- operation=get/list/delete
        |
        |-- keep existing task lifecycle, polling, download, retention output
```

The core architectural decision is to make multimodal references a create-payload concern, not a lifecycle concern. Once the create request returns a task ID, the existing get/list/delete/wait/download paths should remain unchanged unless official docs prove response shape changes are required.

## Component Boundaries

| Component | Status | Responsibility | Communicates With |
|-----------|--------|----------------|-------------------|
| `nodes/Seedance/Seedance.node.ts` | Modify | Dispatch video create, collect URL/binary reference parameters, call new normalizer/mapper, preserve existing get/list/delete branches. | Description layer, new reference normalizer, `buildCreatePayload`, `seedanceApiRequest` |
| `nodes/Seedance/description/create.operation.ts` | Modify | Add n8n-friendly multimodal reference controls under create mode; keep existing first/last-frame fields compatible. | Constants/types only |
| `nodes/Seedance/shared/mappers/createPayload.ts` | Modify or split | Build final official create payload from typed `SeedanceCreateInput`; include ordered multimodal content entries. | `validators/create.ts`, new reference types |
| `nodes/Seedance/shared/mappers/videoReferences.ts` | New | Normalize URL/base64/data URL/binary reference records into a single internal reference format before payload construction. | `Seedance.node.ts`, `types.ts`, validators |
| `nodes/Seedance/shared/validators/create.ts` | Modify | Validate create mode, prompt/reference requirements, supported model/options, media type/count/size limits once confirmed. | Create payload mapper |
| `nodes/Seedance/shared/types.ts` | Modify | Add `SeedanceReferenceInput`, `SeedanceNormalizedReference`, reference source/type/role unions, and request-summary fields. | Node, descriptions, mappers, validators |
| `nodes/Seedance/shared/constants.ts` | Modify | Add confirmed Seedance 2.0 media mime types, max byte sizes, max reference count, media roles, and model capability flags. | Descriptions, validators |
| `nodes/Seedance/shared/transport/endpoints.ts` | Verify, maybe modify | Keep centralized lifecycle endpoints; adjust query/delete path helpers only if live official docs require path IDs over query IDs. | Node, polling, request tests |
| `nodes/Seedance/shared/mappers/task.ts` | Verify, likely unchanged | Continue normalizing task output, `content.video_url`, `content.last_frame_url`, status flags, retention warnings. | Get/list/polling branches |
| `nodes/Seedance/shared/polling/getTaskPolling.ts` | Keep | Poll task status until terminal state; no multimodal-specific logic belongs here. | Transport, task mapper |
| `nodes/Seedance/shared/transport/request.ts` | Keep | Continue credential loading, Bearer auth, JSON request shaping, and video download. | All API branches |
| `test/seedanceVideoMultimodalPayload.test.ts` | New | Direct mapper/validator coverage for multimodal content ordering, URL/binary normalization, and rejected invalid mixes. | Built dist mappers/validators |
| `test/seedanceCreateMultimodalExecute.test.ts` | New | Execute-level regression tests for n8n parameters, binary helpers, captured HTTP payload, and response mapping. | Built dist node |

## New vs Modified Components

### New Components

Add `nodes/Seedance/shared/mappers/videoReferences.ts` because multimodal reference normalization is distinct from payload assembly. This helper should own:

- splitting URL lists and fixed-collection records,
- reading normalized input records already collected from n8n binary helpers,
- converting binary/base64 references into official-compatible URL or data URL values only after exact official support is verified,
- preserving reference order because multimodal generation often interprets sequence and role semantically,
- returning reference metadata for `requestSummary` without leaking large base64 strings into output JSON.

Add focused tests:

- `test/seedanceVideoMultimodalPayload.test.ts` for pure helper contracts.
- `test/seedanceCreateMultimodalExecute.test.ts` for end-to-end node execution request shaping.

### Modified Components

Modify `create.operation.ts` rather than adding a new operation file. Users already understand "创建任务" as the video creation entry point, and lifecycle operations depend on task IDs regardless of prompt-only or multimodal creation.

Modify `Seedance.node.ts` only at the create branch and near binary-reference helpers. Do not thread multimodal logic into get/list/delete.

Modify `createPayload.ts` only enough to accept a richer internal input shape and emit the official content array. If this file becomes difficult to read, split content construction into `buildSeedanceVideoContent()` while keeping `buildCreatePayload()` as the public mapper entry.

Modify `validators/create.ts`, `types.ts`, and `constants.ts` with confirmed official limits. Until official verification is complete, make unverified limits conservative and feature-flagged in constants with comments that identify the official field still needing validation.

## Data Flow

### Video Create With Multimodal References

1. `Seedance.execute()` enters `generationMode=video` and `operation=create`.
2. Existing scalar parameters are read: `model`, `prompt`, `resolution`, `ratio`, `duration`, `generateAudio`, and `advancedOptions`.
3. New reference parameters are read from a fixed collection such as `referenceMedia.items`, using the same n8n-friendly source pattern shipped for Seedream image references: URL first, binary support, and optional multiple entries.
4. Binary references are read in `Seedance.node.ts` through n8n helpers because shared mappers should not depend on `IExecuteFunctions`.
5. `normalizeSeedanceVideoReferences()` converts mixed UI inputs into ordered internal references:

```typescript
interface SeedanceVideoReferenceInput {
  source: 'url' | 'binary';
  mediaType: 'image' | 'video' | 'audio';
  role?: string;
  subjectType?: string;
  value: string;
  mimeType?: string;
  byteLength?: number;
}
```

6. `validateCreateInput()` validates model support, prompt/reference requirements, media size/mime constraints, duration/resolution/ratio, and any official role compatibility rules.
7. `buildCreatePayload()` maps the prompt and normalized references to the official create-task request payload.
8. `seedanceApiRequest()` posts to the centralized create-task endpoint.
9. `mapCreateResponse()` returns the task ID, status, raw response, and a safe request summary with reference counts/types, not full binary/base64 payloads.

### Task Lifecycle After Create

The lifecycle should remain the existing one:

1. Create returns a task ID and status.
2. Get either performs one query or `pollTaskUntilSettled()` waits until terminal status.
3. When succeeded and `downloadVideo=true`, `downloadSeedanceVideo()` fetches `videoUrl` into `binary.video`.
4. List aggregates recent tasks with retention metadata.
5. Delete/cancel uses the centralized delete endpoint helper.

Multimodal references do not change polling, list aggregation, delete behavior, or binary output download. If official query responses add media-specific output fields, extend `mapTaskResponse()` additively and keep `raw`.

## Patterns to Follow

### Pattern 1: Internal Reference Contract Before Official Payload

**What:** Convert n8n UI and binary input into a stable internal reference object, then convert that object into the official API shape.

**When:** Any create request includes images, video clips, audio, first/last frames, or future reference roles.

**Example:**

```typescript
const references = normalizeSeedanceVideoReferences(rawReferences);
const payload = buildCreatePayload({
  ...scalarCreateInput,
  references,
});
```

**Why:** This keeps UI evolution separate from exact API field names. When Volcengine changes or clarifies official fields, only the official-payload mapper should need adjustment.

### Pattern 2: Keep Binary I/O at the Node Boundary

**What:** Read binary buffers in `Seedance.node.ts`, then pass base64/value/mime/size metadata into shared helpers.

**When:** Handling images, videos, or audio from n8n binary properties.

**Why:** Existing Seedream code already follows this boundary. It makes shared mappers pure and keeps tests simple.

### Pattern 3: Preserve Request Summaries Without Payload Bloat

**What:** Include `referenceCount`, `referenceTypes`, `referenceRoles`, prompt/model/options, and lifecycle metadata in `requestSummary`; omit raw base64 and data URLs.

**When:** Mapping create-task responses.

**Why:** n8n execution data can become large and sensitive if binary inputs are echoed into JSON.

### Pattern 4: Endpoint Helpers Stay Centralized

**What:** Any official endpoint path change must be represented in `transport/endpoints.ts` and verified by `test/request.test.ts`.

**When:** Live official docs/API verify whether get/delete/list use path parameters or query parameters.

**Why:** Current code centralizes endpoint construction; bypassing it would fragment lifecycle behavior.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding a New Seedance 2.0 Node

**What:** Creating a separate n8n node for multimodal Seedance 2.0.
**Why bad:** Duplicates credentials, lifecycle, polling, and transport, and conflicts with the project decision to keep one unified Seedance node.
**Instead:** Extend the existing video `create` operation.

### Anti-Pattern 2: Treating Multimodal References as a New Lifecycle

**What:** Adding separate get/list/delete/polling branches for multimodal tasks.
**Why bad:** Official lifecycle remains task based; downstream workflows should receive the same task ID and status contract.
**Instead:** Keep multimodal logic in create payload shaping only.

### Anti-Pattern 3: Baking Unverified Third-Party Field Names Into Types

**What:** Implementing fields solely because a mirror or search snippet shows `role`, `subject_type`, `video_url`, or similar names.
**Why bad:** The official page body was not extractable in this research pass, and third-party sources may be proxy-specific or stale.
**Instead:** Mark exact API fields as verification tasks, then encode confirmed names in constants/types after live official-doc or API validation.

### Anti-Pattern 4: Echoing Binary References Into Output JSON

**What:** Returning base64 input references in `requestSummary.rawInput` or similar output fields.
**Why bad:** Bloats execution records, leaks user media, and makes downstream item data hard to inspect.
**Instead:** Return counts, media types, roles, source kinds, byte sizes, and the raw provider response only.

## Integration Points

| Integration Point | Recommendation | Confidence |
|-------------------|----------------|------------|
| n8n operation surface | Extend video create parameters inside `create.operation.ts`; do not add a new node. | HIGH |
| Model selection | Keep `doubao-seedance-2-0-260128` and `doubao-seedance-2-0-fast-260128`, but verify model capability matrix against official docs before adding media-specific UI rules. | MEDIUM |
| Reference input UX | Use a fixed collection with URL/binary entries and media type/role fields; reuse Seedream URL/binary normalization patterns. | HIGH |
| Payload mapper | Add ordered multimodal content construction behind `buildCreatePayload()`. | HIGH |
| Validation | Expand `validateCreateInput()` with media constraints once official limits are verified. | MEDIUM |
| Transport | Reuse `seedanceApiRequest()` and endpoint helpers. | HIGH |
| Get/list/delete/wait/download | Preserve current behavior unless official response path/fields require additive mapper updates. | HIGH |
| Tests | Add mapper and execute-level tests importing from `dist/` after build. | HIGH |

## Suggested Build Order

1. **Official field verification spike**
   - Use the live official Volcengine docs or API console to capture exact create-task fields for image/video/audio references, media roles, supported mime types, max file sizes, max counts, status names, and task ID query style.
   - Output should be a small implementation note before code changes.

2. **Types and constants**
   - Add reference source/type/role types in `types.ts`.
   - Add confirmed mime/count/size/model-capability constants in `constants.ts`.
   - This unblocks validators, descriptions, and mapper tests.

3. **Reference normalizer and validator**
   - Add `videoReferences.ts`.
   - Extend `validateCreateInput()` to validate references and existing scalar options in one place.
   - Add pure tests first because these rules are easiest to regress.

4. **Payload mapper**
   - Extend `SeedanceCreateInput` and `buildCreatePayload()`.
   - Preserve first/last-frame compatibility by translating existing create modes into the same normalized reference model internally.
   - Add request-summary fields that report reference metadata only.

5. **n8n UI and execute branch**
   - Extend `create.operation.ts` with multimodal reference controls.
   - Update `Seedance.node.ts` create branch to collect references and binary data.
   - Keep get/list/delete branches untouched except endpoint verification fixes.

6. **Execute-level regression tests**
   - Add tests for URL references, binary image reference, mixed media references if official docs confirm support, and continue-on-fail validation behavior.
   - Add a lifecycle compatibility regression showing multimodal create returns a task ID consumed by existing get/wait/download code.

7. **Documentation and retention wording**
   - Update README/user docs after implementation.
   - Keep 7-day task history and 24-hour asset URL warnings visible in task outputs.

## Scalability Considerations

| Concern | At 100 executions/day | At 10K executions/day | At 1M executions/day |
|---------|-----------------------|-----------------------|----------------------|
| Payload size | Inline binary data is acceptable but should not be echoed in JSON. | Prefer URL references or upstream object storage for large video/audio. | Require durable object storage and pass URLs only. |
| Polling | Existing polling is enough. | Users should tune wait timeout and avoid aggressive concurrent polling. | Prefer external orchestration/webhooks if Volcengine supports callback flow. |
| Execution data volume | Request summaries can include reference metadata. | Avoid storing raw provider responses if they grow large, except current `raw` compatibility. | Consider opt-in raw response retention. |
| Endpoint drift | Manual verification is fine. | Add endpoint-shape regression tests. | Consider contract tests against a mocked official OpenAPI snapshot if available. |

## Research Flags

| Topic | Flag | Why It Matters |
|-------|------|----------------|
| Exact multimodal content fields | Needs live official-doc/API verification | The official page body was not extractable; third-party examples are not authoritative. |
| Query/delete path style | Needs verification | Current code uses `GET /tasks` with `qs.id` and `DELETE /tasks/{id}`; official nav confirms lifecycle pages but not exact paths. |
| Status vocabulary | Needs verification | Current mapper supports `queued`, `running`, `cancelled`, `succeeded`, `failed`, `expired`; external snippets sometimes show `pending`. |
| Media upload strategy | Needs verification | It is not confirmed whether official Seedance 2.0 accepts data URLs/base64 for video/audio references or requires URL-accessible media. |
| Callback/webhook support | Not verified | If official docs support callbacks, roadmap may add it later; v1.3 should not block on it. |

## Sources

- Official Volcengine create task page: https://www.volcengine.com/docs/82379/1520757?lang=zh
- Official Volcengine query task page: https://www.volcengine.com/docs/82379/1521309?lang=zh
- Official Volcengine list tasks page: https://www.volcengine.com/docs/82379/1521675?lang=zh
- Official Volcengine cancel/delete page: https://www.volcengine.com/docs/82379/1521720?lang=zh
- Official Volcengine Base URL/auth page: https://www.volcengine.com/docs/82379/1298459?lang=zh
- Local project context: `.planning/PROJECT.md`
- Local codebase architecture: `.planning/codebase/ARCHITECTURE.md`
- Local codebase structure: `.planning/codebase/STRUCTURE.md`
- Local testing map: `.planning/codebase/TESTING.md`
