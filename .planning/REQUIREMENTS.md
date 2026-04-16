# Requirements: n8n-nodes-seedance2

**Defined:** 2026-04-16
**Core Value:** 让 n8n 用户可以用最少配置、可预期的方式接入 Seedance 视频生成的完整任务生命周期。

## v1 Requirements

Requirements for the initial release. Each maps to exactly one roadmap phase.

### Credentials

- [x] **CRED-01**: 用户可以通过独立的 n8n 凭证安全配置 Seedance API Key
- [x] **CRED-02**: 所有 Seedance 节点操作都可以复用同一种凭证配置而无需重复填写 API Key

### Create Task

- [x] **CRTK-01**: 用户可以通过模型 ID 和文本提示词创建文生视频任务
- [ ] **CRTK-02**: 用户可以通过首帧图片和可选文本提示词创建首帧图生视频任务
- [ ] **CRTK-03**: 用户可以通过首帧图片、尾帧图片和可选文本提示词创建首尾帧图生视频任务
- [x] **CRTK-04**: 用户可以在创建任务时设置常用生成参数，包括分辨率、宽高比、时长或帧数、种子、水印、服务等级和任务过期时间
- [x] **CRTK-05**: 用户可以在适用场景下配置是否返回尾帧以及是否生成音频
- [x] **CRTK-06**: 创建任务后节点返回任务 ID、初始状态、创建时间和关键请求摘要，供后续工作流轮询使用

### Get Task

- [x] **GETT-01**: 用户可以通过任务 ID 查询单个视频生成任务的最新状态
- [x] **GETT-02**: 查询结果会返回任务状态、错误信息、更新时间、输出视频 URL、尾帧 URL 以及用量信息（若接口返回）
- [x] **GETT-03**: 查询结果会提供适合工作流分支判断的状态语义，使用户可以区分终态与非终态

### List Tasks

- [ ] **LIST-01**: 用户可以按页码和每页数量查询视频生成任务列表
- [ ] **LIST-02**: 用户可以按任务状态筛选任务列表
- [ ] **LIST-03**: 用户可以按一个或多个任务 ID 精确筛选任务列表
- [ ] **LIST-04**: 用户可以按接入点/模型 ID 和服务等级筛选任务列表

### Lifecycle Control

- [ ] **LIFE-01**: 用户可以通过一个明确命名的操作取消排队中的任务或删除允许删除的任务记录
- [ ] **LIFE-02**: 当任务当前状态不支持取消或删除时，用户会收到清晰的失败反馈而不是含糊错误

### Workflow UX

- [ ] **UX-01**: 用户在常见创建场景中通过表单字段配置输入模式，而不是默认手写原始 `content` 数组
- [ ] **UX-02**: 当用户输入互斥或明显不合法的参数组合时，节点会给出清晰的校验错误
- [ ] **UX-03**: 节点说明和输出语义会明确提示最近 7 天历史限制以及结果 URL 仅 24 小时有效

## v2 Requirements

Deferred to future release. Tracked but not included in the current roadmap.

### Advanced Create Modes

- **ADV-01**: 用户可以通过高级模式提交原始 `content` JSON 以覆盖更复杂的多模态输入结构
- **ADV-02**: 用户可以创建包含多参考图、参考视频和参考音频的多模态参考生成任务
- **ADV-03**: 用户可以配置 Draft 工作流和基于 Draft 任务 ID 的正式视频生成

### Automation Enhancements

- **AUTO-01**: 用户可以在单个操作中提交任务并轮询直到完成或失败
- **AUTO-02**: 用户可以在任务成功后直接获得 binary 视频输出而不仅是临时 URL
- **AUTO-03**: 用户可以通过节点直接配置回调驱动模式并与 n8n webhook 工作流衔接

### Extended Controls

- **EXT-01**: 用户可以配置联网搜索工具等高级模型工具参数
- **EXT-02**: 用户可以配置更完整的平台治理字段，如安全标识等高级选项

## Out of Scope

Explicitly excluded from the current roadmap.

| Feature | Reason |
|---------|--------|
| 复刻火山引擎官方控制台 | 不是 n8n 社区节点的目标，且会显著扩大范围 |
| 为所有 Seedance 历史模型和全部参数做一次性完整 UI 覆盖 | 参数矩阵复杂且变化快，v1 应先交付稳定主路径 |
| 自动长期保存视频或尾帧到外部对象存储 | 超出 API 封装职责边界，应由用户在工作流中显式编排 |
| 在创建任务默认内部无限轮询直到完成 | 会放大执行时长和失败复杂度，不符合 v1 的可预期执行模型 |

## Traceability

Which phases cover which requirements. This will be updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRED-01 | Phase 1 | Complete |
| CRED-02 | Phase 1 | Complete |
| CRTK-01 | Phase 1 | Complete |
| CRTK-02 | Phase 2 | Pending |
| CRTK-03 | Phase 2 | Pending |
| CRTK-04 | Phase 1 | Complete |
| CRTK-05 | Phase 1 | Complete |
| CRTK-06 | Phase 1 | Complete |
| GETT-01 | Phase 1 | Complete |
| GETT-02 | Phase 1 | Complete |
| GETT-03 | Phase 1 | Complete |
| LIST-01 | Phase 3 | Pending |
| LIST-02 | Phase 3 | Pending |
| LIST-03 | Phase 3 | Pending |
| LIST-04 | Phase 3 | Pending |
| LIFE-01 | Phase 3 | Pending |
| LIFE-02 | Phase 3 | Pending |
| UX-01 | Phase 2 | Pending |
| UX-02 | Phase 2 | Pending |
| UX-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after roadmap creation*
