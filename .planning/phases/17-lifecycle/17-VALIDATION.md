# Phase 17 Validation Plan

**Date:** 2026-05-19
**Phase:** 17 - 既有模式与 lifecycle 兼容性

## Validation Scope

Phase 17 validates compatibility only. It should not add new user-facing behavior, new UI fields, new API features, or new documentation.

## Required Automated Checks

### Plan 17-01

```powershell
npm run build
node --test test/seedanceVideoRegression.test.ts
```

Must prove:

- old `t2v` body remains exact
- old `i2v_first` body keeps `first_frame`
- old `i2v_first_last` body keeps `first_frame` and `last_frame`
- old modes ignore stale multimodal saved-workflow fields
- old modes emit no `reference_image`, `reference_video`, or `reference_audio`

### Plan 17-02

```powershell
npm run build
node --test test/seedanceVideoRegression.test.ts test/seedanceGetWaitMode.test.ts test/seedanceDownloadFlow.test.ts
```

Must prove:

- get immediate mode makes one GET request with `id`
- list sends selected filters and pagination and returns one item with `json.tasks`
- delete sends the locked DELETE path and returns the existing success envelope
- wait covers succeeded, failed, and timeout
- download attaches `binary.video` only when the task succeeded, `downloadVideo=true`, and `videoUrl` is non-empty

### Plan 17-03

```powershell
npm run build
node --test test/seedanceGenerateImageExecute.test.ts test/seedreamImageOperationContract.test.ts
node --test test/*.test.ts
```

Must prove:

- image generation does not read video-only parameters
- prompt-only and image-to-image Seedream behavior remains stable
- grouped image generation and advanced image options remain stable
- full suite passes

## Completion Gate

Before Phase 17 can be marked complete:

```powershell
npm run build
node --test test/*.test.ts
```

The phase should produce summary and verification artifacts during execution.
