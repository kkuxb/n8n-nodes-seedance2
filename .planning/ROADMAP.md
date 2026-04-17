# Roadmap: n8n-nodes-seedance2

## Overview

本路线图围绕 Seedance 异步任务生命周期反推而来，先交付 n8n 用户最早能跑通的“凭证接入 → 提交任务 → 轮询状态”主路径，再补齐高频图生模式，最后完善任务检索与取消/删除控制。v1 明确聚焦社区节点包职责：封装 Create / Get / List / Cancel or Delete，避免把长轮询、长期存储、复杂多模态矩阵和原始 `content` 暴露过早塞进首发版本。

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 凭证接入与文生查询闭环** - 先打通 API Key、文生任务创建与单任务状态查询的最小可用主路径。
- [ ] **Phase 2: 图生创建模式与参数护栏** - 在主路径稳定后补齐首帧图生、首尾帧图生和 n8n 友好的输入校验。
- [ ] **Phase 3: 任务检索与生命周期控制** - 完成列表筛选、取消/删除语义和历史/URL 时效提示，补齐生命周期管理能力。

## Phase Details

### Phase 1: 凭证接入与文生查询闭环
**Goal**: 用户可以在 n8n 中安全配置 Seedance 凭证，提交文生视频任务，并基于任务 ID 查询异步状态与结果。
**Depends on**: Nothing (first phase)
**Requirements**: CRED-01, CRED-02, CRTK-01, CRTK-04, CRTK-05, CRTK-06, GETT-01, GETT-02, GETT-03
**Success Criteria** (what must be TRUE):
  1. 用户可以通过一个独立的 n8n 凭证配置并复用 Seedance API Key，而无需在每个节点中重复填写密钥。
  2. 用户可以使用模型 ID、文本提示词和常用生成参数提交文生视频任务，并立即拿到可用于后续轮询的任务元数据。
  3. 用户可以通过任务 ID 查询最新任务状态，并在 n8n 工作流中直接分辨任务是否仍在处理中或已经进入终态。
  4. 用户在任务成功时可以拿到视频 URL、可选尾帧 URL 与用量信息；任务失败时可以拿到明确错误信息而不是模糊失败。
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Package skeleton and single Seedance credential/node registration
- [x] 01-02-PLAN.md — Shared credential-driven transport, endpoints, and error normalization
- [x] 01-03-PLAN.md — Text-to-video create and single-task get operations with mapper coverage
- [x] 01-04-PLAN.md — Gap closure for frames-only create and query-string get-task contracts
**Notes/Risks**:
- Phase 1 只覆盖文生主路径，不在首阶段引入复杂图片组合与原始 `content` 拼装。
- `return_last_frame` 与 `generate_audio` 仅在 API 明确支持的场景下暴露，避免先开放再回收。

### Phase 2: 图生创建模式与参数护栏
**Goal**: 用户可以通过 n8n 友好的表单模式创建首帧图生与首尾帧图生任务，并在提交前得到清晰的参数约束反馈。
**Depends on**: Phase 1
**Requirements**: CRTK-02, CRTK-03, UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. 用户可以不用手写原始 `content` 数组，而是通过表单字段切换“文生 / 首帧图生 / 首尾帧图生”输入模式。
  2. 用户可以上传首帧图片创建图生任务，也可以同时提供首帧和尾帧图片创建首尾帧约束的视频生成任务。
  3. 当用户传入互斥字段、缺失当前模式必填项或组合明显不合法时，节点会在执行前给出清晰校验错误。
  4. 常用参数在不同创建模式下保持一致的命名和输出摘要，方便用户把多个模式放进同一条工作流里复用。
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — 图生创建模式 UI 字段设计
- [x] 02-02-PLAN.md — 图生创建模式运行时执行逻辑
- [x] 02-03-PLAN.md — 补齐图片二进制文件格式与大小护栏
**UI hint**: yes
**Notes/Risks**:
- 该阶段只补齐 v1 高频输入模式；多参考图/视频/音频、Draft 和 Raw JSON 逃生口继续后置。
- 需要重点核实模型能力矩阵与互斥规则，避免把 API 约束错误抽象成固定表单。

### Phase 3: 任务检索与生命周期控制
**Goal**: 用户可以检索最近 7 天内的任务、按条件筛选结果，并在接口允许时明确地取消或删除任务。
**Depends on**: Phase 2
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04, LIFE-01, LIFE-02, UX-03
**Success Criteria** (what must be TRUE):
  1. 用户可以按分页、状态、一个或多个任务 ID、接入点/模型 ID 与服务等级列出最近 7 天内的任务。
  2. 用户可以通过一个明确命名的“取消或删除任务”操作发起 DELETE，并从返回结果中理解这是取消排队任务还是删除可删除记录。
  3. 当任务当前状态不允许取消或删除时，用户会收到清晰、可用于排错的失败反馈，而不是含糊的通用错误。
  4. 节点说明与输出语义会明确提示“仅支持最近 7 天历史”“结果 URL 默认 24 小时有效”，帮助用户在工作流中及时转存或补救。
**Plans**: TBD
**Notes/Risks**:
- DELETE 的状态语义必须保留“取消或删除”双重含义，不能误导用户把它理解为始终删除记录。
- `filter.task_ids` 的查询序列化方式需要在实现前再次按官方文档验证。

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 凭证接入与文生查询闭环 | 0/TBD | Not started | - |
| 2. 图生创建模式与参数护栏 | 2/3 | In progress | - |
| 3. 任务检索与生命周期控制 | 0/TBD | Not started | - |

## Deferred Beyond v1

- 高级原始 `content` / Raw JSON 逃生口
- 多参考图、参考视频、参考音频等复杂多模态组合
- Draft 工作流与基于 Draft ID 的正式生成
- Submit-and-Wait / 自动长轮询直到完成
- binary 自动下载、长期存储、回调 webhook 全链路

---
*Last updated: 2026-04-16 during roadmap creation*
