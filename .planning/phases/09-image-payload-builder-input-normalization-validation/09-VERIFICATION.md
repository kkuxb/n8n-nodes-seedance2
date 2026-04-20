---
phase: 09-image-payload-builder-input-normalization-validation
verified: 2026-04-20T05:12:17Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
---

# Phase 09: Image Payload Builder, Input Normalization & Validation Verification Report

**Phase Goal:** Build the request-shaping and validation layer for Seedream 5.0 lite image generation.
**Verified:** 2026-04-20T05:12:17Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `buildSeedreamImagePayload()` maps prompt, references, group options, web search, prompt optimization, fixed `b64_json`, and Seedream size. | ✓ VERIFIED | `09-01-SUMMARY.md` records the mapper, `SEEDREAM_IMAGE_RESPONSE_FORMAT`, reference support, web search, prompt optimization, and `mapSeedreamRecommendedSize()`. |
| 2 | URL, base64/data URL, binary, and multiple reference inputs normalize into official image request shapes. | ✓ VERIFIED | `09-01-SUMMARY.md` records URL/data URL compatibility, binary reference handling, and multiple-reference mapper tests. |
| 3 | `validateSeedreamImageInput()` enforces reference count, MIME, 10MB binary limit, `maxImages`, `referenceCount + maxImages <= 15`, and Seedream resolution/aspect-ratio validation for `VAL-IMG-02`. | ✓ VERIFIED | `09-02-SUMMARY.md` records the validator, reference-count limits, binary MIME allowlist, 10MB limit, `maxImages` range, combined group limit, and official recommended size lookup. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `nodes/Seedance/shared/mappers/seedreamImagePayload.ts` | Payload builder and recommended-size mapper | ✓ VERIFIED | Current source defines `buildSeedreamImagePayload()` and `mapSeedreamRecommendedSize()`; summaries report focused tests passed. |
| `nodes/Seedance/shared/validators/seedreamImage.ts` | Runtime image input validator | ✓ VERIFIED | Current source defines `validateSeedreamImageInput()` with count, MIME, byte-size, group, and recommended-size checks. |
| `nodes/Seedance/shared/constants.ts` | Seedream response, reference, MIME, and recommended-size constants | ✓ VERIFIED | `09-01-SUMMARY.md` records constants for `b64_json`, reference limits, MIME allowlist, and official recommended sizes. |
| `test/seedreamImagePayload.test.ts` | Mapper coverage | ✓ VERIFIED | `09-01-SUMMARY.md` reports prompt-only, URL/data URL, binary, multiple reference, group, web search, prompt optimization, and size mapping coverage. |
| `test/seedreamImageValidation.test.ts` | Validator coverage | ✓ VERIFIED | `09-02-SUMMARY.md` reports validation tests for counts, MIME, byte-size, maxImages, and invalid size selections. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `seedreamImagePayload.ts` | `constants.ts` | `SEEDREAM_RECOMMENDED_IMAGE_SIZES` and `SEEDREAM_IMAGE_RESPONSE_FORMAT` | ✓ WIRED | Current mapper imports constants and maps resolution/aspect-ratio through `mapSeedreamRecommendedSize()`. |
| `seedreamImagePayload.ts` | `types.ts` | `SeedreamImagePayloadInput` and reference types | ✓ WIRED | Current mapper imports the image payload and reference types. |
| `seedreamImage.ts` | `constants.ts` | reference limits, MIME allowlist, sizes | ✓ WIRED | Current validator imports reference count, max bytes, MIME types, resolutions, ratios, and recommended-size table. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `buildSeedreamImagePayload()` | `payload.image` | URL/data URL/binary references normalized by `normalizeSeedreamReferenceImage()` | Yes — single reference becomes string, multiple references become array | ✓ FLOWING |
| `buildSeedreamImagePayload()` | `payload.size` | `imageResolution` + `imageAspectRatio` | Yes — resolved through official recommended-size table | ✓ FLOWING |
| `validateSeedreamImageInput()` | validation errors | user-provided reference and group options | Yes — invalid count/MIME/size/maxImages/ratio combinations throw before API call | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Payload mapper build/test gate | `npm run build`; `node --test test/seedreamImagePayload.test.ts test/seedreamImageOperationContract.test.ts test/createPayload.test.ts` | Reported passed in `09-01-SUMMARY.md` | ✓ PASS |
| Validator build/test gate | `npm run build`; `node --test test/seedreamImageValidation.test.ts test/seedreamImagePayload.test.ts test/createPayload.test.ts` | Reported `26/26` passed in `09-02-SUMMARY.md` | ✓ PASS |
| VAL-IMG-02 validation path | Source inspection of `validateSeedreamImageInput()` and `mapSeedreamRecommendedSize()` | Recommended resolution/aspect-ratio checks exist and are tested | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| IMG-03 | 09-01 | Prompt-only payload generation | ✓ SATISFIED | Prompt-only mapper tests reported in `09-01-SUMMARY.md`. |
| IMG-04 | 09-01 | Reference image normalization | ✓ SATISFIED | URL/data URL/binary and multiple-reference mapper coverage reported. Public UI scope was later refined to URL/binary with base64 internal fallback. |
| IMG-05 / IMG-06 / VAL-IMG-03 | 09-01, 09-02 | Group image options and total count validation | ✓ SATISFIED | `referenceCount + maxImages <= 15` enforced by validator and documented in summary. |
| VAL-IMG-01 | 09-02 | Reference input runtime validation | ✓ SATISFIED | Reference count, MIME, and 10MB binary limit enforced. |
| VAL-IMG-02 | 09-02 | Seedream 5.0 lite recommended size validation | ✓ SATISFIED | `mapSeedreamRecommendedSize()` and validator enforce official resolution/aspect-ratio combinations. |

### Gaps Summary

No blocking gaps found. `VAL-IMG-02` is implemented and formally traced here; Phase 13 reconciles the requirement checkbox and wording.
