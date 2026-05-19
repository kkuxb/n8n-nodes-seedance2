# Phase 16: Seedance 2.0 参数与本地校验 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19T08:20:00Z
**Phase:** 16-Seedance 2.0 参数与本地校验
**Areas discussed:** 媒体校验深度, Binary 媒体校验, 错误粒度, 1080p 与 Fast 模型, 远程媒体边界, 官方可选参数

---

## 媒体校验深度

| Option | Description | Selected |
|--------|-------------|----------|
| 只做可确定校验 | Binary 校验 MIME/大小等可见信息；URL/asset 只校验非空和已知数量/组合规则，不根据后缀猜格式，避免误杀带签名 URL 或无扩展名 CDN URL。 | ✓ |
| 轻量后缀提示 | 对 URL 做 `.png/.jpg/.mp4/.wav` 等后缀检查；不符合时阻止提交。 | |
| 尽量严格 | URL/asset 也按官方格式、后缀、协议做强校验。 | |

**User's choice:** 只做可确定校验。
**Notes:** URL/asset 不做后缀或协议强校验，不做远程探测。

---

## Binary 媒体校验

| Option | Description | Selected |
|--------|-------------|----------|
| MIME + 大小 | 图片/音频 binary 按 n8n 提供的 `mimeType` 和 buffer 大小校验；图片格式、音频格式、单文件大小、总请求大小可本地阻止。视频 binary 仍不支持。 | ✓ |
| MIME + 大小 + 图片尺寸 | 额外读取图片宽高来校验宽高比、像素边界，需要新增 metadata 解析逻辑或依赖。 | |
| MIME + 大小，尺寸类延期 | 本阶段不做图片宽高/视频分辨率/FPS/codec，本地只拦截格式和大小；尺寸类统一记录为 API 负责。 | |

**User's choice:** MIME + 大小。
**Notes:** 不新增图片尺寸、视频 metadata、音频 duration 解析依赖。

---

## 错误粒度

| Option | Description | Selected |
|--------|-------------|----------|
| 一次报第一个错误 | 实现简单，符合现有 validator 抛错模式；用户修一个再跑一次。 | ✓ |
| 按类别汇总 | 同一请求内把参数错误、参考素材错误分别汇总成一条中文错误。 | |
| 尽量完整汇总 | 所有 item、所有参数问题一次性列出。 | |

**User's choice:** 一次报第一个错误。
**Notes:** 不在 Phase 16 做 validator 多错误收集重构。

---

## 1080p 与 Fast 模型

| Option | Description | Selected |
|--------|-------------|----------|
| UI 开放 1080p，本地阻止 Fast+1080p | 标准 Seedance 2.0 可选 1080p；Fast 也可能看到选项，但选择 Fast+1080p 时给明确错误。 | |
| 按模型动态隐藏 1080p | 标准模型显示 1080p，Fast 模型隐藏；validator 仍防御性阻止 Fast+1080p。 | ✓ |
| 暂不开放 1080p | 继续只允许 480p/720p。 | |

**User's choice:** 按模型动态隐藏 1080p。
**Notes:** 标准 Seedance 2.0 显示并允许 1080p；Fast 隐藏并防御性报错。

---

## 远程媒体边界

| Option | Description | Selected |
|--------|-------------|----------|
| 明确交给 API 校验 | 本地只校验非空、数量、组合、可见参数；URL/asset 的分辨率、时长、FPS、codec、远程大小不下载、不探测。 | ✓ |
| 只做文案提示 | 不阻止提交，但在字段描述中提示官方限制。 | |
| 尝试远程探测 | 对 URL 发请求或下载头信息来判断大小/类型。 | |

**User's choice:** 明确交给 API 校验。
**Notes:** 不发 `HEAD`，不下载，不读取远程 metadata。

---

## 官方可选参数

| Option | Description | Selected |
|--------|-------------|----------|
| 保持轻量，只补强已有项 | 只处理已暴露/已在范围内的 `duration`、`ratio`、`resolution`、`seed`、`execution_expires_after`、`watermark`、`generate_audio`、`return_last_frame`。 | ✓ |
| 补 `web_search` | 增加 Seedance 2.0 `tools: [{ type: "web_search" }]` 可选项。 | |
| 补 `safety_identifier` | 增加终端用户安全标识字段。 | |

**User's choice:** 保持轻量，只补强已有项。
**Notes:** `web_search` 和 `safety_identifier` 记录为延期，不进入 Phase 16。

---

## the agent's Discretion

- Helper names, module boundaries, and constant placement may be chosen by planner/researcher.
- Validation implementation can stay in `validators/create.ts` or be split into a focused helper if that keeps the code clearer.

## Deferred Ideas

- Seedance 2.0 `tools.web_search`.
- `safety_identifier`.
- Remote media metadata probing for URL/asset sources.
