# n8n-nodes-seedance2

## Current State

**Last shipped version:** v1.2
**Last shipped date:** 2026-04-20
**Status:** v1.3 planning started.

v1.2 shipped Seedream 5.0 lite image generation inside the existing `Seedance` node while preserving the previously shipped Seedance video lifecycle. The node now supports mode-first video/image UX, prompt-only and reference-driven image generation, default binary image output, grouped image generation constraints, and execute-level regression coverage for image request shaping.

## Current Milestone: v1.3 Seedance 2.0 multimodal reference video generation

**Goal:** Add Seedance 2.0 video generation support that lets n8n users create videos from multimodal references while preserving the existing Seedance task lifecycle and shipped image-generation behavior.

**Target features:**
- Research the official Volcengine Seedance 2.0 video generation API documentation before implementation.
- Add a video-generation request path for Seedance 2.0 multimodal references, covering text prompt plus supported reference media inputs.
- Keep the existing create/get/list/delete/wait/download lifecycle stable and additive.
- Expose reference inputs in an n8n-friendly way, reusing the current URL/binary multi-value patterns where practical.
- Add validation and regression coverage for payload shaping, reference normalization, and lifecycle compatibility.

## What This Is

这是一个面向 n8n 的自定义节点项目，用来把火山引擎 Seedance 视频生成与 Seedream 图片生成能力封装成可直接用于工作流的节点。它面向希望把 AI 视频与图片生成接入自动化流程的开发者与运营场景，重点是把异步任务生命周期、图片输出、错误信息与下游可组合性在 n8n 中做得稳定、可预期、易理解。

## Core Value

让 n8n 用户可以用最少配置、可预期的方式接入 Seedance/Seedream 生成能力，并优先保证完整任务与产物流转体验。

## Next Milestone Goals

- v1.3 focuses on Seedance 2.0 multimodal reference video generation.
- Defer unrelated cleanup unless required to keep the Seedance 2.0 integration safe.
- Keep PNG icon lint debt accepted unless this milestone explicitly chooses to address branding assets.

## Constraints

- **Platform**: 必须符合 n8n 社区节点/自定义节点的实现约定，否则无法在 n8n 中正常安装和使用。
- **Authentication**: 使用 API Key 鉴权，通过 n8n credentials 安全存储与注入。
- **API Behavior**: 视频生成是异步任务，节点设计必须清晰区分创建、查询、列表、取消/删除等操作。
- **Retention**: 查询历史仅支持最近 7 天，视频与图片相关产物 URL 具有时效性，文档与节点输出必须明确这些限制。
- **Compatibility**: 节点参数需要尽量贴合官方 API，但同时保持 n8n 用户可理解性，避免直接暴露过度原始且难懂的输入结构。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 在现有 `Seedance` 节点内扩展图片生成，而不是新增单独节点 | 保持用户入口统一，复用既有认证与执行模式 | ✓ Shipped in v1.2 |
| 复用 `SeedanceApi` API Key credentials 给视频与图片能力 | 降低配置成本，避免重复凭证管理 | ✓ Shipped in v1.2 |
| 图片生成公共 UI 只暴露 URL / binary 参考图来源 | 与当前 shipped UX 保持一致，base64/data URL 仅保留内部兼容 fallback | ✓ Reconciled in Phase 13 |
| 默认图片结果输出为 n8n binary | 降低用户对 24 小时有效 URL 的依赖 | ✓ Shipped in v1.2 |
| 保持 Seedance 视频 lifecycle 合同不回退 | 图片能力必须是 additive，不破坏 create/get/list/delete 的既有行为 | ✓ Verified through v1.2 |
| PNG branding 继续作为已接受技术债 | 当前项目选择 PNG 资源，即使社区节点 lint 倾向 SVG | ✓ Accepted debt |
| v1.3 先研究官方 Seedance 2.0 文档再实现多模态参考生视频 | Seedance 2.0 API 文档仍在更新，需避免按旧 Seedance 1.x 或非官方字段假设实现 | — Pending |

## Archived Context

See:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

## Evolution

This document evolves at milestone boundaries.

- After each shipped milestone, update Current State, Core Value, Constraints, and Key Decisions.
- Use archived milestone files for detailed historical roadmap and requirement context.
- Start each new milestone with `/gsd-new-milestone` so requirements stay milestone-scoped and context cost remains bounded.

---
*Last updated: 2026-05-18 after starting v1.3 milestone*
