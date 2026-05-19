# Phase 16: Seedance 2.0 参数与本地校验 - Context

**Gathered:** 2026-05-19T08:20:00Z
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes Seedance 2.0 create requests fail early when the node can determine they violate the official local contract. It covers locally knowable media validation, model-specific generation parameter validation, and making existing generation options travel as official request body fields instead of weak prompt suffixes.

This phase does not add new create modes, does not change the shipped task lifecycle, does not add video binary upload, does not manage Volcengine assets, and does not implement user documentation or manual UAT. Compatibility is handled in Phase 17 and user-facing docs/UAT are handled in Phase 18.

</domain>

<decisions>
## Implementation Decisions

### 本地校验边界
- **D-01:** Use deterministic local validation only. Binary sources can be validated from n8n-provided metadata and buffers; URL and `asset://` sources must not be rejected based on file suffix, guessed format, protocol heuristics, remote reachability, or remote metadata.
- **D-02:** For URL and asset sources, Phase 16 validates only locally known facts: non-empty value, already-decided reference count limits, audio-only/multimodal combination rules, and generation parameter constraints.
- **D-03:** Do not perform `HEAD`, download, remote probing, or metadata extraction for URL/asset media. Remote size, resolution, duration, FPS, codec, and container validity are left to the Volcengine API response.
- **D-04:** Record the remote-media limitation clearly in planning artifacts so implementation agents do not introduce network probing or signed-URL-breaking checks.

### Binary 媒体校验
- **D-05:** Binary media validation should cover MIME type and byte size only.
- **D-06:** Image binary references should enforce official image MIME/format allowlists from the local MIME type and the official single-image size limit where the buffer size is available.
- **D-07:** Audio binary references should enforce official audio MIME/format allowlists from the local MIME type and the official single-audio size limit where the buffer size is available.
- **D-08:** Total request-size validation should be applied only where it can be computed from local binary/data payload values. Do not estimate remote URL or asset sizes.
- **D-09:** Do not add image dimension parsing, audio duration parsing, video duration/FPS/codec parsing, or new media metadata dependencies in Phase 16.
- **D-10:** Video binary direct upload remains unsupported. No Phase 16 plan should add a video binary branch.

### 错误体验
- **D-11:** Keep the current validator style: fail fast on the first detected error with a clear Chinese user-facing message.
- **D-12:** Do not refactor validators into a multi-error accumulator in this phase. Tests should assert first-error behavior rather than aggregated error lists.

### 1080p 与模型规则
- **D-13:** Standard Seedance 2.0 (`doubao-seedance-2-0-260128`) should expose and allow `1080p`.
- **D-14:** Seedance 2.0 Fast (`doubao-seedance-2-0-fast-260128`) should not show `1080p` in the UI when the model selection is Fast.
- **D-15:** The validator must still defensively reject Fast + `1080p` even if a workflow or older saved parameter set sends that combination.
- **D-16:** Existing `480p` and `720p` behavior should remain available for both supported models.

### 官方 body 参数
- **D-17:** Phase 16 should only strengthen parameters already in the active v1.3 scope: `duration`, `ratio`, `resolution`, `seed`, `execution_expires_after`, `watermark`, `generate_audio`, and `return_last_frame`.
- **D-18:** These options must be sent as official request body fields. Do not rely on appending weakly validated suffix parameters to prompt text.
- **D-19:** `camera_fixed` must not be shown or sent for Seedance 2.0 paths.
- **D-20:** Do not add `tools.web_search` or `safety_identifier` in Phase 16. They are official optional fields but would introduce new capability/governance design beyond this phase's validation scope.

### the agent's Discretion
- Planner/researcher may choose helper names, module boundaries, and exact constant placement.
- The agent may choose whether to keep validation in `validators/create.ts` or split local media constants into a small helper module, as long as the deterministic validation boundary and first-error behavior stay intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/ROADMAP.md` — Phase 16 goal, success criteria, dependencies, and requirement IDs.
- `.planning/REQUIREMENTS.md` — v1.3 requirements, especially `VAL-01` through `VAL-06` and `PAY-03`.
- `.planning/PROJECT.md` — project-level constraints: keep one Seedance node, reuse credentials, keep v1.3 additive, defer unrelated cleanup.
- `.planning/STATE.md` — current milestone state and Phase 16 position.
- `.planning/phases/14-multimodal-reference-form/14-CONTEXT.md` — locked UI field names and reference source options.
- `.planning/phases/15-payload/15-CONTEXT.md` — locked multimodal source normalization, payload roles, and request summary behavior.
- `.planning/phases/15-payload/15-VERIFICATION.md` — confirms Phase 15 payload and source behavior that Phase 16 must preserve.

### Official API Contract
- `APIdocs/seedance2.0文档.md` — authoritative local Seedance 2.0 contract for media limits, model options, body parameters, `generate_audio`, `execution_expires_after`, `resolution`, `ratio`, `duration`, `seed`, `watermark`, and `camera_fixed` unsupported status.

### Existing Code
- `nodes/Seedance/description/create.operation.ts` — current model, resolution, ratio, duration, generate-audio, advanced-options, and reference-material UI fields.
- `nodes/Seedance/Seedance.node.ts` — runtime parameter collection, image/audio binary conversion, create request construction, and existing binary helper patterns.
- `nodes/Seedance/shared/validators/create.ts` — current create input contract and first-error validation surface.
- `nodes/Seedance/shared/mappers/createPayload.ts` — official body payload construction and request summary mapping.
- `nodes/Seedance/shared/constants.ts` — shared constants location if Phase 16 introduces model/media limit constants.
- `test/createPayload.test.ts` — focused payload and validation tests.
- `test/seedanceVideoRegression.test.ts` — execute-level HTTP body and multimodal regression tests.

### Codebase Maps
- `.planning/codebase/STACK.md` — build/test runtime expectations and Node/n8n toolchain.
- `.planning/codebase/INTEGRATIONS.md` — Volcengine Ark API integration and endpoint behavior.
- `.planning/codebase/ARCHITECTURE.md` — node, description, mapper, validator, and test layering rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `nodes/Seedance/shared/validators/create.ts` already validates model, create-mode requirements, reference counts, resolution, ratio, duration, execution timeout, and seed. Phase 16 should extend this rather than inventing a second validation path.
- `nodes/Seedance/Seedance.node.ts` already reads n8n binary buffers and MIME types for first-frame images and Phase 15 image/audio references. It can pass enough local metadata for MIME and size validation without adding remote fetches.
- `nodes/Seedance/shared/mappers/createPayload.ts` already sends `resolution`, `ratio`, `duration`, `seed`, `watermark`, `execution_expires_after`, `return_last_frame`, and `generate_audio` as body fields when present.

### Established Patterns
- UI schema stays in `nodes/Seedance/description/*.operation.ts`; runtime behavior stays in `Seedance.node.ts` and shared validators/mappers.
- User-facing validation errors are concise Chinese `Error` or `NodeOperationError` messages.
- Tests import compiled `dist` modules, so Phase 16 plans must run `npm run build` before `node --test`.
- Existing validators throw on the first invalid condition; Phase 16 should preserve that behavior.

### Integration Points
- Add `1080p` to the standard model resolution UI path while hiding it for Fast through `displayOptions` or equivalent n8n description structure.
- Add defensive validator coverage for Fast + `1080p`.
- Extend binary reference input shape or runtime collection so validators can see MIME type and byte length for image/audio binary references.
- Add official media constants for image MIME/size and audio MIME/size. Do not add URL/asset extension checks or network probes.
- Add tests for body-field preservation, `camera_fixed` absence, Fast + `1080p` rejection, standard model `1080p` acceptance, binary MIME/size rejection, and remote URL/asset non-probing behavior.

</code_context>

<specifics>
## Specific Ideas

- Prefer exact defensive tests over broad refactors: standard Seedance 2.0 + `1080p` passes; Fast + `1080p` fails with a Chinese error.
- URL values such as signed CDN links without file extensions should remain valid if non-empty.
- Asset values should not be parsed for file type; asset validity belongs to Volcengine.
- `web_search` and `safety_identifier` were intentionally not folded into Phase 16 even though the official doc lists them.

</specifics>

<deferred>
## Deferred Ideas

- `tools.web_search` for Seedance 2.0 video generation — future capability phase if desired.
- `safety_identifier` — future governance/privacy design phase if needed.
- Remote URL/asset metadata probing — intentionally deferred because it risks signed URL breakage, privacy concerns, latency, and false rejects.

</deferred>

---

*Phase: 16-Seedance 2.0 参数与本地校验*
*Context gathered: 2026-05-19T08:20:00Z*
