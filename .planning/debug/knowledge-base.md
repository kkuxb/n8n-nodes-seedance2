---
status: resolved
updated: 2026-04-20T00:00:00Z
note: Knowledge base file, not an active debug session. Marked resolved so audit-open does not treat it as open work.
---

# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## auto-download-video-403 — expired signed asset URL causes download 403
- **Date:** 2026-04-19
- **Error patterns:** Request failed with status code 403, download enabled, videoUrl, X-Tos-Expires, expired signed URL, auto download, binary.video
- **Root cause:** the real-world 403 is explained by an expired presigned TOS video URL (X-Tos-Date 2026-04-17T14:13:13Z + X-Tos-Expires 86400 expired at 2026-04-18T14:13:13Z), and Seedance.node.ts also had a separate messaging bug where it rethrew raw errors after computing normalized user-facing messages.
- **Fix:** Seedance.node.ts now throws a NodeOperationError using the normalized error message instead of rethrowing the raw error, so expired asset downloads consistently surface the 24-hour expiry guidance. Previous request-shape hardening remains in place.
- **Files changed:** nodes/Seedance/Seedance.node.ts, nodes/Seedance/shared/transport/request.ts, test/request.test.ts, test/seedanceDownloadFlow.test.ts
---
