# Contributing to Amigo TypeScript SDK

Thank you for contributing to `@amigo-ai/sdk`. This repository ships the classic TypeScript SDK today while classic-to-platform migration work continues in parallel, so contributor changes should keep the existing classic package stable and well-documented.

## Development Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm ci
```

## Scripts

### Build And Codegen

- `npm run gen-types` regenerates Classic API types from `specs/openapi-baseline.json`
- `npm run openapi:sync` refreshes that snapshot from the public Classic API
- `npm run build` runs codegen, bundles with esbuild, and emits declarations
- `npm run dev` runs the build in watch mode
- `npm run docs` rebuilds the published TypeDoc output

### Testing

- `npm test` runs the unit test project
- `npm run test:dist` verifies the built ESM and CJS artifacts
- `npm run test:integration` runs live API integration tests
- `npm run test:coverage` runs unit coverage

### Code Quality

- `npm run lint` runs ESLint with zero warnings
- `npm run format` checks formatting with Prettier
- `npm run format:write` applies formatting

## Testing

This repository uses Vitest.

```bash
npm run build
npm test
npm run test:dist
npm run test:integration
npm run test:coverage
```

Integration tests require valid Amigo API credentials in the environment.

## Type Generation

Code generation reads the committed Classic API snapshot and writes `src/generated/api-types.ts`. Platform types and resources belong to the separate [Platform SDK](https://github.com/amigo-ai/amigo-platform-typescript-sdk). Builds do not fetch a newer API schema unless you explicitly run `openapi:sync`.

Never edit generated files manually.

## Project Structure

```text
src/
├── core/            # auth, errors, retry, helpers
├── generated/       # generated classic OpenAPI types
├── resources/       # classic API resources
└── index.ts         # public package entry point

tests/
├── integration/     # live API tests
├── resources/       # resource-level unit tests
└── *.test.ts        # core package tests

scripts/
├── build.mjs
├── gen.mjs
└── sync-openapi.mjs
```

## Pull Requests

Before opening a PR:

1. Run `npm run format:write`
2. Run `npm run lint`
3. Run `npm test`
4. Run `npm run build`
5. Run `npm run test:dist` for package-surface changes
6. Update README or examples if customer-visible behavior changed

## Release Notes

Releases are handled by GitHub Actions. If you change public package behavior, examples, or generated API surface, include enough context in the PR description for maintainers to produce accurate release notes.
