# Amigo AI TypeScript SDK

Official TypeScript/JavaScript SDK for the Amigo AI API (`@amigo-ai/sdk` on npm).

## Key Commands

| Task                                           | Command                    |
| ---------------------------------------------- | -------------------------- |
| Build (generate types + bundle + declarations) | `npm run build`            |
| Run unit tests                                 | `npm test`                 |
| Run distribution tests (requires build first)  | `npm run test:dist`        |
| Run integration tests (requires API creds)     | `npm run test:integration` |
| Watch mode tests                               | `npm run test:watch`       |
| Lint                                           | `npm run lint`             |
| Lint with autofix                              | `npm run lint:fix`         |
| Format check                                   | `npm run format`           |
| Format write                                   | `npm run format:write`     |
| Generate types from OpenAPI spec               | `npm run gen-types`        |
| Pack tarball for local testing                 | `npm run pack:local`       |

The `build` script runs type generation, esbuild bundling, and `tsc` declaration emit in sequence.

## Architecture

```
src/
  index.ts              — AmigoClient class, config validation, public re-exports
  core/
    auth.ts             — API-key-to-bearer-token exchange, auth middleware with token refresh
    errors.ts           — Error hierarchy (AmigoError base), error factory, error middleware
    retry.ts            — Exponential backoff with jitter, Retry-After header support
    openapi-client.ts   — Creates openapi-fetch Client with auth + error + retry middleware
    utils.ts            — NDJSON stream parser, response helpers
    rate-limit.ts       — RateLimitInfo type, header parsing, callback type
  webhooks/
    types.ts            — Typed interfaces for webhook events (discriminated union)
    parse.ts            — parseWebhookEvent() with HMAC-SHA256 signature verification
    index.ts            — Re-exports
  resources/
    conversation.ts     — Conversations, interactions, NDJSON streaming, message retrieval
    organization.ts     — Organization management
    services.ts         — Service configuration
    user.ts             — User operations
  generated/
    api-types.ts        — Auto-generated OpenAPI types (DO NOT EDIT — run `npm run gen-types`)
tests/
  test-helpers.ts       — Shared MSW mock handlers, mock config, helper utilities
  resources/            — Per-resource test files
  dist/                 — Distribution compatibility tests (run after build)
  integration/          — Integration tests (require real API credentials)
scripts/
  gen.mjs               — Fetches OpenAPI spec and generates src/generated/api-types.ts
  build.mjs             — esbuild bundler producing ESM (.mjs) and CJS (.cjs) in dist/
  generate-changelog.sh — Generates categorized changelog entries from conventional commits
benchmarks/
  token-refresh.bench.ts    — Token refresh latency benchmark
  concurrent-requests.bench.ts — Concurrent request handling benchmark
  run.sh                    — Runner script (requires AMIGO_* env vars)
```

## Conventions

- **Strict TypeScript** — `strict: true`, `noUncheckedIndexedAccess: true` in tsconfig.
- **Single runtime dependency** — `openapi-fetch` is the only production dep. Everything else is devDependencies.
- **Dual ESM/CJS output** — esbuild produces `dist/index.mjs` (ESM) and `dist/index.cjs` (CJS). Type declarations go to `dist/types/`.
- **MSW for test mocking** — Tests use `msw` (Mock Service Worker) to intercept HTTP requests. Shared helpers live in `tests/test-helpers.ts`.
- **Vitest** — Test runner with three project configs: `unit`, `dist`, and `integration`.
- **ESLint + Prettier** — Lint runs with `--max-warnings 0` (zero tolerance). Prettier handles formatting.

## Important Patterns

### Error Hierarchy

`AmigoError` is the base class. Subclasses map to HTTP status codes (e.g., `AuthenticationError` for 401, `RateLimitError` for 429). `createApiError()` is the factory that maps response status to the right error class. `createErrorMiddleware()` plugs into openapi-fetch middleware.

### Retry with Jitter

`createRetryingFetch()` wraps the global fetch with exponential backoff and jitter. It respects `Retry-After` headers and only retries idempotent methods (GET by default). POST requests only retry on 429 when a `Retry-After` header is present.

### Token Refresh

`createAuthMiddleware()` lazily acquires a bearer token by exchanging API key credentials, caches it, and proactively refreshes 5 minutes before expiry. Concurrent requests share a single refresh promise to avoid thundering herd.

### NDJSON Streaming

Conversation creation and interaction endpoints return NDJSON streams. `parseNdjsonStream()` in `core/utils.ts` returns an `AsyncGenerator` that yields parsed JSON objects line-by-line from the response body.

## Generated Code

Files in `src/generated/` are auto-generated from the Amigo OpenAPI spec. Do not edit them manually. Regenerate with:

```sh
npm run gen-types
```

This fetches the latest spec and runs `openapi-typescript` to produce `src/generated/api-types.ts`.
