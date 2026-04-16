---
phase: 01-credentials-t2v-get
plan: 03
subsystem: create-get-operations
tags: [n8n, seedance, text-to-video, create-task, get-task, tests, docs]
requires: [01-02]
provides:
  - Phase 1 text-to-video create operation with n8n-friendly fields
  - Single-task get operation with derived workflow status booleans
  - Mapper tests and README workflow guidance for Create Task -> Wait -> Get Task
affects: [create-task, get-task, mappers, validators, node-description, tests, README]
tech-stack:
  added: [description modules, create payload mapper, task response mapper, create validator, node:test mapper coverage]
  patterns: [programmatic n8n node routing, internal text content construction, raw response preservation, retention metadata]
key-files:
  created:
    - nodes/Seedance/description/create.operation.ts
    - nodes/Seedance/description/get.operation.ts
    - nodes/Seedance/shared/mappers/createPayload.ts
    - nodes/Seedance/shared/mappers/task.ts
    - nodes/Seedance/shared/validators/create.ts
    - test/createPayload.test.ts
    - test/taskMapper.test.ts
  modified:
    - nodes/Seedance/Seedance.node.ts
    - README.md
    - test/request.test.ts
key-decisions:
  - "Phase 1 create operation only supports text-to-video and builds content[type=text] internally instead of exposing raw content arrays."
  - "Task status mapping preserves raw API data while lifting n8n workflow booleans isTerminal, isSuccess, isFailure, and shouldPoll to top-level fields."
  - "Retention guidance is surfaced in both README and get-task output metadata so users see 7-day task history and 24-hour asset URL limits."
requirements-completed: [CRTK-01, CRTK-04, CRTK-05, CRTK-06, GETT-01, GETT-02, GETT-03]
duration: 45min
completed: 2026-04-16
---

# Phase 1 Plan 03: Text-to-Video Create/Get Summary

**Phase 1 的最小可用闭环已完成：n8n 用户现在可以用 Seedance 节点提交文生视频任务、拿到 taskId 与请求摘要，再通过单任务查询获得结果 URL、错误信息、用量和可直接用于分支判断的状态布尔字段。**

## Performance

- **Duration:** 45 min
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- 新增 `create` operation 的具体字段定义，覆盖 model、prompt、resolution、ratio、duration、frames、seed、watermark、service tier、execution expiry、return last frame 和 generate audio。
- 新增 create mapper 与 validator：内部构造 `content: [{ type: 'text', text: prompt }]`，并阻止 `duration` 与 `frames` 同时设置。
- 新增 `get` operation 与 task response mapper：输出 `taskId`、`status`、时间戳、`videoUrl`、`lastFrameUrl`、`usage`、`error`、`raw`，以及 `isTerminal`、`isSuccess`、`isFailure`、`shouldPoll`。
- README 增加 Phase 1 最小 workflow：`Seedance Create Task` -> `Wait` -> `Seedance Get Task`，并重申 7 天历史与 24 小时 URL 时效。
- 新增 `node:test` mapper 覆盖：create payload、duration/frames 互斥、六种官方状态、成功结果 URL、失败错误信息。

## Task Commits

1. **Task 1: Implement text-to-video create operation and payload mapping** - `0965337` (feat)
2. **Task 2: Implement get-task operation and n8n-friendly response mapping** - `3c72bec` (feat)
3. **Task 3: Add mapper tests and Phase 1 usage documentation** - `a3eb485` (test)

## Files Created/Modified

- `nodes/Seedance/Seedance.node.ts` - routes create/get operations through shared transport, mapper, and validator modules.
- `nodes/Seedance/description/create.operation.ts` - defines Phase 1 text-to-video create fields.
- `nodes/Seedance/description/get.operation.ts` - defines task ID lookup field and retention hint.
- `nodes/Seedance/shared/mappers/createPayload.ts` - builds official create payload and maps create response to n8n-friendly output.
- `nodes/Seedance/shared/mappers/task.ts` - maps task status/result/error data and derived booleans.
- `nodes/Seedance/shared/validators/create.ts` - validates required model/prompt and illegal duration/frames combinations.
- `test/createPayload.test.ts` - covers payload construction, validation, request summary, and create response mapping.
- `test/taskMapper.test.ts` - covers all documented task statuses plus success/failure mappings.
- `test/request.test.ts` - keeps transport tests compatible with strict lint by locally disabling the test-only restricted import rule.
- `README.md` - documents the Phase 1 async n8n workflow and retention limits.

## Decisions Made

- Create stays strictly text-to-video for Phase 1; image/video/audio/draft/raw content paths remain deferred.
- `get` returns raw API response under `raw` but promotes common fields and branching booleans to the top level for n8n usability.
- No submit-and-wait loop was added; users compose polling explicitly with n8n `Wait`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript/n8n description typing issues**
- **Found during:** Task 1
- **Issue:** Shared displayOptions constants were inferred as readonly arrays, and response mapper interfaces were too narrow for n8n `IDataObject` responses.
- **Fix:** Removed readonly inference from display options and explicitly cast transport responses at mapper boundaries.
- **Files modified:** `nodes/Seedance/description/create.operation.ts`, `nodes/Seedance/description/get.operation.ts`, `nodes/Seedance/shared/mappers/createPayload.ts`, `nodes/Seedance/shared/mappers/task.ts`, `nodes/Seedance/Seedance.node.ts`
- **Verification:** `npm run build`, `node --test test/createPayload.test.ts`
- **Committed in:** `0965337`

**2. [Rule 3 - Blocking] Fixed strict n8n lint compatibility for tests and field descriptions**
- **Found during:** Task 3
- **Issue:** `npm run lint` required sorted option labels and English boolean descriptions beginning with "Whether"; it also flagged Node built-in test imports in test files under cloud compatibility checks.
- **Fix:** Sorted Ratio options, adjusted boolean descriptions, and added test-file scoped lint disables for Node built-in test imports without changing strict package configuration.
- **Files modified:** `nodes/Seedance/description/create.operation.ts`, `test/createPayload.test.ts`, `test/taskMapper.test.ts`, `test/request.test.ts`
- **Verification:** `npm run build`, `node --test`, `npm run lint`
- **Committed in:** `a3eb485`

---

**Total deviations:** 2 auto-fixed（2 blocking）
**Impact on plan:** 偏差仅用于满足 TypeScript 与 n8n strict lint；未扩展到 list/delete、图生、多模态或 submit-and-wait。

## Known Stubs

None - Phase 1 create/get behavior is implemented. Deferred capabilities（list/delete、图生、多模态、submit-and-wait）属于后续 phase 边界，不是本计划 stub。

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: network-endpoint | `nodes/Seedance/Seedance.node.ts` | create/get operations now perform authenticated remote API calls via the shared Seedance transport. |
| threat_flag: input-validation | `nodes/Seedance/shared/validators/create.ts` | user-controlled create parameters are validated before being sent to Seedance. |

## Verification

- `node --test test/createPayload.test.ts` — passed
- `node --test test/taskMapper.test.ts` — passed
- `node --test` — passed, 18 tests
- `npm run build` — passed
- `npm run lint` — passed

## Issues Encountered

- `n8n-node build` and `n8n-node lint` continue to emit Node `DEP0190` warnings from the upstream CLI process wrapper; commands still pass.
- `node --test` continues to emit `MODULE_TYPELESS_PACKAGE_JSON` warnings for ESM-style test files. This is pre-existing from the current test approach and was not changed to avoid altering package module semantics.

## Next Phase Readiness

- Phase 1 now supports credential reuse, text-to-video create, single-task get, derived status booleans, and documented retention limits.
- Phase 2 can build image-based create modes on top of the same create mapper/validator pattern.
- Phase 3 can add list/delete without changing the Phase 1 create/get output contract.

## Self-Check: PASSED

- Found summary file `.planning/phases/01-credentials-t2v-get/01-03-SUMMARY.md`
- Found commit `0965337`
- Found commit `3c72bec`
- Found commit `a3eb485`

---
*Phase: 01-credentials-t2v-get*
*Completed: 2026-04-16*
