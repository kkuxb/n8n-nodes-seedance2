# n8n-nodes-seedance2

## Current State

**Last shipped version:** v1.3
**Last shipped date:** 2026-04-21
**Status:** v1.3 shipped; ready to define the next milestone.

v1.3 shipped multimodal Seedance video create support for ordered reference images and reference videos, closed the remaining phase-level verification backfill work, and kept the existing video lifecycle plus Seedream image generation behavior additive and release-ready.

## What This Is

这是一个面向 n8n 的自定义节点项目，用来把火山引擎 Seedance 视频生成与 Seedream 图片生成能力封装成可直接用于工作流的节点。当前已支持 Seedance 文生视频、首帧/首尾帧图生视频、参考图生视频、参考视频生视频，以及 Seedream 图片生成，并把异步任务生命周期、图片/视频产物输出、错误信息与下游可组合性在 n8n 中做得稳定、可预期、易理解。

## Core Value

让 n8n 用户可以用最少配置、可预期的方式接入 Seedance/Seedream 生成能力，并优先保证完整任务与产物流转体验。

## Next Milestone Goals

- 通过 `/gsd-new-milestone` 定义下一阶段目标，而不是继续沿用 v1.3 的 requirements 文件。
- 评估是否推进参考图 + 参考视频组合输入、参考音频和 binary/base64 参考视频等延后能力。
- 评估是否补 reference-video invalid-input execute no-dispatch negative test，以及 release metadata / warning 类技术债。
- 评估是否继续增强本地开发 runtime 与发布流程的稳定性。

## Requirements

### Validated

- ✓ 用户可以通过 Seedance 节点完成文生视频、首帧图生视频、首尾帧图生视频，以及查询、列表、取消/删除任务生命周期能力。 — v1.0-v1.1
- ✓ 用户可以在 Wait For Completion 场景下轮询任务，并在成功时可选下载 `binary.video`。 — v1.1
- ✓ 用户可以在同一节点内完成 Seedream 图片生成，并获得稳定的 mode-first UX 与默认 binary 图片输出。 — v1.2
- ✓ 用户可以通过参考图创建多模态参考生视频任务。 — v1.3
- ✓ 用户可以通过参考视频创建多模态参考生视频任务。 — v1.3
- ✓ 上述新模式与既有视频 create/get/list/delete/wait/download、文档提示和回归验证保持一致且不回退。 — v1.3

### Active

- [ ] 待下一 milestone 定义新的需求范围。

### Out of Scope

- 参考图 + 参考视频组合输入模式 — 本次 milestone 聚焦先补齐两种单一参考主路径，避免一次引入过多参数组合。
- 参考音频输入 — 当前里程碑只补图像/视频两类多模态参考，不扩展到音频。
- Binary/Base64 参考视频上传 — 当前 milestone 仍保持 URL / `asset://` 路径，不扩展更重的视频上传合同。
- 通用原始 `content[]` 构建器 — 继续避免把节点退化为 HTTP 透传器。
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
| Video create UX 保持五种显式模式 | 让参考图/参考视频模式与首帧图模式边界清晰，避免 raw 合同暴露 | ✓ Shipped in v1.3 |
| `reference_images` 与 `reference_videos` 分开建模 | 降低多模态输入矩阵复杂度，先锁定两个单一路径 | ✓ Shipped in v1.3 |
| `npm run test:phase18` 作为 v1.3 release gate | 用有边界的回归集验证多模态视频交付，同时保留 PNG lint accepted debt | ✓ Shipped in v1.3 |
| 缺失的 phase verification 通过 backfill 闭合 | 用已 shipped 证据补齐 verification artifact，而不是重新打开实现范围 | ✓ Verified in v1.3 |

## Archived Context

See:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.3-ROADMAP.md`
- `.planning/milestones/v1.3-REQUIREMENTS.md`
- `.planning/milestones/v1.3-MILESTONE-AUDIT.md`

<details>
<summary>Archived v1.3 milestone framing</summary>

**Milestone:** v1.3 多模态参考视频生成补全

**Goal:** 补齐 Seedance 多模态视频创建能力，让 n8n 用户可以用可发布的节点体验使用参考图生视频和参考视频生视频。

**Shipped outcomes:**
- 五种显式 video create mode 与清晰的 reference-image / reference-video UX
- 参考图 / 参考视频 validator、payload、request summary 合同
- 参考图与参考视频真实 execute 路径
- `test:phase18` 发布回归门与 release/docs verification
- 最终 milestone audit `passed`

</details>

## Evolution

This document evolves at milestone boundaries.

- After each shipped milestone, update Current State, Core Value, Constraints, and Key Decisions.
- Use archived milestone files for detailed historical roadmap and requirement context.
- Start each new milestone with `/gsd-new-milestone` so requirements stay milestone-scoped and context cost remains bounded.
- At milestone start, update the Current Milestone section and Active requirements before generating a new scoped `REQUIREMENTS.md`.

---
*Last updated: 2026-04-21 after archiving v1.3 milestone*
