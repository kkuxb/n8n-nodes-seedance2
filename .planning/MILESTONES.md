# Milestones

## v1.3 多模态参考视频生成补全 (Shipped: 2026-04-21)

**Phases completed:** 10 phases, 14 plans, 31 tasks

**Code tag:** `v1.3`

**Key accomplishments:**

- Seedance video create UI 现已锁定五种创建模式，并为参考图/参考视频模式补齐了诚实且可回归验证的字段合同。
- Seedance create validator 现已显式识别参考图/参考视频模式，并会在本地拦截数量越界、互斥冲突、参考音频和 binary/base64 参考视频等明显无效组合。
- Seedance create payload builder 现已能够把参考图/参考视频输入稳定映射为 `reference_image` / `reference_video` API 内容项，并输出不泄露原始引用内容的低风险请求摘要。
- Seedance video create execute 分支现已正式接入 `referenceImageItems`，可以按用户配置顺序提交混合 URL、`asset://` 和 binary 的参考图生视频请求。
- Seedance video create execute 分支现已正式接入 `referenceVideoItems`，可以按用户配置顺序提交 URL / `asset://` 参考视频生视频请求，并保持既有 create 输出结构不变。
- Phase 18 现已提供顺序执行的 `npm run test:phase18` 发布验证命令，并扩展 legacy video lifecycle 回归覆盖 get/list/delete/wait/download 兼容性。
- README 和 Seedance create 字段说明现已对齐已发布的参考图/参考视频能力，明确写出配置步骤、限制、排除项和发布验证方式。
- reference_images 本地校验现在拒绝空 URL/asset/binary 占位，并通过 execute 回归证明无效请求不会触发 create HTTP 调用。
- Phase 14 的五模式 create UX 合同现已具备正式 verification 报告，UX-04 由代码与回归测试的逐行证据闭环支撑。
- Phase 15 validator verification report 现已补齐 prompt omission 与 unsupported multimodal input rejection 的正式证据，并明确把 payload/request-summary 收口保留给 20-03。
- Phase 15 verification now proves validator guardrails plus ordered payload mapping and safe request-summary redaction for `VAL-REF-02` and `CRTK-12`.
- Phase 17 now has a formal, line-cited verification report proving reference-video create execution for `CRTK-10` and `CRTK-11` from shipped UI, execute, payload, validator, and regression evidence.
- 为 Phase 18 补齐正式 verification 报告，并把 README 的视频分辨率说明纠正为与 shipped Seedance 2.0 / Fast 合同一致。
- Phase 16 and Phase 21 now have formal verification artifacts, and the refreshed v1.3 milestone audit marks all in-scope phase directories verified.

---

## v1.2 Seedream 5.0 lite image generation, UX iteration, and audit reconciliation (Shipped: 2026-04-20)

**Phases completed:** 6 phases, 11 plans, 26 tasks

**Code tag:** `v1.2`

**Key accomplishments:**

- Added Seedream 5.0 lite image generation inside the existing `Seedance` node instead of introducing a second node or credentials model.
- Built the full image-generation request contract: payload builder, URL/binary normalization, runtime validators, recommended-size mapping, and group-image constraints.
- Shipped live image execution with default binary output (`binary.imageN`), preserved per-image failure metadata, and explicit all-failed error handling.
- Refactored the UX to be mode-first: users now choose `视频生成 / 图像生成`, then `文生图 / 图生图`, with clearer field ordering and URL/binary reference handling.
- Added comma-separated URL/binary multi-reference support, default-off image watermark behavior, and execute-level regression coverage for group-image `max_images` request shaping.
- Closed milestone audit blockers by backfilling Phase 08-11 verification artifacts and reconciling requirements to the final shipped product contract.

---

## v1.0 milestone (Shipped: 2026-04-17)

**Phases completed:** 3 phases, 10 plans, 12 tasks

**Key accomplishments:**

- n8n 社区节点包骨架已落地，包含单一 Seedance API Key 凭证、programmatic-style 节点入口，以及通过官方 node-cli 验证的 build/lint 基线。
- Seedance 的共享凭证与 transport 基础层已完成：节点现在只声明一个可复用 API Key 凭证，create/get 后续实现可以共用统一的鉴权头、端点常量、状态枚举与错误归一化结构。
- Phase 1 的最小可用闭环已完成：n8n 用户现在可以用 Seedance 节点提交文生视频任务、拿到 taskId 与请求摘要，再通过单任务查询获得结果 URL、错误信息、用量和可直接用于分支判断的状态布尔字段。
- Phase 1 的两个阻断性验证缺口已修复：frames-only 文生创建不再被默认 `duration` 卡住，单任务查询也已改为官方要求的 `qs.id` 调用链路。
- Implemented Seedance `list` operation with filter mapping/pagination, and `delete` operation for task cancellation/deletion
- Added explicit 24-hour URL expiration and 7-day history limit warnings to node and operation descriptions to satisfy UX-03 requirement.

---

## v1.1 milestone (Shipped: 2026-04-19)

**Phases completed:** 4 phases, 6 plans

**Code tag:** `v1.1`

**Key accomplishments:**

- Fixed task lifecycle correctness issues in Get/List/Delete: single task lookup now returns only the requested task, list output is aggregated under `json.tasks`, and delete/cancel uses the official task path with clearer failure messages.
- Added bounded Get Task wait mode with fixed-interval polling, timeout-safe exits, and additive wait metadata for downstream workflow branching.
- Added optional wait-success video download to `binary.video` while preserving the mapped JSON task output.
- Confirmed real-world fresh-task auto-download success and documented expired signed URL `403` behavior as the expected 24-hour asset window.
- Closed actionable non-icon release-hardening gaps by fixing boolean wording and replacing the restricted polling delay import.
- Preserved PNG node and credential icons as explicit accepted technical debt; icon-format lint failures remain expected until the project chooses SVG icons.

---
