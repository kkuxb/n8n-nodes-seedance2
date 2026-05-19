---
phase: 16
status: passed
verified: 2026-05-19
requirements:
  - VAL-01
  - VAL-02
  - VAL-03
  - VAL-04
  - VAL-05
  - VAL-06
  - PAY-03
summaries:
  - 16-01-SUMMARY.md
  - 16-02-SUMMARY.md
---

# Phase 16 Verification — Seedance 2.0 参数与本地校验

## Verdict

**Passed.** Phase 16 achieved its goal: the node now gives deterministic local feedback for officially knowable Seedance 2.0 media, model, and generation parameter constraints before submitting clearly invalid create requests.

## Requirement Coverage

| Requirement | Verdict | Evidence |
|-------------|---------|----------|
| VAL-01 | Passed | `test/createPayload.test.ts` and `test/seedanceVideoRegression.test.ts` reject invalid binary image MIME, over-30MB binary image, image count overflow, and locally computable request-size overflow while preserving URL/asset pass-through. |
| VAL-02 | Passed | Video reference count and binary-source rejection remain covered; URL/asset video metadata is intentionally left to the API because Phase 16 forbids remote probing. |
| VAL-03 | Passed | Binary audio MIME and over-15MB checks are covered in unit and execute-level tests; audio-only and audio count rules remain covered. |
| VAL-04 | Passed | Duration, ratio, resolution, seed, execution timeout, watermark, return-last-frame, and generate-audio validation/body-field behavior are covered. |
| VAL-05 | Passed | Standard Seedance 2.0 exposes and accepts 1080p; Seedance 2.0 Fast hides 1080p in UI and rejects saved/runtime Fast + 1080p inputs. |
| VAL-06 | Passed | UI, payload, and execute-level body assertions confirm `camera_fixed` is not exposed or sent. |
| PAY-03 | Passed | Payload and execute-level tests confirm options are sent as body fields and prompt text is not mutated with parameter suffixes. |

## Must-Have Checks

| Must-have | Status |
|-----------|--------|
| No URL/asset suffix checks, protocol checks, HEAD requests, downloads, or media probing for input references | Passed |
| Binary validation covers MIME and byte size only | Passed |
| Image binary references enforce official MIME allowlist and 30MB limit | Passed |
| Audio binary references enforce official MIME allowlist and 15MB limit | Passed |
| Request-size validation uses only locally computable binary/data URL values | Passed |
| No image dimension, audio duration, video FPS, video codec, or remote metadata parser added | Passed |
| Fail-fast first-error validation style preserved | Passed |
| Official body-field payload behavior preserved | Passed |
| `camera_fixed`, `tools`, `web_search`, and `safety_identifier` remain absent from Seedance video create path | Passed |

## Automated Checks

| Command | Result |
|---------|--------|
| `npm run build` | Passed |
| `node --test test/createPayload.test.ts` | Passed, 29/29 tests |
| `node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts` | Passed, 44/44 tests |
| `node --test test/*.test.ts` | Passed, 138/138 tests |
| `gsd-sdk query verify.schema-drift 16` | Passed, no drift detected |

## Notes

- Node test runner prints `MODULE_TYPELESS_PACKAGE_JSON` warnings for existing ESM-style `.ts` tests. This is pre-existing test-runner noise and did not affect pass/fail status.
- No manual verification is required for Phase 16; user-facing UAT is deferred to Phase 18 by plan.

## Human Verification

None required.
