---
phase: 15
slug: payload
status: complete
created: 2026-05-19T15:06:17+08:00
---

# Phase 15 Pattern Map

## Files and Closest Analogs

| Target File | Role | Closest Analog | Pattern to Reuse |
|-------------|------|----------------|------------------|
| `nodes/Seedance/shared/validators/create.ts` | Input contract and payload-level validation | `nodes/Seedance/shared/validators/seedreamImage.ts` and existing `validateCreateInput()` | Plain `Error` messages in Chinese; typed input object; keep format-heavy validation separate from payload-level rules |
| `nodes/Seedance/shared/mappers/createPayload.ts` | Official payload and request summary mapping | Existing text / first-frame / last-frame mapper code in same file | Build `content` as ordered `IDataObject[]`; preserve API field names at boundary; keep mapper pure |
| `nodes/Seedance/Seedance.node.ts` | n8n parameter and binary collection | `processBinaryImage()` and `processSeedreamBinaryReference()` | Use `assertBinaryData()`, inspect `items[itemIndex].binary?.[prop].mimeType`, and call `getBinaryDataBuffer()` only for supported binary paths |
| `test/createPayload.test.ts` | Unit contract tests | Existing payload and summary tests in same file | Dynamic import from `dist`; exact `assert.deepEqual` payload assertions; Chinese test names |
| `test/seedanceVideoRegression.test.ts` | Execute-level regression tests | Existing hand-built `createVideoExecutionContext()` | Capture HTTP body; assert requested parameters and binary helper calls |

## Implementation Guidance

- Keep official `content.type` strings local to payload mapping: `image_url`, `video_url`, `audio_url`.
- Keep role strings local to payload mapping and summary mapping: `reference_image`, `reference_video`, `reference_audio`.
- Avoid adding behavior to `nodes/Seedance/description/create.operation.ts`; Phase 14 already completed UI shape.
- Prefer small helper functions in `createPayload.ts` for media-to-role/content mapping so tests can exercise behavior through `buildCreatePayload()`.
- Convert `collectSeedanceReferenceMaterials()` to async only if needed for binary reads; keep the call site narrow inside `createMode === "multimodal_reference"`.
- Existing tests import `dist`, so every verification command must run `npm run build` before `node --test`.

