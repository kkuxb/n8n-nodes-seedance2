# n8n-nodes-seedance2

## Current State

**Last shipped version:** v1.1
**Last shipped date:** 2026-04-19
**Status:** v1.2 image generation milestone complete and ready for audit/release decision.

v1.1 delivered a stable Seedance video lifecycle: corrected get/list/delete behavior, bounded Get Task wait mode, optional wait-success video download to `binary.video`, and non-icon release hardening. PNG node and credential icons remain accepted technical debt by explicit project decision.

## Current Milestone: v1.2 Seedream Image Generation

**Goal:** 在现有 Seedance 节点中新增基于 Seedream 5.0 lite 的图片生成能力，并保持已发布视频生命周期能力稳定不回退。

**Target features:**
- **[Feature] 图片生成 operation:** 在现有 `Seedance` 节点中新增图片生成 operation，复用现有 Seedance API credentials。
- **[Feature] Seedream 5.0 lite MVP:** 仅支持模型 ID `doubao-seedream-5-0-260128`。
- **[Feature] 文生图 + 参考图输入:** 支持 prompt-only，以及参考图 URL/base64/binary 输入；在可行范围内支持单图与多图参考图。
- **[Feature] 单图与组图:** 支持单图生成和 sequential/group image generation，并覆盖 `max_images` 约束。
- **[Feature] 默认 binary 输出:** 节点默认返回 n8n binary 图片数据，而不是要求用户自行处理 24 小时有效 URL。
- **[Feature] 高级选项:** 支持 `sequential_image_generation`、`web_search`、`optimize_prompt_options`、`size`。
- **[Compatibility] 视频能力回归保护:** 不破坏既有视频 `create/get/list/delete` 的参数、执行与输出契约。
- **[UX Iteration] 模式优先的图片生成 UI:** 节点现在先选择 `视频生成` / `图像生成`，图像模式内再选择 `文生图` / `图生图`；图生图公开 URL 与 binary 两种参考图来源，并支持英文/中文逗号分隔多个值。

## Next Milestone Goals

- Define the Seedream 5.0 lite image-generation contract from the local API doc and current code structure.
- Plan a minimal additive implementation that fits the existing operation-based node architecture.
- Preserve current video lifecycle contracts and accepted PNG icon policy while extending functionality.

<details>
<summary>Archived v1.1 Project Context</summary>

## Current Milestone: v1.1 Bug Fixes & Smart Polling

**Goal:** 修复当前 V1 版本中关于查询、列表返回结构、和删除接口失效的 Bug，并在查询模式中增加智能轮询机制及自动下载能力。

**Target features:**
- **[Bugfix] 单任务查询准确性:** 修复指定 ID 查询依然返回全量列表的问题 (排查并修正 API 调用方式或参数)。
- **[Bugfix] 取消/删除任务修复:** 修复 `/api/v3/contents/generations/tasks` action invalid 报错问题，确保通过 ID 可以正确触发任务删除或取消。
- **[Optimization] 列表数据折叠:** 将“获取任务列表”的返回结果重构为在单个 Item 中以数组字段(如 `tasks`)返回所有任务，避免拆分为多个 n8n Items。
- **[Feature] 智能轮询与自动下载:** 升级单任务查询能力，内置轮询机制，并在检测到成功时自动下载视频并转换为 n8n binary 数据。

## What This Is

这是一个面向 n8n 的自定义节点项目，用来封装火山引擎 Seedance 视频生成能力，让工作流可以直接提交视频生成任务、查询任务状态与结果、列出任务，并在合适条件下取消或删除任务。它面向希望把 AI 视频生成接入自动化流程的开发者与运营场景，重点是把异步任务生命周期在 n8n 中变得稳定、可组合、易理解。

## Core Value

让 n8n 用户可以用最少配置、可预期的方式接入 Seedance 视频生成的完整任务生命周期。

## Requirements

### Validated

- [x] 用户可以查询单个视频生成任务状态与结果 (Validated in Phase 1)
- [x] 用户可以通过 n8n 凭证安全配置并复用火山引擎 API Key (Validated in Phase 1)
- [x] 用户可以在 n8n 中创建 Seedance 视频生成任务 (Validated in Phase 2)
- [x] 用户可以按条件列出视频生成任务 (Validated in Phase 3)
- [x] 用户可以在符合接口约束时取消排队中的任务或删除可删除的任务记录 (Validated in Phase 3)
- [x] 用户可以按任务 ID 稳定查询单个任务，而不会错误返回整页列表 (Validated in Phase 04)
- [x] 用户可以在 n8n 中以单个 output item 的 `json.tasks` 读取任务列表 (Validated in Phase 04)
- [x] 用户可以按官方 `DELETE /tasks/{id}` 接口成功取消或删除任务，且不再出现 invalid action 错误 (Validated in Phase 04)
- [x] 用户可以在 Get Task 中直接切换是否等待任务完成 (Validated in Phase 05)
- [x] 用户可以在等待模式下以固定 20 秒间隔轮询任务状态，并在超时后返回最新任务结果而不是无限挂起 (Validated in Phase 05)

### Active

- 用户可以在等待成功后进一步自动下载视频并转为 n8n binary（目标留在 Phase 06）

### Out of Scope

- 火山引擎控制台能力复刻 - 不在此项目中重建官方控制台、计费或模型开通流程
- 全量 Seedance 历史型号一次性覆盖 - 先聚焦当前有价值且文档明确的任务生命周期能力，避免初始化阶段过度扩张
- 长期文件托管 - 官方返回的视频与尾帧链接具有时效性，长期归档交给用户自己的存储链路或后续 phase

## Context

### v1.0 Milestone Shipped

v1.0 MVP 版本正式发布，共包含三个 Phase：凭证与单查询 (Phase 1)、图生模式与参数 (Phase 2)、列表与生命周期 (Phase 3)。总计完成了 10 个执行计划，覆盖了从凭证注册到完整生命周期的全链路。

在实施中明确了以下约束与模式：
- 摒弃了 1080p 及旧版 1.0/1.5 模型，仅聚焦 Seedance 2.0 规范，提供更稳定的视频输出保障。
- 在提交数据前对 Binary 图形数据实施大小和类型拦截，避免不必要的 API 并发。
- Get-task 继续使用 qs.id 的官方标准，并在节点输出提供了更便捷的 boolean flags（isTerminal、isSuccess 等），极大简化了后续 n8n 工作流的分支判断逻辑。

### Current State

Phase 05 已完成并通过自动验证，在不新增 operation 的前提下把 bounded wait mode 接入了既有 Get Task 流程。当前节点已经稳定区分 immediate get 与 wait-mode get：默认开启等待时会每 20 秒轮询任务状态、在终态返回最终映射结果、在超时或非法 timeout 输入时安全退出；关闭等待时仍保持 Phase 04 的单次查询契约。Delete 路径仍使用官方 `DELETE /api/v3/contents/generations/tasks/{id}`。

当前目录只有 `APIdocs/` 文档，说明项目仍处于绿地初始化阶段。已有资料集中描述了火山引擎 Seedance 视频生成相关接口，包括创建任务、查询单任务、查询任务列表、取消或删除任务。

从现有文档可提炼出的关键业务背景：
- 视频生成是异步任务模型，创建后需要轮询或基于回调获取最终结果
- 查询接口只保留最近 7 天任务，生成视频 URL 和尾帧 URL 默认 24 小时有效，需要及时转存
- 删除/取消能力受任务状态约束，只有特定状态允许 `DELETE`
- 接口基于 API Key 鉴权，适合封装为 n8n credentials + node operations
- 创建任务支持文本、图片、视频、音频、Draft 任务等多种输入组合，但不同模型与场景存在互斥约束

项目名与现有 API 文档共同表明，本项目大概率是一个 `n8n-nodes-*` 形态的社区节点包，而不是独立 Web 应用或 SDK。路线图会优先围绕 n8n 节点包的最小可用能力展开。

## Constraints

- **Platform**: 必须符合 n8n 社区节点/自定义节点的实现约定 - 否则无法在 n8n 中正常安装和使用
- **Authentication**: 使用 API Key 鉴权 - 需要通过 n8n credentials 安全存储与注入
- **API Behavior**: 视频生成是异步任务 - 节点设计必须清晰区分创建、查询、列表、取消/删除等操作
- **Retention**: 查询历史仅支持最近 7 天，产物 URL 默认 24 小时有效 - 文档与节点输出必须明确这些限制
- **Scope**: 初始化阶段以任务生命周期封装为主 - 先不扩展到控制台辅助能力、素材管理或资产归档系统
- **Compatibility**: 节点参数需要尽量贴合官方 API，但同时保留 n8n 用户可理解性 - 避免直接暴露过度原始且难懂的输入结构

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 项目先按 n8n 社区节点包来规划 | 目录名 `n8n-nodes-seedance2` 与现有 API 文档最符合这一定位 | - Pending |
| v1 先覆盖任务生命周期核心操作 | 现有文档完整覆盖创建、查询、列表、取消/删除，适合形成可交付最小闭环 | - Pending |
| 先把 Seedance 复杂输入能力做成渐进式暴露 | 多模态输入和模型限制较多，初始化阶段应优先保证核心体验与正确性 | - Pending |
| 需在后续 Phase 区分单任务查询与任务列表 | 用户 UAT 反馈：目前 Get Task (Phase 1) 实际调用了列表 API，导致未传 ID 时会返回近 7 天全部数据。后续需明确拆分为“按任务 ID 查询单个”与“近 7 日全部任务查询”两种操作 | ✓ 解决 (已分离 Get 和 List 操作) |
| Get-task 使用 query string `id` | 单任务查询官方文档要求使用 `GET /tasks?id={id}`，因此保持 query string 形式。 | ✓ 解决 (在 Phase 1 修复) |
| Delete-task 使用 path 参数 `tasks/{id}` | 用户现场验证与官方文档均确认删除接口要求 `DELETE /tasks/{id}`，继续使用 query string 会触发 invalid action。 | ✓ 解决 (在 Phase 04 修复) |
| 创建任务只保留 Seedance 2.0 模型支持 | 简化参数和验证逻辑，剔除了 1080p 以及摄像机运镜控制等旧模型专属且被 2.0 遗弃的参数。 | ✓ 解决 |
| 扩展输出增加状态标识 | 为了让 n8n 工作流方便处理等待逻辑，增加 isTerminal 等布尔标记，并在 Get / List 中统一返回该映射 | ✓ 解决 |
| Wait mode 作为 Get Task 内的默认增强能力 | 避免新增 wait operation，保持 n8n 用户在同一查询动作中即可选择即时返回或 bounded polling。 | ✓ 解决 (在 Phase 05 实现) |
| Wait timeout 必须做运行时有限数值校验 | UI `minValue` 无法覆盖表达式输入，必须在执行分支和 helper 中双层防御，防止无界轮询。 | ✓ 解决 (在 Phase 05 修复) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 after completing Phase 12*

</details>
