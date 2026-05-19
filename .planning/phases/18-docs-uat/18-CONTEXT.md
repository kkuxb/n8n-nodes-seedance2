# Phase 18: 用户文档与手工验收 - Context

**Gathered:** 2026-05-19T21:25:00+08:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase closes the v1.3 user-facing loop for Seedance 2.0 multimodal reference video generation. It updates user documentation so a n8n user can understand how to configure multimodal reference images, videos, audio, and Volcengine asset IDs, understand the official limitations, and then follow a documented create -> get/wait -> download verification flow.

This phase does not add new runtime capabilities, change node parameters, alter payload mapping, relax validation, or rebuild shipped video/image lifecycle behavior. It may only update user-facing docs and planning/UAT artifacts unless planning discovers a documentation-blocking mismatch in the implemented behavior.

</domain>

<decisions>
## Implementation Decisions

### 文档结构
- **D-01:** The agent owns documentation structure decisions. The user does not need to approve technical/doc-organization details.
- **D-02:** Prefer updating `README.md` as the primary user-facing documentation surface because it is the existing package usage document.
- **D-03:** Keep the documentation practical and workflow-oriented: explain what to select in n8n, what each reference source means, which combinations are allowed, and what result fields to inspect.
- **D-04:** Documentation must explicitly cover the v1.3 official limitations required by `DOC-02`: multimodal/reference-frame mutual exclusion, audio cannot be used alone, video binary direct upload is not supported, and direct real-person face uploads are restricted.
- **D-05:** Documentation should preserve the existing non-technical Chinese style in `README.md` and avoid exposing raw implementation internals unless they help users configure the node.

### 手工验收方式
- **D-06:** Manual UAT should use a real Volcengine API call rather than a mocked/local-only check.
- **D-07:** The UAT input combination should be the minimal reliable multimodal path: one reference image plus a prompt.
- **D-08:** The UAT flow must cover the full user journey: create a multimodal task, then verify get/wait, then verify download.
- **D-09:** Record the actual UAT result in Phase 18 planning artifacts, not in `README.md`.
- **D-10:** If valid credentials, API quota, or a suitable public/allowed reference image are unavailable during execution, do not mark UAT as passed through mocks. Record the blocker clearly and ask for the missing functional input.

### 验收记录内容
- **D-11:** The UAT record should identify the tested mode, model, reference combination, prompt shape, task lifecycle path, and whether `binary.video` was produced after download.
- **D-12:** The UAT record should avoid storing secrets, API keys, private signed URLs, raw Base64 media, or sensitive media contents.
- **D-13:** The UAT record should capture any remaining limitations or external API constraints observed during the real run.

### the agent's Discretion
- The user explicitly delegated technical decisions to the agent. Ask the user only for functional/product-facing choices.
- The agent may decide the exact README section order, wording, examples, UAT file name, UAT checklist format, commands to run, and whether to add small supporting docs under `.planning/phases/18-docs-uat/`.
- The agent may decide whether Phase 18 needs one plan or multiple plans. A conservative split is documentation first, then real UAT recording.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/ROADMAP.md` — Phase 18 goal, success criteria, dependencies, and requirement IDs.
- `.planning/REQUIREMENTS.md` — v1.3 requirements, especially `DOC-01`, `DOC-02`, and `DOC-03`.
- `.planning/PROJECT.md` — project-level constraints: one `Seedance` node, shared credentials, additive v1.3 scope, lifecycle stability, and non-technical user preference.
- `.planning/STATE.md` — current milestone state and Phase 18 position.

### Prior Phase Decisions
- `.planning/phases/14-multimodal-reference-form/14-CONTEXT.md` — locked UI field names, mode names, and user-facing warnings for multimodal references.
- `.planning/phases/15-payload/15-CONTEXT.md` — locked source normalization behavior, allowed media source types, content roles, and safe request summary shape.
- `.planning/phases/16-seedance-2-0/16-CONTEXT.md` — locked local validation boundaries, official limits, and body-parameter behavior that docs must describe accurately.
- `.planning/phases/17-lifecycle/17-CONTEXT.md` — locked compatibility and lifecycle behavior that Phase 18 should document and manually verify.
- `.planning/phases/17-lifecycle/17-VERIFICATION.md` — confirms shipped create/lifecycle/image compatibility after v1.3 additions.

### Official API Contract
- `APIdocs/seedance2.0文档.md` — authoritative local Seedance 2.0 contract for multimodal combinations, reference roles, asset URI behavior, media limits, real-person restrictions, generation options, async task flow, and retention behavior.

### User Documentation
- `README.md` — existing user-facing Chinese package documentation and the primary docs file to update.
- `docs/plans/2026-05-19-node24-n8n2-dev-runtime-design.md` — local dev/runtime note if manual verification needs the existing n8n dev setup.

### Existing Code
- `nodes/Seedance/description/create.operation.ts` — actual n8n field labels and options for video create documentation.
- `nodes/Seedance/description/get.operation.ts` — actual get/wait/download field labels and options for lifecycle documentation.
- `nodes/Seedance/Seedance.node.ts` — runtime create/get/wait/download behavior that UAT exercises.
- `nodes/Seedance/shared/mappers/createPayload.ts` — request summary fields users can inspect after create.
- `nodes/Seedance/shared/mappers/task.ts` — task output fields users can inspect after get/wait.
- `nodes/Seedance/shared/transport/request.ts` — video download behavior and binary attachment path.

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — documentation and code style conventions.
- `.planning/codebase/STRUCTURE.md` — existing README/docs locations and project layout.
- `.planning/codebase/TESTING.md` — build/test commands and existing fake execution patterns if Phase 18 needs supporting automated checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` already has Chinese, user-facing sections for installation, credentials, video generation, query/wait/download, image generation, workflow examples, outputs, failures, and platform limits.
- The existing README video create section currently documents only `文生视频`, `首帧图生视频`, and `首尾帧图生视频`, so the multimodal create path should be added there rather than creating a disconnected doc surface.
- Existing tests already verify the implemented multimodal payload, validation, lifecycle compatibility, and download behavior. Phase 18 should not duplicate all tests as manual UAT.

### Established Patterns
- User-facing docs explain n8n field selections step by step and avoid implementation internals.
- Existing docs use concise Chinese headings and numbered operation steps.
- Planning artifacts under `.planning/phases/<phase>/` are appropriate for actual UAT records and validation notes.

### Integration Points
- Documentation should align with actual labels/options from `nodes/Seedance/description/create.operation.ts` and `nodes/Seedance/description/get.operation.ts`.
- UAT should exercise the installed/dev n8n node path or an equivalent documented user path, then record the real task ID/result status without secrets.
- If a live n8n UI run is not practical in the execution environment, planning may define the closest acceptable manual protocol, but it must still be a real Volcengine create/get/wait/download API flow before `DOC-03` is marked complete.

</code_context>

<specifics>
## Specific Ideas

- Manual UAT is locked to: real API call, one reference image plus prompt, create -> get/wait -> download, actual result recorded only in Phase 18 artifacts.
- README should add a concrete multimodal example that a non-technical n8n user can follow without reading official API JSON.
- UAT should record enough evidence to prove the full flow worked, but not raw media payloads or credentials.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-用户文档与手工验收*
*Context gathered: 2026-05-19T21:25:00+08:00*
