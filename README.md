# n8n-nodes-seedance2

用于在 n8n 中接入 Seedance 视频生成任务生命周期的社区节点包。

## 当前范围

当前 Phase 1 基线聚焦以下能力：

- 通过可复用的 n8n credentials 安全配置 **API Key**
- 提供 **text-to-video / 文生视频** 任务创建能力
- 提供按任务 ID 查询单个任务状态与结果的能力

这是一个可执行的 Phase 1 最小闭环；但本阶段仍然**不承诺**任务列表、取消/删除、图生模式或 submit-and-wait 长轮询行为。

## 已知平台约束

- Seedance 任务查询历史仅支持最近 **7 天 / 7 days**
- 生成的视频 URL 与尾帧 URL 默认仅 **24 小时 / 24 hours** 有效，拿到结果后应尽快转存

## 开发

```bash
npm install
npm run build
npm run lint
```

## Phase 1 最小工作流示例

推荐的 n8n 编排方式：

1. **Seedance Create Task**
   - 填写模型 ID、Prompt，以及可选的 resolution / ratio / duration 或 frames / seed / watermark 等参数。
   - 节点会自动把 Prompt 封装成官方需要的 `content: [{ type: 'text', text: ... }]`。
   - 返回 `taskId`、`status`、`createdAt` 和 `requestSummary`，便于后续轮询。
2. **Wait**
   - 使用 n8n 自带 **Wait** 节点，等待一段时间后再查询状态。
3. **Seedance Get Task**
   - 使用上一步输出的 `taskId` 查询任务。
   - 返回 `status`、`videoUrl`、`lastFrameUrl`、`usage`、`error`，以及 `isTerminal`、`isSuccess`、`isFailure`、`shouldPoll` 这些适合分支判断的布尔字段。

典型分支：

- `shouldPoll = true`：继续进入 **Wait** 后轮询
- `isSuccess = true`：处理 `videoUrl`
- `isFailure = true`：读取 `error.code` / `error.message`

## 数据保留与链接时效

- Seedance 任务查询历史仅支持最近 **7 天 / 7 days**
- 生成的视频 URL 与尾帧 URL 默认仅 **24 小时 / 24 hours** 有效，拿到结果后应尽快转存

## 说明

本仓库遵循 n8n programmatic-style node 结构。当前实现严格限制在 Phase 1：只覆盖文生 `create` 与单任务 `get`，不会提前扩展到任务列表、取消删除、图生输入或节点内长轮询。
