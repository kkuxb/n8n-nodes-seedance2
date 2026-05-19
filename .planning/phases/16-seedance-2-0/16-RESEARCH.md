---
phase: 16
slug: seedance-2-0
status: complete
created: 2026-05-19T08:45:00Z
sources:
  - APIdocs/seedance2.0文档.md
  - .planning/phases/16-seedance-2-0/16-CONTEXT.md
  - nodes/Seedance/shared/validators/create.ts
  - nodes/Seedance/description/create.operation.ts
  - nodes/Seedance/Seedance.node.ts
  - nodes/Seedance/shared/mappers/createPayload.ts
---

# Phase 16 Research — Seedance 2.0 参数与本地校验

## Scope Answer

Phase 16 should turn the official Seedance 2.0 limits into deterministic local validation where the node can know the answer before sending the request. The safe boundary is strict for local binary metadata and request parameters, but intentionally non-invasive for URL and `asset://` media because remote probing would add latency, privacy risk, and false rejects for signed or extensionless URLs.

## Official Contract Findings

### Media limits

| Media | Official limits | Locally knowable in Phase 16 |
|-------|-----------------|------------------------------|
| Image reference | Formats `jpeg`, `png`, `webp`, `bmp`, `tiff`, `gif`, plus Seedance 2.0 `heic` and `heif`; 1-9 multimodal images; single image under 30 MB; request body under 64 MB; width/height and aspect-ratio limits also documented. | Count, binary MIME, binary byte length, binary data-url/request-size contribution. Dimensions/aspect ratio are not locally available without adding metadata parsing and were explicitly ruled out in CONTEXT. |
| Video reference | URL or asset only; `mp4`/`mov`; max 3 videos; individual and total duration constraints; resolution, size, pixel count, FPS, MIME/codec constraints. | Count and source kind only. No video binary path exists. URL/asset video metadata is not locally knowable without remote probing, which CONTEXT forbids. |
| Audio reference | URL, Base64/data URL, or asset; `wav`/`mp3`; max 3 audio files; individual and total duration constraints; single audio under 15 MB; request body under 64 MB. | Count, binary MIME, binary byte length, binary data-url/request-size contribution. Duration is not locally available without audio parsing and was explicitly ruled out. |

### Generation parameters

| Parameter | Official contract | Current state | Phase 16 action |
|-----------|-------------------|---------------|-----------------|
| `resolution` | `480p`, `720p`, `1080p`; `1080p` unsupported by Seedance 2.0 Fast. | UI and validator only allow `480p`/`720p`. | Add standard-model `1080p`; hide from Fast UI; defensively reject Fast + `1080p`. |
| `ratio` | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9`, `adaptive`. | Already represented. | Preserve and test. |
| `duration` | Seedance 2.0 supports integer `[4,15]` or `-1`. | Already represented. | Preserve and test first-error behavior. |
| `seed` | Integer `[-1, 2^32-1]`. | Already validated. | Preserve and test edge cases. |
| `execution_expires_after` | Integer `[3600,259200]`, default `172800`. | Already validated when numeric. | Preserve and test body field. |
| `watermark` | Boolean, default false. | Already body field. | Preserve and test explicit false. |
| `generate_audio` | Boolean, Seedance 2.0 supported. | Already root UI and body field. | Preserve and test. |
| `return_last_frame` | Boolean, default false. | Already advanced option and body field. | Preserve and test. |
| `camera_fixed` | Seedance 2.0 not supported. | Not exposed/sent. | Add negative tests to keep it absent. |
| `tools.web_search`, `safety_identifier` | Official optional fields. | Not exposed. | Defer by user decision. |

## Codebase Findings

- `nodes/Seedance/shared/validators/create.ts` is the right place for first-error validation. It already checks model, mode requirements, counts, resolution, ratio, duration, timeout, and seed.
- `nodes/Seedance/Seedance.node.ts` currently converts multimodal image/audio binary references directly into data URLs before the shared validator can see original MIME and byte length. Phase 16 should extend `SeedanceReferenceMaterialInput` with optional local metadata such as `mimeType` and `byteLength`, then populate it in the runtime collector.
- `processBinaryImage()` already validates first/last-frame binary image MIME and 30 MB size, but its allowlist lacks Seedance 2.0 `heic` and `heif`. Phase 16 should share official image MIME constants where practical.
- `nodes/Seedance/shared/mappers/createPayload.ts` already sends body fields instead of prompt suffixes. Phase 16 should protect this with regression tests rather than reworking the mapper.
- `nodes/Seedance/description/create.operation.ts` must implement the user decision to dynamically hide `1080p` for Fast. The least invasive n8n pattern is two mutually exclusive resolution property declarations with the same `name: "resolution"` and different `displayOptions` by `model`.

## Recommended Plan Shape

1. Wave 1 should establish constants, shared input metadata, validator rules, UI resolution options, and pure mapper/validator tests.
2. Wave 2 should wire runtime binary metadata into `Seedance.execute()` and add execute-level tests proving the HTTP request is blocked before the API call for invalid binary MIME/size, while URL/asset sources remain unprobed.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dynamic resolution UI with duplicate `name: "resolution"` behaves unexpectedly in n8n. | Medium | Keep displayOptions mutually exclusive by model and add description tests. Validator remains defensive even if UI state leaks. |
| Request-size validation accidentally counts remote URL/asset file sizes by guessing. | Medium | Tests should prove signed/extensionless URLs and asset IDs are accepted when non-empty. Count only local binary/data-url payload contributions. |
| Adding media metadata fields leaks values into request summary. | High | Keep `requestSummary` unchanged; add negative leakage assertions after metadata extension. |
| First/last-frame binary behavior diverges from multimodal binary validation. | Medium | Reuse constants and focused tests for both binary paths where relevant. |

## Research Conclusion

Phase 16 is implementation-ready. The plan should preserve the current first-error validator style, avoid remote media probing, add local binary MIME/size validation metadata, allow 1080p only for the standard Seedance 2.0 model, and lock current body-field payload behavior with tests.

