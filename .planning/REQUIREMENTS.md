# Requirements: n8n-nodes-seedance2 v1.3

**Defined:** 2026-05-18
**Milestone:** v1.3 Seedance 2.0 multimodal reference video generation
**Core Value:** 让 n8n 用户可以用最少配置、可预期的方式接入 Seedance/Seedream 生成能力，并优先保证完整任务与产物流转体验。

## Milestone Scope

v1.3 upgrades the existing video-reference generation capability into the official Seedance 2.0 "多模态参考生视频" mode. It does not rebuild shipped text-to-video, first-frame image-to-video, first/last-frame image-to-video, Seedream image generation, credentials, or task lifecycle behavior.

Primary official source for this milestone:

- `APIdocs/seedance2.0文档.md`
- https://www.volcengine.com/docs/82379/1520757?lang=zh

## v1.3 Requirements

### Mode

- [x] **MODE-01**: User can select a distinct "多模态参考生视频" create mode inside the existing `Seedance` video create operation.
- [ ] **MODE-02**: User can continue using the existing 文生视频、首帧图生视频、首尾帧图生视频 modes without changed behavior.
- [x] **MODE-03**: User cannot accidentally mix 多模态参考生视频 with strict first-frame or first/last-frame roles; the node explains that strict first/last-frame control remains in the existing first-frame modes.

### References

- [x] **REF-01**: User can add 0-9 reference images in multimodal mode, each mapped to official `content` item type `image_url` with role `reference_image`.
- [x] **REF-02**: User can add 0-3 reference videos in multimodal mode, each mapped to official `content` item type `video_url` with role `reference_video`.
- [x] **REF-03**: User can add 0-3 reference audio files in multimodal mode, each mapped to official `content` item type `audio_url` with role `reference_audio`.
- [x] **REF-04**: User can combine reference images, reference videos, reference audio, and optional prompt text in the official supported multimodal combinations.
- [x] **REF-05**: User cannot submit audio-only multimodal requests; at least one reference image or reference video is required when audio is present.

### Sources

- [x] **SRC-01**: User can provide reference image sources as public URL, image Base64/data URL from n8n binary, or Volcengine `asset://` material ID/URI.
- [x] **SRC-02**: User can provide reference video sources as public URL or Volcengine `asset://` material ID/URI.
- [x] **SRC-03**: User can provide reference audio sources as public URL, audio Base64/data URL from n8n binary, or Volcengine `asset://` material ID/URI.
- [x] **SRC-04**: User entering a bare Volcengine asset ID can have it normalized to the official `asset://<ASSET_ID>` form where appropriate.
- [x] **SRC-05**: User is not offered video binary direct upload in v1.3 because the official Seedance 2.0 create-task document lists video URL and asset ID, not video Base64.

### Validation

- [ ] **VAL-01**: The node validates multimodal reference image count, image formats, single-image size, and total request-size limits according to the official document.
- [ ] **VAL-02**: The node validates multimodal reference video count, formats, resolution, duration, total duration, size, FPS, and MIME/codec constraints according to the official document where locally knowable.
- [ ] **VAL-03**: The node validates multimodal reference audio count, formats, duration, total duration, size, and request-size limits according to the official document where locally knowable.
- [ ] **VAL-04**: The node validates Seedance 2.0 duration, ratio, resolution, seed, execution timeout, watermark, and generate-audio options using the official body-parameter contract.
- [ ] **VAL-05**: The node allows 1080p for standard Seedance 2.0 but prevents 1080p for Seedance 2.0 Fast.
- [ ] **VAL-06**: The node does not expose or send `camera_fixed` for Seedance 2.0 because the official document says Seedance 2.0 does not support it.

### Payload

- [x] **PAY-01**: The create payload builder emits official `content` objects for text, `image_url`, `video_url`, and `audio_url` in multimodal mode.
- [ ] **PAY-02**: The create payload builder preserves the existing payload contract for 文生视频、首帧图生视频、首尾帧图生视频.
- [ ] **PAY-03**: The create payload builder sends supported generation options in the request body instead of appending weakly-validated prompt suffix parameters.
- [x] **PAY-04**: The request summary reports model, mode, prompt presence, reference counts, reference types, roles, source kinds, and option values without raw media payloads.

### UI

- [x] **UI-01**: The existing `Seedance` node exposes multimodal references as a repeatable `参考素材` list with `素材类型`, `素材来源`, and source-specific `素材URL` / `属性名` / `素材ID` fields. The list intentionally does not include a label field.
- [x] **UI-02**: The UI copy explains the official real-person face restriction and directs users to authorized Volcengine assets when relevant.
- [x] **UI-03**: The UI copy explains that multimodal mode can indirectly guide first/last-frame intent through prompt/reference materials, but strict first/last-frame consistency should use the existing first/last-frame mode.
- [x] **UI-04**: The UI keeps advanced v1.3 additions such as web search and safety identifier optional, so basic multimodal generation remains easy to configure.

### Compatibility

- [ ] **COMP-01**: Existing create/get/list/delete task lifecycle behavior remains compatible with shipped v1.2 workflows.
- [ ] **COMP-02**: Existing wait and video-download behavior remains compatible with multimodal tasks and shipped non-multimodal tasks.
- [ ] **COMP-03**: Existing Seedream image-generation paths remain unaffected by the new video multimodal reference helpers.
- [ ] **COMP-04**: Regression tests cover old video modes, new multimodal payload shaping, validation errors, n8n binary conversion for supported media, and execute-level HTTP body capture.

### Documentation

- [ ] **DOC-01**: README or user-facing docs describe how to configure multimodal reference images, videos, audio, and asset IDs in n8n.
- [ ] **DOC-02**: Docs list the official v1.3 limitations: multimodal/reference-frame mutual exclusion, audio cannot be used alone, video binary direct upload is not supported, and real-person direct face upload is restricted.
- [ ] **DOC-03**: Manual UAT verifies at least one multimodal create flow and the follow-up get/wait/download lifecycle against the documented behavior.

## Future Requirements

### Later Milestones

- **FUT-01**: User can manage or enroll Volcengine real-person/virtual-person assets directly from n8n.
- **FUT-02**: User can submit video binary directly if Volcengine later documents a supported video Base64/data URL path.
- **FUT-03**: User can use Seedance 1.5 pro Draft/sample-task flows.
- **FUT-04**: User can batch-generate multiple multimodal videos from one n8n item through a built-in batch mode.

## Out of Scope

| Feature | Reason |
|---------|--------|
| New standalone Seedance 2.0 node | Existing project decision keeps video/image generation inside one `Seedance` node and one shared credential. |
| New credential type | Existing `SeedanceApi` API Key credential already matches the official API Key authentication model. |
| Rebuilding文生视频/首帧图生视频/首尾帧图生视频 | These modes already exist; v1.3 only protects them from regression while adding multimodal mode. |
| Asset library or real-person authorization management | Official asset enrollment and consent flows belong in Volcengine console, not this n8n node. |
| Draft/sample-task generation | Official document says Draft is only supported by Seedance 1.5 pro, while this milestone targets Seedance 2.0 multimodal generation. |
| `camera_fixed` for Seedance 2.0 | Official document says Seedance 2.0 does not support it. |
| Video binary direct upload | Official document lists video URL and asset ID, not video Base64/data URL. |
| Prompt assistant/scriptwriter features | Useful later, but not required for correct multimodal API support. |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MODE-01 | Phase 14 | Complete |
| MODE-02 | Phase 17 | Pending |
| MODE-03 | Phase 14 | Complete |
| REF-01 | Phase 15 | Complete |
| REF-02 | Phase 15 | Complete |
| REF-03 | Phase 15 | Complete |
| REF-04 | Phase 15 | Complete |
| REF-05 | Phase 15 | Complete |
| SRC-01 | Phase 15 | Complete |
| SRC-02 | Phase 15 | Complete |
| SRC-03 | Phase 15 | Complete |
| SRC-04 | Phase 15 | Complete |
| SRC-05 | Phase 15 | Complete |
| VAL-01 | Phase 16 | Pending |
| VAL-02 | Phase 16 | Pending |
| VAL-03 | Phase 16 | Pending |
| VAL-04 | Phase 16 | Pending |
| VAL-05 | Phase 16 | Pending |
| VAL-06 | Phase 16 | Pending |
| PAY-01 | Phase 15 | Complete |
| PAY-02 | Phase 17 | Pending |
| PAY-03 | Phase 16 | Pending |
| PAY-04 | Phase 15 | Complete |
| UI-01 | Phase 14 | Complete |
| UI-02 | Phase 14 | Complete |
| UI-03 | Phase 14 | Complete |
| UI-04 | Phase 14 | Complete |
| COMP-01 | Phase 17 | Pending |
| COMP-02 | Phase 17 | Pending |
| COMP-03 | Phase 17 | Pending |
| COMP-04 | Phase 17 | Pending |
| DOC-01 | Phase 18 | Pending |
| DOC-02 | Phase 18 | Pending |
| DOC-03 | Phase 18 | Pending |

**Coverage:**
- v1.3 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after v1.3 roadmap creation*
