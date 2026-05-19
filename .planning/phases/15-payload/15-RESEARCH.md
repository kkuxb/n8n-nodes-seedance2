---
phase: 15
slug: payload
status: complete
created: 2026-05-19T15:06:17+08:00
---

# Phase 15 Research — 参考媒体来源与官方 payload

## Research Complete

Phase 15 should implement the official Seedance 2.0 multimodal payload path by extending the existing video create mapper and execution collection path. The lowest-risk approach is to keep the existing non-multimodal create contracts intact, add normalized multimodal reference entries to `SeedanceCreateInput`, and let `buildCreatePayload()` own official `content` construction.

## Official Contract Findings

- `APIdocs/seedance2.0文档.md` defines multimodal create payloads under `content`, using `text`, `image_url`, `video_url`, and `audio_url` objects.
- Reference image content uses `{ type: "image_url", role: "reference_image", image_url: { url } }`.
- Reference video content uses `{ type: "video_url", role: "reference_video", video_url: { url } }`.
- Reference audio content uses `{ type: "audio_url", role: "reference_audio", audio_url: { url } }`.
- Image and audio URL fields may contain public URLs, data URLs, or `asset://<ASSET_ID>` values. Video URL fields may contain public URLs or `asset://<ASSET_ID>` values.
- Multimodal mode is mutually exclusive with first-frame and first/last-frame roles.
- Audio cannot be used alone; at least one reference image or video is required when audio is present.

## Existing Code Findings

- `nodes/Seedance/Seedance.node.ts` already collects Phase 14 `referenceMaterials`, but the collector is synchronous and currently skips empty values. Phase 15 needs this path to become strict and binary-aware.
- `nodes/Seedance/shared/validators/create.ts` currently defines `SeedanceReferenceMaterialInput` as `{ materialType, materialSource, value }` and only rejects video binary.
- `nodes/Seedance/shared/mappers/createPayload.ts` currently sends prompt and first/last-frame content only. Phase 14 tests intentionally assert that multimodal reference roles are not sent yet; Phase 15 must replace those assertions.
- `buildCreateRequestSummary()` already exposes aggregate `referenceCount`, `referenceTypes`, and `referenceSources`; Phase 15 should keep those fields and add a safe per-reference array.

## Recommended Implementation Shape

1. Extend the reference material type so each item can carry a normalized official URL value and its user-facing source kind.
2. Add small pure helpers in `createPayload.ts` or a nearby shared helper:
   - map media type to content type and role,
   - normalize `asset://` values,
   - build safe reference summary items.
3. Move combination and count validation into `validateCreateInput()` because these are payload-level constraints tied to `SeedanceCreateInput`.
4. Convert `collectSeedanceReferenceMaterials()` in `Seedance.node.ts` to an async collector so image/audio binary references can call `assertBinaryData()` and `getBinaryDataBuffer()`.
5. Preserve existing text-to-video, first-frame, and first/last-frame logic. This phase should only add multimodal reference content when `createMode === "multimodal_reference"`.

## Validation Architecture

Use existing Node.js test infrastructure after build:

- Quick command: `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`
- Full command: `npm run build && node --test test/*.test.ts`

Automated coverage should include:

- pure payload tests for image/video/audio content shapes, role mapping, ordering, asset normalization, empty item errors, audio-only rejection, prompt-only rejection, and count limits;
- request summary tests proving aggregate fields are retained and per-reference summaries expose only `index`, `type`, `role`, and `source`;
- execute-level tests proving URL, asset, and image/audio binary sources are collected into the HTTP body correctly while video binary remains unavailable/rejected;
- regression tests proving first-frame and text-to-video payloads remain unchanged.

## Risks and Mitigations

- **Risk:** Existing collector silently skips empty rows, violating Phase 15 order decisions.  
  **Mitigation:** Make row presence strict: if the user added an item, its active value field must be non-empty after trim.
- **Risk:** Binary conversion pulls in Phase 16 format validation too early.  
  **Mitigation:** Only require MIME presence in Phase 15; leave MIME allowlists, size, duration, codec, and request-size limits for Phase 16.
- **Risk:** Summary accidentally leaks raw URLs, binary property names, Base64, or asset IDs.  
  **Mitigation:** Build per-reference summaries from normalized metadata only, not from raw values.
- **Risk:** Updating temporary Phase 14 tests could hide regressions.  
  **Mitigation:** Replace "does not send reference role" assertions with positive official payload assertions and keep old-mode contract tests.

