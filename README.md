# n8n-nodes-seedance2

用于在 n8n 中接入火山引擎 Seedance 视频生成任务生命周期，以及 Seedream 5.0 lite 图片生成能力的社区节点包。

当前实现已经覆盖两条可用能力：

- Seedance 视频任务生命周期闭环：创建任务、查询任务、获取任务列表，以及按任务状态取消或删除任务
- Seedream 5.0 lite 图片生成：默认返回 n8n binary 图片输出

节点保持 programmatic-style 实现，凭证与节点图标继续使用当前 PNG 资源。

## 当前能力

- Seedance API Key 凭证
- 创建任务
  - 文生视频
  - 首帧图生视频
  - 首尾帧图生视频
  - 支持图片 URL 或 n8n binary 输入
- 查询单个任务
  - 可单次查询当前状态
  - 可在节点内每 20 秒轮询一次，直到终态或超时
  - 成功后可选下载视频到 `binary.video`
- 获取任务列表
  - 支持分页或自动拉取多页
  - 支持 `status`、`taskIds`、`model`、`serviceTier` 过滤
- 取消 / 删除任务
  - `queued` 任务可取消
  - 支持删除的终态记录可删除
- 图片生成
  - 固定模型 `doubao-seedream-5-0-260128`
  - 支持文生图
  - 支持 URL、base64/data URL、binary、以及多参考图输入
  - 支持单图与组图
  - 默认返回单 item，多张成功图片挂到 `binary.image1`、`binary.image2`...

## 平台限制

- Seedance 仅支持查询最近 7 天任务历史
- `videoUrl` 与 `lastFrameUrl` 默认 24 小时有效，拿到结果后应尽快转存
- 图片接口在 `response_format=url` 时返回的图片 URL 同样默认 24 小时有效
- 节点内等待模式会阻塞当前执行；长流程仍建议结合 n8n 自带 `Wait` 节点编排

## 安装

社区节点安装方式以你的 n8n 部署方式为准。发布到 npm 后，可按 n8n 社区节点常规方式安装本包：

```bash
npm install n8n-nodes-seedance2
```

本包要求 Node.js `22.x`。

## 凭证设置

节点提供一个凭证类型：`Seedance 凭证 API`。

需要填写：

- `API Key`：火山方舟 Seedance API Key

当前实现只需要这一项，不额外暴露 base URL。

## 节点操作

### Create

用于创建 Seedance 视频任务。

支持模型：

- `Seedance 2.0`
- `Seedance 2.0 Fast`

支持创建模式：

- `文生视频`
- `首帧图生视频`
- `首尾帧图生视频`

主要参数：

- `prompt`
- `resolution`: `480p` 或 `720p`
- `ratio`: `1:1`、`16:9`、`21:9`、`3:4`、`4:3`、`9:16`、`adaptive`
- `duration`: `4` 到 `15` 秒，或 `-1` 自动选择
- `generateAudio`
- `seed`
- `watermark`
- `returnLastFrame`
- `executionExpiresAfter`: `3600` 到 `259200` 秒

图生模式额外支持：

- 首帧图片 URL
- 尾帧图片 URL
- 从输入 item 的 binary 属性读取图片

二进制图片限制：

- 支持 `jpeg`、`png`、`webp`、`bmp`、`tiff`、`gif`
- 单张图片最大 30 MB

创建结果会返回摘要字段，便于后续流程继续使用。

### Get

用于根据 `taskId` 查询任务。

支持两种模式：

- 单次查询：返回当前状态与结果
- 等待完成：节点内每 20 秒轮询一次，默认最多等待 20 分钟

等待模式可选：

- `waitTimeoutMinutes`
- `downloadVideo`

当 `downloadVideo = true` 且任务成功时，节点会把下载结果附加到 `binary.video`。

### List

用于查询最近 7 天内的任务列表。

支持：

- `returnAll`
- `pageNum`
- `pageSize`
- `status`
- `taskIds`，逗号分隔
- `model`
- `serviceTier`

当前列表操作每个输入 item 返回 1 个输出 item，任务数组位于 `json.tasks`。

### Delete

用于取消或删除任务记录。

行为取决于 Seedance 当前任务状态：

- `queued`：可取消
- `succeeded`、`failed`、`expired`：在 Seedance 允许时可删除
- `running`、`cancelled`：不支持

### Generate Image

用于调用 Seedream 5.0 lite 生成图片。

当前固定模型：

- `doubao-seedream-5-0-260128`

当前不暴露：

- `streaming`
- `output_format`
- `watermark`

节点默认使用 `response_format: b64_json` 作为主成功路径，而不是先拿 URL 再下载。这样可以直接把图片写入 n8n binary，避免把“24 小时有效 URL”作为默认依赖。

#### 支持的输入模式

- 仅 prompt：文生图
- 单张参考图 URL
- 单张参考图 base64 / data URL
- 单张参考图 binary
- 多张参考图 mixed sources
  - URL
  - base64 / data URL
  - binary

#### 主要参数

- `imagePrompt`
- `referenceImageSource`
- `sequentialImageGeneration`
- `maxImages`
- `imageResolution`
- `imageAspectRatio`
- `webSearch`
- `optimizePromptMode`

#### 输入约束

- 参考图最多 14 张
- 参考图 binary 支持：`jpeg`、`png`、`webp`、`bmp`、`tiff`、`gif`
- 单张参考图 binary 最大 10 MB
- 组图模式下：参考图数量 + `maxImages` 不能超过 15

#### 输出行为

每个输入 item 只返回 1 个输出 item。

成功生成的图片会附加到：

- `binary.image1`
- `binary.image2`
- `binary.image3`

JSON 中会保留：

- `requestSummary`
- `images`
- `usage`
- `toolCalls`

其中：

- `requestSummary` 用于保留模型、prompt、size、referenceCount、group mode 等摘要
- `images[]` 用于保留逐图状态
- JSON 不会包含原始 `b64_json` 内容

#### 失败语义

- 部分失败：
  - 只要至少有一张图片成功，节点就返回成功结果
  - 成功图片继续写入 `binary.imageN`
  - 失败图片记录在 `json.images[]`
- 全部失败：
  - 节点抛错
  - 错误消息会保留逐图失败原因

#### 24 小时限制说明

虽然当前实现默认使用 `b64_json` 直接返回图片二进制，不依赖 URL 下载作为主路径，但 Seedream 官方在 `response_format=url` 模式下返回的图片 URL 默认仍只有 `24 hours` / `24 小时` 有效期。如果后续你改为 URL 流程或自行保存 URL，应及时转存。

## 推荐工作流

### 工作流一：提交任务后用 Wait 轮询

适合更可控的 n8n 编排。

1. `Seedance` -> `Create`
2. `Wait`
3. `Seedance` -> `Get`
4. `IF` 根据返回状态分支

建议判断：

- `shouldPoll = true`：继续等待后重查
- `isSuccess = true`：处理视频 URL 或已下载的 binary
- `isFailure = true`：读取 `error.code` 和 `error.message`

### 工作流二：节点内等待直到完成

适合短任务或简单流程。

1. `Seedance` -> `Create`
2. `Seedance` -> `Get`
3. 打开 `等待任务完成`
4. 按需打开 `下载视频`

注意：这种模式会在 n8n 执行期间持续占用该节点，直到任务完成或超时。

### 工作流三：拉取最近任务并清理

1. `Seedance` -> `List`
2. 读取 `json.tasks`
3. 根据 `status` 或时间过滤
4. 对符合条件的任务调用 `Delete`

### 工作流四：Generate Image

适合直接在 n8n 内拿到图片 binary。

1. `Seedance` -> `Generate Image`
2. 输入 prompt
3. 按需配置参考图来源：URL / base64 / binary / 多参考图
4. 按需配置组图、联网搜索、提示词优化、分辨率与比例
5. 在下游节点读取：
   - `binary.image1`
   - `binary.image2`
   - `json.images[]`
   - `json.usage`

## 输出结构

### Create 输出

```json
{
  "taskId": "task_xxx",
  "status": "queued",
  "createdAt": 1712345678,
  "requestSummary": {
    "model": "doubao-seedance-2-0-260128",
    "prompt": "...",
    "resolution": "720p",
    "ratio": "adaptive",
    "duration": 5,
    "generateAudio": true
  },
  "raw": {}
}
```

### Get 输出

```json
{
  "taskId": "task_xxx",
  "model": "doubao-seedance-2-0-260128",
  "status": "succeeded",
  "createdAt": 1712345678,
  "updatedAt": 1712345700,
  "videoUrl": "https://...",
  "lastFrameUrl": "https://...",
  "usage": {},
  "error": null,
  "isTerminal": true,
  "isSuccess": true,
  "isFailure": false,
  "shouldPoll": false,
  "retention": {
    "taskHistoryDays": 7,
    "assetUrlHours": 24,
    "message": "Seedance 仅支持查询最近 7 天任务，videoUrl/lastFrameUrl 默认 24 小时有效，请及时转存。"
  },
  "raw": {}
}
```

等待模式还会附加：

- `timedOut`
- `pollCount`
- `waitedMs`

如果启用 `downloadVideo`，还会返回：

- `binary.video.data`
- `binary.video.mimeType`
- `binary.video.fileName`

### List 输出

```json
{
  "tasks": [],
  "count": 0,
  "returnAll": true,
  "pageNum": 1,
  "pageSize": 100,
  "retention": {
    "taskHistoryDays": 7,
    "assetUrlHours": 24,
    "message": "Seedance 仅支持查询最近 7 天任务，videoUrl/lastFrameUrl 默认 24 小时有效，请及时转存。"
  }
}
```

`tasks` 中的每一项与 `Get` 的单任务输出结构一致。

### Delete 输出

```json
{
  "success": true,
  "taskId": "task_xxx",
  "action": "deleted_or_cancelled",
  "message": "已向 Seedance 提交取消或删除请求。实际结果取决于任务当前状态。"
}
```

### Generate Image 输出

```json
{
  "requestSummary": {
    "model": "doubao-seedream-5-0-260128",
    "prompt": "A quiet lake at sunrise",
    "size": "2048x2048",
    "referenceCount": 0,
    "sequentialImageGeneration": "disabled",
    "webSearch": false,
    "optimizePromptMode": "standard"
  },
  "images": [
    {
      "index": 0,
      "isSuccess": true,
      "binaryPropertyName": "image1",
      "mimeType": "image/png",
      "fileName": "seedream-image-1.png"
    }
  ],
  "usage": {
    "generated_images": 1
  },
  "toolCalls": {
    "web_search": 0
  }
}
```

同时 binary 输出中会附加：

- `binary.image1.data`
- `binary.image1.mimeType`
- `binary.image1.fileName`

如果组图返回多张成功图片，则继续追加：

- `binary.image2`
- `binary.image3`

如果发生部分失败，失败项不会生成 binary，但会保留在 `json.images[]` 中。

## 错误与失败输出

当节点启用 n8n 的 continue-on-fail 时，失败项会返回：

```json
{
  "error": {
    "message": "..."
  },
  "status": "failed"
}
```

## 本地开发

```bash
npm install
npm run build
npm run lint
```

本项目固定使用 Node.js `22.x`。

本地联调：

```bash
npm run dev
```

`npm run dev` 会：

- 启动 `n8n-node dev --external-n8n`
- 启动一个固定版本的本地 n8n 开发服务

在 Windows 上，脚本会显式检查当前 Node 主版本是否为 22，不符合时直接退出。

## 打包与发布基础

常用命令：

```bash
npm run build
npm run lint
```

包元数据已经按社区节点方式注册：

- 节点入口：`dist/nodes/Seedance/Seedance.node.js`
- 凭证入口：`dist/credentials/SeedanceApi.credentials.js`

发布前请至少确认：

- `README.md` 与当前行为一致
- `npm run build` 通过
- 包版本号已正确更新

注意：当前仓库按项目要求使用 PNG 图标资源。n8n 官方 lint 规则可能要求 SVG 图标，因此在保持 PNG 图标的前提下，`npm run lint` 可能会报告图标格式相关错误。若需要严格通过 n8n lint，需要将节点和凭证图标切回 SVG。

## 本地 API 文档

`APIdocs/` 目录仅保留在本地工作区，用于开发参考，不再纳入 Git 跟踪，也不会作为仓库内容发布。
