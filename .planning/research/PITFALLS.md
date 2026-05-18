# Domain Pitfalls

**Domain:** Seedance 2.0 multimodal reference video generation in an existing n8n community node
**Researched:** 2026-05-18
**Overall confidence:** MEDIUM

## Source Notes

- Primary official source checked first: Volcengine "Create video generation task" page: https://www.volcengine.com/docs/82379/1520757?lang=zh. The page is reachable and shows a 2026-05-11 update timestamp, but the static fetch path does not expose the field table or examples. Exact request field names, allowed media roles, reference video support, size limits, and model-specific constraints must be verified against the live official page or the live API before implementation.
- Additional official Volcengine source discovered: https://www.volcengine.com/docs/82379/1544136?lang=zh. Search-index metadata for this official page indicates `role: "reference_image"` and `asset://...` reference material usage for preset virtual avatar/material workflows. Treat this as directional only unless the live page/API confirms the same field contract for this node's target feature.
- Local project context read: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/INTEGRATIONS.md`, plus current Seedance source files and prior local debug notes.

## Critical Pitfalls

Mistakes that cause rewrites, shipped regressions, provider failures, or security issues.

### Pitfall 1: Implementing guessed multimodal request fields

**What goes wrong:** The node ships a new request shape based on indexed snippets, old local notes, or analogy with existing `first_frame` / `last_frame` image logic instead of the current official Seedance 2.0 multimodal contract.
**Why it happens:** The linked Volcengine page is JavaScript-rendered in this environment, so exact parameter tables are not extractable here. The existing mapper already builds `content` items with `type: "text"` and `type: "image_url"` plus `role: "first_frame"` / `"last_frame"`, which makes it tempting to infer a generic reference shape.
**Consequences:** Users get provider-side "unsupported parameter" or "invalid content" errors; the team has to rewrite UI fields, validators, tests, and payload mapping after manual API validation; saved workflows may persist incorrect parameter names.
**Prevention:** Start the implementation phase with a contract-verification spike. Capture the official request examples from the live Volcengine page and, if credentials are available, submit one minimal reference request against the real API. Do not expose or document exact field names until this is done.
**Detection:** Tests or manual runs fail only at provider request time; request bodies contain unverified fields such as guessed `reference_video`, guessed roles, or data URLs for media types the API does not document.

### Pitfall 2: Collapsing reference media into existing first/last-frame modes

**What goes wrong:** Multimodal references are treated as just another version of `i2v_first` or `i2v_first_last`.
**Why it happens:** Current video create UX has only `t2v`, `i2v_first`, and `i2v_first_last`; current payload code adds first and last images into the same `content` array. Multimodal reference generation may require a different role, ordering rule, media count rule, asset URI rule, or separate source field.
**Consequences:** Existing first/last-frame behavior may regress, while the new feature still fails for valid reference use cases. Users cannot tell whether they are anchoring a start/end frame or supplying style/identity/motion references.
**Prevention:** Add a separate internal normalized model for video references, for example `VideoReferenceInput`, instead of extending `SeedanceImageInput`. Keep first/last-frame mapping unchanged until the official contract proves they share a schema.
**Detection:** New UI labels reuse "first frame" language for non-frame references; tests assert only count/order but not role semantics; payload snapshots show mixed frame roles and generic references in one unvalidated array.

### Pitfall 3: Accepting unsupported human-face reference uploads

**What goes wrong:** The node invites users to upload arbitrary human-face reference images or videos when the relevant official material workflow may only support trusted `asset://...` materials or Seedance-generated references.
**Why it happens:** n8n-friendly URL/binary repeaters make it easy to expose "reference image/video" broadly. Official Volcengine metadata for the preset virtual avatar/material workflow indicates `role: "reference_image"` and `asset://...` usage, and also warns around real-person face image/video material handling in that workflow.
**Consequences:** Requests fail provider validation; users misunderstand the feature as face cloning or unrestricted identity transfer; the node may encourage a use case the provider explicitly constrains.
**Prevention:** Do not label the feature as unrestricted human identity reference unless the official API confirms it. Prefer "official material asset URI" or "supported reference media" wording. If arbitrary URLs/binaries are supported, validate and document the exact constraints separately from actor/material workflows.
**Detection:** UI examples show human portrait upload as the happy path before live API verification; validation accepts local binary video references without any official field/limit proof.

### Pitfall 4: Sending data URLs or Base64 for media the API expects as URLs/assets

**What goes wrong:** Binary images or videos are converted into `data:<mime>;base64,...` and sent in the JSON request even if the current API only accepts remote URLs or `asset://...` references for that media role.
**Why it happens:** The existing first/last-frame image helper converts binary input to data URLs and the Seedream image code has URL/binary/base64 normalizers. Reusing those helpers hides a major contract difference between image generation, frame images, material assets, and reference videos.
**Consequences:** Large request bodies fail provider limits, n8n memory spikes, or provider validation rejects the field. If reference video binary is added naively, request size can become much larger than current image inputs.
**Prevention:** Verify allowed media transport per reference type: public URL, binary-as-data-URL, Base64, or provider asset URI. Implement a media-source matrix and reject unsupported combinations locally with actionable messages.
**Detection:** Payload snapshots include Base64 video data; tests only cover binary image MIME checks; provider errors mention body size or invalid URL.

### Pitfall 5: Breaking shipped video lifecycle behavior

**What goes wrong:** Adding reference inputs changes create/get/list/delete/wait/download paths that shipped in v1.2.
**Why it happens:** `Seedance.node.ts` still owns video create, get, list, delete, image generation, binary processing, polling, download, and error handling in one large `execute()` method. New reference collection code increases shared control-flow risk.
**Consequences:** Existing text-to-video, first-frame, first/last-frame, wait mode, download mode, list pagination, or delete behavior regresses while the new feature is being added.
**Prevention:** Make the new create path additive and narrow. Prefer extracting reference normalization and payload construction into pure helpers with focused tests before touching lifecycle branches. Keep endpoint helpers and polling untouched unless the official docs require a change.
**Detection:** Existing tests such as `createPayload`, `seedanceVideoRegression`, `seedanceGetWaitMode`, `seedanceDownloadFlow`, `taskMapper`, and `request` change unexpectedly or need broad rewrites to pass.

### Pitfall 6: Breaking shipped Seedream image behavior through shared reference helpers

**What goes wrong:** New video reference collection reuses or modifies Seedream reference-image helpers and changes image generation behavior.
**Why it happens:** Seedream image reference support already has hidden legacy branches (`none`, `base64`, `multiple`) and visible URL/binary options. A generic "reference media" helper could accidentally normalize image-generation inputs differently.
**Consequences:** v1.2 image workflows lose URL/binary reference support, Base64 hidden-state workflows fail differently, or generated image outputs no longer default to safe binary attachments.
**Prevention:** Keep video-reference normalization separate from Seedream image-reference normalization. If shared code is introduced, make it lower-level and media-agnostic, with separate Seedream and Seedance contract tests.
**Detection:** `seedreamImagePayload`, `seedreamImageValidation`, `seedreamImageResult`, and `seedanceGenerateImageExecute` fail after a video-only change.

### Pitfall 7: Leaking prompts, media references, or credentials through raw output

**What goes wrong:** New reference payloads, signed URLs, prompts, provider metadata, or HTTP request objects appear in workflow-visible JSON.
**Why it happens:** Current video create/task mappers include `raw` provider responses, and `normalizeSeedanceError()` keeps the raw thrown error. `continueOnFail()` returns the normalized error object in node output.
**Consequences:** Workflows can expose API keys, Authorization headers, prompts, reference media URLs, Base64 material, generated signed URLs, or user-sensitive creative inputs.
**Prevention:** Redact or remove raw provider/error output before adding reference media. Add tests that serialize successful and failed outputs and assert no `Authorization`, API key, Base64 payload, request body, or reference URL appears unless an explicit debug option is enabled.
**Detection:** `continueOnFail()` output includes `raw`; successful create/get outputs expose full provider responses; regression snapshots include long data URLs or signed media URLs under `raw`.

### Pitfall 8: Overlooking provider capability drift

**What goes wrong:** The node's model IDs, resolutions, ratios, durations, audio flags, and reference constraints drift away from the current Seedance 2.0 API.
**Why it happens:** Capabilities are hard-coded in `create.operation.ts` and `validators/create.ts`; prior local debug notes show this project previously exposed unsupported fields and had provider "parameter unsupported" failures.
**Consequences:** Users can select combinations that the provider rejects; future provider changes require edits in multiple places; docs, UI, validators, and tests disagree.
**Prevention:** Centralize Seedance video capabilities in one constants module and generate UI options plus validators from it. Attach a source note with the official doc date used for each capability.
**Detection:** UI options and validator arrays diverge; request payload tests pass for values the live provider rejects; README examples include fields not present in the verified capability source.

## Moderate Pitfalls

### Pitfall 1: Empty or partially resolved reference inputs

**What goes wrong:** n8n expressions resolve to empty strings or missing binary property names, and the node silently sends blank references or drops media without telling the user.
**Prevention:** Trim and validate every repeated reference item after expression resolution. Throw `NodeOperationError` with item index and field name when a visible reference row is incomplete.

### Pitfall 2: Reference ordering bugs

**What goes wrong:** The order of text, frame images, reference images, and reference videos changes between UI collection, mapper normalization, and API payload construction.
**Prevention:** Preserve user order only when the official API says order matters. Otherwise group by verified role and assert exact payload order in tests.

### Pitfall 3: Media count and size limits are copied from the wrong feature

**What goes wrong:** Current 30 MB binary image checks or Seedream image limits are reused for Seedance video references without official support.
**Prevention:** Maintain separate limits for first-frame images, last-frame images, reference images, reference videos, and provider material assets. Mark any unknown limit as "requires live official verification" rather than inventing a local cap.

### Pitfall 4: Download behavior assumes all successful tasks have one `content.video_url`

**What goes wrong:** A multimodal task returns a different result structure, multiple outputs, or delayed media fields, but the mapper only checks `content.video_url`.
**Prevention:** Verify response shape in the official docs/live API. Extend `mapTaskResponse()` defensively while preserving existing `videoUrl` and `lastFrameUrl` outputs for shipped workflows.

### Pitfall 5: Polling and wait defaults become painful for heavier jobs

**What goes wrong:** Reference-driven video jobs take longer, but the node still defaults to synchronous wait behavior in get/wait workflows and processes input items sequentially.
**Prevention:** Keep create/get split workflows prominent. If reference jobs are slower, adjust documentation and tests around timeout messaging rather than increasing blocking defaults casually.

### Pitfall 6: URL download safety remains unresolved while adding more media URLs

**What goes wrong:** The node fetches generated `videoUrl` values without HTTPS/private-host checks, and new reference URL handling increases the number of trusted-looking media URLs in outputs.
**Prevention:** Add HTTPS and private-network rejection for downloads before broadening URL surfaces. Keep input media URLs passed to the provider unless explicit local fetch/upload is required.

## Minor Pitfalls

### Pitfall 1: Confusing Chinese UX labels

**What goes wrong:** Users cannot distinguish start-frame, end-frame, reference image, reference video, and provider asset URI inputs.
**Prevention:** Use distinct labels and descriptions. Avoid implying binary upload support until verified.

### Pitfall 2: README examples get ahead of the implementation

**What goes wrong:** Documentation shows reference combinations that were not tested against the live API.
**Prevention:** Keep examples limited to verified request paths and label anything else as unsupported.

### Pitfall 3: Tests stay manual-only

**What goes wrong:** Regression tests exist but are easy to skip because `package.json` has no `test` script.
**Prevention:** Add a package-level test command before relying on regression coverage for this milestone.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Phase 1: Official contract verification | Guessing exact field names from stale snippets or existing code | Capture live official examples and run one minimal live API request before implementation |
| Phase 2: Payload model and validators | Collapsing multimodal references into first/last-frame logic | Create separate normalized video-reference types and mapper tests |
| Phase 3: n8n UI fields | Exposing unsupported binary/Base64/reference-video options | Expose only verified source types; hide unknown modes until confirmed |
| Phase 4: Regression hardening | Breaking existing video lifecycle or Seedream image paths | Run build plus all existing `node --test test/*.test.ts`; add focused tests for old and new create payloads |
| Phase 5: Security and output safety | Raw errors or responses leak prompts/media/API details | Redact raw output and add serialization tests for success and `continueOnFail()` |
| Phase 6: Manual UAT | Asset URL expiry and wait/download behavior look like generation failures | Test create/get separately, then wait/download inside the 24-hour generated-asset window |

## Research Flags for Roadmap

- **Exact API contract:** HIGH priority. The linked official page is not statically extractable here; exact multimodal reference fields require live official-doc or API verification.
- **Reference-video support shape:** HIGH priority. Do not assume URL, Base64, binary, or `asset://` support for reference videos until verified.
- **Actor/material workflows:** MEDIUM priority. Official Volcengine metadata suggests `reference_image` and `asset://` material usage in a related workflow, but this must not be generalized without confirmation.
- **Raw output redaction:** HIGH priority. This is already a known codebase concern and becomes more serious when reference media is added.
- **Test command gap:** MEDIUM priority. Existing tests are useful, but the repository lacks a standard `npm test` script.

## Sources

- Volcengine official "Create video generation task" page, checked first; JavaScript-rendered field details were not extractable in this environment: https://www.volcengine.com/docs/82379/1520757?lang=zh
- Volcengine official preset virtual avatar/material page, discovered as related reference-material documentation; exact applicability to this node requires live verification: https://www.volcengine.com/docs/82379/1544136?lang=zh
- Local project context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/INTEGRATIONS.md`
- Local implementation context: `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/description/create.operation.ts`, `nodes/Seedance/shared/mappers/createPayload.ts`, `nodes/Seedance/shared/validators/create.ts`, `nodes/Seedance/shared/mappers/task.ts`, `nodes/Seedance/shared/transport/request.ts`
