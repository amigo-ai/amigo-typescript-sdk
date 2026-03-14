# Changelog

All notable changes to the Amigo TypeScript SDK will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/) and the format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Webhook type safety: typed interfaces for all webhook event types, `parseWebhookEvent()` with HMAC-SHA256 signature verification, replay attack protection (#26)
- Rate limit header exposure: `RateLimitInfo` type, `parseRateLimitHeaders()` utility (#26)
- Changelog automation: `scripts/generate-changelog.sh` wired into release workflow (#25)
- Performance benchmarks: token refresh latency, concurrent request handling (#27)
- SECURITY.md with responsible disclosure policy
- CHANGELOG.md
- CODE_OF_CONDUCT.md
- GitHub issue and PR templates
- Troubleshooting section in README
- JSDoc documentation on all public methods

### Fixed

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
