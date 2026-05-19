---
phase: 17-lifecycle
plan: 01
subsystem: testing
tags:
  - seedance
  - video-create
  - compatibility
  - regression
requires:
  - phase: 16-seedance-2-0
    provides: Seedance 2.0 payload fields and validation behavior that old modes must not regress
provides:
  - Execute-level HTTP payload coverage for old t2v, first-frame, and first-last-frame video create modes
  - Saved-workflow stale multimodal field regression coverage
affects:
  - Phase 17 lifecycle compatibility
  - Phase 18 documentation and UAT
tech-stack:
  added: []
  patterns:
    - Execute-level n8n fake context request capture
    - Parameter-read guard assertions for saved workflow compatibility
key-files:
  created:
    - .planning/phases/17-lifecycle/17-01-SUMMARY.md
  modified:
    - test/seedanceVideoRegression.test.ts
key-decisions:
  - "Old video create compatibility is protected with exact execute-level HTTP body assertions."
  - "Frame role assertions inspect content roles instead of broad JSON substrings so body fields like return_last_frame do not create false failures."
patterns-established:
  - "Use stale saved-workflow fields in regression fakes to prove hidden multimodal values do not affect old modes."
requirements-completed:
  - MODE-02
  - PAY-02
  - COMP-01
  - COMP-04
duration: 8 min
completed: 2026-05-19
---

# Phase 17 Plan 01: Lock Old Video Create Payload Compatibility Summary

**Execute-level request body tests now lock the shipped text-to-video, first-frame, and first-last-frame create contracts against multimodal field leakage.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-19T12:51:29Z
- **Completed:** 2026-05-19T12:59:50Z
- **Tasks:** 5
- **Files modified:** 1

## Accomplishments

- Added stale saved-workflow multimodal fixtures to the video regression harness.
- Added exact execute-level HTTP body assertions for `t2v`, `i2v_first`, and `i2v_first_last`.
- Proved old modes do not read `referenceMaterials` and do not emit `reference_image`, `reference_video`, or `reference_audio` roles.
- Preserved strict `first_frame` and `last_frame` role coverage for old frame-control modes.

## Task Commits

1. **Tasks 17-01-01 through 17-01-05: old create compatibility coverage and verification** - `25da983` (test)

**Plan metadata:** this summary commit.

## Files Created/Modified

- `test/seedanceVideoRegression.test.ts` - Added old create execute-level compatibility tests and request-role helpers.
- `.planning/phases/17-lifecycle/17-01-SUMMARY.md` - Records plan completion.

## Decisions Made

- Reused the existing video execution fake and made frame-parameter read guards configurable so old frame modes can be tested without weakening multimodal guard behavior.
- Checked frame roles from `body.content[*].role` instead of raw JSON string matching, because `return_last_frame` is a valid body field and should not count as a `last_frame` role.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial role-negative assertions matched `return_last_frame` as a string. Fixed the assertions to inspect only `content` roles, then reran the focused verification successfully.

## Verification

- `npm run build` - PASSED.
- `node --test test/seedanceVideoRegression.test.ts` - PASSED, 18/18 tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Plan 17-02. The video regression harness now has reusable helpers for exact create-task HTTP capture and saved-workflow field leakage checks.

## Self-Check: PASSED

- Summary includes the plan requirement IDs verbatim.
- The focused build and test command passed.
- All Plan 17-01 must-haves are covered by tests.

---
*Phase: 17-lifecycle*
*Completed: 2026-05-19*
