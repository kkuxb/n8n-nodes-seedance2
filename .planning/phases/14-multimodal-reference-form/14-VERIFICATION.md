---
phase: 14-multimodal-reference-form
verified: 2026-05-19T03:25:58Z
status: gaps_found
score: 23/23 must-haves statically verified; automated build/test blocked
---

# Phase 14: 多模态入口与参考素材表单 Verification Report

**Phase Goal:** Add the user-facing Seedance 2.0 multimodal reference video create mode and reference素材 form without implementing Phase 15 payload mapping.
**Status:** gaps_found

## Goal Achievement

| Area | Status | Evidence |
|------|--------|----------|
| Create mode | VERIFIED | `createMode` appends `multimodal_reference` after existing modes and keeps `t2v` default. |
| Reference素材 form | VERIFIED | `referenceMaterials` fixedCollection uses **参考素材**, **素材类型**, **素材来源**, **素材URL**, **属性名**, **素材ID**. |
| Source matrix | VERIFIED | Video has a separate source selector without Binary文件; image/audio use URL链接, Binary文件, 火山方舟素材库. |
| No removed fields | VERIFIED | No label/tag/note field was added to the create form or runtime input. |
| Face restriction guidance | VERIFIED | Field descriptions include the agreed Seedance 2.0 real-face source limitation near image value fields. |
| Runtime collection | VERIFIED | Multimodal references are collected only in `multimodal_reference` mode. |
| Payload boundary | VERIFIED | Phase 14 does not emit `reference_image`, `reference_video`, or `reference_audio` payload roles. |
| Existing modes | VERIFIED BY REVIEW | Existing first-frame/last-frame branches remain gated to `i2v_first` and `i2v_first_last`. |

**Decision coverage:** 23/23 must-haves statically verified against code and tests.

## Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| MODE-01 | SATISFIED BY IMPLEMENTATION | Automated test run blocked by environment. |
| MODE-03 | SATISFIED BY IMPLEMENTATION | Automated test run blocked by environment. |
| UI-01 | SATISFIED BY IMPLEMENTATION | Automated test run blocked by environment. |
| UI-02 | SATISFIED BY IMPLEMENTATION | Automated test run blocked by environment. |
| UI-03 | SATISFIED BY IMPLEMENTATION | Automated test run blocked by environment. |
| UI-04 | SATISFIED BY IMPLEMENTATION | Automated test run blocked by environment. |

## Automated Checks

| Check | Result | Detail |
|-------|--------|--------|
| `git diff --check` | PASS | No whitespace errors; Git reported LF-to-CRLF warnings only. |
| Static source scan | PASS | No Phase 14 direct Base64 create source, no label/tag/note field, expected reference素材 strings present. |
| `npm run build` | BLOCKED | `n8n-node` is not recognized because local dependencies are incomplete. |
| `node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts` | BLOCKED | Tests import `dist/`, which cannot exist until build succeeds. |
| Environment check | BLOCKED | Current Node is `v24.15.0`; project requires Node `22.x`. `npm ls --depth=0` reports invalid/extraneous dependencies. |

## Human Verification Required

### 1. Restore Node 22 dependency environment

**Test:** Use Node 22.x, reinstall dependencies cleanly, then run `npm run build`.
**Expected:** `n8n-node build` completes and generates `dist/`.
**Why human:** The current sandbox has no approval path for network/escalated repair and npm install failed under Node 24.

### 2. Run focused Phase 14 tests

**Test:** Run `node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`.
**Expected:** The focused create schema, payload, and execution regressions pass.
**Why human:** The tests depend on generated `dist/` output.

## Gaps Summary

### Critical Gaps

1. **Automated verification blocked by local environment**
   - Missing: Successful `npm run build` and focused test execution.
   - Impact: Phase 14 should not be marked fully verified until Node 22 dependencies are restored and tests pass.
   - Fix: Restore a clean Node 22 install, rebuild, and rerun the focused tests.

## Verification Metadata

**Verification approach:** Goal-backward static verification plus attempted automated checks.
**Must-haves source:** `14-01-PLAN.md` and `14-02-PLAN.md`.
**Implementation commit:** `f823c62`.
**Verifier:** Codex inline execution.
