---
status: resolved
trigger: "调查并诊断当前 Seedance 节点在人工验证中失败的根因，聚焦参数定义与 API 文档不一致的问题。只做诊断，不直接改代码。"
created: 2026-04-17T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Focus

hypothesis: 根因已定位：当前节点以“泛 Seedance create”参数集实现 Phase 1，而不是严格收敛到 Seedance 2.0 / 2.0 fast 文生视频参数子集，导致不受支持字段被直接发往 API；同时模型输入、文案与凭证/README 也未按目标产品约束收敛
test: 基于已读证据整理优先级、保留/移除参数清单与最小修复方向
expecting: 输出仅诊断结论，不改代码
next_action: resolved as superseded by later video lifecycle hardening and v1.2 verification; no current open action remains

## Symptoms

expected: 节点应严格基于 `D:\Projects\n8n-nodes-seedance2\APIdocs` 中的官方文档，只暴露 Seedance 2.0 / Seedance 2.0 fast 文生视频支持的参数，模型为下拉选择，凭证只保留 API Key，所有用户文案为中文。
actual: 运行节点时会出现各种“参数不支持”等报错，Create Task 未成功跑通；当前模型 ID 是自由输入，界面文案存在英文，参数集合疑似包含 Seedance2.0 不支持的字段。
errors: 用户口头反馈为“会提醒各种参数不支持等报错”，未提供具体服务端报错体。
reproduction: 在 n8n 中配置凭证后执行 Create Task，按当前节点提供的字段填写参数，任务创建失败。
started: 在当前 Phase 1 实现完成后的首次人工验证中暴露。

## Eliminated

## Evidence

- timestamp: 2026-04-17T00:06:00Z
  checked: APIdocs/创建视频生成任务 API.md
  found: Seedance 2.0 / 2.0 fast 文生视频场景支持 model、content(text)、resolution、ratio、duration、seed、watermark、return_last_frame、execution_expires_after、generate_audio、tools、safety_identifier；其中 frames 与 camera_fixed 明确“暂不支持”，service_tier 明确“不支持离线推理”。
  implication: 针对 2.0 / 2.0 fast 文生视频，若节点暴露 frames 或允许 service_tier=flex，就会把不受支持参数送入强校验 API，直接命中“参数不支持/参数错误”类失败。

- timestamp: 2026-04-17T00:07:00Z
  checked: nodes/Seedance/description/create.operation.ts
  found: Create UI 暴露 Model 为 string 自由输入，而非下拉；同时暴露 Resolution=1080p、Frames、Service Tier(Default/Flex)、Execution Expires After、Return Last Frame、Generate Audio 等字段，且多处 displayName/description 为英文。
  implication: UI 允许用户选择 Seedance 2.0 / 2.0 fast 文生视频不支持的取值或字段，并违反“模型下拉/全中文文案”目标。

- timestamp: 2026-04-17T00:08:00Z
  checked: nodes/Seedance/Seedance.node.ts
  found: create 执行路径无模型级别分支，直接把 UI 收集到的 resolution、ratio、duration、frames、seed、watermark、serviceTier、executionExpiresAfter、returnLastFrame、generateAudio 统一送入 buildCreatePayload。
  implication: 节点不会依据“当前只支持 Seedance 2.0 / 2.0 fast 文生视频”收敛 payload；任何 UI 暴露的字段都可能进入服务端请求。

- timestamp: 2026-04-17T00:09:00Z
  checked: nodes/Seedance/shared/mappers/createPayload.ts
  found: payload builder 会把 frames 映射为 body.frames，把 serviceTier 映射为 body.service_tier，把 executionExpiresAfter / returnLastFrame / generateAudio 等直接写入请求体；不存在模型能力过滤。
  implication: 不受支持参数不是“只在 UI 展示”，而是确实进入 API body，属于直接致错路径。

- timestamp: 2026-04-17T00:10:00Z
  checked: nodes/Seedance/shared/validators/create.ts
  found: 本地校验只检查 model/prompt 必填、duration/frames 互斥、seed/executionExpiresAfter 数值范围；不校验 Seedance 2.0 / 2.0 fast 对 frames、service_tier=flex、resolution=1080p 的不支持约束。
  implication: 节点将本可在本地提前阻止的无效组合放行到服务端，增加人工验证时的“各种参数不支持”报错。

- timestamp: 2026-04-17T00:11:00Z
  checked: credentials/SeedanceApi.credentials.ts
  found: 凭证字段实际上只有 API Key，符合“只保留 API Key”；但 displayName 与 description 为英文。
  implication: 凭证结构本身不是创建任务失败主因，但与“全中文用户文案”要求不一致。

- timestamp: 2026-04-17T00:12:00Z
  checked: README.md
  found: README 明确当前范围是文生视频，但示例仍引导填写“模型 ID、Prompt，以及可选的 resolution / ratio / duration 或 frames / seed / watermark 等参数”，且中英混写。
  implication: 文档层面继续放大了错误心智模型：用户会被引导填写 frames 这类对 2.0 / 2.0 fast 文生视频不支持的字段。

## Resolution

root_cause: 
root_cause: 当前 Phase 1 实现把 Create Task 设计成“通用 Seedance 创建接口”的宽参数集，而不是严格限制为“Seedance 2.0 / 2.0 fast 文生视频”能力子集。create.operation.ts 暴露了 frames、serviceTier=flex、resolution=1080p 等与目标模型/场景不兼容的输入；Seedance.node.ts 与 createPayload.ts 又会无条件把这些字段写入请求体；validateCreateInput 也没有做模型能力约束校验。因此用户按当前 UI/README 填写后，服务端强校验返回“参数不支持”等错误。次级问题是 model 仍为自由输入而非受控下拉，且节点/凭证/README 仍存在英文文案，与本次验收目标不一致。
fix: 仅诊断模式，未在该 session 中实施修复；后续 phase 已通过模型/参数收敛、视频回归和 README 更新覆盖相关产品问题。
verification: 通过后续 Phase 11-13 verification、focused regression 和 v1.2 milestone audit 复核，当前无阻断性 Seedance 2.0 参数开放问题留待该 debug session 继续处理。
files_changed: []
