# Roadmap: n8n-nodes-seedance2

## Milestones

- v1.0 milestone - Phases 1-3 (shipped 2026-04-17; archived in [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md))
- v1.1 milestone - Phases 04-07 (shipped 2026-04-19; archived in [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md))
- v1.2 milestone - Phases 08-13 Seedream image generation, UX iteration, and audit reconciliation (shipped 2026-04-20; archived in [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md))
- v1.3 Seedance 2.0 multimodal reference video generation - Phases 14-17 (implemented)

## Overview

v1.3 将现有/目标的“参考视频生视频”能力升级为官方 Seedance 2.0 “多模态参考生视频”模式。该里程碑只围绕本次新增能力展开：在现有 `Seedance` 节点的视频 create 操作中增加多模态入口、官方参考媒体 content 映射、来源归一化、参数校验和兼容性回归；不重建已 shipped 的文生视频、首帧图生视频、首尾帧图生视频、Seedream 图像生成、凭证或任务 lifecycle。用户文档与真实手工 UAT 已按用户确认从 v1.3 必做范围中取消，保留为后续可选事项。

**Granularity:** standard (未发现 `.planning/config.json`，按默认粒度处理)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 14: 多模态入口与参考素材表单** - 用户能在现有 Seedance create 操作中选择并配置官方多模态参考生视频模式。 (completed 2026-05-19)
- [x] **Phase 15: 参考媒体来源与官方 payload** - 用户的图片、视频、音频和素材 ID 被归一化为官方 Seedance 2.0 content 结构。 (completed 2026-05-19)
- [x] **Phase 16: Seedance 2.0 参数与本地校验** - 用户在提交前获得符合官方约束的媒体、模型和生成参数校验。 (completed 2026-05-19)
- [x] **Phase 17: 既有模式与 lifecycle 兼容性** - 已 shipped 的视频 lifecycle 与 Seedream 图片路径在新增多模态能力后保持兼容。 (completed 2026-05-19)

## Phase Details

### Phase 14: 多模态入口与参考素材表单
**Goal**: 用户能在现有 `Seedance` 视频 create 操作中清晰选择“多模态参考生视频”，并用 n8n 友好的表单配置参考素材。
**Depends on**: Phase 13
**Requirements**: MODE-01, MODE-03, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. 用户可以在现有 `Seedance` 节点的视频 create 操作中选择独立的“多模态参考生视频”模式。
  2. 用户可以通过可重复的参考素材列表填写素材类型、素材来源、素材 URL、素材 ID 或 binary 属性名。
  3. 用户在多模态模式中看不到会误导其混用 strict first-frame/last-frame role 的配置路径。
  4. 节点文案说明真人脸参考限制，以及严格首尾帧一致性应继续使用现有首帧/首尾帧模式。
  5. web search、safety identifier 等高级选项保持可选，基础多模态配置不需要额外复杂步骤。
**Plans**:
- Wave 1: `14-01-PLAN.md` - Expose multimodal create mode and reference素材 form.
- Wave 2 *(blocked on Wave 1 completion)*: `14-02-PLAN.md` - Make multimodal form execution-safe and regression-covered.
**UI hint**: yes

### Phase 15: 参考媒体来源与官方 payload
**Goal**: 用户提交的多模态参考图片、视频、音频和素材 ID 能按官方 Seedance 2.0 content schema 进入 create 请求，并在摘要中安全可见。
**Depends on**: Phase 14
**Requirements**: REF-01, REF-02, REF-03, REF-04, REF-05, SRC-01, SRC-02, SRC-03, SRC-04, SRC-05, PAY-01, PAY-04
**Success Criteria** (what must be TRUE):
  1. 用户可以提交 0-9 张参考图片，每张图片作为 `image_url` 且 role 为 `reference_image`。
  2. 用户可以提交 0-3 个参考视频，每个视频作为 `video_url` 且 role 为 `reference_video`，但不会被要求或允许直接使用视频 binary 上传。
  3. 用户可以提交 0-3 段参考音频，每段音频作为 `audio_url` 且 role 为 `reference_audio`，并且音频不能单独成单。
  4. 用户可以组合官方支持的 prompt、图片、视频、音频输入；裸素材 ID 在适用时会归一化为 `asset://<ASSET_ID>`。
  5. 创建结果摘要展示模型、模式、prompt 是否存在、参考数量、类型、role、来源种类和选项值，但不暴露原始媒体 payload。
**Plans**:
- Wave 1: `15-01-PLAN.md` - Build official multimodal payload mapper and validation contract.
- Wave 2 *(blocked on Wave 1 completion)*: `15-02-PLAN.md` - Wire n8n reference source collection into multimodal create execution.

### Phase 16: Seedance 2.0 参数与本地校验
**Goal**: 用户在本地就能得到符合官方 Seedance 2.0 文档的媒体限制、模型选项和生成参数反馈，避免提交明显无效的请求。
**Depends on**: Phase 15
**Requirements**: VAL-01, VAL-02, VAL-03, VAL-04, VAL-05, VAL-06, PAY-03
**Success Criteria** (what must be TRUE):
  1. 用户提交超出官方数量、格式、尺寸、时长、分辨率、FPS、MIME/codec 或请求大小限制的参考媒体时，会收到明确错误。
  2. 用户配置 Seedance 2.0 duration、ratio、resolution、seed、execution timeout、watermark 和 generate-audio 时，节点按官方 body 参数合同校验。
  3. 用户为标准 Seedance 2.0 选择 1080p 可以通过，但为 Seedance 2.0 Fast 选择 1080p 会被阻止。
  4. 用户不会在 Seedance 2.0 路径中看到或发送 `camera_fixed`。
  5. 生成选项以 request body 字段发送，而不是依赖追加到 prompt 的弱校验参数后缀。
**Plans**:
- Wave 1: `16-01-PLAN.md` - Add official Seedance 2.0 parameter and local validation contract.
- Wave 2 *(blocked on Wave 1 completion)*: `16-02-PLAN.md` - Wire binary media metadata into execution and verify full regression.

### Phase 17: 既有模式与 lifecycle 兼容性
**Goal**: 新增多模态能力后，v1.2 已 shipped 的视频 lifecycle、旧 create 模式和 Seedream 图片生成功能仍可按原工作流运行。
**Depends on**: Phase 16
**Requirements**: MODE-02, PAY-02, COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. 用户继续使用文生视频、首帧图生视频、首尾帧图生视频时，请求行为与 v1.2 保持一致。
  2. 用户对多模态任务和非多模态任务执行 create/get/list/delete 时，任务 lifecycle 输出保持兼容。
  3. 用户使用 wait 与视频下载时，多模态任务和既有视频任务都能沿用现有成功/失败/超时语义。
  4. 用户使用 Seedream 图片生成路径时，不会受到新增视频多模态 helper 的影响。
  5. 回归测试覆盖旧视频模式、新多模态 payload、校验错误、支持媒体的 n8n binary 转换和 execute-level HTTP body 捕获。
**Plans**:
- Wave 1: `17-01-PLAN.md` - Lock old video create payload compatibility.
- Wave 2 *(blocked on Wave 1 completion)*: `17-02-PLAN.md` - Lock task lifecycle, wait, and download compatibility.
- Wave 3 *(blocked on Wave 2 completion)*: `17-03-PLAN.md` - Lock Seedream image isolation and full regression.

## Coverage

| Requirement | Phase |
|-------------|-------|
| MODE-01 | Phase 14 |
| MODE-02 | Phase 17 |
| MODE-03 | Phase 14 |
| REF-01 | Phase 15 |
| REF-02 | Phase 15 |
| REF-03 | Phase 15 |
| REF-04 | Phase 15 |
| REF-05 | Phase 15 |
| SRC-01 | Phase 15 |
| SRC-02 | Phase 15 |
| SRC-03 | Phase 15 |
| SRC-04 | Phase 15 |
| SRC-05 | Phase 15 |
| VAL-01 | Phase 16 |
| VAL-02 | Phase 16 |
| VAL-03 | Phase 16 |
| VAL-04 | Phase 16 |
| VAL-05 | Phase 16 |
| VAL-06 | Phase 16 |
| PAY-01 | Phase 15 |
| PAY-02 | Phase 17 |
| PAY-03 | Phase 16 |
| PAY-04 | Phase 15 |
| UI-01 | Phase 14 |
| UI-02 | Phase 14 |
| UI-03 | Phase 14 |
| UI-04 | Phase 14 |
| COMP-01 | Phase 17 |
| COMP-02 | Phase 17 |
| COMP-03 | Phase 17 |
| COMP-04 | Phase 17 |

**Coverage:** 31/31 v1.3 requirements mapped exactly once.

## Progress

**Execution Order:**
Phases execute in numeric order: 14 -> 15 -> 16 -> 17

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 14. 多模态入口与参考素材表单 | v1.3 | 2/2 | Complete | 2026-05-19 |
| 15. 参考媒体来源与官方 payload | v1.3 | 2/2 | Complete | 2026-05-19 |
| 16. Seedance 2.0 参数与本地校验 | v1.3 | 2/2 | Complete | 2026-05-19 |
| 17. 既有模式与 lifecycle 兼容性 | v1.3 | 3/3 | Complete | 2026-05-19 |
