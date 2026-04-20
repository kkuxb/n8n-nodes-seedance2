---
status: resolved
trigger: 当前实测其它功能已正常，但我发现图像生成模式下，生成的图片右下角有一个“AI生成”的水印。检查是否是默认将水印参数按照开启来传递了？这个参数需要默认是关闭的。同时排查视频生成模式下是否也有同样的问题。
created: 2026-04-20T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

# Debug Session: image-watermark-default-on

## Symptoms

- expected_behavior: 图像生成模式和视频生成模式都不应默认开启水印；如果 API 支持该参数，应明确传递关闭值或保持 UI 默认关闭。
- actual_behavior: 图像生成实测结果右下角出现“AI生成”水印；尚未确认视频生成是否也默认带水印。
- error_messages: 无显式报错，属于实测行为异常/默认值不符合预期。
- timeline: 在修复图像模式 `operation` 参数问题后继续实测时发现；当前其它功能表现正常。
- reproduction: 在 n8n 中使用图像生成模式生成图片，产物右下角出现“AI生成”水印；需要同时检查视频生成 create payload 默认行为。

## Current Focus

- hypothesis: 图片生成 payload 当前没有显式传递 `watermark=false`，而 API 默认开启水印；或现有视频/图片 mapper 中把水印默认值映射为了开启。
- test: 检查 image/video payload builder、description 默认值、执行层默认参数，以及现有测试是否断言了 watermark 缺省行为。
- expecting: 若 API 支持 watermark，应在图片和视频生成默认请求中显式关闭，且补回归测试；若图片 API 不支持该参数，也要确认当前请求没有主动传开启值，并给出根因结论。
- next_action: completed
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- timestamp: 2026-04-20T00:00:00Z
  source: `APIdocs/图片生成API.md`
  finding: 图片生成接口文档明确声明 `watermark` 默认值为 `true`，`false` 才是不添加水印，说明如果客户端不传该字段，服务端会默认加上“AI生成”水印。

- timestamp: 2026-04-20T00:00:00Z
  source: `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`
  finding: 修复前 `buildSeedreamImagePayload()` 只传 `model/prompt/size/response_format/sequential_image_generation` 等字段，没有传 `watermark`，与图片 API 默认值组合后会导致默认带水印。

- timestamp: 2026-04-20T00:00:00Z
  source: `nodes/Seedance/Seedance.node.ts`
  finding: 视频创建路径已将 `advancedOptions.watermark` 缺省兜底为 `false`，并传入 `buildCreatePayload()`；视频默认行为不是“主动传 true”，而是已显式默认关闭。

- timestamp: 2026-04-20T00:00:00Z
  source: `nodes/Seedance/description/create.operation.ts`
  finding: 视频高级选项中的 `watermark` UI 默认值本来就是 `false`，与执行层默认值一致。

- timestamp: 2026-04-20T00:00:00Z
  source: `APIdocs/创建视频生成任务 API.md`
  finding: 视频创建文档把 `watermark` 作为支持的请求体参数；当前节点视频路径显式传递 `false` 时可关闭水印，因此视频分支不存在“未传参数导致默认开启”的同类问题。

- timestamp: 2026-04-20T00:00:00Z
  source: tests + local verification
  finding: 新增/更新的 image payload、image execute、video payload、video regression 测试全部通过，并验证图像默认请求体现在会显式包含 `watermark: false`，视频路径仍保持显式 `watermark: false` 能力。

## Eliminated

- 图片模式“主动传了 `watermark=true`”被排除：修复前图片 payload 根本没有 `watermark` 字段，不是错误地传成了 `true`。
- 视频模式“存在同样的默认开启问题”被排除：视频 UI 默认值与执行层兜底值都为 `false`，相关回归测试已验证显式关闭仍会写入 payload。
- “API 不支持关闭水印”被排除：图片与视频官方文档均列出了 `watermark` 参数，且图片文档明确 `false` 表示不添加水印。

## Specialist Review

- runtime_note: 当前运行时未提供 `engineering:debug`/语言专家类外部 specialist skill，可执行证据审阅已由本次调试流程完成，未追加额外 specialist 输出。

## Resolution

- root_cause: 图像生成路径此前没有显式传递 `watermark=false`，而官方图片 API 的 `watermark` 默认值为 `true`，因此服务端按默认行为给生成图片添加了右下角“AI生成”水印；视频生成路径不存在同样问题，因为节点已默认显式关闭视频水印。
- fix: 为图像生成新增 `imageWatermark` 节点参数并将默认值设为 `false`，在 `Seedream` 图片 payload builder 中始终传递 `watermark`；同时补充图片默认关闭/显式开启、视频默认关闭回归测试。
- verification: `npm run build` ✅；`node --test test/seedreamImagePayload.test.ts` ✅；`node --test test/seedanceGenerateImageExecute.test.ts` ✅；`node --test test/createPayload.test.ts` ✅；`node --test test/seedanceVideoRegression.test.ts` ✅。
- files_changed: `nodes/Seedance/shared/types.ts`, `nodes/Seedance/shared/mappers/seedreamImagePayload.ts`, `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/description/image.operation.ts`, `test/seedreamImagePayload.test.ts`, `test/seedanceGenerateImageExecute.test.ts`, `test/createPayload.test.ts`, `test/seedanceVideoRegression.test.ts`, `.planning/debug/image-watermark-default-on.md`
