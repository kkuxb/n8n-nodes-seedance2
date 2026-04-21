---
phase: 14-create-mode-ux-contract
verified: 2026-04-21T00:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 14: Create-Mode UX Contract Verification Report

**Phase Goal:** 在现有 video create operation 中锁定五种 create mode 的 UI 合同，并用正式 verification 证明用户可以清晰区分参考图/参考视频模式与既有首帧模式。
**Verified:** 2026-04-21T00:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `createMode` 保留既有 `t2v`、`i2v_first`、`i2v_first_last`，并在末尾追加 `reference_images`、`reference_videos` 两个用户可见选项。 | ✓ VERIFIED | `nodes/Seedance/description/create.operation.ts:33-45` 定义五种模式及顺序；`test/createPayload.test.ts:224-241` 回归断言名称和值顺序完全一致。 |
| 2 | `referenceImageItems` 只在 `reference_images` 下显示，且采用 ordered `fixedCollection`，不会污染旧模式 UI。 | ✓ VERIFIED | `nodes/Seedance/description/create.operation.ts:142-200` 将字段限定在 `createMode=['reference_images']`，并使用 `multipleValues` + `source/url/binaryProperty` 结构；`test/createPayload.test.ts:243-271` 断言有序集合、来源选项与模式隔离。 |
| 3 | `referenceVideoItems` 只在 `reference_videos` 下显示，公共 UI 仅暴露 URL/`asset://`，不暴露 binary/base64。 | ✓ VERIFIED | `nodes/Seedance/description/create.operation.ts:201-232` 将字段限定在 `createMode=['reference_videos']` 且 values 仅含 `url`；`test/createPayload.test.ts:273-296` 断言无 `source`、`binaryProperty`、`base64`。 |
| 4 | Prompt/helper copy 明确说明文生视频必填、参考模式可省略提示词、参考模式与首帧/首尾帧模式互斥，且不保证精确首尾帧一致；节点 subtitle/description 与该 mode-first UX 对齐。 | ✓ VERIFIED | `nodes/Seedance/description/create.operation.ts:47-57` 写明 prompt 使用规则与互斥边界；`nodes/Seedance/description/create.operation.ts:150-152,209-227` 记录参考图/参考视频 helper copy 与限制；`nodes/Seedance/Seedance.node.ts:21-29` 将 subtitle/description 对齐到 `reference_images` / `reference_videos`；`test/createPayload.test.ts:298-315` 对关键提示文案回归断言。 |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `nodes/Seedance/description/create.operation.ts` | 五种 create mode、模式级字段可见性、提示文案与参考模式边界 | ✓ VERIFIED | 文件存在且提供 `createMode`、`prompt`、`referenceImageItems`、`referenceVideoItems` 的实质定义。 |
| `nodes/Seedance/Seedance.node.ts` | 顶层 subtitle/description 与 mode-first UX 对齐 | ✓ VERIFIED | 文件存在；`subtitle` 对参考图/参考视频模式显示专有标签，`description` 继续声明互斥边界。 |
| `test/createPayload.test.ts` | 覆盖 createMode 顺序、字段可见性与 helper-copy 回归 | ✓ VERIFIED | 文件存在；针对 Phase 14 UX 合同的断言集中在 224-315 行。 |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `nodes/Seedance/description/create.operation.ts` | `test/createPayload.test.ts` | `createMode` / `referenceImageItems` / `referenceVideoItems` / `prompt` 属性断言 | ✓ VERIFIED | `test/createPayload.test.ts:224-315` 直接读取 built `createOperationProperties` 并校验顺序、displayOptions 与文案。 |
| `nodes/Seedance/description/create.operation.ts` | `nodes/Seedance/Seedance.node.ts` | 模式名称与互斥说明在节点级 copy 保持一致 | ✓ VERIFIED | `create.operation.ts:41-42,55,151,210` 与 `Seedance.node.ts:27-28` 在参考模式命名和互斥说明上保持一致。 |
| `nodes/Seedance/Seedance.node.ts` | `test/createPayload.test.ts` | Phase 14 通过 description-property 回归保护 UX 合同，不扩展到后续执行期 claim | ✓ VERIFIED | 测试聚焦 UI/文案合同；未越界声称 Phase 15-17 的 runtime 支持已在本报告内验证。 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 14 UX contract verification build/test | `npm run build && node --test "test/createPayload.test.ts"` | `build` 通过；`createPayload.test.ts` 22/22 通过，其中与 Phase 14 UX 合同直接相关的 5 个断言全部通过。 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `UX-04` | `14-01-PLAN.md` | 用户可以在节点 UI 中清晰区分五种视频 create mode 的用途 | ✓ SATISFIED | 五种模式顺序、参考图/参考视频字段隔离、helper copy、节点 subtitle/description 均有代码与回归测试双重证据，见 `create.operation.ts:33-57,142-232`、`Seedance.node.ts:21-29`、`test/createPayload.test.ts:224-315`。 |

### Anti-Patterns Found

未发现会阻塞 Phase 14 UX 合同目标的 stub / TODO / placeholder 反模式。本报告仅验证 Phase 14 UI 合同，不声明 Phase 15、16、17 的 validator、payload 或 execute 级行为已在此处完成验证。

### Gaps Summary

无。当前 shipped code 与 targeted regression 已足以正式证明 Phase 14 的五模式 UI 合同、字段可见性边界、helper copy 与节点级 mode-first 文案；若未来出现新的 verification blocker，必须在本文件中用具体证据和影响范围显式记录，而不是以 summary 声称替代。

---

_Verified: 2026-04-21T00:00:00Z_
_Verifier: the agent (gsd-executor)_
