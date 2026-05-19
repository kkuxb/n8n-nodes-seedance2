# Phase 17: 既有模式与 lifecycle 兼容性 - Context

**Gathered:** 2026-05-19T20:37:12+08:00
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase protects compatibility after the v1.3 multimodal reference work. It verifies that shipped video create modes, task lifecycle operations, wait/download behavior, and Seedream image generation still behave as expected after the new multimodal helpers and validators were added.

This phase does not add new user-facing capabilities, does not change the API contract, does not redesign existing fields, and does not write user documentation or manual UAT. Phase 18 owns documentation and human validation.

</domain>

<decisions>
## Implementation Decisions

### 旧视频 create 合同
- **D-01:** Treat old create-mode compatibility as an exact HTTP payload contract, not just a user-visible output check.
- **D-02:** Cover all three shipped video create modes at execute level: `t2v`, `i2v_first`, and `i2v_first_last`.
- **D-03:** Execute-level tests must call `Seedance.prototype.execute.call(context)` and capture the create-task HTTP body for each old mode.
- **D-04:** Saved workflow compatibility must be covered. Tests should simulate old workflows that omit new fields, and stale workflows that contain hidden multimodal fields.
- **D-05:** Old create modes must not read `referenceMaterials` and their payloads must not contain `reference_image`, `reference_video`, or `reference_audio`.
- **D-06:** Old first-frame and first/last-frame modes must keep their original `first_frame` and `last_frame` roles.

### lifecycle 回归覆盖深度
- **D-07:** Cover `get`, `list`, and `delete` through execute-level HTTP capture rather than endpoint-only tests.
- **D-08:** `get` with `waitForCompletion=false` must make one GET request using the `id` query parameter and return the existing `mapTaskResponse()` output shape.
- **D-09:** `list` compatibility must lock query parameters and aggregation behavior: `returnAll`, page controls, status/taskIds/model/serviceTier filters, and one output item containing `json.tasks`.
- **D-10:** `delete` compatibility must lock the DELETE path `/api/v3/contents/generations/tasks/{taskId}` and the success envelope fields `success`, `taskId`, `action`, and `message`.
- **D-11:** Do not expand Phase 17 to re-test every delete/list friendly-error branch. Existing mapper tests remain responsible for those error helpers unless planning finds a direct regression gap.

### wait/download 兼容性
- **D-12:** Wait-mode compatibility must cover `succeeded`, `failed`, and timeout outcomes.
- **D-13:** Cover both old video tasks and multimodal-created tasks so the planner proves the common lifecycle path works for both.
- **D-14:** Download behavior is locked by attachment conditions: only download when `downloadVideo=true`, the task status is `succeeded`, and a non-empty `videoUrl` exists.
- **D-15:** When the conditions in D-14 are not met, the node must not call the video download helper and must not attach `binary.video`.
- **D-16:** Prefer extending `test/seedanceDownloadFlow.test.ts` and `test/seedanceGetWaitMode.test.ts` for wait/download coverage so the existing fake execution contexts are reused.

### Seedream 图片路径隔离边界
- **D-17:** Seedream isolation must be verified at execute level with `generationMode='image'`.
- **D-18:** Image-generation execution must not read video-only create parameters such as `operation`, `createMode`, `referenceMaterials`, first-frame fields, or last-frame fields unless an existing saved-workflow fallback explicitly requires a safe read.
- **D-19:** Existing Seedream behaviors that must remain protected include prompt-only generation, image-to-image URL/binary references, grouped image generation, `webSearch`, `optimizePrompt`, watermark, partial failure behavior, and binary image output.
- **D-20:** Do not add or change Seedream user-facing behavior in Phase 17. The goal is isolation and regression coverage only.

### 回归测试组织方式
- **D-21:** Prefer extending existing test files rather than creating a new Phase 17-only test file.
- **D-22:** Put old video create and general video lifecycle compatibility in `test/seedanceVideoRegression.test.ts` unless the file becomes materially harder to read.
- **D-23:** Put wait/download compatibility in `test/seedanceDownloadFlow.test.ts` and `test/seedanceGetWaitMode.test.ts`.
- **D-24:** Put Seedream image isolation coverage in `test/seedanceGenerateImageExecute.test.ts` and keep operation-description assertions in `test/seedreamImageOperationContract.test.ts` if needed.
- **D-25:** Phase 17 verification must run `npm run build && node --test test/*.test.ts`.

### the agent's Discretion
- The user explicitly delegated technical decisions to the agent after selecting the broad gray areas. Going forward, ask the user only for functional/product-facing decisions. The agent may decide testing layer, file organization, fixture shape, helper extraction, and exact assertion strategy as long as Phase 17 requirements and the decisions above are honored.
- Planner/researcher may split Phase 17 into plans by compatibility surface, for example old create modes, lifecycle/wait/download, and Seedream isolation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/ROADMAP.md` — Phase 17 goal, success criteria, dependencies, and requirement IDs.
- `.planning/REQUIREMENTS.md` — v1.3 requirements, especially `MODE-02`, `PAY-02`, and `COMP-01` through `COMP-04`.
- `.planning/PROJECT.md` — project-level constraints: one `Seedance` node, shared credentials, additive v1.3 scope, and Seedance lifecycle stability.
- `.planning/STATE.md` — current milestone state and Phase 17 position.

### Prior Phase Decisions
- `.planning/phases/14-multimodal-reference-form/14-CONTEXT.md` — locked multimodal form names and mode boundaries.
- `.planning/phases/15-payload/15-CONTEXT.md` — locked content ordering, source normalization, roles, and safe request summary shape.
- `.planning/phases/16-seedance-2-0/16-CONTEXT.md` — locked local validation boundary, binary metadata rules, 1080p model behavior, and body-field decisions.
- `.planning/phases/16-seedance-2-0/16-VERIFICATION.md` — confirms Phase 16 validation and body-field behavior that Phase 17 must not regress.

### Existing Code
- `nodes/Seedance/Seedance.node.ts` — runtime dispatcher for video/image modes, create/get/list/delete, wait, download, and binary helpers.
- `nodes/Seedance/shared/mappers/createPayload.ts` — old and multimodal create payload contracts plus request summary shape.
- `nodes/Seedance/shared/mappers/task.ts` — task/list output mapping contract.
- `nodes/Seedance/shared/polling/getTaskPolling.ts` — wait-mode behavior and timeout semantics.
- `nodes/Seedance/shared/transport/request.ts` — shared HTTP request and video download helpers.
- `nodes/Seedance/shared/transport/endpoints.ts` — endpoint paths for create/get/list/delete/image generation.
- `nodes/Seedance/shared/mappers/seedreamImagePayload.ts` — Seedream image request contract.
- `nodes/Seedance/shared/mappers/seedreamImageResult.ts` — Seedream JSON and binary image output contract.

### Tests and Codebase Maps
- `test/createPayload.test.ts` — create payload and summary regression coverage.
- `test/seedanceVideoRegression.test.ts` — video create and multimodal execute-level regression tests.
- `test/seedanceGetWaitMode.test.ts` — get/wait behavior and get description coverage.
- `test/seedanceDownloadFlow.test.ts` — wait + download flow tests.
- `test/seedanceGenerateImageExecute.test.ts` — Seedream execute-level image behavior.
- `test/seedreamImageOperationContract.test.ts` — image-mode operation and description contract tests.
- `.planning/codebase/TESTING.md` — test runner, fake n8n execution context, and build-before-test patterns.
- `.planning/codebase/ARCHITECTURE.md` — node dispatcher, shared mapper/validator/polling/transport layering.
- `.planning/codebase/INTEGRATIONS.md` — Volcengine endpoints, auth, media download, and external API boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createVideoExecutionContext()` in `test/seedanceVideoRegression.test.ts` already captures HTTP calls and parameter reads for video create paths.
- Execution-context fakes in `test/seedanceGetWaitMode.test.ts`, `test/seedanceDownloadFlow.test.ts`, and `test/seedanceGenerateImageExecute.test.ts` already exercise real `Seedance.prototype.execute.call(context)` behavior.
- `buildCreatePayload()`, `mapTaskResponse()`, `pollTaskUntilSettled()`, and `downloadSeedanceVideo()` are already directly testable through compiled `dist` modules after `npm run build`.

### Established Patterns
- Tests import compiled JavaScript from `dist`, so plans must build before running node tests.
- Tests use Node's built-in `node:test` and `node:assert/strict`.
- Execution tests should use hand-written n8n fakes rather than introducing Jest/Vitest/Sinon.
- User-facing errors remain concise Chinese `Error` or `NodeOperationError` messages.

### Integration Points
- Old create compatibility connects through `Seedance.node.ts` create branch, `buildCreatePayload()`, and `buildCreateRequestSummary()`.
- Lifecycle compatibility connects through `Seedance.node.ts` get/list/delete branches, endpoint helpers, task mappers, polling, and transport.
- Wait/download compatibility connects through `pollTaskUntilSettled()` and `downloadSeedanceVideo()`.
- Seedream isolation connects through the top-level `generationMode` dispatch before any video operation branch is evaluated.

</code_context>

<specifics>
## Specific Ideas

- For old saved workflows, include stale `referenceMaterials` in parameters and assert old modes do not read it.
- For image isolation, use fakes that throw if video-only parameters are read unexpectedly.
- Treat technical testing strategy as agent-owned unless it changes user-visible behavior or milestone scope.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-既有模式与 lifecycle 兼容性*
*Context gathered: 2026-05-19T20:37:12+08:00*
