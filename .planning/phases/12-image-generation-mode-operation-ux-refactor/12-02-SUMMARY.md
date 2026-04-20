---
phase: 12-image-generation-mode-operation-ux-refactor
plan: 02
subsystem: api
tags: [n8n, seedance, seedream, image-generation, regression-tests]

requires:
  - phase: 12-image-generation-mode-operation-ux-refactor
    provides: Mode-first image UI contract with generationMode and imageOperation selectors
  - phase: 10-image-execution-path-binary-output-partial-failure-mapping
    provides: Existing Seedream image execute path and binary output mapping
provides:
  - Mode-aware image execution dispatch driven by generationMode and imageOperation
  - Comma-separated URL and binary reference normalization for image-to-image mode
  - Focused regression coverage proving image output and video lifecycle contracts remain stable
affects: [12-execution-wiring, Seedance node runtime, Seedream image generation]

tech-stack:
  added: []
  patterns: [mode-aware execute dispatch, comma-separated reference normalization, focused regression gate]

key-files:
  created:
    - .planning/phases/12-image-generation-mode-operation-ux-refactor/12-02-SUMMARY.md
  modified:
    - nodes/Seedance/Seedance.node.ts
    - nodes/Seedance/description/image.operation.ts
    - test/seedanceGenerateImageExecute.test.ts
    - test/seedreamImagePayload.test.ts
    - test/seedreamImageOperationContract.test.ts

key-decisions:
  - "Drive image execution from generationMode=image with imageOperation fallback to textToImage, while preserving operation=generateImage only as internal compatibility behavior."
  - "Normalize comma-separated URL and binary property inputs at execute time before reusing the existing Seedream validator and payload builder."
  - "Keep optimizePrompt mapped to the currently supported standard mode so execution remains deterministic without inventing unsupported API values."

patterns-established:
  - "Text-to-image explicitly clears stale hidden reference inputs before validation and request mapping."
  - "Image-to-image multi-reference inputs preserve user order after trim-and-drop-empty normalization."
  - "Video regression tests remain part of image UX refactor verification whenever dispatch logic changes."

requirements-completed:
  - IMG-03
  - IMG-04
  - IMG-05
  - IMG-06
  - IMG-07
  - IMG-08
  - IMG-09
  - IMG-10
  - UX-IMG-01
  - UX-IMG-02
  - UX-IMG-03
  - UX-IMG-04
  - VAL-IMG-01
  - VAL-IMG-03
  - VAL-IMG-04

duration: 8 min
completed: 2026-04-20
---

# Phase 12 Plan 02: Image Execution Wiring Summary

**Seedream image execution now follows generationMode/imageOperation UI selections, supports comma-separated multi-reference inputs, and preserves binary image output plus existing video lifecycle behavior.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-20T01:41:38Z
- **Completed:** 2026-04-20T01:49:35Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- 新执行分发以 `generationMode=image` 和 `imageOperation` 为主入口，文生图/图生图都复用既有 Seedream validator、payload mapper 和 result mapper。
- 图生图支持逗号分隔的 URL 与 binary 属性名输入，并按用户填写顺序映射为多张参考图。
- 最终回归覆盖同时验证图片执行、字段文案契约与视频非回归，确认已发布视频生命周期行为未受影响。

## Task Commits

Each task was committed atomically:

1. **Task 1: Add execute tests for mode-aware image dispatch** - `0d7a9a8` (test)
2. **Task 2: Wire image execution through generationMode and imageOperation** - `b9888ad` (feat)
3. **Task 3: Final regression gate for image UX refactor and video non-regression** - `8f746bd` (test)

**Plan metadata:** pending final docs commit

_Note: This plan followed TDD intent with a RED test commit before implementation._

## Files Created/Modified

- `nodes/Seedance/Seedance.node.ts` - 按模式分发图片执行，并规范化逗号分隔 URL / binary 参考图输入。
- `nodes/Seedance/description/image.operation.ts` - 明确说明参考图 URL 与 binary 属性支持逗号分隔多值输入。
- `test/seedanceGenerateImageExecute.test.ts` - 覆盖新 UI 参数、逗号分隔参考图输入与视频分支非回归。
- `test/seedreamImagePayload.test.ts` - 增加组图选项仅在启用时输出 payload 字段的回归断言。
- `test/seedreamImageOperationContract.test.ts` - 锁定多值输入描述文案与最终执行契约。

## Decisions Made

- 使用 `generationMode` 作为图片执行总开关，默认缺省仍回退为视频模式，满足计划中的视频分发威胁缓解要求。
- `imageOperation=textToImage` 时无条件清空参考图，避免隐藏旧字段误入请求。
- `optimizePrompt=false` 不引入任何新的 API 模式值；当前实现继续走稳定的 `standard` 合约，以避免偏离既有类型与 mapper 约束。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修复逗号分隔参考图输入未被执行层拆分**
- **Found during:** Task 2 (Wire image execution through generationMode and imageOperation)
- **Issue:** RED 测试表明执行层直接把逗号分隔字符串当作单个 URL 或单个 binary 属性名，导致图生图多参考图输入不可用。
- **Fix:** 在 `collectSeedreamReferenceImages()` 中为 URL 与 binary 输入增加 split/trim/filter 规范化，并保留既有 base64 / fixedCollection 分支。
- **Files modified:** `nodes/Seedance/Seedance.node.ts`
- **Verification:** `npm run build && node --test test/seedanceGenerateImageExecute.test.ts test/seedreamImagePayload.test.ts test/seedreamImageValidation.test.ts test/seedreamImageResult.test.ts`
- **Committed in:** `b9888ad`

**2. [Rule 2 - Missing Critical] 补充多值输入用户文案说明**
- **Found during:** Task 3 (Final regression gate for image UX refactor and video non-regression)
- **Issue:** 计划要求 URL 和 binary 参考图字段明确说明可接受逗号分隔多个值，否则新能力对用户不可发现。
- **Fix:** 更新 `referenceImageUrl` 与 `referenceImageBinaryProperty` 描述文案，并增加契约测试锁定该要求。
- **Files modified:** `nodes/Seedance/description/image.operation.ts`, `test/seedreamImageOperationContract.test.ts`
- **Verification:** 最终 focused regression suite 全通过。
- **Committed in:** `8f746bd`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** 两项修正都直接服务于计划正确性与可用性，没有超出 Phase 12 Wave 2 范围。

## Issues Encountered

- Task 1 RED 按预期失败，暴露出执行层尚未消费逗号分隔 URL / binary 多值输入。
- 初次 Task 2 实现尝试把 `optimizePromptMode` 变为条件字段时触发 TypeScript 类型错误；最终保持稳定的 `standard` 合约并继续通过布尔字段承接 UI 语义。

## Verification

- `npm run build && node --test test/seedanceGenerateImageExecute.test.ts test/seedreamImageOperationContract.test.ts` — RED 阶段按预期失败，随后实现后通过。
- `npm run build && node --test test/seedanceGenerateImageExecute.test.ts test/seedreamImagePayload.test.ts test/seedreamImageValidation.test.ts test/seedreamImageResult.test.ts` — passed.
- `npm run build && node --test test/seedreamImageOperationContract.test.ts test/seedanceGenerateImageExecute.test.ts test/seedreamImagePayload.test.ts test/seedreamImageValidation.test.ts test/seedreamImageResult.test.ts test/seedanceVideoRegression.test.ts test/createPayload.test.ts test/seedanceGetWaitMode.test.ts test/request.test.ts test/seedanceDownload.test.ts test/seedanceDownloadFlow.test.ts test/taskMapper.test.ts test/taskPolling.test.ts` — passed (`96/96`).

## Known Stubs

None. 本计划修改未引入新的占位数据、空数据源组件或 TODO/FIXME 型未完成桩实现。

## Threat Flags

None. 变更仅在既有图片执行入口内做模式分发与输入规范化，没有引入新的网络端点、鉴权路径或新的信任边界。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 12 的图片模式 UX 重构已完成，UI 契约与执行路径现已对齐。
- 可进入 `/gsd-verify-work 12` 或后续里程碑收尾流程。

## Self-Check: PASSED

- Verified file exists: `.planning/phases/12-image-generation-mode-operation-ux-refactor/12-02-SUMMARY.md`.
- Verified task commits exist: `0d7a9a8`, `b9888ad`, `8f746bd`.
- Verified final focused build and regression suite pass.

---
*Phase: 12-image-generation-mode-operation-ux-refactor*
*Completed: 2026-04-20*
