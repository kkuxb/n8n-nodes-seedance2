# Roadmap: n8n-nodes-seedance2

## Milestones

- ✅ **v1.0 milestone** — Phases 1-3 (shipped 2026-04-17)
- ✅ **v1.1 milestone** — Phases 04-07 (shipped 2026-04-19; archived in [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md))
- 🔄 **v1.2 milestone** — Phases 08-12 Seedream 5.0 lite image generation and UX iteration (planning)

## Phases

<details>
<summary>✅ v1.0 milestone (Phases 1-3) — SHIPPED 2026-04-17</summary>

- [x] Phase 1: 凭证接入与文生查询闭环 (4/4 plans) — completed 2026-04-16
- [x] Phase 2: 图生创建模式与参数护栏 (3/3 plans) — completed 2026-04-17
- [x] Phase 3: 任务检索与生命周期控制 (3/3 plans) — completed 2026-04-17

</details>

- ✅ **v1.1 milestone** — Bug fixes, smart polling, auto-download, and non-icon release hardening (shipped 2026-04-19; see [archive](milestones/v1.1-ROADMAP.md))

## Phase Details

### Phase 04: Bug Fixes & List Optimization

**Goal**: Existing query, list, and delete operations function correctly and output optimized structures
**Depends on**: Phase 3
**Requirements**: BUG-01, BUG-02, OPT-01
**Success Criteria** (what must be TRUE):

1. User querying a specific task ID receives exactly one item, not the full list.
2. User deleting/canceling a task by ID succeeds without invalid action errors.
3. User retrieving task lists receives a single n8n Item with an array of tasks.
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md — Fix get/list/delete response shaping, delete error semantics, and user-facing list contract docs

### Phase 05: Smart Polling Orchestration

**Goal**: Users can opt to wait for a task to complete directly within the Get Task operation
**Depends on**: Phase 04
**Requirements**: POLL-01, POLL-02, POLL-03
**Success Criteria** (what must be TRUE):

1. User can toggle "Wait For Completion" and set polling settings in the Get Task UI.
2. Node execution waits and correctly outputs the finalized task state instead of the immediate state.
3. Node execution finishes successfully without hanging indefinitely if the timeout duration is reached.
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Build the bounded polling helper, additive wait metadata contract, and regression tests for terminal, timeout, and unknown-status exits
- [x] 05-02-PLAN.md — Add Get Task wait-mode UI fields and wire the execute branch for default-on bounded waiting without breaking immediate get behavior
**UI hint**: yes

### Phase 06: Auto-Downloading & Error Handling

**Goal**: Users can automatically download finished videos into n8n binary format
**Depends on**: Phase 05
**Requirements**: DL-01, DL-02, DL-03
**Success Criteria** (what must be TRUE):

1. User can toggle "Download Video" when "Wait For Completion" is enabled.
2. Node execution returns a binary item containing the video file when the task succeeds.
3. Node execution fails with a clear expiration message if the video is older than 24 hours.
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md - Build the shared video-download helper, binary-ready payload shaping, and expiry-friendly error normalization with focused tests
- [x] 06-02-PLAN.md - Add Get Task download UI and wire the wait-success execute path to return `binary.video` or fail loudly on download errors
**UI hint**: yes

### Phase 07: Non-Icon Lint Closure & Release Hardening

**Goal**: Close the remaining actionable non-icon lint and release-hardening gaps without changing the accepted PNG branding decision
**Depends on**: Phase 06
**Requirements**: GAP-07-01, GAP-07-02, GAP-07-03
**Success Criteria** (what must be TRUE):

1. `nodes/Seedance/description/get.operation.ts` no longer fails the boolean description wording rule.
2. `nodes/Seedance/shared/polling/getTaskPolling.ts` no longer relies on the restricted `node:timers/promises` import.
3. `npm run build` passes and targeted regression tests covering polling/get behavior stay green.
4. Non-icon lint blockers identified in `.planning/milestones/v1.1-AUDIT.md` are closed, while PNG icon lint failures remain explicitly accepted technical debt and are not misrepresented as fixed.
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md - Fix the Get Task boolean description wording, replace the restricted polling delay import with a repo-safe alternative, and verify build plus targeted tests while keeping PNG icon lint debt explicit

### Phase 08: Seedream Image Operation Contract & UX Skeleton

**Goal**: Lock the image-generation API contract and add a safe operation/UI skeleton inside the existing Seedance node design
**Depends on**: Phase 07
**Requirements**: IMG-01, IMG-02, UX-IMG-01, UX-IMG-02, UX-IMG-04, IMG-10
**Success Criteria** (what must be TRUE):

1. The roadmap and requirements align on a single new image-generation operation inside the existing node.
2. The implementation plan clearly preserves existing video operation contracts.
3. The UI/property structure for prompt, reference-image inputs, sequential generation, and advanced options is defined without exposing streaming.
**Plans**: 1 plan

Plans:
- [x] 08-01-PLAN.md - Define the additive image-generation operation contract, displayOptions layout, and compatibility guardrails for existing video operations

### Phase 09: Image Payload Builder, Input Normalization & Validation

**Goal**: Build the request-shaping and validation layer for Seedream 5.0 lite image generation
**Depends on**: Phase 08
**Requirements**: IMG-03, IMG-04, IMG-05, IMG-06, IMG-07, VAL-IMG-01, VAL-IMG-02, VAL-IMG-03
**Success Criteria** (what must be TRUE):

1. Prompt-only, single-reference, and multi-reference inputs all map into the official image API payload correctly.
2. URL, base64, and binary image sources are normalized into a stable request format.
3. Invalid image count, MIME type, size, and size/max_images combinations fail locally with clear errors before the API call.
**Plans**: 2 plans

Plans:
- [x] 09-01-PLAN.md - Implement Seedream payload builder and normalize URL/base64/binary reference-image inputs into official `image` request shapes
- [x] 09-02-PLAN.md - Add runtime validators for reference-image limits, size rules, sequential generation constraints, and Seedream size parsing

### Phase 10: Image Execution Path, Binary Output & Partial-Failure Mapping

**Goal**: Execute image generation requests and return stable n8n binary output for single-image and group-image scenarios
**Depends on**: Phase 09
**Requirements**: IMG-08, IMG-09, VAL-IMG-04, UX-IMG-03, IMG-10
**Success Criteria** (what must be TRUE):

1. Single-image requests return a binary image output by default.
2. Group-image requests return a stable, documented n8n output contract with per-image metadata and errors.
3. Response usage, tool usage, and per-image failures are preserved in JSON output without breaking downstream handling.
4. Existing video operations remain behaviorally unchanged.
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md - Lock the shared Seedream response-mapping and binary-output contract, including partial-failure and all-failed semantics
- [x] 10-02-PLAN.md - Wire the live generateImage execute branch to Phase 09 helpers and preserve single-item binary output plus video non-regression

### Phase 11: Regression Coverage, Documentation & Release Hardening

**Goal**: Verify the new image capability and document the final milestone contract without regressing shipped video behavior
**Depends on**: Phase 10
**Requirements**: IMG-10, UX-IMG-03, UX-IMG-04
**Success Criteria** (what must be TRUE):

1. Focused tests cover image payload mapping, validation, binary output shaping, and key video regressions.
2. User-facing docs explain image capabilities, supported input forms, output behavior, and 24-hour asset constraints.
3. Build and targeted regression verification pass with the accepted PNG icon debt still explicitly tracked.
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md - Add focused tests for image mappers, validators, binary output shaping, and non-regression coverage for existing video operations
- [x] 11-02-PLAN.md - Update docs and perform milestone release-hardening verification while keeping PNG icon debt explicitly accepted

### Phase 12: Image Generation Mode & Operation UX Refactor

**Goal**: Refactor the image-generation UX so users first choose video or image generation mode, then choose mode-specific operations and fields with clearer ordering and reference-image input behavior.
**Depends on**: Phase 11
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, IMG-05, IMG-06, IMG-07, IMG-08, IMG-09, IMG-10, UX-IMG-01, UX-IMG-02, UX-IMG-03, UX-IMG-04, VAL-IMG-01, VAL-IMG-03, VAL-IMG-04
**Success Criteria** (what must be TRUE):

1. Node UI exposes a top-level mode selector with `视频生成` and `图像生成`, while existing video lifecycle operations remain under video mode.
2. Image mode exposes `文生图` and `图生图` operations instead of mixing image generation into the existing operation list.
3. Text-to-image fields appear in the requested order: image model, prompt, prompt optimization toggle, resolution, aspect ratio, group-image toggle, conditional group count, and web search toggle.
4. Image-to-image adds reference image source after the prompt optimization toggle, with URL and binary-data sources accepting comma-separated multiple values where feasible.
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — Refactor the node description into mode-first video/image operation selectors and lock requested image field ordering with contract tests
- [x] 12-02-PLAN.md — Wire the refactored image operations into execution, including comma-separated multi-reference inputs and final image/video regression coverage
**UI hint**: yes

## Progress

| Phase                                 | Milestone | Plans Complete | Status      | Completed  |
| ------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. 凭证接入与文生查询闭环                        | v1.0      | 4/4            | Complete    | 2026-04-16 |
| 2. 图生创建模式与参数护栏                        | v1.0      | 3/3            | Complete    | 2026-04-17 |
| 3. 任务检索与生命周期控制                        | v1.0      | 3/3            | Complete    | 2026-04-17 |
| 04. Bug Fixes & List Optimization     | v1.1      | 1/1 | Complete    | 2026-04-18 |
| 05. Smart Polling Orchestration       | v1.1      | 2/2 | Complete    | 2026-04-18 |
| 06. Auto-Downloading & Error Handling | v1.1      | 2/2 | Complete   | 2026-04-18 |
| 07. Non-Icon Lint Closure & Release Hardening | v1.1 | 1/1 | Complete | 2026-04-19 |
| 08. Seedream Image Operation Contract & UX Skeleton | v1.2 | 1/1 | Complete | 2026-04-19 |
| 09. Image Payload Builder, Input Normalization & Validation | v1.2 | 2/2 | Complete | 2026-04-19 |
| 10. Image Execution Path, Binary Output & Partial-Failure Mapping | v1.2 | 2/2 | Complete | 2026-04-19 |
| 11. Regression Coverage, Documentation & Release Hardening | v1.2 | 2/2 | Complete | 2026-04-19 |
| 12. Image Generation Mode & Operation UX Refactor | v1.2 | 2/2 | Complete   | 2026-04-20 |
