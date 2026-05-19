---
phase: 14
plan: 01
title: "Expose multimodal create mode and reference素材 form"
completed: 2026-05-19
commit: f823c62
requirements_completed: [MODE-01, MODE-03, UI-01, UI-02, UI-03, UI-04]
---

# Plan 14-01 Summary

## Completed Work

- Added the fourth create mode **多模态参考生视频** after existing video create modes while keeping `t2v` as the default.
- Added the multimodal-only repeatable **参考素材** fixedCollection with the agreed fields: **素材类型**, **素材来源**, and source-specific **素材URL** / **属性名** / **素材ID**.
- Encoded the source matrix so image/audio support URL链接、Binary文件、火山方舟素材库, while video only supports URL链接、火山方舟素材库.
- Added real-person face restriction text to first-frame/last-frame image value fields and multimodal image value fields.
- Added schema-level regression tests for create mode order, reference素材 fields, source options, hidden first/last-frame fields, and face restriction placement.

## Verification

- `git diff --check`: passed, with only existing LF-to-CRLF warnings.
- Static source scan confirmed the create form does not add direct Base64 input or label/tag/note fields for Phase 14.
- `npm run build`: blocked because local `node_modules` is incomplete and `n8n-node` is not available.
- `node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`: blocked because `dist/` has not been generated.

## Self-Check: PASSED WITH ENVIRONMENT GAP

The planned UI/schema work is implemented and covered by committed tests, but automated build/test execution still needs a clean Node 22 dependency install.
