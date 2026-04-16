---
phase: 01-credentials-t2v-get
plan: 02
subsystem: transport
tags: [n8n, seedance, credentials, transport, errors, tests]
requires: [01-01]
provides:
  - 单一 API Key 凭证驱动的共享 Seedance 请求上下文
  - create/get 共用的 Phase 1 端点常量、状态常量与错误归一化
  - transport 层纯逻辑测试，覆盖鉴权头、端点与错误映射
affects: [credentials, create-task, get-task, transport, tests]
tech-stack:
  added: [shared transport helpers, error mapper, node:test transport coverage]
  patterns: [single credential path, centralized request helpers, stable normalized errors]
key-files:
  created:
    - nodes/Seedance/shared/constants.ts
    - nodes/Seedance/shared/types.ts
    - nodes/Seedance/shared/transport/endpoints.ts
    - nodes/Seedance/shared/transport/request.ts
    - nodes/Seedance/shared/mappers/errors.ts
    - test/request.test.ts
  modified:
    - credentials/SeedanceApi.credentials.ts
    - nodes/Seedance/Seedance.node.ts
key-decisions:
  - "Phase 1 transport 只暴露单一 seedanceApi 凭证读取路径，避免在 operation 中重复读取 API Key。"
  - "Seedance 错误先归一化为 code/message/statusCode/raw 四段结构，供后续 create/get mapper 直接复用。"
  - "node --test 直接验证构建产物中的共享 helper，避免在当前 CommonJS 构建配置下引入额外测试运行时依赖。"
requirements-completed: [CRED-01, CRED-02]
duration: 32min
completed: 2026-04-16
---

# Phase 1 Plan 02: Credential Transport Foundation Summary

**Seedance 的共享凭证与 transport 基础层已完成：节点现在只声明一个可复用 API Key 凭证，create/get 后续实现可以共用统一的鉴权头、端点常量、状态枚举与错误归一化结构。**

## Performance

- **Duration:** 32 min
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- 完成 `seedanceApi` 凭证契约收敛，仅保留一个 `apiKey` 密文字段，并在节点元数据中明确其为所有 Seedance 操作共享。
- 新增共享 transport 层：包含基础 URL、Phase 1 create/get endpoint 常量、鉴权 header 构造、HTTP request option 构造、请求上下文加载与统一错误归一化。
- 新增 `node:test` 用例，覆盖 Bearer 鉴权头、端点 helper、任务状态常量与多层级 API 错误 payload 的归一化行为。

## Task Commits

1. **Task 1: Finalize the reusable Seedance credential contract** - `d42024f` (feat)
2. **Task 2: Build shared transport, endpoint, and error helpers** - `4dc281a` (feat)
3. **Task 3: Add transport-level tests for auth and error mapping** - `da6b565` (test)

## Files Created/Modified

- `credentials/SeedanceApi.credentials.ts` - 将凭证定义收敛为单一共享 API Key，并补充复用语义描述。
- `nodes/Seedance/Seedance.node.ts` - 节点继续只声明一个 Seedance 凭证入口，不引入额外鉴权方案。
- `nodes/Seedance/shared/constants.ts` - 定义 credential type、基础 URL、API version、状态常量与鉴权 header 常量。
- `nodes/Seedance/shared/types.ts` - 定义 transport / error / credential 相关共享 TypeScript 类型。
- `nodes/Seedance/shared/transport/endpoints.ts` - 定义 create/get endpoint 常量与 path/url helper。
- `nodes/Seedance/shared/transport/request.ts` - 封装凭证读取、Bearer header 构造、请求 options 组装与统一异常抛出。
- `nodes/Seedance/shared/mappers/errors.ts` - 将网络/API 失败统一映射成稳定错误对象。
- `test/request.test.ts` - 通过纯 helper 测试保护鉴权与错误归一化行为。

## Decisions Made

- 共享请求层只允许从 `seedanceApi` 凭证读取 `apiKey`，确保后续 create/get/list/delete 都走同一鉴权路径。
- 本计划只定义 Phase 1 需要的 create/get endpoint，不提前实现 Phase 3 的 list/delete 用户能力。
- transport 层直接返回稳定的 `code`、`message`、`statusCode`、`raw` 结构，避免后续节点执行逻辑耦合上游异常形态。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 修正 `httpRequest` 选项类型以通过 build**
- **Found during:** Task 2
- **Issue:** 共享 request helper 最初返回 `IDataObject`，与 n8n `helpers.httpRequest` 的 `IHttpRequestOptions` 类型不兼容，导致 `npm run build` 失败。
- **Fix:** 在共享类型中新增明确的 `SeedanceHttpRequestOptions` 别名，并让 request helper 返回 n8n 期望的请求选项类型。
- **Files modified:** `nodes/Seedance/shared/types.ts`, `nodes/Seedance/shared/transport/request.ts`
- **Verification:** `npm run build`
- **Committed in:** `4dc281a`

**2. [Rule 3 - Blocking] 调整测试加载方式以匹配当前构建链路**
- **Found during:** Task 3
- **Issue:** `node --test` 直接执行 `.ts` 测试时，Node 以 ESM 解析测试文件，但无法解析源码侧未带扩展名的 TypeScript import，导致测试在运行时找不到模块。
- **Fix:** 保持零额外运行时依赖不变，将测试改为动态导入已构建的 `dist/` helper 产物，继续只验证 transport 层纯逻辑。
- **Files modified:** `test/request.test.ts`
- **Verification:** `npm run build`, `node --test`
- **Committed in:** `da6b565`

---

**Total deviations:** 2 auto-fixed（2 blocking）
**Impact on plan:** 偏差仅用于打通官方 build/test 流程，没有扩展到 create/get 真正的用户执行逻辑。

## Known Stubs

- `nodes/Seedance/Seedance.node.ts:77` - 节点 execute 仍返回 `status: 'not_implemented'` 的占位结果；这是有意保留的 Phase 1/后续计划边界，真实 create/get 用户行为将在后续 plan 实现。
- `nodes/Seedance/Seedance.node.ts:79` - create/get message 文案仍为 later plan stub；不影响本计划“共享 credential/transport/errors/types/test 基础层”目标。

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth-path | `nodes/Seedance/shared/transport/request.ts` | 新增统一 API Key 读取与 Bearer 鉴权头构造路径，后续所有 HTTP 请求都会经过此 trust boundary。 |
| threat_flag: network-endpoint | `nodes/Seedance/shared/transport/endpoints.ts` | 新增 Seedance create/get 网络 endpoint 常量，后续操作会复用这些远程调用路径。 |

## Issues Encountered

- `n8n-node build` 仍会输出 Node 的 `DEP0190` 警告，属于上游 CLI 子进程实现细节，未影响构建通过。
- `node --test` 仍会输出 `MODULE_TYPELESS_PACKAGE_JSON` 警告；当前未为消除此警告去修改包模块类型，避免影响现有 CommonJS 构建与 n8n 产物约定。

## Next Phase Readiness

- create/get 后续实现已经可以直接复用共享 request helper 与错误 mapper。
- 任务状态枚举和端点常量已固化，后续 mapper 可以继续构建 `isTerminal` 等工作流语义字段。
- 当前仍严格停留在 Phase 1 基础层，没有提前实现 Phase 3 的 list/delete 用户能力。

## Self-Check: PASSED

- Found summary file `.planning/phases/01-credentials-t2v-get/01-02-SUMMARY.md`
- Found commit `d42024f`
- Found commit `4dc281a`
- Found commit `da6b565`

---
*Phase: 01-credentials-t2v-get*
*Completed: 2026-04-16*
