# Phase 17: 既有模式与 lifecycle 兼容性 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19T20:37:12+08:00
**Phase:** 17-既有模式与 lifecycle 兼容性
**Areas discussed:** 旧视频 create 合同, lifecycle 回归覆盖深度, wait/download 兼容性, Seedream 图片路径隔离边界, 回归测试组织方式

---

## 旧视频 create 合同

| Option | Description | Selected |
|--------|-------------|----------|
| 锁定 HTTP payload 精确形状 | 对 `t2v`、`i2v_first`、`i2v_first_last` 分别断言 `content`、role、body 字段和不应出现的多模态字段。 | ✓ |
| 只锁用户可见输出 | 只断言执行结果、requestSummary 和错误消息。 | |
| 锁 payload + requestSummary | 同时确认发给 API 的 body 和返回给 n8n 用户看的摘要。 | |

**User's choice:** 1 — 锁定 HTTP payload 精确形状。
**Notes:** User also chose to cover saved workflow parameter state, forbid `reference_*` roles and `referenceMaterials` reads in old modes, and cover all three old modes through execute-level HTTP body capture.

---

## lifecycle 回归覆盖深度

| Option | Description | Selected |
|--------|-------------|----------|
| 全部 execute-level 捕获 | `get`、`list`、`delete` 都通过 node execution fake 捕获 method/path/query/body 和输出形状。 | ✓ |
| mapper/endpoint 为主，execute 抽样 | endpoint、task mapper、错误 mapper 单测为主，只抽一个操作做 execute-level。 | |
| 只覆盖新增多模态相关路径 | 只确认多模态 create 后的后续 lifecycle 兼容。 | |

**User's choice:** 1 — 全部 execute-level 捕获。
**Notes:** User selected list query/filter aggregation coverage, delete success envelope coverage, and get immediate-query single GET + task mapped output coverage.

---

## wait/download 兼容性

| Option | Description | Selected |
|--------|-------------|----------|
| 成功、失败、超时都覆盖 | 覆盖 `succeeded`、`failed` 和 timeout。 | ✓ |
| 只覆盖 succeeded + timeout | 用户最常见路径加超时保护。 | |
| 沿用已有 wait 测试，不新增终态覆盖 | 只确认新多模态不破坏 wait 入口。 | |

**User's choice:** 1 — 成功、失败、超时都覆盖。
**Notes:** User selected coverage for both old video tasks and multimodal tasks, locked `binary.video` attachment conditions, and chose to reuse existing flow tests.

---

## Seedream 图片路径隔离边界

| Option | Description | Selected |
|--------|-------------|----------|
| 锁 execute-level image generation 路径 | 调用 `Seedance.prototype.execute.call(context)` 走 `generationMode='image'`，确认不会读取视频 create/multimodal 参数。 | ✓ |
| 只锁 image payload mapper | 只确认 Seedream payload 没变，不测 node dispatch 隔离。 | |
| 沿用已有 Seedream 测试，不新增 | 认为现有图片测试足够，Phase 17 只关注视频 lifecycle。 | |

**User's choice:** 1, then delegated technical decisions to the agent.
**Notes:** User stated they do not have a technical background and wants future technical decisions handled by the agent. Only functional/product-facing decisions should be escalated.

---

## 回归测试组织方式

| Option | Description | Selected |
|--------|-------------|----------|
| 扩展现有测试文件 | Reuse current fake contexts and place coverage near related behavior. | ✓ |
| 新建 Phase 17 专用 lifecycle 测试 | Centralize all compatibility tests but duplicate harnesses. | |
| 只扩展 seedanceVideoRegression.test.ts | Keep video compatibility in one file but risk making it too large. | |

**User's choice:** Delegated to the agent.
**Notes:** The agent selected the recommended existing-file strategy: video create/lifecycle in `seedanceVideoRegression.test.ts`, wait/download in `seedanceDownloadFlow.test.ts` and `seedanceGetWaitMode.test.ts`, Seedream isolation in `seedanceGenerateImageExecute.test.ts`.

---

## the agent's Discretion

- Technical test strategy, file organization, fixture design, assertion depth, and helper extraction are delegated to the agent.
- Future discussions should ask the user only about functional/product-facing choices.

## Deferred Ideas

None.
