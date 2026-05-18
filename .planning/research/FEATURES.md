# Feature Landscape

**Domain:** n8n community node support for Seedance 2.0 multimodal reference video generation
**Researched:** 2026-05-18
**Overall confidence:** MEDIUM

## Scope

This research is milestone-scoped to v1.3: adding Seedance 2.0 multimodal reference video generation to the existing `Seedance` node. It intentionally does not revisit shipped Seedance lifecycle behavior or Seedream image generation except where the new feature depends on them.

The primary Volcengine API page (`/docs/82379/1520757?lang=zh`) was checked first. In this environment it renders as a JavaScript app shell, so the exact request field tables and examples were not extractable from the page body. Field-level implementation for v1.3 must be verified against the live official page or a real API/template-code sample before coding. Adjacent official Volcengine docs do confirm the important product behavior around trusted assets, human-face restrictions, `asset://` references, API-key usage, and asynchronous task lifecycle.

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Seedance 2.0 model selection | v1.3 is specifically about Seedance 2.0, not the older 1.x models. | Low | Keep the current model picker focused on `doubao-seedance-2-0-260128` and `doubao-seedance-2-0-fast-260128`, but verify the exact model IDs on the live official API page before release. |
| Additive video create path | Existing n8n users already have create/get/list/delete/wait/download video lifecycle behavior. | Medium | New multimodal request shaping must plug into the current `create` operation without breaking `get`, `list`, `delete`, wait polling, or binary video download. |
| Prompt plus reference-media input | Seedance 2.0 generation in the official experience is centered on instructions plus reference materials. | Medium | n8n UI should support a text prompt plus a repeatable reference collection. Validate at least one useful input is present. Exact `content` item names and allowed modalities require live API verification. |
| URL, binary, and asset URI reference sources | Existing Seedream image references already use n8n-friendly URL/binary patterns; official Seedance 2.0 docs emphasize asset IDs/URIs for trusted materials. | Medium | Reuse the shipped URL/binary multi-value pattern where practical. Add first-class `asset://` entry or "Asset ID" entry that normalizes to `asset://...`. |
| Role-aware references | Users need to express whether media is a first frame, last frame, or general reference. | Medium | Existing video create supports `first_frame` and `last_frame`. Official trusted-asset examples use `role: reference_image`. Add a role selector, but verify exact allowed roles for image/video/audio references before implementation. |
| Trusted person/virtual-person asset support | Official docs say Seedance 2.0 uses a trusted asset library for virtual and real-person generation. | Medium | Let users paste Asset ID/URI from Volcengine. Do not build asset enrollment in the node. |
| Human-face direct-upload guardrails | Official virtual-person docs state Seedance 2.0 does not support directly uploading reference images/videos that contain real human faces. | Medium | UI copy and validation should warn that real human actors must use authorized trusted assets. The node cannot reliably detect all faces locally, so this is a preflight warning plus API error surfacing, not biometric analysis. |
| Image reference binary normalization | n8n users expect binary media from previous workflow steps to work. | Medium | Convert binary images to API-supported URL/data form only if official API permits it for non-human content. If the API requires remote URLs or assets only, reject binary input with a clear message. |
| Video and audio reference placeholders | The milestone calls this "multimodal reference video generation"; users will expect more than still-image first/last-frame control. | High | Model the UI/data structure so video/audio reference sources can be added, but keep final enabled modalities gated by official field verification. Exact fields, max counts, formats, and size limits are not authoritative from the JS-rendered primary page. |
| Standard generation controls | Users expect duration, ratio, resolution, seed, watermark, audio generation, and return-last-frame controls to remain available. | Low | Existing create UI already has these controls. Reconfirm Seedance 2.0 limits before changing validation. Current local validation says 480p/720p, 4-15s or auto, ratios including adaptive. |
| Request summary without raw media | n8n users need debuggable outputs, but binary/base64 payloads should not be echoed. | Low | Return model, prompt presence, reference count, reference sources, roles, duration/ratio/resolution, and flags. Never include raw binary data or full base64 strings in `requestSummary`. |
| Preserve asynchronous task UX | Official adjacent API docs describe async task creation followed by task status lookup. | Low | Keep create returning `taskId`, keep get/wait/download behavior, and keep expiry/retention messaging. Do not make task creation synchronously block by default. |
| Clear API uncertainty messages | The official page could not be extracted here, and third-party snippets are not authoritative for fields. | Low | Requirements and implementation should explicitly mark fields/counts needing live official-doc/API verification before coding or release. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Asset ID convenience mode | Reduces mistakes when users copy `asset-...` IDs from Volcengine instead of full URIs. | Low | Offer source type "Volcengine Asset ID/URI"; auto-prefix bare `asset-...` values with `asset://`. |
| Reference collection with per-item labels | n8n workflows often pass several media items; labels make outputs and errors understandable. | Medium | Allow optional label/name per reference and include it in validation errors and request summary. |
| Compliance-aware UI text | Prevents a high-friction failure mode for human-face content. | Low | Explain that direct real-person face uploads are not supported and authorized person assets must be created/accepted in Volcengine first. |
| Last-frame chaining workflow | Official adjacent API docs describe returning the last frame to create continuous videos. | Medium | Keep `returnLastFrame`; expose returned `lastFrameUrl`/binary clearly so the next item can use it as a first-frame reference. |
| Binary-to-reference reuse from Seedream | Reusing shipped Seedream normalization patterns keeps workflow authoring consistent across image and video modes. | Medium | Add shared reference normalization only where it matches official Seedance behavior; do not over-generalize if video/audio references differ. |
| Defensive payload preview in output | Helps users debug automation without opening Volcengine console. | Low | Include sanitized content summary: `[{type, role, source, label}]`, counts, and omitted-media notes. |
| Template-code parity workflow | Official virtual-person docs say the Seedance 2.0 template library can show REST API sample code. | Medium | Provide an "advanced content JSON" import only after exact official schema is verified. This should be a power-user option, not the default UI. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Guessing exact API fields from third-party mirrors | Source rules forbid treating mirrors/blogs/snippets as authoritative for exact request field names. | Verify exact fields against the live official page, copied template REST code, or real API responses before implementation. |
| Direct real-person face upload as a happy path | Official docs say Seedance 2.0 does not support direct uploads containing real human faces. | Support trusted `asset://` references and document the external Volcengine authorization/enrollment flow. |
| Asset library management inside n8n | Real-person asset enrollment requires Volcengine console flows, identity/auth checks, and consent handling. | Let users paste Asset IDs/URIs obtained from Volcengine. |
| New standalone Seedance 2.0 node | Project decision is to keep a unified `Seedance` node and preserve existing lifecycle operations. | Add mode/fields inside the existing node. |
| Default synchronous generation | Video generation is asynchronous and may take long enough to make blocking workflows fragile. | Keep create asynchronous; keep optional wait/download behavior under existing get/wait UX. |
| Exposing base64/data URLs in output JSON | Leaks large payloads, slows n8n executions, and makes histories hard to inspect. | Store media in n8n binary where needed and summarize references in JSON. |
| Building prompt assistant/scriptwriter features | Out of scope for this milestone and would distract from API correctness. | Provide a prompt text box and maybe examples in docs later, not runtime prompt generation. |
| Adding third-party Seedance API providers | This package uses Volcengine Ark API Key credentials and official endpoints. | Stay on official Volcengine APIs only. |
| Bulk generation/template management | The official experience may generate multiple videos/templates, but v1.3 is about reliable single-task multimodal create. | Defer batch/template orchestration to later phases or n8n workflow composition. |
| Hardcoding unverified modality limits | Exact max image/video/audio counts, sizes, durations, formats, and roles were not extractable from the primary API page here. | Put these behind verified constants after live-doc/API validation. |

## Feature Dependencies

```text
Official Seedance 2.0 field verification -> Payload mapper and validator constants
Existing create operation -> Multimodal create UI extension
Existing Seedream URL/binary patterns -> Reference source UX and binary normalization
Existing task mapper/polling/download -> Create/get/wait/download compatibility
Volcengine trusted asset library -> Real-person and virtual-person references
return_last_frame support -> Last-frame chaining workflows
```

## MVP Recommendation

Prioritize:

1. **Verified Seedance 2.0 create path** - Use the existing `create` operation and preserve lifecycle output. Confirm exact model IDs, endpoint path, content item schema, and option fields against the live official API page before coding.
2. **Reference collection for image/asset references** - Add repeatable references with source type URL, binary, or Volcengine Asset ID/URI; support `first_frame`, `last_frame`, and verified `reference_image` roles.
3. **Human-face and trusted-asset guardrails** - Warn against direct real-person face uploads and guide users toward `asset://` trusted assets.
4. **Sanitized request summary and regression tests** - Cover reference normalization, role mapping, validation, no raw base64 in output, and compatibility with wait/download lifecycle.

Defer:

- **Video/audio reference inputs:** likely important for full multimodal Seedance 2.0, but exact official request fields, roles, limits, and formats require live official-doc/API verification first.
- **Advanced raw content JSON:** useful for power users once the schema is stable, but dangerous before exact field verification.
- **Asset enrollment/management:** belongs in Volcengine console, not this n8n node.
- **Batch/template orchestration:** n8n can compose repeated executions; this milestone should focus on one correct task request per item.

## Source Confidence

| Finding | Confidence | Source Notes |
|---------|------------|--------------|
| Primary API doc exists for create video task and was updated recently | MEDIUM | Official page linked by user is accessible only as JS shell in this environment; title/nav/update metadata were visible, but body fields were not extractable. |
| Seedance 2.0 uses trusted `asset://` references for virtual/real-person materials | HIGH | Official virtual-person and real-person material docs expose asset ID/URI behavior and API sample shape. |
| Direct real-person face reference image/video uploads are not supported | HIGH | Official virtual-person library doc states this restriction. |
| Real-person material flow requires external authorization/enrollment | HIGH | Official real-person material doc describes consent, asset groups, acceptance, and material validation. |
| Async task lifecycle, statuses, 24h output URL expiry, `return_last_frame` concept | MEDIUM | Official LAS Seedance operator docs describe the same task lifecycle and reference Ark create-video content, but are not the primary Seedance 2.0 API page. Existing project behavior already implements this lifecycle. |
| Exact v1.3 content fields for image/video/audio references | LOW | Must be verified live from official docs/API/template REST sample. Do not rely on third-party mirrors for exact names. |

## Research Flags for Requirements

- Before implementation, run a live verification pass on `https://www.volcengine.com/docs/82379/1520757?lang=zh` with a browser or Volcengine template-code sample and record exact request schema.
- Verify whether binary/data URL media is accepted for Seedance 2.0 references, or whether media must be remote URL / `asset://` only.
- Verify exact supported modalities for create-video API: image, video, audio, and whether they are separate `*_url` item types or another content schema.
- Verify exact modality limits: max counts, file formats, sizes, duration windows, total duration, supported roles, and whether limits differ between standard and fast models.
- Verify `generate_audio` behavior for Seedance 2.0 specifically; adjacent official docs mention the field for older models, while the v1.3 feature targets Seedance 2.0.
- Verify resolution support for Seedance 2.0. Current local validation permits only 480p and 720p, while non-primary ecosystem snippets mention higher resolutions. Official API page must decide.

## Sources

- Official primary API page checked first: https://www.volcengine.com/docs/82379/1520757?lang=zh
- Official virtual-person library doc: https://www.volcengine.com/docs/82379/2223965?lang=zh
- Official real-person material enrollment doc: https://www.volcengine.com/docs/82379/2315856?lang=zh
- Official Seedance operator/lifecycle reference in LAS docs: https://www.volcengine.com/docs/6492/2165104?lang=zh
- Local project context: `.planning/PROJECT.md`
- Local architecture context: `.planning/codebase/ARCHITECTURE.md`
- Local conventions context: `.planning/codebase/CONVENTIONS.md`
