---
phase: 12-image-generation-mode-operation-ux-refactor
plan: 01
subsystem: ui
tags: [n8n, seedance, seedream, node-description, contract-tests]

requires:
  - phase: 10-image-execution-path-binary-output-partial-failure-mapping
    provides: Live Seedream image execute branch and binary output contract
  - phase: 11-regression-coverage-documentation-release-hardening
    provides: Image and video regression coverage baseline
provides:
  - Mode-first generation selector with video and image operation separation
  - Image-mode operation selector for text-to-image and image-to-image
  - Contract-tested image field ordering and video displayOptions gating
affects: [12-02-execution-wiring, Seedance node UX, Seedream image generation]

tech-stack:
  added: []
  patterns: [mode-first n8n displayOptions gating, node-description contract tests]

key-files:
  created: []
  modified:
    - nodes/Seedance/Seedance.node.ts
    - nodes/Seedance/description/create.operation.ts
    - nodes/Seedance/description/get.operation.ts
    - nodes/Seedance/description/list.operation.ts
    - nodes/Seedance/description/delete.operation.ts
    - nodes/Seedance/description/image.operation.ts
    - test/seedreamImageOperationContract.test.ts
    - test/seedanceGetWaitMode.test.ts

key-decisions:
  - "Use generationMode as the first selector and keep the existing operation field video-only to avoid mixing image generation into video lifecycle operations."
  - "Represent image UX with imageOperation=textToImage/imageToImage while retaining operation=generateImage as an execution fallback until Plan 12-02 completes wiring."
  - "Promote prompt optimization and web search from imageAdvancedOptions into first-class image fields so n8n displays the requested ordering explicitly."

patterns-established:
  - "Every video operation displayOptions.show block includes generationMode=['video']."
  - "Every image field displayOptions.show block includes generationMode=['image'] and imageOperation gating where applicable."
  - "Contract tests evaluate visible property order from the node description rather than relying on manual UI inspection."

requirements-completed:
  - IMG-01
  - IMG-02
  - IMG-03
  - IMG-04
  - IMG-05
  - IMG-06
  - IMG-07
  - IMG-10
  - UX-IMG-01
  - UX-IMG-02
  - UX-IMG-04

duration: 7min
completed: 2026-04-20
---

# Phase 12 Plan 01: Mode-First Image Operation UX Summary

**Seedance node now starts with a video/image generation-mode selector, exposes video lifecycle operations only in video mode, and contract-tests Seedream text-to-image/image-to-image field ordering.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-20T01:32:34Z
- **Completed:** 2026-04-20T01:39:17Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- Added contract tests proving `generationMode` precedes `operation`, video operations exclude image generation, and image mode exposes `文生图` / `图生图`.
- Added the mode-first selector and gated every existing video operation description file with `generationMode=['video']`.
- Refactored image description fields so text-to-image and image-to-image show the requested order, with reference controls inserted immediately after prompt optimization for image-to-image.
- Kept streaming, `output_format`, `outputFormat`, and image watermark fields absent from the node description.

## Task Commits

Each task was committed atomically:

1. **Task 1: Lock the mode-first UI contract in tests** - `10bd9bd` (test)
2. **Task 2: Add generation mode and split operation selectors** - `b507018` (feat)
3. **Task 3: Reorder and gate image-mode fields** - `43412d2` (feat)

**Plan metadata:** pending final docs commit

_Note: This plan followed TDD intent with a RED contract-test commit before implementation commits._

## Files Created/Modified

- `nodes/Seedance/Seedance.node.ts` - Adds `generationMode`, gates video operation selector, updates subtitle branching, and supports image-mode execution fallback.
- `nodes/Seedance/description/create.operation.ts` - Gates create-task video fields by `generationMode=['video']`.
- `nodes/Seedance/description/get.operation.ts` - Gates get-task video fields by `generationMode=['video']`.
- `nodes/Seedance/description/list.operation.ts` - Gates list-task video fields by `generationMode=['video']`.
- `nodes/Seedance/description/delete.operation.ts` - Gates delete/cancel video fields by `generationMode=['video']`.
- `nodes/Seedance/description/image.operation.ts` - Adds `imageOperation`, image-mode display helpers, first-class `optimizePrompt` / `webSearch`, and requested image field order.
- `test/seedreamImageOperationContract.test.ts` - Locks the mode-first UI contract, image operation selector, visible field order, and forbidden-field exclusions.
- `test/seedanceGetWaitMode.test.ts` - Updates existing wait-mode description assertion for the new video-mode gate.

## Decisions Made

- Kept `operation=generateImage` as an internal compatibility fallback in `execute()` while introducing `generationMode=image` + `imageOperation` for the UI. This avoids breaking the already-live image execution path before Plan 12-02 completes final wiring.
- Mapped the boolean `optimizePrompt` field to the existing Seedream `standard` prompt optimization mode because the current mapper only supports the fixed official mode.
- Updated the wait-mode regression assertion to include `generationMode=['video']`; this is expected under the Phase 12 threat mitigation requiring every video field to be mode-gated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Preserved existing image execution during UI split**
- **Found during:** Task 3 (Reorder and gate image-mode fields)
- **Issue:** Replacing the UI selector with `imageOperation` would otherwise leave the current live image execute path dependent on the old `operation=generateImage` selector until Plan 12-02.
- **Fix:** Allowed `generationMode === 'image'` to enter the existing image execution branch while preserving `operation === 'generateImage'` as a compatibility fallback.
- **Files modified:** `nodes/Seedance/Seedance.node.ts`
- **Verification:** `npm run build` and targeted image/video regression tests passed.
- **Committed in:** `43412d2`

**2. [Rule 1 - Bug] Updated wait-mode contract assertion for new video gate**
- **Found during:** Task 3 verification
- **Issue:** `test/seedanceGetWaitMode.test.ts` still expected `downloadVideo.displayOptions.show` without the required `generationMode=['video']` gate.
- **Fix:** Updated the regression test to assert the new gate while preserving operation and wait-mode conditions.
- **Files modified:** `test/seedanceGetWaitMode.test.ts`
- **Verification:** Full plan verification suite passed.
- **Committed in:** `43412d2`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes were necessary to keep the refactor correct and regression tests aligned with the new mode-first contract. No scope creep beyond Phase 12 UI contract work.

## Issues Encountered

- Task 1 RED verification failed as expected before implementation because `generationMode` and `imageOperation` did not exist and `generateImage` was still mixed into the video operation selector.
- Task 2 targeted verification still failed on image-operation tests because Task 3 was responsible for image-mode field refactoring.
- TypeScript initially rejected `optimizePromptMode: undefined`; the implementation keeps the currently supported `standard` mode to remain compatible with existing Seedream payload types.

## Verification

- `npm run build` — passed.
- `node --test test/seedreamImageOperationContract.test.ts test/seedanceVideoRegression.test.ts test/createPayload.test.ts test/seedanceGetWaitMode.test.ts` — passed (`28/28`).

## Known Stubs

None. Stub-pattern scan found only intentional runtime accumulators/default containers and n8n UI placeholder labels (`placeholder`) in existing/additive field definitions; none are incomplete data-source stubs.

## Threat Flags

None. This plan changed node-description/UI gating and did not introduce new network endpoints, auth paths, file access patterns, or schema trust boundaries beyond the threat model already listed in the plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `12-02-PLAN.md`: execution wiring can now consume `generationMode=image` and `imageOperation=textToImage/imageToImage`, including the planned comma-separated multi-reference input behavior.

## Self-Check: PASSED

- Verified key modified files exist on disk.
- Verified task commits exist: `10bd9bd`, `b507018`, `43412d2`.
- Verified final build and targeted test suite pass.

---
*Phase: 12-image-generation-mode-operation-ux-refactor*
*Completed: 2026-04-20*
