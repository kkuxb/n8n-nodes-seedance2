# Phase 14: 多模态入口与参考素材表单 - Research

**Date:** 2026-05-19
**Status:** Complete

## Research Scope

This phase is limited to the user-facing entry point and n8n parameter form for Seedance 2.0 multimodal reference video generation. It must not implement the official multimodal `content` payload mapping, media-source normalization, or full validation rules reserved for Phases 15 and 16.

## Findings

### Existing n8n Form Pattern

- `nodes/Seedance/description/create.operation.ts` owns all video create parameters and already uses `displayOptions` keyed by `createMode`.
- `nodes/Seedance/description/image.operation.ts` has a reusable `fixedCollection` + `multipleValues: true` pattern for repeatable reference inputs.
- The clean Phase 14 implementation is to add a multimodal-only `fixedCollection` under the existing video create operation rather than creating a new node or operation.

### Existing Runtime Pattern

- `nodes/Seedance/Seedance.node.ts` already collects create parameters into `SeedanceCreateInput`.
- `nodes/Seedance/shared/validators/create.ts` owns `createMode` typing and mode-specific minimum input checks.
- `nodes/Seedance/shared/mappers/createPayload.ts` turns existing prompt/first/last-frame inputs into official `content` entries.
- Phase 14 should extend types and collection enough that the new mode is execution-safe, but should not map reference素材 to official `image_url` / `video_url` / `audio_url` payload entries yet. That belongs to Phase 15.

### Official API Constraints Relevant To Form Design

- Seedance 2.0 supports a multimodal reference mode using reference images, videos, audio, and optional prompt.
- Reference-frame modes and multimodal reference mode are mutually exclusive API scenarios. In the node this is naturally represented by `createMode` as a single-select field.
- Image sources may be URL, Base64/data URL, or Volcengine `asset://` material. The Phase 14 decision is to expose URL, Binary文件, and 火山方舟素材库 only; direct Base64 text input is intentionally hidden.
- Video sources are URL or `asset://`; do not expose video Binary文件.
- Audio sources may be URL, Base64/data URL, or `asset://`; Phase 14 exposes URL, Binary文件, and 火山方舟素材库.
- Real-person face reference guidance should be placed near image value fields.

## Planning Implications

- Plan 01 should implement the UI schema and type surface: new create mode, `参考素材` repeatable list, source-dependent display rules, prompt copy, face-restriction copy, and tests for property shape.
- Plan 02 should make the new UI execution-safe: collect reference素材 into typed input, permit prompt/reference list to be empty in multimodal mode, avoid first/last-frame roles for multimodal mode, keep advanced options optional, and add regression tests proving old modes remain unchanged.

## Risks

- If Phase 14 sends partial multimodal payloads before Phase 15, users may think the feature is fully functional. Plans must keep payload mapping explicit and bounded.
- ROADMAP/REQUIREMENTS previously required an optional label field. This was reconciled before planning by updating the planning docs to match `CONTEXT.md`: no label/tag/note field.

## Research Complete

The codebase supports a small, additive implementation split into a UI-schema plan and an execution-safety/regression plan.
