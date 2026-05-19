# Phase 14: 多模态入口与参考材料表单 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 14-多模态入口与参考材料表单
**Areas discussed:** 创建模式入口与命名, 参考素材列表的表单形态, 来源类型与字段显示边界, 用户提示文案的位置与强度

---

## 创建模式入口与命名

| Option | Description | Selected |
|--------|-------------|----------|
| 多模态参考生视频 | 贴近官方名称，和现有模式并列 | ✓ |
| Seedance 2.0 多模态 | 突出模型版本，但偏技术化 | |
| 参考材料生视频 | 更口语化，但弱化官方多模态概念 | |

**User's choice:** 使用“多模态参考生视频”。
**Notes:** 选项放在首尾帧之后，默认仍为文生视频；复用现有“提示词”字段，多模态下提示词可选；模式描述保持简洁。

---

## 参考素材列表的表单形态

| Option | Description | Selected |
|--------|-------------|----------|
| 一个统一的参考材料可重复列表 | 统一结构，便于后续归一化 | ✓ |
| 图片 / 视频 / 音频拆成三个列表 | 每类直观，但表单更长 | |
| 简单字段优先，列表放到高级模式 | 会产生两套输入路径 | |

**User's choice:** 使用统一列表，但用户-facing 名称改为“参考素材”。
**Notes:** 字段顺序为素材类型、素材来源、实际输入字段。列表允许为空。取消标签/备注字段，因为它不传参且实际价值不足；这需要同步调整现有 requirement。

---

## 字段命名

| Field Purpose | Final Name |
|---------------|------------|
| 参考输入列表 | 参考素材 |
| 媒体类型选择 | 素材类型 |
| 来源类型选择 | 素材来源 |
| URL 来源选项 | URL链接 |
| Binary 来源选项 | Binary文件 |
| Volcengine asset 来源选项 | 火山方舟素材库 |
| URL 值字段 | 素材URL |
| Binary 属性字段 | 属性名 |
| Asset 值字段 | 素材ID |

**User's choice:** 字段命名由用户逐项指定。
**Notes:** 不使用“参考材料”措辞。

---

## 来源类型与字段显示边界

| Option | Description | Selected |
|--------|-------------|----------|
| 按素材类型动态显示来源 | 图片/音频支持 URL、Binary、素材库；视频只支持 URL、素材库 | ✓ |
| 三种素材类型都显示三个来源 | 视频 Binary 选择后再报错 | |
| Phase 14 暂不加 Binary | 更保守但表单不完整 | |

**User's choice:** 按素材类型动态显示来源。
**Notes:** 素材ID 支持裸 ID 或 `asset://...`；Phase 15 归一化。属性名描述为 n8n 输入 item 的 binary property，默认 `data`。不暴露 Base64 直接文本来源。新增素材默认图片 + URL链接。

---

## 用户提示文案的位置与强度

| Option | Description | Selected |
|--------|-------------|----------|
| 专门说明字段 + 简短字段提醒 | 集中展示限制 | |
| 全部放入创建模式描述 | 选项描述过长 | |
| 放在相关字段描述中 | 用户在填写图片字段时看到 | ✓ |

**User's choice:** 只提示真人脸参考限制，并放在图片素材相关字段描述中。
**Notes:** 文案需说明 Seedance 2.0 当前只接受两类人脸素材来源：Seedream 5.0 Lite 文生图生成，以及火山方舟素材库。无需额外提示模式互斥，因为 create mode 单选已经保证；无需额外说明高级选项保持可选。

---

## the agent's Discretion

None.

## Deferred Ideas

None.
