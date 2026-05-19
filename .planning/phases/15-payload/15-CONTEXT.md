# Phase 15: 参考媒体来源与官方 payload - Context

**Gathered:** 2026-05-19T15:06:17.2030595+08:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase connects the Phase 14 multimodal reference form to the official Seedance 2.0 create-task payload. It normalizes user-provided image, video, audio, and Volcengine asset sources into official `content` entries, enforces the payload-level multimodal combination and count rules needed for this phase, and expands `requestSummary` so users can safely inspect the mapped reference order, roles, and source kinds.

This phase does not own full media format, dimension, duration, FPS, codec, request-size, model-option, or generation-parameter validation; those belong to Phase 16. It also does not change shipped non-multimodal create modes or task lifecycle behavior; compatibility is handled in Phase 17.

</domain>

<decisions>
## Implementation Decisions

### content 顺序
- **D-01:** In multimodal mode, include the prompt `text` content item first whenever the prompt is non-empty.
- **D-02:** Append reference media after the prompt in the exact order the user configured items in the `参考素材` list.
- **D-03:** Do not regroup mixed images, videos, and audio by media type. User order is the payload order.
- **D-04:** If a reference item exists in the list but its required source value is empty or incomplete, fail with a clear user-facing error. Do not silently skip empty items because that would make the payload order differ from the configured order.

### 素材来源归一化
- **D-05:** For `火山方舟素材库` sources, use tolerant asset normalization: trim whitespace, preserve values already starting with `asset://`, and convert bare IDs to `asset://<ID>`. Empty normalized values are errors.
- **D-06:** For `URL链接` sources, trim whitespace and require a non-empty value. Do not validate URL protocol or reachability in Phase 15.
- **D-07:** For image/audio `Binary文件` sources, read the n8n binary property and emit official data URLs in the form `data:<mime>;base64,<base64>`.
- **D-08:** Binary sources must have an n8n MIME type. Missing MIME is an error; do not guess defaults such as `image/png` or `audio/wav`.
- **D-09:** Phase 15 only requires MIME presence for binary conversion. Image/audio MIME allowlists and other format checks belong to Phase 16.
- **D-10:** Video binary direct upload remains unsupported. Video references may use URL or `asset://` sources only.

### 多模态组合边界
- **D-11:** Audio-only multimodal requests are rejected in Phase 15. If any audio reference is present, at least one image or video reference must also be present.
- **D-12:** Multimodal mode must include at least one reference image or reference video. A prompt-only request should use the existing 文生视频 mode instead.
- **D-13:** Enforce Phase 15 count limits while building payload: 0-9 reference images, 0-3 reference videos, and 0-3 reference audio files.
- **D-14:** Allow image-only multimodal requests and video-only multimodal requests. Prompt text remains optional when at least one image or video reference exists.
- **D-15:** Detailed media constraints such as file format, size, duration, resolution, FPS, codec, and total request size belong to Phase 16.

### requestSummary 形状
- **D-16:** Keep the existing aggregate summary fields for multimodal requests, including `referenceCount`, `referenceTypes`, and `referenceSources`.
- **D-17:** Keep the existing `prompt` field in `requestSummary`; do not replace it with `promptPresent` in this phase.
- **D-18:** Add a per-reference safe summary array that exposes item order and mapping without raw media values.
- **D-19:** Each per-reference summary item contains `index`, `type`, `role`, and `source`.
- **D-20:** The per-reference summary must not include raw URL values, Base64/data URL content, binary property names, bare asset IDs, or `asset://` values.

### the agent's Discretion
- No user-facing behavior was left to the agent's discretion. Planner/researcher may choose exact TypeScript helper names and module boundaries as long as the decisions above are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/ROADMAP.md` — Phase 15 goal, success criteria, and phase boundary.
- `.planning/REQUIREMENTS.md` — v1.3 requirements, especially `REF-01` through `REF-05`, `SRC-01` through `SRC-05`, `PAY-01`, and `PAY-04`.
- `.planning/PROJECT.md` — project-level decisions: keep one Seedance node, reuse credentials, keep v1.3 additive, use local official Seedance 2.0 docs.
- `.planning/STATE.md` — current milestone state and active phase.
- `.planning/phases/14-multimodal-reference-form/14-CONTEXT.md` — locked Phase 14 form names, source options, and user-facing boundaries that Phase 15 must consume.

### Official API Contract
- `APIdocs/seedance2.0文档.md` — authoritative Seedance 2.0 create-task contract for multimodal `content` items, supported source formats, `reference_image` / `reference_video` / `reference_audio` roles, `asset://` URI behavior, audio-only restriction, and multimodal/reference-frame mutual exclusion.

### Existing Code
- `nodes/Seedance/description/create.operation.ts` — existing multimodal form fields and display options created in Phase 14.
- `nodes/Seedance/Seedance.node.ts` — runtime parameter collection, existing binary image handling, and current `referenceMaterials` collection path.
- `nodes/Seedance/shared/validators/create.ts` — create input contract and current validation surface for create modes and reference material inputs.
- `nodes/Seedance/shared/mappers/createPayload.ts` — current create payload builder and request summary mapper that Phase 15 extends.
- `test/createPayload.test.ts` — existing payload and request summary regression tests, including Phase 14 temporary assertions that references are not sent yet.
- `test/seedanceVideoRegression.test.ts` — execute-level regression coverage for multimodal create behavior and old video-mode boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `nodes/Seedance/Seedance.node.ts` already collects `referenceMaterials` from the `fixedCollection`; Phase 15 should extend this path so image/audio binary values are read into data URLs and asset/URL values are normalized before mapper use.
- `processBinaryImage()` in `nodes/Seedance/Seedance.node.ts` is a useful reference for n8n binary reads and data URL construction, but Phase 15 should avoid inheriting its image-specific size/format validation because those constraints belong to Phase 16.
- `nodes/Seedance/shared/mappers/createPayload.ts` already builds `text`, `first_frame`, and `last_frame` `content` items and owns `requestSummary`; extend this mapper rather than constructing payload fragments in description files.

### Established Patterns
- UI schema stays in `nodes/Seedance/description/*.operation.ts`; runtime behavior belongs in `Seedance.node.ts` and shared validators/mappers.
- User-facing validation errors are Chinese plain `Error` or `NodeOperationError` messages.
- Tests import compiled `dist` modules, so implementation plans should include build-before-test steps.
- Existing non-multimodal video modes must continue using the current first/last-frame roles; multimodal references must use `reference_*` roles only.

### Integration Points
- Extend `SeedanceReferenceMaterialInput` or add a normalized reference type in `nodes/Seedance/shared/validators/create.ts`.
- Add source normalization helpers for URL, asset, and binary-derived data URLs.
- Extend `buildCreatePayload()` to emit `image_url`, `video_url`, and `audio_url` official content items with the correct `reference_*` roles.
- Extend `buildCreateRequestSummary()` to keep aggregate fields and add per-reference safe summaries.
- Update tests that currently assert multimodal references are not sent; those assertions were intentionally temporary before Phase 15.

</code_context>

<specifics>
## Specific Ideas

- The per-reference summary shape should be safe and compact, for example: `{ index: 1, type: "image", role: "reference_image", source: "url" }`.
- The official content item types are inferred from media type: image -> `image_url`, video -> `video_url`, audio -> `audio_url`.
- The summary does not need a separate `contentType` field because `type`, `role`, and `source` were judged sufficient for user inspection.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-参考媒体来源与官方 payload*
*Context gathered: 2026-05-19T15:06:17.2030595+08:00*
