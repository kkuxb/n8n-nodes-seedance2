# n8n-nodes-seedance2

用于在 n8n 中接入 Seedance 视频生成任务生命周期的社区节点包。

## 当前范围

当前 Phase 1 基线聚焦以下能力：

- 通过可复用的 n8n credentials 安全配置 **API Key**
- 提供 **text-to-video / 文生视频** 任务创建入口的节点骨架
- 提供按任务 ID 查询单个任务状态的节点骨架

这是一个面向后续实现的真实 n8n package baseline，不是纯文档仓库；但本阶段仍然**不承诺**任务列表、取消/删除、图生模式或 submit-and-wait 长轮询行为。

## 已知平台约束

- Seedance 任务查询历史仅支持最近 **7 天 / 7 days**
- 生成的视频 URL 与尾帧 URL 默认仅 **24 小时 / 24 hours** 有效，拿到结果后应尽快转存

## 开发

```bash
npm install
npm run build
npm run lint
```

## 说明

本仓库遵循 n8n programmatic-style node 结构，后续 phase 会在当前骨架上继续补齐真正的创建与查询实现，而不会提前扩展到 Phase 2/3 的任务列表、取消删除或复杂多模态输入矩阵。
