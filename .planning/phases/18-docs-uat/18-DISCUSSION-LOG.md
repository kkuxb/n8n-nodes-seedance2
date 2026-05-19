# Phase 18: 用户文档与手工验收 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19T21:25:00+08:00
**Phase:** 18-用户文档与手工验收
**Areas discussed:** 手工验收方式

---

## 讨论范围

| Option | Description | Selected |
|--------|-------------|----------|
| 全部讨论 | 覆盖文档放哪里、示例怎么写、手工验收怎么记录，后续计划更稳。 | |
| 只讨论验收 | 文档结构由 the agent 决定，只确认是否要跑真实任务和记录什么结果。 | ✓ |
| 我只看结论 | the agent 按保守默认值决定，之后直接生成 Phase 18 的上下文文档摘要。 | |

**User's choice:** 只讨论验收
**Notes:** 用户没有技术背景，已明确要求技术向决策由 the agent 处理，只有功能向决策才询问用户。

---

## 手工验收方式

| Option | Description | Selected |
|--------|-------------|----------|
| 真实调用 | 记录一次真实创建任务、查询/等待、下载结果，最能证明用户流程跑通。 | ✓ |
| 模拟验收 | 只记录本地检查和测试结果，不消耗额度，但不能证明真实接口可用。 | |

**User's choice:** 真实调用
**Notes:** Phase 18 不能用 mock 结果替代 `DOC-03` 的真实手工验收通过记录。

---

## 验收素材组合

| Option | Description | Selected |
|--------|-------------|----------|
| 最小组合 | 1 张参考图片 + 提示词，最容易跑通。 | ✓ |
| 完整组合 | 图片 + 视频 + 音频 + 提示词，覆盖最全，但更容易受素材限制影响。 | |
| 素材 ID 组合 | 使用 Volcengine `asset://` 素材，适合人脸/授权素材，但需要已有素材 ID。 | |

**User's choice:** 最小组合
**Notes:** 使用最小可靠路径证明多模态 create 到 lifecycle 的完整用户流程。

---

## 验收记录位置

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 文档里 | 写入 Phase 18 的验收记录，适合开发闭环。 | ✓ |
| README 里也放简短验收步骤 | 用户更容易看到，但 README 会更长。 | |
| 两边都写 | README 放步骤，Phase 文档放实际结果。 | |

**User's choice:** Phase 文档里
**Notes:** README 应保留用户操作步骤和限制说明；真实验收细节、任务 ID、结果状态和保留限制记录到 Phase 18 artifacts。

---

## the agent's Discretion

- 文档结构、README 章节位置、措辞、验收清单格式、计划拆分、测试命令和技术执行细节由 the agent 决定。
- 只有当真实 UAT 缺少功能输入时再询问用户，例如缺少可用火山凭证、额度或合规参考图片。

## Deferred Ideas

None.
