---
phase: 16-reference-image-execution
verified: 2026-04-21T16:40:00Z
status: passed
score: 3/3 must-haves verified; CRTK-07, CRTK-08, and CRTK-09 closed for Phase 16 reference-image create execution
overrides_applied: 0
---

# Phase 16: Reference Image Execution Verification Report

**Phase Goal:** 让 video create execute 分支正式接入 `referenceImageItems`，使参考图生视频请求可以按用户配置顺序提交混合 URL、`asset://` 和 binary 的参考图。
**Verified:** 2026-04-21T16:40:00Z
**Status:** passed
**Scope Boundary:** 本报告只验证 Phase 16 的 reference-image create execution 证据，不声明新的产品能力；它只把已 shipped 的 summary、context、research、代码与测试证据整理为 phase-level verification，不扩展到 Phase 17/18/19 之外的 scope。

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Phase 16 shipped scope is specifically the ordered mixed-source reference-image create execute path, not a new validator or payload redesign. | ✓ VERIFIED | `16-01-SUMMARY.md:32-45` states the shipped outcome is execute wiring for ordered URL/`asset://`/binary reference images; `16-CONTEXT.md:17-34` locks D-01 through D-12 around ordered collection reading, mixed-source support, reused error boundaries, and execute-boundary regressions only; `16-RESEARCH.md:13-23,55-64,82-90` states Phase 16 only needs execute-layer collection into `createInput.referenceImages` while validator/payload boundaries stay upstream. |
| 2 | The shipped node execute path reads `referenceImageItems` in UI order and wires them into `createInput.referenceImages` only for `reference_images` mode. | ✓ VERIFIED | `nodes/Seedance/Seedance.node.ts:250-268` iterates `referenceImageItems.items` sequentially and maps each item directly to `SeedanceImageInput`; `Seedance.node.ts:409-410` assigns that ordered result to `createInput.referenceImages` only when `createMode === 'reference_images'`. |
| 3 | Ordered URL/asset/binary request shaping is regression-backed and additive-safe for existing video create behavior. | ✓ VERIFIED | `test/seedanceReferenceImageExecute.test.ts:101-141` proves URL → `asset://` → binary order is preserved in the outgoing `reference_image` payload; `seedanceReferenceImageExecute.test.ts:143-160` proves empty reference-image input is rejected before HTTP dispatch; `seedanceReferenceImageExecute.test.ts:163-189` proves hidden reference-image state does not leak into legacy `t2v`; `test/seedanceVideoRegression.test.ts:19-38,51-65,83-137` proves existing create defaults and lifecycle contracts remain stable; `19-VERIFICATION.md:22-25,61-64` shows downstream hardening preserved CRTK-07/08/09 rather than replacing the Phase 16 path. |

**Score:** 3/3 Phase 16 must-have truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `.planning/phases/16-reference-image-execution/16-VERIFICATION.md` | Phase-level verification report for shipped Phase 16 scope | ✓ VERIFIED | File exists and formalizes Phase 16 evidence without claiming new functionality beyond shipped reference-image execute work. |
| `.planning/phases/16-reference-image-execution/16-01-SUMMARY.md` | Delivered-scope summary for CRTK-07 / CRTK-08 / CRTK-09 | ✓ VERIFIED | Summary explicitly records ordered mixed-source execute wiring and regression coverage. |
| `.planning/phases/16-reference-image-execution/16-CONTEXT.md` | Locked implementation decisions D-01 through D-12 | ✓ VERIFIED | Context fixes the intended ordered mixed-source contract and scope boundary for Phase 16. |
| `.planning/phases/16-reference-image-execution/16-RESEARCH.md` | Execute-layer-only implementation boundary | ✓ VERIFIED | Research states no new validator/payload abstraction is needed; execute should wire collection data into `createInput.referenceImages`. |
| `nodes/Seedance/Seedance.node.ts` | Real execute wiring from `referenceImageItems` to `createInput.referenceImages` | ✓ VERIFIED | Shipped node implementation exists and performs ordered collection-to-contract mapping. |
| `test/seedanceReferenceImageExecute.test.ts` | Execute-boundary proof for ordered mixed-source request shaping and legacy safety | ✓ VERIFIED | Test file exists and proves ordered URL/asset/binary mapping, pre-dispatch invalid-input rejection, and non-leakage into `t2v`. |
| `test/seedanceVideoRegression.test.ts` | Additive compatibility proof for existing video behavior | ✓ VERIFIED | Regression file exists and keeps prior video create/get/list/delete/wait/download contracts stable. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `16-01-SUMMARY.md` | `16-VERIFICATION.md` | shipped summary claims converted to line-cited evidence | ✓ VERIFIED | `16-01-SUMMARY.md:42-45,57-64` claims real execute wiring, ordered mapping, and mixed-source support; this report ties those claims to code and tests. |
| `16-CONTEXT.md` | `nodes/Seedance/Seedance.node.ts` | D-01/D-03 ordered collection and D-04/D-06 mixed-source support | ✓ VERIFIED | `16-CONTEXT.md:17-24,31-34` locks order and mixed-source support; `Seedance.node.ts:250-268,409-410` implements the same collection order and mode-gated wiring. |
| `16-RESEARCH.md` | `nodes/Seedance/Seedance.node.ts` | execute-only boundary into `createInput.referenceImages` | ✓ VERIFIED | `16-RESEARCH.md:22-23,64-65,84-90` recommends execute-only collection mapping; `Seedance.node.ts:250-268,409-423` follows that boundary and continues through existing payload/summary builders. |
| `nodes/Seedance/Seedance.node.ts` | `test/seedanceReferenceImageExecute.test.ts` | exact execute-boundary request capture | ✓ VERIFIED | `Seedance.node.ts:409-423` wires and submits the create request; `seedanceReferenceImageExecute.test.ts:101-141` captures the request and proves ordered URL/asset/binary content; `seedanceReferenceImageExecute.test.ts:163-189` proves legacy non-regression. |
| `16-VERIFICATION.md` | milestone audit closure | CRTK-07 / CRTK-08 / CRTK-09 phase-local verification artifact | ✓ VERIFIED | This file closes the audit's remaining phase-directory gap for Phase 16 while relying only on already-shipped evidence. |

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `CRTK-07` | `16-01-PLAN.md`, `19-01-PLAN.md`, milestone audit | 用户可以通过参考图生视频模式创建任务。 | ✓ SATISFIED | `16-01-SUMMARY.md:32-45` records shipped execute wiring; `Seedance.node.ts:409-423` performs real `reference_images` create submission; `seedanceReferenceImageExecute.test.ts:101-123` proves successful create dispatch and mapped task response; `19-VERIFICATION.md:61-62` confirms downstream hardening preserved the path. |
| `CRTK-08` | `16-01-PLAN.md`, milestone audit | 用户可以按顺序提供 1-9 张参考图并保持顺序映射。 | ✓ SATISFIED | `16-CONTEXT.md:17-24,31-34` locks ordered semantics; `Seedance.node.ts:250-268` iterates the collection in order; `seedanceReferenceImageExecute.test.ts:101-141` proves URL then `asset://` then binary order survives into payload; `19-VERIFICATION.md:63` confirms order remains satisfied after hardening. |
| `CRTK-09` | `16-01-PLAN.md`, milestone audit | 用户可通过 URL、`asset://` 或 binary 提供参考图。 | ✓ SATISFIED | `16-01-SUMMARY.md:32-45,57-64` states mixed-source support; `Seedance.node.ts:253-264` maps binary via `processBinaryImage()` and URL/`asset://` through the URL path; `seedanceReferenceImageExecute.test.ts:105-140` proves all three sources appear in one request; `19-VERIFICATION.md:64` confirms all three input paths stay valid. |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 16 verification gate | `npm run build && node --test "test/seedanceReferenceImageExecute.test.ts" && node --test "test/seedanceVideoRegression.test.ts"` | Passed in this Phase 23 execution session. | ✓ PASS |

## Audit Closure Status

The milestone audit blocker for Phase 16 was not missing implementation; it was missing a formal phase-local verification artifact.

This report closes that blocker by connecting four evidence layers already present before Phase 23 started:

1. `16-01-SUMMARY.md` states the shipped Phase 16 outcome and scope.
2. `16-CONTEXT.md` locks D-01 through D-12 so the intended contract is auditable.
3. `16-RESEARCH.md`, `Seedance.node.ts`, and `test/seedanceReferenceImageExecute.test.ts` prove the exact execute wiring and regression behavior.
4. `19-VERIFICATION.md` shows later validation hardening preserved, rather than invalidated, the shipped Phase 16 contract for `CRTK-07`, `CRTK-08`, and `CRTK-09`.

**Closure conclusion:** Phase 16 is now formally verified for reference-image create execution evidence only. Audit closure comes from formalizing existing shipped evidence, not from re-implementing reference-image behavior.

## Gaps Summary

No Phase 16 verification gap remains for `CRTK-07`, `CRTK-08`, or `CRTK-09`.

Intentionally retained boundaries:

- No claim of new functionality beyond Phase 16 shipped scope.
- No claim of reference-video execution, release/docs verification, or remote media probing.
- No claim that Phase 19's hardening replaced Phase 16; it only serves as downstream preservation evidence.

---

_Verified: 2026-04-21T16:40:00Z_
_Verifier: the agent (gsd-executor)_
