---
phase: 12-image-generation-mode-operation-ux-refactor
reviewed: 2026-04-20T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - nodes/Seedance/Seedance.node.ts
  - nodes/Seedance/description/create.operation.ts
  - nodes/Seedance/description/get.operation.ts
  - nodes/Seedance/description/list.operation.ts
  - nodes/Seedance/description/delete.operation.ts
  - nodes/Seedance/description/image.operation.ts
  - test/seedanceGenerateImageExecute.test.ts
  - test/seedreamImageOperationContract.test.ts
  - test/seedreamImagePayload.test.ts
  - test/seedanceVideoRegression.test.ts
  - test/seedanceGetWaitMode.test.ts
findings:
  critical: 0
  warning: 4
  info: 1
  total: 5
status: resolved
resolved: 2026-04-20T00:00:00Z
resolution_commit: 2f16400
---

# Phase 12: Code Review Report

**Reviewed:** 2026-04-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

**Resolution:** resolved in `2f16400` (`fix(12): resolve image mode review findings`).

## Resolution Summary

- WR-01 resolved: all nested create-video frame fields now reuse `createDisplayOptions.show`, including `generationMode=['video']`.
- WR-02 resolved: URL and binary reference splitting now supports both English commas and Chinese commas.
- WR-03 resolved: `optimizePrompt=false` now omits `optimize_prompt_options` instead of sending `standard`.
- WR-04 resolved: added tests for Chinese comma splitting, stale hidden references, `optimizePrompt=false`, URL/binary-only reference source options, and boolean group-image mode.
- IN-01 partially addressed: final focused regression still covers video dispatch and existing video regression suites; no additional create/list/delete execute tests were required for Phase 12 acceptance.

## Summary

本次审查覆盖了 Phase 12 的模式切换 UI、图片执行分发、参考图输入规范化，以及相关回归测试。

整体上，`generationMode` / `imageOperation` 的主分发思路是成立的，视频 `create/get/list/delete` 的执行路径也保持了原有 endpoint 与主流程；旧 `operation=generateImage` 兼容分支也被保留，方向正确。

但当前实现仍有几处会影响可靠性或 UX 契约的残余问题：

- `create` 相关的部分视频字段没有完整加上 `generationMode=['video']`，存在 hidden/stale 字段在图像模式下重新露出的风险。
- 图生图的逗号分隔只支持英文逗号 `,`，不支持中文逗号 `，`；对中文用户来说这是高概率踩坑点。
- `optimizePrompt=false` 当前不会真正关闭 prompt optimization，和 UI 暴露出来的布尔语义不一致。
- 测试覆盖了英文逗号与主路径，但没有锁定中文逗号、stale hidden references、`optimizePrompt=false` 这些关键失败模式。

## Warnings

### WR-01: create 子字段缺少 generationMode gating，图像模式下可能出现视频 stale fields

**File:** `nodes/Seedance/description/create.operation.ts:65-69,77-82,91-95,107-111,120-124,133-137`
**Issue:** `firstFrameInputMethod`、`firstFrameImageUrl`、`firstFrameBinaryProperty`、`lastFrameInputMethod`、`lastFrameImageUrl`、`lastFrameBinaryProperty` 这些字段的 `displayOptions.show` 只判断了 `operation` / `createMode` / 输入方式，没有带上 `generationMode: ['video']`。Phase 12 的目标是“所有视频字段仅在视频模式可见”，但这些字段仍可能在 `generationMode=image` 且工作流里残留 `operation=create` / `createMode=...` 时被显示出来，造成 UI 泄漏和误配置风险。
**Fix:** 统一复用 `createDisplayOptions.show` 或在每个嵌套 `show` 条件里补上 `generationMode: ['video']`。例如：

```ts
displayOptions: {
  show: {
    ...createDisplayOptions.show,
    createMode: ['i2v_first', 'i2v_first_last'],
    firstFrameInputMethod: ['url'],
  },
}
```

### WR-02: 图生图多值拆分不支持中文逗号，中文用户容易把多参考图当成单个值提交

**File:** `nodes/Seedance/Seedance.node.ts:172-179,192-205`
**Issue:** `referenceImageUrl` 与 `referenceImageBinaryProperty` 的规范化使用的是 `.split(',')`，只识别英文逗号。当前字段文案是中文，“支持用逗号分隔填写多个值”，中文用户很容易输入全角逗号 `，`。这样会导致多个 URL / binary 属性名不会被拆开，而是作为一个整体进入校验或读取流程，形成难定位的失败。
**Fix:** 同时支持半角和全角逗号，或在进入执行前先做标准化。比如：

```ts
const splitCommaSeparated = (value: string) =>
  value
    .split(/[，,]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
```

然后 URL 与 binary 属性名都复用这个 helper。

### WR-03: optimizePrompt=false 不会真正关闭提示词优化，执行语义与 UI 不一致

**File:** `nodes/Seedance/Seedance.node.ts:273-275`
**Issue:** 节点读取了 `optimizePrompt` 布尔值，但构造 `imageInput` 时无条件写死 `optimizePromptMode: 'standard'`。这意味着即使用户显式关闭“优化提示词”，最终 payload 仍会发送优化配置。对外表现为：UI 提供了开关，但执行层忽略了 `false`。
**Fix:** 让执行层真正消费该布尔值。若 API 不支持显式“关闭”模式，建议在 `optimizePrompt=false` 时省略 `optimize_prompt_options`，并同步调整类型与 payload builder；若产品上必须始终开启，则应移除该布尔字段，避免虚假开关。

### WR-04: 关键失败模式测试覆盖不足，当前 suite 还没有锁定中文逗号 / stale references / optimizePrompt=false

**File:** `test/seedanceGenerateImageExecute.test.ts:127-168`; `test/seedreamImageOperationContract.test.ts:179-214,243-260`
**Issue:** 测试已经覆盖了英文逗号 URL/binary 多值输入和文生图主路径，但没有覆盖以下对本 phase 很关键的回归点：

- `referenceImageUrl` / `referenceImageBinaryProperty` 使用中文逗号 `，`
- `imageOperation=textToImage` 时，即便存在隐藏 stale reference 字段，也必须保证请求中不带 `image`
- `optimizePrompt=false` 时 payload 不应继续表现为开启优化

其中前两项都直接对应本 phase 的显式风险点；一旦未来重构执行层，这些行为很容易无声回归。
**Fix:** 补 3 类测试：

```ts
test('image-to-image splits Chinese commas in URL references', ...)
test('text-to-image drops stale hidden reference fields from saved workflow state', ...)
test('optimizePrompt=false does not send optimize_prompt_options', ...)
```

## Info

### IN-01: 视频执行路径主流程保持稳定，但建议补一条 create/list/delete 的 mode-aware dispatch 直连断言

**File:** `test/seedanceGenerateImageExecute.test.ts:197-227`; `test/seedanceVideoRegression.test.ts:17-66`
**Issue:** 当前测试已经证明 `generationMode=video` + `operation=get` 仍走视频分支，且独立回归测试也验证了视频 endpoint 与 mapper 合约稳定。这基本说明视频路径没有明显回归。不过，mode-aware dispatch 是本 phase 新增逻辑，若后续有人调整 `execute()` 的分支顺序，仅靠 `get` 一个操作的直连测试还不够完整。
**Fix:** 可额外补一组轻量执行级断言，至少覆盖 `create`、`list`、`delete` 在 `generationMode=video` 下不会误入 image 分支，从而把“视频主路径不回归”锁得更严。

---

_Reviewed: 2026-04-20T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
