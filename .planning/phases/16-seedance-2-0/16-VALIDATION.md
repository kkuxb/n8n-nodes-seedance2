---
phase: 16
slug: seedance-2-0
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-19T08:45:00Z
---

# Phase 16 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Build prerequisite | `npm run build` |
| Focused pure command | `npm run build && node --test test/createPayload.test.ts` |
| Focused execution command | `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts` |
| Full suite command | `npm run build && node --test test/*.test.ts` |

## Sampling Rate

- After Plan 16-01: run `npm run build && node --test test/createPayload.test.ts`.
- After Plan 16-02: run `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`.
- Before phase verification: run `npm run build && node --test test/*.test.ts`.

## Per-Requirement Verification Map

| Requirement | Verification |
|-------------|--------------|
| VAL-01 | Unit tests reject invalid binary image MIME and over-30 MB binary image; tests prove URL/asset images are not suffix/protocol rejected; existing count tests remain. |
| VAL-02 | Unit tests preserve video count/source rules and document that URL/asset video duration/resolution/FPS/codec are API-validated because Phase 16 forbids probing. |
| VAL-03 | Unit/execute tests reject invalid binary audio MIME and over-15 MB binary audio; tests prove URL/asset audio are not suffix/protocol rejected; existing count/audio-only tests remain. |
| VAL-04 | Unit tests cover duration, ratio, resolution, seed, execution timeout, watermark, and generate-audio body/validation behavior. |
| VAL-05 | UI tests prove standard model exposes `1080p` and Fast does not; validator tests prove Fast + `1080p` is rejected and standard + `1080p` passes. |
| VAL-06 | UI and payload tests prove `camera_fixed` is not exposed and not sent. |
| PAY-03 | Payload tests prove generation options are sent as body fields and prompt text is not mutated with suffix parameters. |

## Manual Verification

No manual verification is required for Phase 16. User-facing documentation and manual UAT are explicitly Phase 18.

## Sign-Off

- [x] Every Phase 16 requirement has at least one automated verification path.
- [x] Validation respects the deterministic local boundary from `16-CONTEXT.md`.
- [x] No watch-mode commands are used.
- [x] Full suite command is identified for phase closeout.

