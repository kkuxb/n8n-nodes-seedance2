---
phase: 12-image-generation-mode-operation-ux-refactor
verified: 2026-04-20T02:36:15Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 12: 图像生成模式与操作 UX 重构验证报告

**Phase Goal:** Refactor the image-generation UX so users first choose video or image generation mode, then choose mode-specific operations and fields with clearer ordering and reference-image input behavior.
**Verified:** 2026-04-20T02:36:15Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | 节点 UI 先暴露顶层 `generationMode`，并提供 `视频生成` / `图像生成` 两种模式；既有视频生命周期操作保留在视频模式下。 | ✓ VERIFIED | `nodes/Seedance/Seedance.node.ts:43-100` 中 `generationMode` 位于 `operation` 之前，默认值为 `video`，选项包含 `视频生成/video` 与 `图像生成/image`；`operation.displayOptions.show.generationMode=['video']`。`test/seedreamImageOperationContract.test.ts:88-116` 锁定该契约。 |
| 2 | 图像模式只暴露 `文生图` / `图生图`，不再把图片生成混入顶层视频 `operation` 列表。 | ✓ VERIFIED | `nodes/Seedance/description/image.operation.ts:25-47` 定义 `imageOperation`，仅包含 `textToImage`/`imageToImage`，显示名分别为 `文生图` / `图生图`；`test/seedreamImageOperationContract.test.ts:118-140` 验证。顶层 `operation` 仅有 `create/get/list/delete`。 |
| 3 | 文生图字段顺序为：模型、提示词、提示词优化、分辨率、比例、组图开关、组图张数、联网搜索。 | ✓ VERIFIED | `nodes/Seedance/description/image.operation.ts` 中顺序为 `imageModel` → `imagePrompt` → `optimizePrompt` → `imageResolution` → `imageAspectRatio` → `sequentialImageGeneration` → 条件 `maxImages` → `webSearch`；`test/seedreamImageOperationContract.test.ts:142-177` 明确断言可见顺序。 |
| 4 | 图生图在提示词优化后显示参考图来源；参考图来源对外仅支持 URL / binary 两项；URL/binary 输入支持英文与中文逗号多值；`optimizePrompt=false` 不发送优化选项；不暴露 streaming / output_format / outputFormat / watermark。 | ✓ VERIFIED | `nodes/Seedance/description/image.operation.ts:84-135` 中 `referenceImageSource` 位于 `optimizePrompt` 之后，选项仅 `url` / `binary`，URL 与 binary 描述均声明支持英文逗号或中文逗号多值。`nodes/Seedance/Seedance.node.ts:153-205` 用 `split(/[，,]/)` 解析 URL/binary 多值。`nodes/Seedance/Seedance.node.ts:260-279` 仅在 `optimizePrompt=true` 时才注入 `optimizePromptMode: 'standard'`。`nodes/Seedance/shared/mappers/seedreamImagePayload.ts:59-79` 仅在存在 `input.optimizePromptMode` 时生成 `optimize_prompt_options`，且未暴露 `stream` / `output_format` / `outputFormat` / 图片 `watermark` 字段。`test/seedanceGenerateImageExecute.test.ts:146-243` 与 `test/seedreamImageOperationContract.test.ts:243-250` 覆盖这些行为。 |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `nodes/Seedance/Seedance.node.ts` | 顶层模式选择、视频/图像分发、执行层 mode-aware dispatch | ✓ VERIFIED | 文件存在，568 行；`description.properties` 先定义 `generationMode` 再定义 `operation`；`execute()` 中 `generationMode==='image'` 走图片分支，否则保持视频分支。 |
| `nodes/Seedance/description/create.operation.ts` | 视频 create 字段仅在 `generationMode=video` 显示 | ✓ VERIFIED | 文件存在，245 行；`createDisplayOptions.show` 包含 `generationMode:['video']`，嵌套子字段复用 `...createDisplayOptions.show`。 |
| `nodes/Seedance/description/get.operation.ts` | 视频 get 字段仅在 `generationMode=video` 显示 | ✓ VERIFIED | 文件存在，60 行；所有 `displayOptions` 以 `getDisplayOptions.show` 为基础并带 `generationMode:['video']`。 |
| `nodes/Seedance/description/list.operation.ts` | 视频 list 字段仅在 `generationMode=video` 显示 | ✓ VERIFIED | 文件存在，119 行；`returnAll`、`pageNum`、`pageSize`、`additionalFields` 都被视频模式 gating。 |
| `nodes/Seedance/description/delete.operation.ts` | 视频 delete 字段仅在 `generationMode=video` 显示 | ✓ VERIFIED | 文件存在，20 行；`taskId` 使用 `deleteDisplayOptions`，其中包含 `generationMode:['video']`。 |
| `nodes/Seedance/description/image.operation.ts` | 图像模式 operation 与字段顺序、参考图来源行为 | ✓ VERIFIED | 文件存在，255 行；定义 `imageOperation`、字段顺序、`referenceImageSource`、URL/binary 多值文案与布尔组图开关。 |
| `nodes/Seedance/shared/mappers/seedreamImagePayload.ts` | Prompt 优化、组图选项、web search 与 payload 映射 | ✓ VERIFIED | 文件存在，82 行；`optimize_prompt_options` 条件发送，`sequential_image_generation_options` 仅在 `auto` 时发送，`tools` 仅在 `webSearch=true` 时发送。 |
| `nodes/Seedance/shared/types.ts` | 图片 payload 合约类型 | ✓ VERIFIED | 文件存在，130 行；`SeedreamImagePayloadInput` 使用 `optimizePromptMode?`、`sequentialImageGeneration`、`maxImages?`、`webSearch`。 |
| `test/seedreamImageOperationContract.test.ts` | UI 契约测试：模式、顺序、禁用字段、24 小时提醒 | ✓ VERIFIED | 文件存在，280 行；覆盖 mode-first、图像操作、字段顺序、禁用字段与 live execute smoke。 |
| `test/seedanceGenerateImageExecute.test.ts` | 执行路径测试：文生图、图生图、多值 URL/binary、视频非回归 | ✓ VERIFIED | 文件存在，336 行；覆盖英文/中文逗号、多 binary 属性、stale hidden references、`optimizePrompt=false`、视频分支保持。 |
| `test/seedreamImagePayload.test.ts` | payload mapper 回归测试 | ✓ VERIFIED | 文件存在，113 行；覆盖 group options 条件输出、prompt optimization 条件省略、尺寸映射与 image 字段形态。 |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `Seedance.node.ts` | `create/get/list/delete.operation.ts` | `displayOptions.show.generationMode=['video']` | ✓ WIRED | `Seedance.node.ts:101-105` 引入并展开四个视频 description 模块；各模块分别在 `create.operation.ts:3-8`、`get.operation.ts:3-8`、`list.operation.ts:3-8`、`delete.operation.ts:3-8` 定义视频 gating。 |
| `Seedance.node.ts` | `image.operation.ts` | `...imageOperationProperties` + `generationMode=image` | ✓ WIRED | `Seedance.node.ts:101-105` 展开 `imageOperationProperties`；`image.operation.ts:5-23` 用 `generationMode:['image']` 作为所有 image UI 的顶层 gating。 |
| `Seedance.node.ts` | `seedreamImagePayload.ts` | `buildSeedreamImagePayload(imageInput)` | ✓ WIRED | `Seedance.node.ts:285-292` 在图片分支完成校验后构造 payload 并请求 `/api/v3/images/generations`。 |
| `Seedance.node.ts` | `validateSeedreamImageInput()` | `validate before API call` | ✓ WIRED | `Seedance.node.ts:285` 在发请求前校验参考图数量、MIME、大小和 group 限制。 |
| `Seedance.node.ts` | `mapSeedreamImageResponse()` | `binary/JSON output shaping` | ✓ WIRED | `Seedance.node.ts:293-308` 用结果 mapper 生成 `binary.image1`/`binary.image2` 与请求摘要、usage、逐图错误信息。 |
| `Seedance.node.ts` | `test/seedreamImageOperationContract.test.ts` | `Seedance().description.properties contract assertions` | ✓ WIRED | `test/seedreamImageOperationContract.test.ts:13-48` 通过 `new Seedance().description.properties` 直接断言属性顺序与显示逻辑。 |
| `Seedance.node.ts` | `test/seedanceGenerateImageExecute.test.ts` | `execute() regression assertions` | ✓ WIRED | `test/seedanceGenerateImageExecute.test.ts:127-302` 直接调用 `Seedance.prototype.execute` 断言图片和视频分发行为。 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `nodes/Seedance/Seedance.node.ts` | `generationMode` / `imageOperation` | `getNodeParameter()` 读取节点参数 | Yes | ✓ FLOWING |
| `nodes/Seedance/Seedance.node.ts` | `referenceImages` | `collectSeedreamReferenceImages()` 将 `referenceImageUrl` / `referenceImageBinaryProperty` 按 `/[，,]/` 拆分并转为 URL 或 data URL | Yes | ✓ FLOWING |
| `nodes/Seedance/shared/mappers/seedreamImagePayload.ts` | `payload.optimize_prompt_options` / `payload.sequential_image_generation_options` / `payload.tools` | 由 `optimizePromptMode`、`sequentialImageGeneration==='auto'`、`webSearch` 条件生成 | Yes | ✓ FLOWING |
| `nodes/Seedance/Seedance.node.ts` → `mapSeedreamImageResponse()` | `mapped.binary` / `mapped.json` | API 响应 `data[].b64_json` 与错误对象被映射为 `binary.imageN` 与 JSON `images[]` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| 项目可构建 | `npm run build` | `n8n-node build` 成功，TypeScript build successful | ✓ PASS |
| Phase 12 focused regression suite 通过 | `node --test ...` | 103/103 tests passed，0 fail | ✓ PASS |
| UI 契约真实存在于编译产物 | `node --test test/seedreamImageOperationContract.test.ts`（包含在 suite 中） | 13 个契约/执行 smoke 用例通过 | ✓ PASS |
| 新 mode-aware 执行分发可运行 | `node --test test/seedanceGenerateImageExecute.test.ts`（包含在 suite 中） | URL/binary 多值、中文逗号、video 非回归等用例通过 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| IMG-01 | 12-01 | 用户可以在现有节点中选择新的图片生成 operation | ✓ SATISFIED | `generationMode` + `imageOperation` 在 `Seedance.node.ts` / `image.operation.ts` 中存在，且契约测试通过。 |
| IMG-02 | 12-01 | 固定模型 `doubao-seedream-5-0-260128` | ✓ SATISFIED | `image.operation.ts:48-62` 与 `seedreamImageOperationContract.test.ts:230-241` 锁定固定模型。 |
| IMG-03 | 12-01, 12-02 | 仅提供 prompt 执行文生图 | ✓ SATISFIED | `Seedance.node.ts:163-165,281-283` 文生图强制 `referenceImages=[]`；`seedanceGenerateImageExecute.test.ts:96-112,213-229` 通过。 |
| IMG-04 | 12-02 | 单张参考图 URL/base64/binary 输入 | ✓ SATISFIED | `Seedance.node.ts:177-205,208-237` 支持 URL/base64/binary；类型与 mapper 支持 data URL 转换。 |
| IMG-05 | 12-02 | 多张参考图输入与限制 | ✓ SATISFIED | `Seedance.node.ts:157-205` 处理逗号分隔多值；`seedreamImageValidation.test.ts:79-85` 验证 2-14 张与总数不超 15。 |
| IMG-06 | 12-01, 12-02 | 可切换单图/组图，启用组图时可设置 `max_images` | ✓ SATISFIED | `image.operation.ts:221-246` 使用布尔 `sequentialImageGeneration` 与条件 `maxImages`； `seedreamImagePayload.ts:71-75` 仅在 auto 时输出。 |
| IMG-07 | 12-01, 12-02 | 可配置 `web_search`、`optimize_prompt_options.mode` 与 `size` | ✓ SATISFIED | `image.operation.ts` 暴露 `webSearch` 与 `optimizePrompt`； `seedreamImagePayload.ts:53-63,77-79` 生成 `size`、`optimize_prompt_options`、`tools`。 |
| IMG-08 | 12-02 | 默认 binary 图片输出 | ✓ SATISFIED | `mapSeedreamImageResponse()` 接到 `Seedance.node.ts:293-308`； `seedanceGenerateImageExecute.test.ts:96-125` 验证 `binary.image1` / `binary.image2`。 |
| IMG-09 | 12-02 | JSON 输出保留摘要、usage、工具调用与逐图错误 | ✓ SATISFIED | `seedanceGenerateImageExecute.test.ts:304-336` 与 `seedreamImageResult.test.ts:73-78` 覆盖 partial-failure 与 metadata。 |
| IMG-10 | 12-01, 12-02 | 不破坏既有视频 create/get/list/delete 行为 | ✓ SATISFIED | 视频字段全部 `generationMode=['video']` gating；`seedanceVideoRegression.test.ts`、`seedanceGetWaitMode.test.ts`、`createPayload.test.ts` 均通过； focused suite 103/103 通过。 |
| UX-IMG-01 | 12-01 | UI 分组与顺序清晰 | ✓ SATISFIED | `image.operation.ts` 按模式和 operation gating；契约测试验证顺序。 |
| UX-IMG-02 | 12-01, 12-02 | 默认路径优先常见文生图/单参考图场景 | ✓ SATISFIED | `imageOperation` 默认 `textToImage`，`referenceImageSource` 默认 `url`，复杂多图通过逗号多值/固定集合渐进暴露。 |
| UX-IMG-03 | 12-02 | 明确保留 24 小时结果 URL 提示 | ✓ SATISFIED | `Seedance.node.ts:28` 节点描述含 24 小时提醒；`seedreamImageOperationContract.test.ts:276-280` 验证。 |
| UX-IMG-04 | 12-01 | 不暴露 streaming 开关 | ✓ SATISFIED | `seedreamImageOperationContract.test.ts:243-250` 断言无 `stream/output_format/outputFormat/watermark`。 |
| VAL-IMG-01 | 12-02 | 参考图数量、MIME、大小与来源运行时校验 | ✓ SATISFIED | `Seedance.node.ts:285` 调用 `validateSeedreamImageInput()`； `seedreamImageValidation.test.ts:79-85` 覆盖。 |
| VAL-IMG-03 | 12-02 | 组图下 `max_images` 与总图数联合校验 | ✓ SATISFIED | `seedreamImageValidation.test.ts:84-85` 覆盖联合约束； `seedreamImagePayload.ts:71-75` 条件输出。 |
| VAL-IMG-04 | 12-02 | API 逐图失败信息必须保留 | ✓ SATISFIED | `seedanceGenerateImageExecute.test.ts:304-321`、`seedreamImageResult.test.ts:75-77` 验证失败细节保留。 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| - | - | 未发现会阻断目标达成的 TODO/FIXME/placeholder/stub 模式 | ℹ️ Info | 读取的 Phase 12 关键代码与测试文件中未发现占位实现、空 handler、仅 `console.log` 的伪实现或暴露禁用字段。 |

### Human Verification Required

无。

本 phase 的目标是节点描述契约、字段顺序、模式 gating、参考图输入规范化与执行分发是否真实存在并可运行；这些都已通过源码级检查与 focused regression suite 自动验证。未留下必须依赖人工视觉判断才能决定 phase 是否达标的阻断项。

### Gaps Summary

未发现阻断 Phase 12 目标达成的 gap。

交叉验证结果表明：

- 顶层 `generationMode` 确实先于 `operation`，且只有视频/图像两种模式；
- 视频模式下顶层 `operation` 仅保留 `create/get/list/delete`，且各视频 description 文件都带 `generationMode=['video']` gating；
- 图像模式下只暴露 `文生图` / `图生图`；
- 文生图字段顺序与要求一致；
- 图生图在 `optimizePrompt` 后显示参考图来源，且来源对外仅 URL / binary；
- URL 与 binary 参考图输入都支持英文逗号和中文逗号多值；
- `optimizePrompt=false` 时不会发送 `optimize_prompt_options`；
- 未暴露 `streaming` / `output_format` / `outputFormat` / 图片 `watermark`；
- 自动化验证可信：`npm run build` 通过，focused regression suite `103/103` 全通过。

结合源码、契约测试、执行测试、payload 测试与视频回归测试，Phase 12 目标已达成。

---

_Verified: 2026-04-20T02:36:15Z_
_Verifier: the agent (gsd-verifier)_
