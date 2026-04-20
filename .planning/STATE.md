---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Seedream 5.0 lite image generation and UX iteration
status: archived
stopped_at: Archived milestone v1.2
last_updated: "2026-04-20T08:45:00.000Z"
last_activity: 2026-04-20 -- Milestone v1.2 archived and ready for next-milestone definition
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 17
  completed_plans: 17
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** 让 n8n 用户可以用最少配置、可预期的方式接入 Seedance/Seedream 生成能力，并优先保证完整任务与产物流转体验。
**Current focus:** Planning the next milestone

## Current Position

Phase: none
Plan: none
Status: Milestone archived
Last activity: 2026-04-20 -- Milestone v1.2 archived and ready for next-milestone definition

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 17
- Average duration: 0 min
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-3 | 10 | 0 min | - |
| 04 | 1 | - | - |
| 05 | 2 | - | - |
| 12 | 2 | - | - |
| 13 | 2 | - | - |

**Recent Trend:**

- Trend: Stable

| Phase 06 P01 | 9min | 2 tasks | 5 files |
| Phase 06 P02 | 10min | 2 tasks | 6 files |
| Phase 12 P01 | 7min | 3 tasks | 8 files |
| Phase 12 P02 | 8 min | 3 tasks | 5 files |
| Phase 13 P02 | 1 min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

- Add image generation inside the existing `Seedance` node instead of creating a separate node.
- Reuse the existing `SeedanceApi` API Key credential for image generation.
- v1.2 MVP supports only Seedream 5.0 lite (`doubao-seedream-5-0-260128`).
- Support text-to-image plus image-to-image reference inputs from URL and binary in the public UI, with comma-separated multi-value support.
- Cover both single-image and sequential/group image generation.
- Default result behavior should be n8n binary output.
- Do not support streaming in this milestone.
- Include advanced options: `sequential_image_generation`, `max_images`, `web_search`, `optimize_prompt_options`, and resolution/aspect-ratio size mapping.
- Defer `output_format` and `watermark` unless implementation proves they are required.
- Preserve existing video lifecycle contracts and accepted PNG icon technical debt.
- Drive image execution from `generationMode=image` with `imageOperation` fallback to `textToImage`, while keeping `operation=generateImage` as internal compatibility behavior only.
- Normalize comma-separated URL and binary property inputs before reusing the existing Seedream validator and payload builder.
- `optimizePrompt=false` omits `optimize_prompt_options`; `true` maps to the supported `standard` mode.
- Keep legacy `operation=generateImage` and internal base64/fixedCollection reference handling as compatibility fallbacks, while the public Phase 12 UI exposes URL and binary reference sources only.
- Close v1.2 audit gaps by reconciling planning artifacts to shipped behavior instead of re-expanding the public image reference UI.
- Keep the new audit-closing regression at the execute() boundary so real node runtime request shaping is verified, not just mapper behavior.
- Reuse the Phase 12 focused regression family unchanged after adding the new assertion so image and video contracts remain jointly verified.

### Roadmap Evolution

- Phase 12 added: 图片生成功能改为先选择视频生成/图像生成模式，再在图像生成模式下选择文生图/图生图；同步调整字段顺序、组图开关和参考图 URL/二进制属性名的多值输入方式。
- Phase 13 added: 关闭 v1.2 审计缺口，补齐 Phase 08-11 verification，统一 IMG-04/VAL-IMG-02/图片水印的 requirements 与审计口径，并补一条组图 execute 回归断言。

### Pending Todos

- Run `/gsd-new-milestone` to define the next milestone and create a fresh requirements file.

### Blockers/Concerns

- Default binary output for group image generation may increase execution-time memory usage and needs explicit output-shaping decisions in implementation.
- API default `response_format=url` means implementation likely needs internal download behavior to satisfy the milestone's default binary-output goal.
- PNG icon lint failures remain an accepted release exception and are intentionally unchanged.

## Quick Tasks Completed

| ID | Date | Task | Status | Notes |
|----|------|------|--------|-------|
| Q001 | 2026-04-19 | Update Seedance branding assets and remove redundant resource selector | Completed with blocker | Swapped node and credential branding references to PNG assets from `APIdocs/1776526732352_download.jpg`; removed the single-option `resource` selector and its dependent display conditions. `npm run build` passed. `npm run lint` still fails because n8n community-node validation requires SVG icons, so PNG branding is incompatible with current lint rules. |

## Session Continuity

Last session: 2026-04-20T08:45:00.000Z
Stopped at: Archived milestone v1.2
Resume file: None
