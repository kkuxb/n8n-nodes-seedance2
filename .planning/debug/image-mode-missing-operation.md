---
status: resolved
trigger: 实测图像生成模式报错：n8n 在图像生成模式执行时抛出 "Could not get parameter"，errorExtra.parameterName 为 "operation"，stack 指向 nodes/Seedance/Seedance.node.ts:241:27。
created: 2026-04-20T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

# Debug Session: image-mode-missing-operation

## Symptoms

- expected_behavior: 图像生成模式下应通过 `generationMode=image` 与 `imageOperation` 执行图片生成，不需要读取隐藏的视频 `operation` 参数。
- actual_behavior: n8n 抛出 `Could not get parameter`，缺失参数为 `operation`。
- error_messages: `errorMessage: Could not get parameter`; `errorDetails.errorExtra.parameterName: operation`; stack 指向 `Seedance.node.ts:241:27`。
- timeline: Phase 12 模式优先 UI 重构后，在 n8n 1.123.15 self-hosted 实测图像生成模式时出现。
- reproduction: 在 n8n 节点中选择图像生成模式并执行图片生成；因为 `operation` 字段只在视频模式显示，图像模式参数集中没有 `operation`。

## Current Focus

- hypothesis: `Seedance.execute()` 在进入 image/video 分支前调用 `getNodeParameter('operation', itemIndex)` 且没有 fallback；n8n 对隐藏且不存在的参数会抛错，导致图像模式无法进入 `generationMode=image` 分支。
- test: 检查 `Seedance.node.ts` 的参数读取顺序，并增加执行测试模拟缺少 `operation` 的图像模式。
- expecting: 修复后图像模式不需要 `operation` 参数即可执行；旧 `operation=generateImage` 兼容 fallback 仍可工作。
- next_action: resolved
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- timestamp: 2026-04-20T00:05:00Z
  observation: `Seedance.execute()` 在循环顶部先读取 `getNodeParameter('operation', itemIndex)`，位置正好对应报错堆栈附近；该读取发生在 `generationMode` 分支判断之前。
  source: `nodes/Seedance/Seedance.node.ts` line 241 附近代码审查
- timestamp: 2026-04-20T00:08:00Z
  observation: 新增执行测试在 `generationMode=image` 且完全缺少 `operation` 参数时，使用“无 fallback 即抛错”的上下文模拟 n8n 行为；旧实现会稳定复现 `Could not get parameter: operation`。
  source: `test/seedanceGenerateImageExecute.test.ts`
- timestamp: 2026-04-20T00:12:00Z
  observation: 将 `operation` 读取延后到视频模式分支后，图像模式执行成功，且请求仍命中 `/api/v3/images/generations`。
  source: `node --test test/seedanceGenerateImageExecute.test.ts test/seedreamImageOperationContract.test.ts`
- timestamp: 2026-04-20T00:14:00Z
  observation: 完整构建通过，说明源码修复与产物同步成功。
  source: `npm run build`

## Eliminated

- `imageOperation` 缺失不是本次根因：图像分支已有 `textToImage` fallback，且报错参数名明确为 `operation`。
- 图像端点或 payload 映射不是根因：修复参数读取顺序后，现有 image execute/contract tests 全部通过。
- 视频分支回归不是根因：相关回归测试仍验证 `generationMode=video` 时会继续读取并使用 `operation=get` 执行视频查询逻辑。

## Resolution

- root_cause: `Seedance.execute()` 在任何模式下都抢先读取隐藏的 `operation` 参数；图像模式工作流没有该参数，n8n 因而在进入 `generationMode=image` 分支前直接抛出 “Could not get parameter”。
- fix: 将 `operation` 读取改为先读取 `generationMode`，仅在视频模式下才取 `operation`（带 `create` fallback），并把图像模式执行测试增强为“缺少 operation 参数也必须成功”。
- verification: `npm run build`；`node --test test/seedanceGenerateImageExecute.test.ts test/seedreamImageOperationContract.test.ts`。
- files_changed: `nodes/Seedance/Seedance.node.ts`; `test/seedanceGenerateImageExecute.test.ts`

## Specialist Review

- skill: typescript-expert
- result: LOOKS_GOOD（根因与修复方向一致：应先以 `generationMode` 决定分支，再按需读取 `operation`，避免对隐藏参数做无条件读取；同时已保留视频模式默认值与旧分支兼容行为。）
