# Phase 15: 参考媒体来源与官方 payload - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19T15:06:17.2030595+08:00
**Phase:** 15-参考媒体来源与官方 payload
**Areas discussed:** content 顺序, 素材来源归一化, 多模态组合边界, requestSummary 形状

---

## content 顺序

| Option | Description | Selected |
|--------|-------------|----------|
| Text first, references in user order | Put prompt text first when present, then append each 参考素材 in the same order the user configured. | ✓ |
| Strict user order only | Preserve reference order, but text is a separate prompt field so placement needs another rule. | |
| Group by type | Text first, then all images, videos, audio; tidy for tests but loses user sequence. | |

**User's choice:** Prompt `text` fixed first; reference items follow in configured order.
**Notes:** Follow-up decisions: empty/incomplete reference rows are errors, not skipped; mixed image/video/audio references are not regrouped.

---

## 素材来源归一化

| Option | Description | Selected |
|--------|-------------|----------|
| 宽容归一化 | Trim values; keep existing `asset://`; convert bare IDs to `asset://<ID>`; empty values error. | ✓ |
| 严格要求官方格式 | Require full `asset://<ID>` and reject bare IDs. | |
| 只补裸 ID | Convert bare IDs but do little other cleanup. | |

**User's choice:** Use tolerant asset normalization.
**Notes:** URL sources only trim and require non-empty values. Binary image/audio sources must use n8n MIME to create `data:<mime>;base64,...`; missing MIME is an error. MIME allowlists remain Phase 16 work.

---

## 多模态组合边界

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 15 就拦截 | Reject audio-only requests and require image/video anchor references in this phase. | ✓ |
| 留给 Phase 16 | Let Phase 15 only build payload and defer all combination validation. | |
| 只在 summary 标记风险 | Send payload but mark risky combinations in summary. | |

**User's choice:** Phase 15 rejects audio-only and prompt-only multimodal requests.
**Notes:** Phase 15 also enforces counts: images 0-9, videos 0-3, audio 0-3. Image-only and video-only multimodal requests are allowed; prompt remains optional when at least one image or video exists.

---

## requestSummary 形状

| Option | Description | Selected |
|--------|-------------|----------|
| 增加逐项安全摘要 | Add ordered per-reference items without raw URL, Base64, or asset values. | ✓ |
| 保持聚合信息 | Keep only counts/types/sources. | |
| 输出脱敏后的部分值 | Show partial URL or asset values for debugging. | |

**User's choice:** Add safe per-reference summaries.
**Notes:** Each item contains `index`, `type`, `role`, and `source`. Keep existing aggregate fields and keep `prompt` in `requestSummary`.

---

## the agent's Discretion

None. The user selected concrete behavior for every discussed area.

## Deferred Ideas

None.
