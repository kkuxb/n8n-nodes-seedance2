# Codebase Concerns

**Analysis Date:** 2026-05-18

## Tech Debt

**Monolithic node execution:**
- Issue: `execute()` contains video create/get/list/delete, image generation, binary processing, reference collection, polling orchestration, download attachment, and error handling in one 500+ line class file.
- Files: `nodes/Seedance/Seedance.node.ts`
- Impact: Changes to one operation can regress unrelated operations because all branches share one large control flow, shared local helpers, and shared catch behavior.
- Fix approach: Extract operation handlers into files under `nodes/Seedance/shared/operations/` or `nodes/Seedance/operations/` and keep `nodes/Seedance/Seedance.node.ts` responsible for node description plus dispatch only.

**Unreachable and legacy image reference branches:**
- Issue: Execution supports `referenceImageSource` values `none`, `base64`, and `multiple`, but the visible node options expose only `url` and `binary`.
- Files: `nodes/Seedance/Seedance.node.ts:166`, `nodes/Seedance/Seedance.node.ts:184`, `nodes/Seedance/Seedance.node.ts:207`, `nodes/Seedance/description/image.operation.ts:85`, `nodes/Seedance/description/image.operation.ts:110`, `nodes/Seedance/description/image.operation.ts:139`, `test/seedreamImageOperationContract.test.ts:217`
- Impact: Saved workflows and tests can exercise modes that users cannot select in the UI. The `base64` branch accepts pure Base64 but `buildSeedreamImagePayload()` requires MIME type for non-data-URL Base64, so hidden workflow state can fail unexpectedly.
- Fix approach: Either expose `base64` and `multiple` as supported options with complete MIME inputs, or remove the branches and tests so runtime behavior matches `nodes/Seedance/description/image.operation.ts`.

**Unused API version constant:**
- Issue: `SEEDANCE_API_VERSION` and `getSeedanceApiVersion()` are exported but not used when constructing requests.
- Files: `nodes/Seedance/shared/constants.ts:5`, `nodes/Seedance/shared/transport/endpoints.ts:1`, `nodes/Seedance/shared/transport/endpoints.ts:42`, `nodes/Seedance/shared/transport/request.ts`
- Impact: Future API-version requirements can be missed because a version constant appears available while no request includes it.
- Fix approach: Remove the unused version API or wire it into the required Volcengine request header/query parameter in `nodes/Seedance/shared/transport/request.ts`.

**Broad response typing in list aggregation:**
- Issue: The list branch suppresses `no-explicit-any` and accepts `items?: any[]`.
- Files: `nodes/Seedance/Seedance.node.ts:493`, `nodes/Seedance/shared/mappers/task.ts`
- Impact: Malformed list responses flow into `mapTaskResponse()` without compile-time checks, increasing mapper fragility around external API changes.
- Fix approach: Reuse `SeedanceTaskListResponse` from `nodes/Seedance/shared/mappers/task.ts` in the list branch and validate that `items` is an array of task-like records before mapping.

## Known Bugs

**Return All silently returns at most 1,000 tasks:**
- Symptoms: `returnAll=true` sets `page_size=100` and loops only while `safetyCounter < 10`, then returns the aggregated item without telling the user it stopped at a safety cap.
- Files: `nodes/Seedance/Seedance.node.ts:457`, `nodes/Seedance/Seedance.node.ts:479`, `nodes/Seedance/Seedance.node.ts:486`, `nodes/Seedance/Seedance.node.ts:505`, `nodes/Seedance/description/list.operation.ts:13`
- Trigger: A Seedance account has more than 1,000 matching tasks in the 7-day retention window and the user leaves `Return All` enabled.
- Workaround: Filter by status/model/task IDs in `nodes/Seedance/description/list.operation.ts` or manually page with `returnAll=false`.

**Image prompt is required in the UI but not validated at runtime:**
- Symptoms: `imagePrompt` defaults to an empty string and `validateSeedreamImageInput()` validates reference counts, max images, resolution, and aspect ratio, but not prompt presence.
- Files: `nodes/Seedance/Seedance.node.ts:265`, `nodes/Seedance/shared/validators/seedreamImage.ts:28`, `nodes/Seedance/description/image.operation.ts:65`
- Trigger: Saved workflow state, expressions, or programmatic execution produce an empty image prompt.
- Workaround: Use a non-empty prompt in workflows; add runtime prompt validation to `nodes/Seedance/shared/validators/seedreamImage.ts`.

**Task ID is required in the UI but not validated at runtime:**
- Symptoms: Empty `taskId` values are sent as `qs: { id: '' }` for get/poll operations or become a DELETE URL ending at the tasks collection path after trimming.
- Files: `nodes/Seedance/Seedance.node.ts:384`, `nodes/Seedance/Seedance.node.ts:435`, `nodes/Seedance/Seedance.node.ts:528`, `nodes/Seedance/shared/transport/endpoints.ts:32`, `nodes/Seedance/description/get.operation.ts:13`, `nodes/Seedance/description/delete.operation.ts:13`
- Trigger: Saved workflow state, expressions, or programmatic execution produce an empty or whitespace-only task ID.
- Workaround: Validate task IDs before get/delete/poll requests and throw `NodeOperationError` before calling `seedanceApiRequest()`.

**Base64 reference mode can fail without a MIME type:**
- Symptoms: `normalizeSeedreamReferenceImage()` throws `Base64 或 binary 参考图必须提供 MIME 类型。` for pure Base64 references without `mimeType`; the hidden `referenceImageBase64` parameter supplies only a string value.
- Files: `nodes/Seedance/Seedance.node.ts:184`, `nodes/Seedance/description/image.operation.ts:110`, `nodes/Seedance/shared/mappers/seedreamImagePayload.ts:26`
- Trigger: Workflow state sets `referenceImageSource=base64` and `referenceImageBase64` contains pure Base64 rather than a complete `data:image/...;base64,...` URL.
- Workaround: Use data URLs for Base64 references or add a MIME selector when exposing the Base64 source.

## Security Considerations

**Raw HTTP errors can expose credentials or request details:**
- Risk: `normalizeSeedanceError()` stores the full thrown error as `raw`; `continueOnFail()` returns the normalized object in node output JSON. HTTP client errors can include request headers, authorization metadata, prompts, URLs, and response bodies.
- Files: `nodes/Seedance/shared/mappers/errors.ts:52`, `nodes/Seedance/shared/mappers/errors.ts:82`, `nodes/Seedance/Seedance.node.ts:555`, `test/request.test.ts:83`
- Current mitigation: Throwing without `continueOnFail()` wraps only the normalized message in `NodeOperationError`; normal image outputs avoid placing raw Base64 image payloads in JSON.
- Recommendations: Redact or omit `raw` from workflow-visible output, keep raw details only in controlled debug logs, and add tests that fail if `Authorization`, `apiKey`, Base64 payloads, or request bodies appear in returned errors.

**Task and create mappers expose raw provider responses:**
- Risk: Normal successful outputs include `raw` API responses for video create/get/list mapping. Raw responses can contain prompts, generated asset URLs, provider metadata, and future fields added by the provider.
- Files: `nodes/Seedance/shared/mappers/createPayload.ts:118`, `nodes/Seedance/shared/mappers/task.ts:137`, `test/createPayload.test.ts:189`, `test/taskMapper.test.ts:82`
- Current mitigation: Seedream image result mapping intentionally excludes raw `b64_json` from JSON output.
- Recommendations: Make raw response output opt-in behind an advanced debug flag, or sanitize raw responses to exclude credentials, prompts, and expiring asset URLs.

**Video download URL is not constrained before server-side fetch:**
- Risk: `downloadSeedanceVideo()` fetches whatever `videoUrl` appears in a succeeded task response. A compromised provider response, replayed mock, or unexpected upstream field could cause server-side requests to arbitrary URLs.
- Files: `nodes/Seedance/Seedance.node.ts:412`, `nodes/Seedance/Seedance.node.ts:417`, `nodes/Seedance/shared/transport/request.ts:86`, `nodes/Seedance/shared/transport/request.ts:92`
- Current mitigation: `sendCredentialsOnCrossOriginRedirect` is set to `false` and download requests use empty headers.
- Recommendations: Require `https:` URLs, reject private/link-local hosts, enforce an allowlist or explicit user opt-in for non-provider hosts, and sanitize filenames derived from `taskId`.

**Credential implementation not reviewed in this map:**
- Risk: The repository contains a credential source file, but credential file contents are excluded from this mapper by secret-handling rules.
- Files: `credentials/SeedanceApi.credentials.ts`, `package.json`
- Current mitigation: `package.json` declares the n8n credential entry at `dist/credentials/SeedanceApi.credentials.js`, and request loading uses `SEEDANCE_CREDENTIAL_TYPE`.
- Recommendations: Review `credentials/SeedanceApi.credentials.ts` in a secret-safe pass for `password: true`, correct `name`, no default secret values, and no logging of API keys.

## Performance Bottlenecks

**Default wait mode blocks execution for each input item:**
- Problem: `waitForCompletion` defaults to `true`, polling sleeps for 20 seconds per cycle, and the node processes input items sequentially.
- Files: `nodes/Seedance/description/get.operation.ts:21`, `nodes/Seedance/shared/polling/getTaskPolling.ts:15`, `nodes/Seedance/shared/polling/getTaskPolling.ts:80`, `nodes/Seedance/Seedance.node.ts:239`, `nodes/Seedance/Seedance.node.ts:387`
- Cause: Polling is implemented as synchronous sleeps inside `execute()` rather than delegating waiting to a resumable workflow pattern.
- Improvement path: Prefer create/get split workflows for long jobs, default `waitForCompletion` to `false` for high-volume usage, or use n8n wait/resume semantics instead of sleeping inside the node.

**Video downloads buffer the whole file and then Base64 encode it:**
- Problem: `downloadSeedanceVideo()` reads the full response body into memory and converts it to Base64 before attaching binary data.
- Files: `nodes/Seedance/shared/transport/request.ts:92`, `nodes/Seedance/shared/transport/request.ts:103`, `nodes/Seedance/shared/transport/request.ts:113`, `nodes/Seedance/Seedance.node.ts:417`
- Cause: The helper uses `encoding: 'arraybuffer'` and returns `body.toString('base64')` with no content-length or maximum-size guard.
- Improvement path: Enforce a maximum download size, check `content-length`, and use n8n binary helpers or streaming where available for large video assets.

**No retry or rate-limit handling around provider calls:**
- Problem: `seedanceApiRequest()` performs one HTTP request and immediately normalizes any error.
- Files: `nodes/Seedance/shared/transport/request.ts:55`, `nodes/Seedance/shared/transport/request.ts:61`, `nodes/Seedance/shared/mappers/errors.ts`
- Cause: The transport layer has no retry policy for transient network errors, 429 responses, or 5xx responses.
- Improvement path: Add bounded exponential backoff for safe operations and provider-specific handling for 429/rate-limit responses; keep DELETE retry behavior conservative.

## Fragile Areas

**Single catch block normalizes unrelated error sources:**
- Files: `nodes/Seedance/Seedance.node.ts:547`, `nodes/Seedance/shared/mappers/errors.ts`
- Why fragile: Validation errors, provider errors, download errors, mapper errors, and unexpected programming errors all pass through `normalizeSeedanceError()`. This can erase useful type distinctions and can surface raw error objects through `continueOnFail()`.
- Safe modification: Keep operation-local validation errors as `NodeOperationError`, normalize only provider transport errors, and return a redacted shape for workflow-visible failures.
- Test coverage: Tests cover several transport and download error paths in `test/request.test.ts` and `test/seedanceDownloadFlow.test.ts`; they do not cover raw-error redaction or `continueOnFail()` output safety.

**Tests depend on generated `dist/` files:**
- Files: `test/request.test.ts`, `test/taskPolling.test.ts`, `test/seedanceGenerateImageExecute.test.ts`, `test/seedanceDownloadFlow.test.ts`, `package.json`, `tsconfig.json`
- Why fragile: Tests import `../dist/...` JavaScript files, but `dist/` is ignored and absent in the workspace. `package.json` has no `test` script, and `tsconfig.json` excludes `test/**/*.ts`.
- Safe modification: Add a `test` script that builds first and runs `node --test test/*.test.ts`, or switch tests to a TypeScript-aware runner while keeping `dist` contract tests where needed.
- Test coverage: Existing tests are useful but are not wired into the package scripts, so they are easy to skip in local and CI workflows.

**Provider model and size constants are hard-coded:**
- Files: `nodes/Seedance/shared/validators/create.ts`, `nodes/Seedance/shared/constants.ts`, `nodes/Seedance/description/create.operation.ts`, `nodes/Seedance/description/image.operation.ts`
- Why fragile: Model IDs, supported durations, resolutions, aspect ratios, and recommended image sizes live in source constants and node description files. Provider changes require code changes in multiple locations.
- Safe modification: Centralize provider capabilities in one constants module and generate both validators and node property options from that source.
- Test coverage: Tests cover existing constants in `test/createPayload.test.ts`, `test/seedreamImagePayload.test.ts`, and `test/seedreamImageValidation.test.ts`; they cannot detect provider-side contract drift.

## Scaling Limits

**List pagination capacity:**
- Current capacity: `returnAll=true` fetches up to 10 pages of 100 tasks, for a maximum of 1,000 mapped tasks per input item.
- Limit: More than 1,000 matching tasks are omitted without a truncation marker.
- Scaling path: Return a `truncated` flag and `nextPageNum`, remove the fixed cap with an explicit user-controlled maximum, or use cursor/page metadata from the provider when available.

**Polling throughput:**
- Current capacity: One input item is processed at a time, and each waited task can hold the execution loop for up to `waitTimeoutMinutes` minutes.
- Limit: Many waited tasks multiply total workflow runtime by item count and timeout duration.
- Scaling path: Keep get operations non-waiting by default for batch workflows, use workflow-level wait nodes, or add bounded concurrency with explicit rate-limit controls.

**Binary media memory:**
- Current capacity: Seedance video downloads have no enforced maximum; video image inputs are capped at 30 MB and Seedream binary references are capped at 10 MB per image.
- Limit: Large videos can exhaust memory after arraybuffer allocation and Base64 expansion.
- Scaling path: Enforce maximum binary output size in `nodes/Seedance/shared/transport/request.ts` and document the limit in `nodes/Seedance/description/get.operation.ts`.

## Dependencies at Risk

**Test runner is implicit rather than declared:**
- Risk: Tests use Node's built-in `node:test`, but `package.json` does not expose a `test` script and tests import generated `dist/` files.
- Impact: Contributors can run `npm run build` and `npm run lint` without running the test suite, and CI has no obvious package-level test command to call.
- Migration plan: Add `npm test` and, if TypeScript test execution is required, add a dedicated runner dependency or a pretest build step.

**Runtime compatibility is pinned narrowly:**
- Risk: `package.json` declares `"engines": { "node": "22.x" }`.
- Impact: n8n installations running a different supported Node major cannot install or run the package even if the code is compatible.
- Migration plan: Align `package.json` engines with the n8n versions this package targets and document the minimum tested Node version in `README.md`.

## Missing Critical Features

**Automated verification command:**
- Problem: The repository contains 13 test files under `test/`, but `package.json` has no `test` script.
- Blocks: CI and future GSD phases cannot rely on a standard `npm test` command for regression verification.

**Input validation for workflow-expression outputs:**
- Problem: UI-required fields such as `imagePrompt` and `taskId` rely on node property metadata instead of runtime validation.
- Blocks: Reliable operation when n8n expressions resolve to empty strings or hidden saved workflow state bypasses UI requirements.

**Pagination completion metadata:**
- Problem: List output includes `count`, `returnAll`, `pageNum`, and `pageSize`, but no `truncated`, `pagesFetched`, or `nextPageNum` metadata.
- Blocks: Users cannot distinguish a complete `returnAll` result from one stopped by the internal safety counter.

## Test Coverage Gaps

**Security redaction:**
- What's not tested: `continueOnFail()` output does not have tests proving API keys, Authorization headers, request bodies, prompts, image Base64, and raw HTTP errors are redacted.
- Files: `nodes/Seedance/shared/mappers/errors.ts`, `nodes/Seedance/Seedance.node.ts`, `test/request.test.ts`
- Risk: Secrets or sensitive prompts can appear in workflow output JSON.
- Priority: High

**List pagination limits and invalid page parameters:**
- What's not tested: `returnAll` truncation at 10 pages, `pageSize <= 0`, non-integer page values, and truncation metadata.
- Files: `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/description/list.operation.ts`, `test/taskMapper.test.ts`
- Risk: Users can receive incomplete lists or provider errors without clear local validation.
- Priority: High

**Runtime validation for required fields:**
- What's not tested: Empty `taskId`, whitespace `taskId`, empty image prompt, whitespace image prompt, and hidden Base64 reference state.
- Files: `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/shared/validators/seedreamImage.ts`, `nodes/Seedance/shared/transport/endpoints.ts`
- Risk: Invalid requests reach the provider and produce less actionable errors.
- Priority: Medium

**Large download and URL safety behavior:**
- What's not tested: Maximum video download size, private-network URL rejection, non-HTTPS URL rejection, redirect behavior, and unsafe task IDs in output filenames.
- Files: `nodes/Seedance/shared/transport/request.ts`, `nodes/Seedance/Seedance.node.ts`, `test/seedanceDownload.test.ts`, `test/seedanceDownloadFlow.test.ts`
- Risk: Resource exhaustion and server-side request exposure can slip into production.
- Priority: High

**Credential source behavior:**
- What's not tested: Credential property shape, secret masking, credential type name alignment, and absence of default secret values.
- Files: `credentials/SeedanceApi.credentials.ts`, `nodes/Seedance/shared/constants.ts`, `package.json`
- Risk: Credential UI or runtime credential loading can break independently from transport tests.
- Priority: Medium

---

*Concerns audit: 2026-05-18*
