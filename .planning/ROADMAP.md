# Roadmap: n8n-nodes-seedance2

## Milestones

- ✅ **v1.0 milestone** — Phases 1-3 (shipped 2026-04-17; archived in [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md))
- ✅ **v1.1 milestone** — Phases 04-07 (shipped 2026-04-19; archived in [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md))
- ✅ **v1.2 milestone** — Phases 08-13 Seedream image generation, UX iteration, and audit reconciliation (shipped 2026-04-20; archived in [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md))
- 🔄 **v1.3 milestone** — Phases 14-22 多模态参考视频生成补全 (planned 2026-04-20)

## Current Milestone: v1.3 多模态参考视频生成补全

**Goal:** 补齐当前未完成的多模态视频生成能力，让 n8n 用户能以可发布的节点体验使用参考图生视频和参考视频生视频。

**Scope:** 参考图生视频、参考视频生视频，以及与现有视频 lifecycle 一致的 UX、校验、文档和回归验证。

**Explicitly deferred:** 参考图 + 参考视频组合输入、参考音频、binary/base64 参考视频、通用 raw `content[]` 构建器。

## Phases

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 14 | Create-Mode UX Contract | 1/1 | Complete   | 2026-04-21 |
| 15 | Validation and Payload Contract | 2/2 | Complete   | 2026-04-21 |
| 16 | Reference Image Execution | 1/1 | Complete   | 2026-04-21 |
| 17 | Reference Video Execution | 1/1 | Complete   | 2026-04-21 |
| 18 | Compatibility, Docs, Release | 2/2 | Complete   | 2026-04-21 |
| 19 | Reference Image Validation Hardening | 0/4 | Pending | Pending |
| 20 | UX and Validation Verification Backfill | 0/3 | Pending | Pending |
| 21 | Reference Video Verification Backfill | 0/2 | Pending | Pending |
| 22 | Release Verification and Docs Alignment | 0/2 | Pending | Pending |

## Phase Details

### Phase 14: Create-Mode UX Contract

**Goal:** 在现有 video create operation 中新增清晰的参考图/参考视频模式入口，并避免用户把参考模式误认为首帧/首尾帧模式。

**Requirements:** UX-04

**Plans:** 1/1 plans complete

Plans:
- [x] 14-01-PLAN.md — 锁定 video create 的参考图/参考视频模式入口、字段可见性与提示文案合同

**Success criteria:**
1. `createMode` 保留既有 `t2v`、`i2v_first`、`i2v_first_last` 值，并新增 `参考图生视频`、`参考视频生视频` 两个明确选项。
2. 新模式字段只在对应模式下显示，不污染文生视频、首帧图生视频、首尾帧图生视频的 UI。
3. UI 文案明确说明参考模式与首帧/首尾帧模式互斥，且参考模式不保证首尾帧精确一致。
4. Prompt 字段说明更新为文生视频必填、媒体参考模式可选且建议用提示词指定参考素材用途。

### Phase 15: Validation and Payload Contract

**Goal:** 在 mapper/validator 层锁定参考图与参考视频的内部合同，先防止无效组合进入 API。

**Requirements:** VAL-REF-01, VAL-REF-02, CRTK-12

**Plans:** 2/2 plans complete

Plans:
- [x] 15-01-PLAN.md — 锁定 reference_images/reference_videos 的输入类型、互斥规则与本地校验合同
- [x] 15-02-PLAN.md — 为参考图/参考视频模式实现 payload 映射与低风险 request summary 合同

**Success criteria:**
1. `SeedanceCreateInput` 支持 `reference_images` 和 `reference_videos` 两个新 create mode，且不改动既有模式取值。
2. Validator 强制 `reference_images` 需要 1 到 9 张参考图，`reference_videos` 需要 1 到 3 个参考视频 URL 或 `asset://` 素材 ID。
3. Validator 强制首帧、首尾帧、参考图、参考视频场景互斥，并拒绝参考图 + 参考视频混合、参考音频和 binary/base64 参考视频输入。
4. Payload mapper 为参考图生成 `type: image_url`、`role: reference_image` 内容项，为参考视频生成 `type: video_url`、`role: reference_video` 内容项。
5. 请求摘要只暴露 `createMode`、`referenceImageCount`、`referenceVideoCount` 等低风险元数据，不泄露完整 URL、素材 ID 或 base64 内容。

### Phase 16: Reference Image Execution

**Goal:** 让用户可以通过 URL、`asset://` 或 n8n binary 有序提交参考图生视频任务。

**Requirements:** CRTK-07, CRTK-08, CRTK-09

**Plans:** 1/1 plans complete

Plans:
- [x] 16-01-PLAN.md — 为 video create execute 分支接入 referenceImageItems，并用 execute 边界回归锁定顺序、混合来源与旧模式不回退

**Success criteria:**
1. Execute 分支能读取有序参考图集合，并按用户配置顺序传给 payload mapper。
2. URL 与 `asset://` 参考图输入可以直接进入 `image_url.url`，binary 参考图沿用现有图片格式和 30MB 单图限制处理。
3. 1 到 9 张参考图的合法请求可以成功创建 Seedance 任务，并返回现有 create response 映射结构。
4. 旧的文生视频、首帧图生视频、首尾帧图生视频 payload 不因参考图模式接入而改变。

### Phase 17: Reference Video Execution

**Goal:** 让用户可以通过 URL 或 `asset://` 素材 ID 提交参考视频生视频任务。

**Requirements:** CRTK-10, CRTK-11

**Plans:** 1/1 plans complete

Plans:
- [x] 17-01-PLAN.md — 接入 referenceVideoItems 的 create execute 路径并锁定参考视频 request shaping 与字段限制提示

**Success criteria:**
1. Execute 分支能读取有序参考视频集合，并将 1 到 3 个参考视频映射为 `reference_video` 内容项。
2. 参考视频输入明确限制为 URL 或 `asset://` 素材 ID，不暴露 binary/base64 参考视频入口。
3. 合法参考视频请求可以成功创建 Seedance 任务，并返回现有 create response 映射结构。
4. 字段说明提示官方参考视频约束，包括 mp4/mov、2 到 15 秒、最多 3 个、总时长不超过 15 秒、单个不超过 50MB、FPS 24 到 60。

### Phase 18: Compatibility, Docs, Release

**Goal:** 确认新模式是 additive 交付，并把不能本地完整校验的 API 限制写进用户可见文档。

**Requirements:** COMP-01, UX-05

**Plans:** 2/2 plans complete

Plans:
- [x] 18-01-PLAN.md — 以聚焦回归命令锁定既有视频 lifecycle compatibility 与 release 验证入口
- [x] 18-02-PLAN.md — 对齐 README 与 create 字段说明，补齐参考模式文档与已接受发布例外说明

**Success criteria:**
1. 回归测试覆盖两个新模式的 validator、payload mapper 和 execute request shaping。
2. 回归测试证明既有 `create/get/list/delete/wait/download` 关键行为不回退。
3. README 和节点字段说明覆盖参考素材数量、URL 时效、最近 7 天历史限制、真人脸参考限制、ratio/adaptive 裁切预期。
4. 文档明确说明本 milestone 不支持参考图 + 参考视频组合、参考音频、binary/base64 参考视频和 raw `content[]` 构建器。
5. `npm run build` 和可执行的目标测试通过；若 lint 仍受 PNG icon 技术债影响，发布说明继续标记为既有接受例外。

### Phase 19: Reference Image Validation Hardening

**Goal:** 修复 `reference_images` 模式下空 URL/asset 本地校验缺口，并把参考图 create flow 恢复为可验证的闭环。

**Requirements:** VAL-REF-01, CRTK-07, CRTK-08, CRTK-09

**Gap Closure:** Closes audit integration gap from Phase 14/15 -> Phase 16 and the broken `参考图生视频` flow.

**Plans:** 0/0 plans complete

**Success criteria:**
1. Validator 会拒绝 `reference_images` 模式下空的 URL/asset 项，以及其他明显无效的空参考图输入，而不是把空内容发给 API。
2. 参考图 create flow 继续保持 URL、`asset://`、binary 的有序映射能力，同时在本地阻断无效空项。
3. 回归测试覆盖 `reference_images` 空 URL/asset 拒绝与 execute 边界不发送无效请求。
4. 参考视频模式与旧的 `t2v`、`i2v_first`、`i2v_first_last` 行为不回退。

### Phase 20: UX and Validation Verification Backfill

**Goal:** 为 Phases 14-15 补齐正式 verification 产物，关闭 UI 合同与 validator/payload 合同的 unverified blocker。

**Requirements:** UX-04, VAL-REF-02, CRTK-12

**Gap Closure:** Closes missing VERIFICATION.md blockers for phases 14 and 15.

**Plans:** 0/0 plans complete

**Success criteria:**
1. 产出 `14-VERIFICATION.md`，验证五种 create mode、字段可见性和关键提示文案合同。
2. 产出 `15-VERIFICATION.md`，验证参考模式可省略 prompt、互斥规则、拒绝参考音频、拒绝 binary/base64 参考视频和安全 request summary。
3. Verification 文件以 requirement 为单位提供状态与证据，覆盖 `UX-04`、`VAL-REF-02`、`CRTK-12`。
4. 若 verification 暴露新 blocker，必须在文档中记录具体证据与范围。

### Phase 21: Reference Video Verification Backfill

**Goal:** 为 Phase 17 补齐正式 verification 产物，确认参考视频 execute 链路和 requirement 证据闭环。

**Requirements:** CRTK-10, CRTK-11

**Gap Closure:** Closes missing VERIFICATION.md blocker for phase 17.

**Plans:** 0/0 plans complete

**Success criteria:**
1. 产出 `17-VERIFICATION.md`，验证参考视频模式的 URL/`asset://` 输入、数量限制、顺序映射和 create response 兼容性。
2. Verification 文件明确引用现有 validator、payload、execute 和 regression 测试证据，覆盖 `CRTK-10` 与 `CRTK-11`。
3. Verification 结果确认参考视频模式不会引入 binary/base64 参考视频入口，也不会破坏旧 create mode。

### Phase 22: Release Verification and Docs Alignment

**Goal:** 为 Phase 18 补齐 release verification 产物，并对齐 README 与当前已支持的分辨率/发布说明。

**Requirements:** UX-05, COMP-01

**Gap Closure:** Closes missing VERIFICATION.md blocker for phase 18 and the README 1080p doc mismatch noted in the audit.

**Plans:** 0/0 plans complete

**Success criteria:**
1. 产出 `18-VERIFICATION.md`，验证 README、字段说明、`test:phase18` 与 lifecycle compatibility 证据闭环。
2. README 的分辨率说明与当前 UI/validator 对齐，明确 Seedance 2.0 支持 `1080p`，Fast 仅支持 `480p` 和 `720p`。
3. Verification 文件覆盖 `UX-05` 与 `COMP-01`，并保留 PNG icon lint accepted exception 的当前发布结论。

## Progress

| Milestone | Phase Range | Plans Complete | Status | Shipped |
|-----------|-------------|----------------|--------|---------|
| v1.0 | 1-3 | 10/10 | Complete | 2026-04-17 |
| v1.1 | 04-07 | 6/6 | Complete | 2026-04-19 |
| v1.2 | 08-13 | 11/11 | Complete | 2026-04-20 |
| v1.3 | 14-22 | 0/9 | Planned | - |

## Coverage

- v1.3 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓
