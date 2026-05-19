# Phase 17 Research: Compatibility Regression Strategy

**Date:** 2026-05-19
**Phase:** 17 - 既有模式与 lifecycle 兼容性
**Status:** Complete

## Research Goal

Find the lowest-risk way to prove that the v1.3 multimodal additions did not change already shipped video create modes, task lifecycle behavior, wait/download behavior, or Seedream image generation.

## Codebase Findings

### Existing Test Harnesses

- `test/seedanceVideoRegression.test.ts` already has `createVideoExecutionContext()`, captures HTTP request options, records requested node parameters, and supports binary input fakes.
- `test/seedanceGetWaitMode.test.ts` already executes `Seedance.prototype.execute.call(context)` for immediate get and wait branches.
- `test/seedanceDownloadFlow.test.ts` already captures the task GET call and the optional media download call.
- `test/seedanceGenerateImageExecute.test.ts` already has an image execution fake that can throw when saved workflows are missing old video parameters.
- `test/taskMapper.test.ts` and `test/taskPolling.test.ts` already cover pure mapper and polling semantics; Phase 17 should add execute-level compatibility where user decisions require it.

### Runtime Boundaries

- Top-level dispatch in `nodes/Seedance/Seedance.node.ts` reads `generationMode` first.
- Image mode should enter the Seedream branch without reading video-only `operation`, `createMode`, `referenceMaterials`, first-frame, or last-frame parameters.
- Video create only collects `referenceMaterials` when `createMode === 'multimodal_reference'`.
- Old create modes still flow through `buildCreatePayload()`, so execute-level tests should assert the captured HTTP body, not only mapped output.
- Get/list/delete all call the same Seedance task endpoint family and are best protected by HTTP method/path/query/output assertions at node execution level.
- Wait/download behavior is controlled by `pollTaskUntilSettled()` and a guarded call to `downloadSeedanceVideo()` only when the task is succeeded and has a non-empty `videoUrl`.

## Recommended Plan Split

1. **Old video create compatibility.**
   - Proves `t2v`, `i2v_first`, and `i2v_first_last` still send exact v1.2-style content roles and do not read or emit multimodal references.
   - Best home: `test/seedanceVideoRegression.test.ts`.

2. **Lifecycle plus wait/download compatibility.**
   - Proves `get`, `list`, `delete`, wait terminal outcomes, timeout, and binary download attachment conditions at execute level.
   - Best homes: `test/seedanceVideoRegression.test.ts`, `test/seedanceGetWaitMode.test.ts`, and `test/seedanceDownloadFlow.test.ts`.

3. **Seedream image isolation.**
   - Proves image execution remains independent from video multimodal helpers and preserves existing image behaviors.
   - Best home: `test/seedanceGenerateImageExecute.test.ts`; only use `test/seedreamImageOperationContract.test.ts` if description-level fallout appears.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Compatibility tests only check output, missing changed HTTP body. | Old workflows could silently submit different provider payloads. | Capture `Seedance.prototype.execute.call(context)` HTTP body for each old create mode. |
| Saved workflow hidden fields accidentally affect old modes. | Old nodes saved before/after v1.3 could behave differently. | Include stale `referenceMaterials` and assert old modes do not read it or emit `reference_*` roles. |
| List/delete coverage stays mapper-only. | Node-level query/path regressions could ship. | Add execute-level capture for list filters, pagination, DELETE path, and success envelope. |
| Wait/download tests cover only one task family. | Multimodal task lifecycle could diverge from old video tasks. | Use response shapes for old and multimodal-created tasks; verify common mapped output and download conditions. |
| Image path reads video fields while hidden in UI. | Seedream saved workflows could fail after video additions. | Use an image fake that throws if video-only parameters are read without fallback. |

## Verification Command

Phase 17 should finish with:

```powershell
npm run build
node --test test/*.test.ts
```

Focused commands are useful during execution, but full regression is required before phase completion.

## Research Complete

No external research is needed. The phase is a local compatibility regression phase, and all relevant contracts are in the committed code, tests, and Phase 17 context.
