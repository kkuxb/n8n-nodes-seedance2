---
phase: 14-create-mode-ux-contract
verified: 2026-04-21T00:00:00Z
status: in_progress
score: evidence-collected
overrides_applied: 0
---

# Phase 14: Create-Mode UX Contract Verification Report

**Phase Goal:** 为五种视频 create mode 的 UI 合同补齐正式 verification 证据，证明用户可以清晰区分模式、字段边界与提示文案。
**Verified:** 2026-04-21T00:00:00Z
**Status:** in_progress
**Re-verification:** No — evidence collection draft

## Evidence Notes

### UX-04 Evidence Inventory

| Claim | Evidence |
| --- | --- |
| 五种 create mode 以既有三种模式为前缀，末尾追加 `reference_images` 与 `reference_videos` | `nodes/Seedance/description/create.operation.ts:33-45` 定义了 `t2v`、`i2v_first`、`i2v_first_last`、`reference_images`、`reference_videos` 五个选项；`test/createPayload.test.ts:224-241` 对顺序与值做回归断言。 |
| 参考图字段仅在 `reference_images` 下显示，且使用 ordered fixedCollection | `nodes/Seedance/description/create.operation.ts:142-200` 将 `referenceImageItems` 限定为 `fixedCollection` + `multipleValues`，并通过 `displayOptions.show.createMode=['reference_images']` 隔离；`test/createPayload.test.ts:243-271` 验证字段隔离、顺序集合与输入来源。 |
| 参考视频字段仅在 `reference_videos` 下显示，公共 UI 不暴露 binary/base64 路径 | `nodes/Seedance/description/create.operation.ts:201-232` 将 `referenceVideoItems` 限定在 `reference_videos` 模式且仅包含 `url` 字段；`test/createPayload.test.ts:273-296` 断言无 `source`、`binaryProperty`、`base64`。 |
| Prompt/helper copy 明确参考模式与首帧/首尾帧模式互斥，且不保证精确首尾帧一致 | `nodes/Seedance/description/create.operation.ts:47-57` 的 `prompt` 描述写明文生必填、参考模式可留空、互斥与“不保证精确首尾帧一致”；`nodes/Seedance/description/create.operation.ts:143-152,202-210` 补充参考图/参考视频说明；`test/createPayload.test.ts:298-315` 做文案回归断言。 |
| 节点级 subtitle/description 与 mode-first UX 保持一致 | `nodes/Seedance/Seedance.node.ts:21-29` 的 `subtitle` 对 `reference_images` / `reference_videos` 返回对应中文模式名，`description` 继续声明参考模式与首帧/首尾帧模式互斥。 |

### Blocker Candidate Rule

若后续复核发现任何 claim 无法被上述代码或测试直接证明，必须在最终 verification 报告中以 blocker 形式记录其范围、缺失证据与受影响 requirement；不得用 summary 文案替代代码证据。
