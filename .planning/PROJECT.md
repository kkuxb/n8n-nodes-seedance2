# n8n-nodes-seedance2

## Current State

**Last shipped version:** v1.2
**Last shipped date:** 2026-04-20
**Status:** Defining milestone v1.3 for remaining multimodal video-generation modes.

v1.2 shipped Seedream 5.0 lite image generation inside the existing `Seedance` node while preserving the previously shipped Seedance video lifecycle. The node now supports mode-first video/image UX, prompt-only and reference-driven image generation, default binary image output, grouped image generation constraints, and execute-level regression coverage for image request shaping.

## What This Is

这是一个面向 n8n 的自定义节点项目，用来把火山引擎 Seedance 视频生成与 Seedream 图片生成能力封装成可直接用于工作流的节点。它面向希望把 AI 视频与图片生成接入自动化流程的开发者与运营场景，重点是把异步任务生命周期、图片输出、错误信息与下游可组合性在 n8n 中做得稳定、可预期、易理解。

## Core Value

让 n8n 用户可以用最少配置、可预期的方式接入 Seedance/Seedream 生成能力，并优先保证完整任务与产物流转体验。

## Current Milestone: v1.3 多模态参考视频生成补全

**Goal:** 补齐当前未完成的多模态视频生成能力，让 n8n 用户能以可发布的节点体验使用参考图生视频和参考视频生视频。

**Target features:**
- 参考图生视频
- 参考视频生视频
- 与现有视频 lifecycle、参数 UX、运行时校验、文档和测试保持一致的 ship-ready 交付

## Requirements

### Validated

- ✓ 用户可以通过 Seedance 节点完成文生视频、首帧图生视频、首尾帧图生视频，以及查询、列表、取消/删除任务生命周期能力。 — v1.0-v1.1
- ✓ 用户可以在 Wait For Completion 场景下轮询任务，并在成功时可选下载 `binary.video`。 — v1.1
- ✓ 用户可以在同一节点内完成 Seedream 图片生成，并获得稳定的 mode-first UX 与默认 binary 图片输出。 — v1.2

### Active

- [ ] 用户可以通过参考图创建多模态参考生视频任务。
- [ ] 用户可以通过参考视频创建多模态参考生视频任务。
- [ ] 上述新模式与既有视频 create/get/list/delete、文档提示和回归验证保持一致且不回退。

### Out of Scope

- 参考图 + 参考视频组合输入模式 — 本次 milestone 聚焦先补齐两种单一参考主路径，避免一次引入过多参数组合。
- 参考音频输入 — 当前里程碑只补图像/视频两类多模态参考，不扩展到音频。
- 独立新节点或新 credentials — 继续复用现有 `Seedance` 节点与 `SeedanceApi` 凭证。

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
- At milestone start, update the Current Milestone section and Active requirements before generating a new scoped `REQUIREMENTS.md`.

---
*Last updated: 2026-04-20 after starting milestone v1.3 definition*
