# Milestones

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
