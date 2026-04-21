---
phase: 19-reference-image-validation-hardening
plan: 01
subsystem: validation
tags: [n8n, seedance, reference-images, validation, node-test]
requires:
  - phase: 15-validation-and-payload-contract
    provides: shared create validator and payload contract
  - phase: 16-reference-image-execution
    provides: reference_images execute boundary and ordered mapping
provides:
  - reference_images per-item non-empty validation for URL, asset, and binary inputs
  - execute-boundary regression proving empty reference-image items do not dispatch HTTP requests
affects: [reference_images, create-validation, execute-regression]
tech-stack:
  added: []
  patterns: [shared-validator-boundary, dist-import-node-test-regression]
key-files:
  created: []
  modified:
    - nodes/Seedance/shared/validators/create.ts
    - test/createValidator.test.ts
    - test/seedanceReferenceImageExecute.test.ts
key-decisions:
  - "Keep reference_images empty-item rejection in validateCreateInput() rather than mapper code so invalid user input is blocked before payload assembly and HTTP dispatch."
patterns-established:
  - "reference_images entries must pass a trimmed non-empty data check while preserving legal URL, asset://, and binary ordering."
requirements-completed: [VAL-REF-01, CRTK-07, CRTK-08, CRTK-09]
duration: 5min
completed: 2026-04-21
---

# Phase 19 Plan 01: Reference Image Validation Hardening Summary

**reference_images 本地校验现在拒绝空 URL/asset/binary 占位，并通过 execute 回归证明无效请求不会触发 create HTTP 调用。**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-21T06:14:41Z
- **Completed:** 2026-04-21T06:19:51Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- 在 `validateCreateInput()` 中为 `reference_images` 增加逐项 `data.trim()` 非空校验，保留 1-9 张数量限制与既有模式规则。
- 补充 validator 回归，覆盖合法 URL/`asset://`/binary 混合输入、空 URL、空白占位和空 binary 数据。
- 补充 execute 边界回归，确认空参考图 URL 在本地失败且 `httpRequest` 调用列表保持为空，同时保留合法顺序映射与 legacy `t2v` 兼容覆盖。

## Task Commits

1. **Task 1: Harden `reference_images` item validation against empty inputs** - `8e91329` (test)
2. **Task 2: Prove the execute boundary never sends invalid empty reference-image requests** - `a3a4b6a` (test)

## Files Created/Modified

- `nodes/Seedance/shared/validators/create.ts` - 为 `reference_images` 每个参考图条目增加非空数据校验。
- `test/createValidator.test.ts` - 增加空 URL、空白占位和空 binary 拒绝回归，并保留合法参考图/参考视频/旧模式覆盖。
- `test/seedanceReferenceImageExecute.test.ts` - 增加 execute 层空 URL 拒绝且不发请求的回归断言。

## Decisions Made

- 将空参考图条目校验放在共享 validator 中，而不是 mapper 中，确保 payload assembly 前即失败。
- 只校验本地明显空值，不做远程 URL 探测或扩大格式校验范围，以符合 gap closure 限定范围。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TDD RED 阶段新增的空参考图测试按预期失败；随后实现 validator 校验后通过。

## Known Stubs

None - grep stub scan only found test-local empty tracking arrays (`calls` and `assertedBinaryProperties`), which are intentional test harness state and do not flow to UI rendering.

## Threat Flags

None - no new endpoint, auth path, file access, schema, or trust-boundary surface was introduced.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm run build` — PASSED
- `node --test "test/createValidator.test.ts"` — PASSED (6/6)
- `node --test "test/seedanceReferenceImageExecute.test.ts"` — PASSED (3/3)
- `node --test "test/createPayload.test.ts"` — PASSED (22/22)
- `node --test "test/seedanceReferenceVideoExecute.test.ts"` — PASSED (2/2)
- `node --test "test/seedanceVideoRegression.test.ts"` — PASSED (6/6)

## TDD Gate Compliance

- RED gate: `test/createValidator.test.ts` 新增空参考图断言后先失败（Missing expected exception）。
- GREEN gate: `8e91329` 实现 validator 校验并通过 Task 1 验证。
- Execute regression gate: `a3a4b6a` 增加 execute 边界负向回归并通过完整计划验证。

## Next Phase Readiness

- Phase 19 gap closure 已完成，可继续后续 gap closure phase。
- 残留的工作树脏改动均为本计划开始前已存在或其他 phase 范围内容，未在本计划中回滚或扩大处理。

## Self-Check: PASSED

- Found: `nodes/Seedance/shared/validators/create.ts`
- Found: `test/createValidator.test.ts`
- Found: `test/seedanceReferenceImageExecute.test.ts`
- Found commits: `8e91329`, `a3a4b6a`

---
*Phase: 19-reference-image-validation-hardening*
*Completed: 2026-04-21*
