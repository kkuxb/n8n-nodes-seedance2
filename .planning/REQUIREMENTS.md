# Milestone v1.2 Requirements

**Status:** Draft
**Milestone:** v1.2
**Focus:** 在现有 Seedance 节点内新增基于 Seedream 5.0 lite 的图片生成能力

## Scope

- 在现有 `Seedance` 节点中新增图片生成 operation，而不是创建新节点。
- 复用现有 `SeedanceApi` credentials，不新增独立图片凭证。
- 当前 milestone 仅支持 `doubao-seedream-5-0-260128`。
- 支持文生图，以及带参考图的图像生成。
- 参考图输入优先支持 URL、base64、binary 三种来源，并在可行范围内支持单图与多图输入。
- 支持单图生成与组图/连续图生成。
- 默认输出应为 n8n binary 图片数据，而不是只返回 URL。
- 支持高级选项：`sequential_image_generation`、`max_images`、`web_search`、`optimize_prompt_options`、`size`。

## Functional Requirements

- [x] **IMG-01**: 用户可以在现有 `Seedance` 节点中选择新的图片生成 operation。
- [x] **IMG-02**: 用户可以使用固定模型 `doubao-seedream-5-0-260128` 发起图片生成请求。
- [x] **IMG-03**: 用户可以只提供 prompt 执行文生图。
- [x] **IMG-04**: 用户可以通过 URL、base64 或 binary 传入单张参考图。
- [x] **IMG-05**: 用户可以在组图/融合场景下传入多张参考图，并满足官方 2-14 张输入及总张数不超过 15 的约束。
- [x] **IMG-06**: 用户可以切换单图模式与组图模式；当启用组图时可设置 `max_images`。
- [x] **IMG-07**: 用户可以配置 `web_search`、`optimize_prompt_options.mode` 与 `size`。
- [x] **IMG-08**: 节点默认把成功生成的图片下载并写入 n8n binary 输出；单图与组图都要有稳定的输出约定。
- [x] **IMG-09**: 节点在 JSON 输出中保留必要的请求摘要、尺寸、usage、工具调用和逐图错误信息，便于工作流分支处理。
- [x] **IMG-10**: 图片生成接入不得破坏既有视频 `create/get/list/delete` operation 的行为、参数契约和输出结构。

## UX Requirements

- [x] **UX-IMG-01**: 图片生成参数在 UI 中按文本输入、参考图输入、组图选项和高级选项清晰分组。
- [x] **UX-IMG-02**: 默认路径优先服务常见文生图和单参考图场景，复杂多图输入作为渐进暴露能力。
- [x] **UX-IMG-03**: 明确说明图片结果 URL 仅 24 小时有效，即使默认会自动下载到 binary，仍要保留这一约束提示。
- [x] **UX-IMG-04**: 不在本 milestone 暴露 streaming 开关。

## Validation Requirements

- [x] **VAL-IMG-01**: 对参考图输入数量、MIME 类型、大小与来源进行运行时校验，避免向 API 发送明显无效请求。
- [ ] **VAL-IMG-02**: 对 `size` 做 Seedream 5.0 lite 允许值与像素格式校验。
- [x] **VAL-IMG-03**: 对组图模式下 `max_images`、参考图数量和总图数上限做联合校验。
- [x] **VAL-IMG-04**: 当 API 返回逐图失败信息时，节点输出必须保留失败细节，而不是静默丢弃。

## Explicitly Out of Scope

- 不支持 streaming / 流式图片输出。
- 不在本 milestone 支持除 `doubao-seedream-5-0-260128` 之外的其他 Seedream 模型。
- 不在本 milestone 暴露 `output_format` 与 `watermark` 为用户配置项，除非后续实现证明 API 默认值无法满足默认 binary 输出目标。
- 不新增独立图片节点或独立图片 credentials。
- 不修改既有 PNG icon 决策。

## Acceptance Notes

- 默认 binary 输出是本 milestone 的核心体验目标。
- 如果 API 默认 `response_format=url`，实现阶段需要在内部下载转换或以最小额外配置达成默认 binary 输出。
- 组图返回中允许出现部分图片失败，但输出契约必须能反映成功图、失败图和 usage。
