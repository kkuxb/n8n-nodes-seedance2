---
phase: 17-reference-video-execution
verified: 2026-04-21T07:50:08Z
status: passed
score: 3/3 must-haves verified; CRTK-10 and CRTK-11 closed for Phase 17 reference-video create execution
overrides_applied: 0
---

# Phase 17: Reference Video Execution Verification Report

**Phase Goal:** 让用户可以通过 URL 或 `asset://` 素材 ID 提交参考视频生视频任务。
**Verified:** 2026-04-21T07:50:08Z
**Status:** passed
**Scope Boundary:** 本报告只验证 Phase 17 的 reference-video create execution 链路；不声明 Phase 18/22 lifecycle、release 或 docs verification，也不声明远端媒体 metadata 探测能力。

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Public create UI exposes `reference_videos` as an explicit create mode and only accepts ordered URL / `asset://` reference-video entries, with 1-3 item and official media-limit wording. | ✓ VERIFIED | `nodes/Seedance/description/create.operation.ts:42` adds `参考视频生视频` with value `reference_videos`; `create.operation.ts:203-227` defines `referenceVideoItems`, shows it only when `createMode` is `reference_videos`, and describes 1-3 URL/`asset://`, no `binary/base64`, mp4/mov, 2-15 seconds, max 3, total <=15 seconds, <=50MB each, FPS 24-60. |
| 2 | The shipped execute path reads `referenceVideoItems` and wires them into `createInput.referenceVideos` before validator/payload submission. | ✓ VERIFIED | `nodes/Seedance/Seedance.node.ts:273` registers `referenceVideoItems` in node properties; `Seedance.node.ts:367` widens `createMode` to include `reference_videos`; `Seedance.node.ts:413-414` assigns `collectReferenceVideosForCreate(itemIndex)` into `createInput.referenceVideos` only for `reference_videos`. |
| 3 | Payload mapping preserves reference-video order as `reference_video` content items and request summary only exposes counts, not raw URL/asset values. | ✓ VERIFIED | `nodes/Seedance/shared/mappers/createPayload.ts:76-82` iterates `input.referenceVideos ?? []` in order and emits `type: 'video_url'`, `role: 'reference_video'`, `video_url.url`; `createPayload.ts:103-122` builds low-risk summary metadata including `referenceVideoCount` without copying raw reference arrays. |

**Score:** 3/3 Phase 17 must-have truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `nodes/Seedance/description/create.operation.ts` | Public UI contract for reference-video create mode | ✓ VERIFIED | File exists and contains `reference_videos` mode plus ordered `referenceVideoItems` URL/`asset://` collection with no binary/base64 option. |
| `nodes/Seedance/Seedance.node.ts` | Execute-layer wiring from UI items to create input | ✓ VERIFIED | File exists and wires `referenceVideoItems` into `createInput.referenceVideos` for `reference_videos`. |
| `nodes/Seedance/shared/mappers/createPayload.ts` | Ordered API payload and safe request-summary mapping | ✓ VERIFIED | File exists and maps reference videos into ordered `reference_video` content items; request summary exposes only counts and scalar metadata. |
| `test/createValidator.test.ts` | Validator proof for 1-3 URL/asset inputs and unsupported binary/base64 rejection | ✓ VERIFIED | File exists; tests cover valid 1-3 URL/asset reference videos and reject missing, over-limit, blank, `data:video...base64`, `binary:` and reference-audio cases. |
| `test/createPayload.test.ts` | Payload proof for ordered `reference_video` mapping and summary redaction | ✓ VERIFIED | File exists; tests assert ordered URL + `asset://` mapping and no raw reference leakage in request summary. |
| `test/seedanceReferenceVideoExecute.test.ts` | Execute-boundary proof for real create request shaping | ✓ VERIFIED | File exists; tests assert shipped node execution preserves ordered URL/asset videos, avoids binary helpers, redacts summary, and prevents legacy hidden reference-video leakage. |
| `test/seedanceVideoRegression.test.ts` | Additive compatibility proof for existing video behavior | ✓ VERIFIED | File exists; regression coverage keeps existing video create defaults and lifecycle mapping stable while reference-video mode is additive. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `nodes/Seedance/description/create.operation.ts` | Phase 17 requirement `CRTK-11` | `reference_videos` + `referenceVideoItems` UI definition | ✓ VERIFIED | `create.operation.ts:42` exposes the mode; `create.operation.ts:203-227` limits public reference-video input to URL/`asset://` wording and has no binary/base64 reference-video branch. |
| `nodes/Seedance/Seedance.node.ts` | `nodes/Seedance/shared/mappers/createPayload.ts` | `referenceVideoItems` → `createInput.referenceVideos` → `reference_video` content | ✓ VERIFIED | `Seedance.node.ts:413-414` passes ordered execute input to `createInput.referenceVideos`; `createPayload.ts:76-82` maps the same collection into ordered API content items. |
| `nodes/Seedance/shared/mappers/createPayload.ts` | `test/createPayload.test.ts` | ordered payload and request-summary assertions | ✓ VERIFIED | `createPayload.test.ts:342-358` asserts URL and `asset://` order in `reference_video` payload; `createPayload.test.ts:374-379` asserts `referenceVideoCount` and raw asset redaction. |
| `nodes/Seedance/Seedance.node.ts` | `test/seedanceReferenceVideoExecute.test.ts` | execute-boundary request capture | ✓ VERIFIED | `seedanceReferenceVideoExecute.test.ts:81-111` verifies a shipped node create request preserves URL/asset order and summary redaction; `seedanceReferenceVideoExecute.test.ts:114-134` verifies legacy `t2v` does not leak hidden `reference_video` content. |

## Evidence Notes

### UI and local input contract proof (`CRTK-11`)

- `nodes/Seedance/description/create.operation.ts:42` adds the explicit `reference_videos` create-mode option.
- `nodes/Seedance/description/create.operation.ts:203-227` defines `referenceVideoItems` as an ordered collection displayed only under `createMode: ['reference_videos']`.
- The public copy at `create.operation.ts:210` and item description at `create.operation.ts:227` state URL/`asset://` only, explicitly exclude `binary/base64`, and document official media constraints: mp4/mov, 2-15 seconds, up to 3 videos, total <=15 seconds, <=50MB each, FPS 24-60.
- `test/createValidator.test.ts:23-35` proves valid `reference_videos` accepts 1-3 URL or `asset://` strings and may omit prompt.
- `test/createValidator.test.ts:116-166` proves invalid missing/over-limit/blank inputs and `data:video/mp4;base64,...` or `binary:video` are rejected locally.

### Execute-path proof (`CRTK-10`)

- `nodes/Seedance/Seedance.node.ts:273` includes `referenceVideoItems` in the shipped node description list.
- `nodes/Seedance/Seedance.node.ts:367` accepts `reference_videos` in the create-mode union used by the create operation.
- `nodes/Seedance/Seedance.node.ts:413-414` is the exact execute wiring: when `createMode === 'reference_videos'`, `collectReferenceVideosForCreate(itemIndex)` is assigned to `createInput.referenceVideos`.
- `test/seedanceReferenceVideoExecute.test.ts:81-111` captures the actual create request and proves three ordered inputs are submitted as `reference_video` content items: URL, `asset://library/ref-2`, URL.
- The same execute test asserts request summary reports `createMode === 'reference_videos'`, `referenceVideoCount === 3`, and does not include raw URL/asset content.

### Payload and request-summary proof

- `nodes/Seedance/shared/mappers/createPayload.ts:76-82` iterates `input.referenceVideos` in order and appends `type: 'video_url'`, `role: 'reference_video'`, and `video_url.url` to the API content array.
- `test/createPayload.test.ts:342-358` asserts the mapper preserves URL then `asset://seedance-video-123` order as two `reference_video` content items.
- `nodes/Seedance/shared/mappers/createPayload.ts:103-122` constructs `buildCreateRequestSummary()` with `referenceVideoCount` but without raw `referenceVideos`, URL, asset, or base64 fields.
- `test/createPayload.test.ts:374-379` asserts summary count behavior and raw asset redaction.

### Compatibility proof

- `test/seedanceReferenceVideoExecute.test.ts:114-134` injects hidden `referenceVideoItems` into a legacy `t2v` parameter set and proves the resulting payload contains no `reference_video` content.
- `test/seedanceVideoRegression.test.ts:19-53` keeps existing video create defaults and create endpoint behavior covered, showing the reference-video execution change is additive rather than a replacement of legacy create behavior.

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `CRTK-10` | `17-01-PLAN.md`, `21-01-PLAN.md` | Execute 分支能读取有序参考视频集合，并将 1 到 3 个参考视频映射为 `reference_video` 内容项，合法请求沿用现有 create response path。 | ✓ SATISFIED | Execute wiring: `Seedance.node.ts:413-414`; payload mapping: `createPayload.ts:76-82`; execute regression: `seedanceReferenceVideoExecute.test.ts:81-111`; mapper regression: `createPayload.test.ts:342-358`. |
| `CRTK-11` | `17-01-PLAN.md`, `21-01-PLAN.md` | 参考视频输入明确限制为 URL 或 `asset://` 素材 ID，不暴露 binary/base64 参考视频入口，并提示官方参考视频限制。 | ✓ SATISFIED | UI wording and display contract: `create.operation.ts:203-227`; validator positive/negative proof: `createValidator.test.ts:23-35,116-166`; execute harness throws if binary helpers are used for `reference_videos`: `seedanceReferenceVideoExecute.test.ts:52-55`. |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 17 verification gate | `npm run build && node --test "test/createValidator.test.ts" && node --test "test/createPayload.test.ts" && node --test "test/seedanceReferenceVideoExecute.test.ts"` | Passed on 2026-04-21 in this execution session. | ✓ PASS |
| Additive video compatibility gate | `npm run build && node --test "test/createValidator.test.ts" && node --test "test/createPayload.test.ts" && node --test "test/seedanceReferenceVideoExecute.test.ts" && node --test "test/seedanceVideoRegression.test.ts"` | Passed on 2026-04-21 in this execution session. | ✓ PASS |

## Audit Closure Status

The milestone audit blocker for Phase 17 was missing formal requirement-level verification, not missing implementation. This report closes that blocker by connecting three independent evidence layers:

1. Phase 17 implementation summary (`17-01-SUMMARY.md`) describes the intended reference-video execute behavior.
2. Shipped code now shows exact UI, execute, validator, payload, and request-summary contracts.
3. Regression tests prove the submitted create request preserves ordered URL/`asset://` references, redacts raw reference values from summary metadata, rejects binary/base64 reference-video inputs, and avoids legacy hidden `reference_video` leakage.

**Closure conclusion:** Phase 17 is verified for reference-video create execution evidence covering `CRTK-10` and `CRTK-11`.

## Gaps Summary

No Phase 17 verification gaps remain for `CRTK-10` or `CRTK-11`.

Out-of-scope boundaries retained intentionally:

- No claim of remote media metadata probing for mp4/mov duration, total duration, size, or FPS; those official limits are documented and left to API-side enforcement.
- No claim of binary/base64 reference-video support; the verified behavior is explicit non-support.
- No Phase 18/22 lifecycle, release, README, or docs verification is claimed here.

---

_Verified: 2026-04-21T07:50:08Z_
_Verifier: the agent (gsd-executor)_
