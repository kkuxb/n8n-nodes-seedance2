---
phase: 15
slug: payload
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-19T15:06:17+08:00
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none |
| **Quick run command** | `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts` |
| **Full suite command** | `npm run build && node --test test/*.test.ts` |
| **Estimated runtime** | ~30-90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`
- **After every plan wave:** Run `npm run build && node --test test/*.test.ts`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | REF-01, REF-02, REF-03, REF-04, REF-05, SRC-04, PAY-01, PAY-04 | T-15-01 | No raw media values in safe summary | unit | `npm run build && node --test test/createPayload.test.ts` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | REF-01, REF-02, REF-03, REF-04, REF-05, SRC-01, SRC-02, SRC-03, SRC-04, SRC-05, PAY-01, PAY-04 | T-15-01 | Invalid payload combinations are blocked before HTTP request | unit | `npm run build && node --test test/createPayload.test.ts` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 2 | SRC-01, SRC-02, SRC-03, SRC-04, SRC-05, PAY-01, PAY-04 | T-15-02 | Binary media values are converted without leaking in summary | integration | `npm run build && node --test test/seedanceVideoRegression.test.ts` | ✅ | ⬜ pending |
| 15-02-02 | 02 | 2 | REF-01, REF-02, REF-03, REF-04, REF-05, SRC-01, SRC-02, SRC-03, SRC-04, SRC-05, PAY-01, PAY-04 | T-15-03 | Old video modes remain stable while multimodal references are sent | regression | `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts` | ✅ | ⬜ pending |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All Phase 15 behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-19

