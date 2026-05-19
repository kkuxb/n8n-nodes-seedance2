---
phase: 16
plan: 01
subsystem: Seedance create validation
tags:
  - validation
  - seedance-2.0
  - multimodal-reference
requires: []
provides:
  - Official Seedance 2.0 local validation constants
  - Binary reference media metadata validation contract
  - Model-specific 1080p rules
affects:
  - nodes/Seedance/shared/constants.ts
  - nodes/Seedance/shared/validators/create.ts
  - nodes/Seedance/description/create.operation.ts
  - test/createPayload.test.ts
tech-stack:
  added: []
  patterns:
    - Shared constants for API limits
    - Fail-fast Chinese validation errors
key-files:
  created: []
  modified:
    - nodes/Seedance/shared/constants.ts
    - nodes/Seedance/shared/validators/create.ts
    - nodes/Seedance/description/create.operation.ts
    - test/createPayload.test.ts
key-decisions:
  - Kept URL and asset references pass-through except existing non-empty, count, and combination rules.
  - Added two mutually exclusive `resolution` UI definitions so standard Seedance 2.0 exposes 1080p while Fast does not.
requirements-completed:
  - VAL-01
  - VAL-02
  - VAL-03
  - VAL-04
  - VAL-05
  - VAL-06
  - PAY-03
duration: 18 min
completed: 2026-05-19
---

# Phase 16 Plan 01: Add Official Seedance 2.0 Parameter and Local Validation Contract Summary

Implemented the shared Seedance 2.0 local validation contract for binary reference media, model-specific resolution rules, and official request body fields.

## Execution

- Start: 2026-05-19T19:37:00+08:00
- End: 2026-05-19T19:55:33+08:00
- Tasks: 5/5 complete
- Files modified: 4

## Commits

| Commit | Description |
|--------|-------------|
| 63b1a92 | `feat(16-01): add seedance 2 validation contract` |

## Completed Work

- Added shared Seedance video image/audio MIME and byte-size constants, including heic/heif image support.
- Extended create input types with optional binary metadata fields.
- Added deterministic local validation for binary image/audio MIME, per-file byte size, and locally computable binary/data URL request size.
- Allowed 1080p for standard Seedance 2.0 while hiding and rejecting 1080p for Seedance 2.0 Fast.
- Added focused tests for constants, UI resolution options, body-field payload behavior, unsupported/deferred field absence, binary validation, summary redaction, and URL/asset non-probing.

## Verification

| Command | Result |
|---------|--------|
| `npm run build` | Passed |
| `node --test test/createPayload.test.ts` | Passed, 29/29 tests |

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact:** The implementation remains inside the planned local-validation boundary.

## Self-Check: PASSED

- All task acceptance criteria passed.
- No remote probing, URL suffix checks, media parsers, `camera_fixed`, `tools`, `web_search`, or `safety_identifier` were introduced.
- Ready for 16-02 runtime metadata wiring.
