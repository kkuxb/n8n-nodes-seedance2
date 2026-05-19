---
quick_id: 260519-x4f
slug: binary
status: complete
completed: 2026-05-19
commit: 3ff194f
---

# Quick Task 260519-x4f Summary

## Completed

- Renamed first-frame and last-frame `binary` input method options from `二进制数据` to `Binary文件`.
- Changed the `查询任务` operation's `下载视频` default to enabled.
- Added automatic `lastFrameUrl` download for waited successful get results, attaching the image as `binary.lastFrame`.
- Preserved the existing `downloadVideo` switch scope: it controls only `binary.video`; tail-frame download is driven by `lastFrameUrl`.

## Verification

- `npm run build` passed.
- `node --test test\*.test.ts` passed: 153 tests.
- `npm run lint` still fails on existing project lint debt: PNG icons must be SVG, existing parameter ordering/description rules, and existing restricted global timer usage in polling tests.

## Code Commit

- `3ff194f` - `fix: download seedance last frame assets`
