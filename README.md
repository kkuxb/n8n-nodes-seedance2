# n8n-nodes-seedance2

这是一个用于 n8n 的火山方舟生成节点。你可以在同一个 `Seedance` 节点里完成两类工作：

- 使用 Seedance 2.0 生成视频，并管理视频任务的创建、查询、列表、取消和删除。
- 使用 Seedream 5.0 Lite 生成图片，并直接把生成结果作为 n8n binary 图片传给后续节点。

本文按“怎么在 n8n 里使用这个节点”的角度说明，不展开底层实现细节。

## 安装

在 n8n 的社区节点管理中安装本包，或按你的部署方式安装：

```bash
npm install n8n-nodes-seedance2
```

安装完成后，在 n8n 里搜索 `Seedance` 节点即可使用。

## 配置凭证

第一次使用前，先创建 `Seedance 凭证`。

需要填写：

- `API Key`：你的火山方舟 API Key。

创建好凭证后，在 `Seedance` 节点中选择这个凭证即可。

## 先选择生成模式

节点的第一个重要字段是 `生成模式`。

你有两个选择：

- `视频生成`：使用 Seedance 2.0 创建和管理视频任务。
- `图像生成`：使用 Seedream 5.0 Lite 生成图片。

选择模式后，后面的 `操作` 字段和可配置参数会随之变化。

## 视频生成

选择 `生成模式 = 视频生成` 后，可以在 `操作` 中选择：

- `创建任务`
- `查询任务`
- `获取任务列表`
- `取消 / 删除任务`

### 重要限制：人脸参考图

**请特别注意：当前 Seedance 2.0 不支持直接上传普通的、带人脸的人物图片作为参考图。**

**如果你希望参考图中包含人物或模特，请先使用 Seedream 5.0 Lite 生成该人物图片，再把这张由 Seedream 5.0 Lite 生成的图片作为 Seedance 2.0 的参考图使用。也就是说，Seedance 2.0 当前只采信由 Seedream 5.0 Lite 生成的带人脸参考图。**

### 创建视频任务

适合你要提交一个新的视频生成请求。

操作步骤：

1. 选择 `生成模式 = 视频生成`。
2. 选择 `操作 = 创建任务`。
3. 选择模型，例如 `Seedance 2.0` 或 `Seedance 2.0 Fast`。
4. 选择创建模式：`文生视频`、`首帧图生视频` 或 `首尾帧图生视频`。
5. 填写提示词、分辨率、比例、时长等参数。
6. 如果是图生视频，填写图片 URL，或指定输入 item 里的 binary 属性名。
7. 执行节点，拿到返回的 `taskId`。

常用参数说明：

- `提示词`：描述你想生成的视频内容。
- `分辨率`：可选 `480p` 或 `720p`。
- `宽高比`：支持 `1:1`、`16:9`、`9:16`、`adaptive` 等。
- `视频时长`：支持 4 到 15 秒，或自动选择。
- `生成音频`：控制是否生成有声视频。
- `添加水印`：默认关闭。
- `返回尾帧`：需要尾帧图时打开。

图生视频的 binary 图片限制：

- 支持 `jpeg`、`png`、`webp`、`bmp`、`tiff`、`gif`。
- 单张图片最大 30 MB。

创建成功后，后续通常会把 `taskId` 传给 `查询任务`。

### 查询视频任务

适合你已经有 `taskId`，想查询生成进度或结果。

操作步骤：

1. 选择 `生成模式 = 视频生成`。
2. 选择 `操作 = 查询任务`。
3. 填写 `taskId`。
4. 如果只想查一次当前状态，关闭等待完成。
5. 如果希望节点自己等待结果，打开 `等待任务完成`。
6. 如果希望成功后直接拿到视频 binary，打开 `下载视频`。

查询结果里常用字段：

- `status`：当前状态。
- `videoUrl`：成功后的视频 URL。
- `lastFrameUrl`：尾帧 URL，如有。
- `isSuccess`：是否成功。
- `isFailure`：是否失败。
- `shouldPoll`：是否建议继续等待后再查。
- `binary.video`：打开下载视频后，成功时会出现。

注意：视频 URL 和尾帧 URL 默认 24 小时有效，请及时转存。

### 获取视频任务列表

适合你想查看最近生成过哪些任务。

操作步骤：

1. 选择 `生成模式 = 视频生成`。
2. 选择 `操作 = 获取任务列表`。
3. 按需设置分页、状态、模型或任务 ID 过滤。
4. 执行后读取 `json.tasks`。

平台限制：Seedance 只支持查询最近 7 天的任务历史。

### 取消或删除视频任务

适合你要取消排队中的任务，或删除已结束的任务记录。

操作步骤：

1. 选择 `生成模式 = 视频生成`。
2. 选择 `操作 = 取消 / 删除任务`。
3. 填写 `taskId`。
4. 执行节点。

行为取决于任务当前状态：

- `queued`：可取消。
- `succeeded`、`failed`、`expired`：在接口允许时可删除记录。
- `running`、`cancelled`：通常不支持删除或取消。

## 图像生成

选择 `生成模式 = 图像生成` 后，可以在 `图像操作` 中选择：

- `文生图`
- `图生图`

当前图片模型固定为 Seedream 5.0 Lite。

### 文生图

适合你只用提示词生成图片。

操作步骤：

1. 选择 `生成模式 = 图像生成`。
2. 选择 `图像操作 = 文生图`。
3. 确认 `图片模型` 为 Seedream 5.0 Lite。
4. 填写 `图片提示词`。
5. 按需打开或关闭 `优化提示词`。
6. 选择 `图片分辨率` 和 `图片比例`。
7. 如果需要一组相关图片，打开 `组图模式`，并填写 `最多生成图片数`。
8. 按需打开 `启用联网搜索`。
9. 按需打开 `添加水印`。默认关闭。
10. 执行节点。

生成结果会直接写入 n8n binary：

- 第一张图：`binary.image1`
- 第二张图：`binary.image2`
- 第三张图：`binary.image3`

JSON 中还会包含 `images`、`usage`、`requestSummary` 等信息，方便你在后续节点里判断结果。

### 图生图

适合你希望基于一张或多张参考图生成新图片。

操作步骤：

1. 选择 `生成模式 = 图像生成`。
2. 选择 `图像操作 = 图生图`。
3. 填写 `图片提示词`。
4. 按需打开或关闭 `优化提示词`。
5. 选择 `参考图来源`。
6. 如果选择 `图片 URL`，在 `参考图 URL` 中填写一个或多个 URL。
7. 如果选择 `二进制数据`，在 `参考图 Binary 属性` 中填写一个或多个 binary 属性名。
8. 选择分辨率、比例、组图模式、联网搜索和水印设置。
9. 执行节点。

多个参考图的填写方式：

- 英文逗号：`https://example.com/a.png, https://example.com/b.png`
- 中文逗号：`https://example.com/a.png，https://example.com/b.png`
- Binary 属性名也支持同样写法：`image1,image2` 或 `image1，image2`

参考图限制：

- 最多 14 张参考图。
- Binary 图片支持 `jpeg`、`png`、`webp`、`bmp`、`tiff`、`gif`。
- 单张 binary 参考图最大 10 MB。
- 如果打开组图模式，参考图数量加最多生成图片数不能超过 15。

### 图片水印

图片生成的 `添加水印` 默认关闭。

如果保持默认设置，请求会显式关闭图片水印，避免官方接口默认添加右下角“AI生成”标识。

只有当你主动打开 `添加水印` 时，节点才会请求生成带水印的图片。

## 常见工作流示例

### 示例一：生成视频并等待完成

1. 添加 `Seedance` 节点。
2. 选择 `视频生成` -> `创建任务`。
3. 填写提示词并执行，得到 `taskId`。
4. 添加第二个 `Seedance` 节点。
5. 选择 `视频生成` -> `查询任务`。
6. 把第一个节点输出的 `taskId` 填入查询节点。
7. 打开 `等待任务完成`。
8. 如果希望直接拿到文件，打开 `下载视频`。

适合简单流程。缺点是节点会一直等待到任务完成或超时。

### 示例二：生成视频后用 Wait 节点轮询

1. `Seedance` -> `视频生成` -> `创建任务`
2. `Wait`
3. `Seedance` -> `视频生成` -> `查询任务`
4. `IF` 判断 `isSuccess`、`isFailure` 或 `shouldPoll`
5. 如果 `shouldPoll = true`，回到 `Wait` 后继续查

适合更稳定、更可控的生产工作流。

### 示例三：文生图并发送到下游节点

1. `Seedance` -> `图像生成` -> `文生图`
2. 填写提示词，例如“一张电影感的产品海报，柔和光线，浅色背景”
3. 选择比例和分辨率
4. 执行节点
5. 在下游节点读取 `binary.image1`

如果打开组图模式，下游可以继续读取 `binary.image2`、`binary.image3` 等。

### 示例四：用参考图生成新图片

1. `Seedance` -> `图像生成` -> `图生图`
2. 填写提示词，说明你希望如何改造参考图
3. 选择 `参考图来源 = 图片 URL` 或 `二进制数据`
4. 填写一个或多个 URL / binary 属性名
5. 执行节点
6. 在下游读取 `binary.image1`

## 输出怎么看

### 视频创建输出

创建任务后重点看：

```json
{
  "taskId": "task_xxx",
  "status": "queued",
  "requestSummary": {
    "model": "doubao-seedance-2-0-260128",
    "prompt": "...",
    "resolution": "720p",
    "ratio": "adaptive",
    "duration": 5
  }
}
```

### 视频查询输出

查询成功后重点看：

```json
{
  "taskId": "task_xxx",
  "status": "succeeded",
  "videoUrl": "https://...",
  "lastFrameUrl": "https://...",
  "isTerminal": true,
  "isSuccess": true,
  "isFailure": false,
  "shouldPoll": false
}
```

如果打开了下载视频，还会有：

- `binary.video.data`
- `binary.video.mimeType`
- `binary.video.fileName`

### 图片生成输出

图片生成后重点看：

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
  ]
}
```

真正的图片文件在 binary 里：

- `binary.image1`
- `binary.image2`
- `binary.image3`

## 失败时怎么处理

### 视频任务失败

查询任务时读取：

- `status`
- `error.code`
- `error.message`
- `isFailure`

如果 `shouldPoll = true`，说明任务还没结束，可以等待后再查。

### 图片部分失败

如果一次生成多张图片，只要至少一张成功，节点会返回成功结果。

成功图片会写入 `binary.imageN`。

失败图片会记录在 `json.images[]` 中。

如果全部图片都失败，节点会抛错，并尽量保留每张图的失败原因。

## 平台限制

- Seedance 任务历史只支持查询最近 7 天。
- 视频结果 URL 和尾帧 URL 默认 24 小时有效。
- Seedream 在 URL 输出模式下的图片 URL 默认也只有 24 小时有效。
- 本节点默认把图片作为 binary 输出，减少对 24 小时 URL 的依赖，但你仍应及时把重要产物转存到自己的存储系统。

## 本地开发

如果你是在本地调试这个节点：

```bash
npm install
npm run build
npm run dev
```

项目使用 Node.js `22.x`。

注意：当前仓库按项目要求使用 PNG 图标资源。n8n 官方 lint 规则可能要求 SVG 图标，因此在保持 PNG 图标的前提下，`npm run lint` 可能会报告图标格式相关错误。
