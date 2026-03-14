# Changelog

All notable changes to the Amigo TypeScript SDK will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/) and the format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.0.0-rc.1] - 2026-03-14

### Breaking Changes

- **AmigoError constructor**: replaced `Object.assign` with typed options parameter; `statusCode` and `errorCode` now correctly mapped from API responses (#30)
- **Error properties readonly**: `statusCode`, `errorCode`, and `context` are now `readonly` on `AmigoError`
- **Removed `errors` namespace**: error classes now exported individually (`import { NotFoundError } from '@amigo-ai/sdk'` instead of `import { errors } from '@amigo-ai/sdk'`)
- **Conversation methods use options objects**: `createConversation`, `interactWithConversation`, `getConversationMessages`, `finishConversation`, `recommendResponsesForInteraction`, `getInteractionInsights`, `getMessageSource` now take a single options object
- **`UserResource.updateUser` uses options object**: `updateUser({ userId, body, headers? })` replaces positional params
- **`UserResource.get()` renamed to `getModel()`**: semantic fix — it returns user model, not user entity
- **Removed `@rollup/rollup-darwin-arm64`** from optionalDependencies
- **Added `engines.node >= 18.0.0`** to package.json

### Added

- **AgentResource**: `createAgent`, `getAgents`, `deleteAgent`, `createAgentVersion`, `getAgentVersions` with `list/create/delete` aliases (#30)
- **ContextGraphResource**: `createContextGraph`, `getContextGraphs`, `createContextGraphVersion`, `deleteContextGraph`, `getContextGraphVersions` with `list/create/delete` aliases (#30)
- **ServiceResource extended**: `createService`, `updateService`, `upsertVersionSet`, `deleteVersionSet` with `create` alias (#30)
- **ConversationResource aliases**: `create()`, `interact()`, `finish()`, `messages()` (#30)
- **New branded types**: `AgentId`, `ToolId`, `DynamicBehaviorSetId`, `MetricId`, `SimulationPersonaId`, `SimulationScenarioId`, `SimulationUnitTestId`, `SimulationUnitTestSetId`, `WebhookDestinationId`, `RoleId`, `ApiKeyId` (#30)
- **Type exports**: `RetryOptions` and `InteractionInput` now exported from package root (#30)
- Webhook type safety: typed interfaces for all webhook event types, `parseWebhookEvent()` with HMAC-SHA256 signature verification, replay attack protection (#26)
- Rate limit header exposure: `RateLimitInfo` type, `parseRateLimitHeaders()` utility (#26)
- Changelog automation: `scripts/generate-changelog.sh` wired into release workflow (#25)
- Performance benchmarks: token refresh latency, concurrent request handling (#27)
- SECURITY.md with responsible disclosure policy
- CODE_OF_CONDUCT.md
- GitHub issue and PR templates

### Fixed

- **AmigoError `statusCode`/`errorCode` mapping bug**: `createApiError()` was passing `status`/`code` but class expected `statusCode`/`errorCode` (#30)
- Dependabot alert #10: `diff` package DoS vulnerability in examples (#23)
- CodeQL workflow conflict with GitHub default setup (#28)
- esbuild `node:crypto` resolution for neutral platform builds (#26)
- Abort signal retry test reliability

## [0.61.0] - 2026-03-14

- Auto-generated type updates from OpenAPI spec

## [0.60.0] - 2026-03-13

- Auto-generated type updates from OpenAPI spec

## [1.0.0-alpha.4]

### Added

- CommonJS (CJS) support for dual ESM/CJS builds

## [1.0.0-alpha.3]

### Fixed

- User endpoint path corrected to `/v1/{organization}/user/{requested_user_id}`

---

> **Note**: Earlier versions were auto-released from OpenAPI spec changes. See [GitHub Releases](https://github.com/amigo-ai/amigo-typescript-sdk/releases) for the full history.
