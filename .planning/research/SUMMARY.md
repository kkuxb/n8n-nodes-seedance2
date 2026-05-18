# Project Research Summary

**Project:** n8n-nodes-seedance2
**Domain:** n8n community node for Volcengine Seedance video and Seedream image generation
**Researched:** 2026-05-18
**Confidence:** MEDIUM

## Executive Summary

v1.3 is an additive integration milestone for an existing n8n community node: add Seedance 2.0 multimodal reference video generation while preserving the shipped Seedance video task lifecycle and Seedream image-generation behavior. Expert implementation should treat this as typed API request shaping inside the existing node, not as a new node, new credential, SDK migration, or new lifecycle. The current architecture already has the right boundaries: n8n parameter descriptions, execute-level binary handling, pure validators/mappers, centralized transport, polling, task mapping, and regression tests.

The recommended approach is to keep the current TypeScript + n8n + direct Volcengine Ark REST stack, add internal video-reference types and a normalizer, extend the create payload mapper and validator, then expose n8n-friendly URL/binary/asset reference controls only for verified source types. No new runtime dependency is justified by the research. The first roadmap phase must be official contract verification because the user-requested Volcengine create-task page was checked first but rendered as a JavaScript app shell in this environment, so exact field tables, examples, media roles, and limits could not be fully extracted.

The main risks are provider-contract drift, guessed field names, unsupported human-face uploads, unsupported binary/data URL transport, raw media leakage in workflow output, and regressions to existing create/get/list/delete/wait/download behavior. Mitigate these by capturing live official docs or API sample payloads before implementation, keeping multimodal references as a create-payload concern, using trusted `asset://` references for material workflows where required, redacting request summaries, and adding focused mapper plus execute-level tests.

## Key Findings

### Recommended Stack

Do not add new runtime packages for v1.3. The integration should extend the existing TypeScript and n8n community-node stack with internal types, validators, mappers, UI descriptions, and tests. Direct REST through n8n helpers remains the correct transport because the project already uses Volcengine Ark task endpoints and shared `SeedanceApi` credentials.

The only planned "stack additions" are local code additions: reference input types, a video-reference normalizer, official-payload mapper extensions, validator constants, n8n UI controls, request-summary mapping, and regression tests. Package changes should be avoided unless live official-doc or API verification proves that upload, signing, or media preprocessing is required.

**Core technologies:**
- TypeScript 5.8.3: typed node descriptions, validators, payload builders, and response mappers.
- n8n-workflow ^2.13.1: node contracts, credential access, binary helpers, request options, and `NodeOperationError`.
- Node.js 22.x: current runtime and built-in `node:test` verification path.
- @n8n/node-cli ^0.23.1: existing build and community-node packaging path.
- Volcengine Ark REST API: official Seedance task creation/query/list/delete lifecycle; exact v1.3 payload fields still need live verification.
- Existing `SeedanceApi` credential: shared API key credential for video and image capabilities; no new credential type is expected.

### Expected Features

The table stakes are a verified Seedance 2.0 create path, prompt plus supported reference media inputs, n8n-friendly reference sources, role-aware references, trusted asset support, human-face guardrails, preserved lifecycle operations, standard generation controls, and sanitized request summaries. Feature work must remain additive to the current video create/get/list/delete/wait/download contract.

**Must have (table stakes):**
- Verified Seedance 2.0 model and create-task payload path.
- Prompt plus reference-media input for supported modalities.
- URL, binary, and Volcengine Asset ID/URI source UX, gated by official support.
- Role-aware references such as first frame, last frame, or verified general reference roles.
- Trusted `asset://` support for official material/person workflows.
- Guardrails warning that direct real-person face uploads may be unsupported and should use authorized trusted assets where required.
- Existing async task lifecycle compatibility for create, get, list, delete, wait, and download.
- Sanitized request summary with counts/types/roles, no raw base64 or full media payloads.

**Should have (competitive):**
- Asset ID convenience mode that auto-normalizes bare asset IDs to `asset://...` where appropriate.
- Optional per-reference labels for clearer validation errors and output summaries.
- Compliance-aware UI copy around person/material workflows.
- Last-frame chaining support that keeps returned last-frame output easy to reuse.
- Payload preview as metadata only, not raw media.

**Defer (v2+):**
- Video/audio reference inputs until exact official fields, roles, formats, and limits are verified.
- Advanced raw content JSON import until the schema is stable and documented.
- Asset enrollment or material-library management inside n8n.
- Batch generation, template orchestration, or prompt-assistant features.
- Third-party Seedance providers or non-official API surfaces.

### Architecture Approach

Keep multimodal reference generation inside the existing video `create` operation. The architecture should normalize n8n URL/binary/asset parameters into a stable internal reference model, validate against verified provider constraints, then map to the official Seedance 2.0 request body. Once create returns a task ID, existing lifecycle code should remain unchanged unless live official docs prove a response or endpoint change is required.

**Major components:**
1. `nodes/Seedance/description/create.operation.ts` - add create-mode reference controls under the existing Seedance node.
2. `nodes/Seedance/Seedance.node.ts` - collect scalar parameters and binary inputs at the n8n boundary, then delegate to pure helpers.
3. `nodes/Seedance/shared/mappers/videoReferences.ts` - new normalizer for ordered URL/binary/asset reference records.
4. `nodes/Seedance/shared/types.ts` and `constants.ts` - add reference source/type/role types and verified capability constants.
5. `nodes/Seedance/shared/validators/create.ts` - enforce prompt/reference requirements, model constraints, media source support, count/size/MIME limits, and role compatibility.
6. `nodes/Seedance/shared/mappers/createPayload.ts` - build the official create-task payload while preserving first/last-frame compatibility.
7. `nodes/Seedance/shared/mappers/task.ts`, `polling`, and `transport` - keep existing lifecycle mapping, polling, download, and request helpers unless verification requires additive updates.
8. `test/seedanceVideoMultimodalPayload.test.ts` and `test/seedanceCreateMultimodalExecute.test.ts` - add pure and execute-level regression coverage.

### Critical Pitfalls

1. **Implementing guessed multimodal request fields** - avoid by starting with a live official-doc/API contract spike and treating third-party snippets as non-authoritative.
2. **Collapsing multimodal references into first/last-frame modes** - avoid by adding separate video-reference types and mapping frame roles only when the official schema proves they share a contract.
3. **Accepting unsupported human-face reference uploads** - avoid by using cautious labels, surfacing trusted `asset://` workflows, and not marketing arbitrary face uploads as supported.
4. **Sending data URLs/Base64 where the API expects URLs or assets** - avoid by verifying media transport per source and rejecting unsupported combinations locally.
5. **Breaking shipped video lifecycle or Seedream image behavior** - avoid narrow create-path changes, separate video and Seedream reference helpers, and run existing plus new regression tests.
6. **Leaking prompts, media, credentials, or raw errors** - avoid by redacting raw request/error output and asserting serialized outputs do not include API keys, authorization headers, or base64 media.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Official Contract Verification
**Rationale:** Exact Seedance 2.0 multimodal request fields, media roles, source support, limits, and response shape were not extractable from the JS-rendered official create-task page in this environment.
**Delivers:** A short implementation note with verified model IDs, endpoint shape, request body examples, role names, supported modalities, source transport rules, media limits, task query/delete shape, and response fields.
**Addresses:** Verified Seedance 2.0 create path, model selection, reference schema, media constraints.
**Avoids:** Guessed fields, provider-contract drift, unsupported binary/data URL transport, incorrect role semantics.

### Phase 2: Reference Model, Constants, And Validators
**Rationale:** Types and constraints must be established before UI and execute code, otherwise saved workflows may encode unstable field assumptions.
**Delivers:** Internal reference source/type/role types, confirmed capability constants, validation for prompt/reference requirements, media counts, MIME/size limits, source support, and human/material guardrail errors or warnings.
**Uses:** TypeScript types, existing validator patterns, confirmed official constants.
**Implements:** `types.ts`, `constants.ts`, `validators/create.ts`.
**Avoids:** Collapsing reference roles, copying Seedream or first-frame limits into Seedance 2.0, accepting incomplete reference rows.

### Phase 3: Payload Mapper And Reference Normalizer
**Rationale:** Pure request shaping is the core integration risk and can be tested before n8n UI plumbing.
**Delivers:** `videoReferences.ts`, extended `buildCreatePayload()`, sanitized request-summary metadata, preservation of existing first/last-frame payload behavior, and pure mapper tests.
**Addresses:** Prompt plus supported references, asset URI normalization, source matrix enforcement, no raw media in summaries.
**Avoids:** Data URL/Base64 misuse, reference ordering bugs, raw media output bloat.

### Phase 4: n8n UI And Execute Integration
**Rationale:** Once the internal contract is stable, expose only verified controls in the existing video create operation and keep lifecycle branches untouched.
**Delivers:** n8n fixed-collection reference inputs, URL/binary/asset source controls as verified, optional labels, clear descriptions, binary collection at the node boundary, and execute-level HTTP payload capture tests.
**Addresses:** n8n-friendly UX, role-aware references, binary support where official docs allow it, trusted asset entry.
**Avoids:** New standalone node, unsupported reference-video options, Seedream helper regressions, lifecycle branch churn.

### Phase 5: Lifecycle Compatibility And Output Safety
**Rationale:** v1.3 must not regress v1.2 video lifecycle or image generation, and multimodal media raises the output-leakage risk.
**Delivers:** Regression coverage for create/get/list/delete/wait/download, Seedream image paths, raw output redaction, continue-on-fail errors, and no base64/API-key/media request leakage in serialized outputs.
**Addresses:** Preserved async lifecycle, sanitized output, safe failure behavior.
**Avoids:** Breaking shipped workflows, leaking credentials/prompts/media, assuming every successful task has only one `content.video_url`.

### Phase 6: Documentation And Manual UAT
**Rationale:** Users need to understand verified combinations, asset expiry, trusted material constraints, and async workflow composition.
**Delivers:** README/user documentation updates, examples limited to verified request paths, manual UAT against create/get/wait/download, retention/24-hour URL expiry wording, and explicit unsupported/deferred modes.
**Addresses:** Human-face guardrails, last-frame chaining, create/get split workflows, clear uncertainty boundaries.
**Avoids:** README examples outrunning implementation, confusing labels, manual-only verification gaps.

### Phase Ordering Rationale

- Phase 1 must come first because every later field, UI option, validator, and test depends on the official request contract.
- Phases 2 and 3 isolate stable internal contracts and pure mapping before touching n8n UI and execute control flow.
- Phase 4 adds user-facing controls only after the source/type/role matrix is known.
- Phase 5 protects shipped v1.2 behavior and addresses the higher security/privacy risk created by multimodal media.
- Phase 6 keeps documentation honest by describing only verified behavior and clearly marking deferrals.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Required. Use `$gsd-plan-phase --research-phase 1` or equivalent because the official docs are JS-rendered and exact API contract data remains unresolved.
- **Phase 2:** Required if Phase 1 does not produce a complete source/type/role/limit matrix; validators must not invent limits.
- **Phase 4:** Recommended if binary/video/audio reference support remains ambiguous after Phase 1.
- **Phase 6:** Recommended for human/material workflow wording if official trusted-asset docs need product-specific interpretation.

Phases with standard patterns (skip research-phase):
- **Phase 3:** Mostly standard local mapper/normalizer work after Phase 1 supplies the official schema.
- **Phase 5:** Standard regression, redaction, and lifecycle hardening patterns already exist in the codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Local package and architecture evidence is high-confidence, but exact Volcengine v1.3 upload/media requirements were not extractable from the official create page. |
| Features | MEDIUM | Table stakes are consistent across project goals and official adjacent docs, but exact modalities and field-level support remain low-confidence until live verification. |
| Architecture | MEDIUM | Existing codebase boundaries are well understood and suitable; endpoint shape and response additions need official confirmation. |
| Pitfalls | MEDIUM | Risks are strongly supported by local codebase concerns and provider-doc uncertainty; some human/material workflow details come from adjacent official docs and need applicability checks. |

**Overall confidence:** MEDIUM

### Gaps to Address

- Exact create-task field names: verify against the live official page, Volcengine template REST sample, or a live API request before coding.
- Supported modalities: confirm whether reference image, video, audio, asset URI, and binary/data URL sources are actually supported for the target Seedance 2.0 feature.
- Role semantics and ordering: confirm allowed roles such as first frame, last frame, reference image, and any subject/material roles.
- Media limits: confirm counts, file formats, MIME types, byte sizes, duration, resolution, aspect ratio, and model-specific constraints.
- Transport strategy: confirm whether local binary can be encoded as data URL/Base64 or must be converted to remote URL/provider asset first.
- Task lifecycle endpoint shape: verify query/delete/list paths and status vocabulary against official docs or live API.
- Response mapping: verify whether multimodal tasks return additional artifacts beyond `video_url` and optional last-frame output.
- Raw output policy: decide whether to redact existing `raw` provider/error output as part of v1.3 or guard it behind an explicit debug option.
- Test command gap: add or document a standard test command if regression coverage becomes central to milestone acceptance.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` - v1.3 milestone goal, constraints, shipped v1.2 decisions, and requirement to research official docs first.
- Local codebase context referenced by researchers: `nodes/Seedance/**`, `test/**`, `package.json`, and `.planning/codebase/**` - current stack, boundaries, lifecycle, and regression patterns.

### Official (MEDIUM confidence)
- https://www.volcengine.com/docs/82379/1520757?lang=zh - required official create-video task page; reachable and current, but detailed field content was not fully extractable in this environment because it is JavaScript-rendered.
- https://www.volcengine.com/docs/82379/1521309?lang=zh - official query-task lifecycle page referenced by architecture research.
- https://www.volcengine.com/docs/82379/1521675?lang=zh - official list-tasks lifecycle page referenced by architecture research.
- https://www.volcengine.com/docs/82379/1521720?lang=zh - official cancel/delete lifecycle page referenced by architecture research.
- https://www.volcengine.com/docs/82379/1298459?lang=zh - official Base URL/auth page referenced by architecture research.

### Secondary (MEDIUM confidence)
- https://www.volcengine.com/docs/82379/2223965?lang=zh - official virtual-person/material documentation used for asset and human-face guardrail direction.
- https://www.volcengine.com/docs/82379/2315856?lang=zh - official real-person material enrollment documentation used for trusted-asset workflow direction.
- https://www.volcengine.com/docs/6492/2165104?lang=zh - official LAS Seedance lifecycle/operator reference used directionally for async lifecycle and return-last-frame behavior.
- https://www.volcengine.com/docs/82379/1544136?lang=zh - related official material/avatar page; applicability to the target create-video feature needs live verification.

---
*Research completed: 2026-05-18*
*Ready for roadmap: yes, with Phase 1 official contract verification required*
