# Contributing to Amigo TypeScript SDK

Thank you for your interest in contributing to the Amigo TypeScript SDK! This guide will help you get started with development, testing, and making changes to the SDK.

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Package.json Scripts Overview

The following npm scripts are available for development:

### Development & Build Scripts

- **`npm run build`** - Full build process that:
  - Generates OpenAPI types (`scripts/gen.mjs`)
  - Builds the project with esbuild (`scripts/build.mjs`)
  - Compiles TypeScript declarations (`tsc --project tsconfig.build.json`)

- **`npm run dev`** - Development build with watch mode:
  - Generates OpenAPI types
  - Builds with esbuild in watch mode for automatic rebuilds

### Code Generation

- **`npm run gen-types`** - Generates TypeScript types from the OpenAPI schema
  - Fetches the OpenAPI specification from `https://api.amigo.ai/v1/openapi.json`
  - Generates types in `src/generated/api-types.ts`

### Testing Scripts

- **`npm test`** - Runs all tests once using Vitest
- **`npm run test:watch`** - Runs tests in watch mode for development
- **`npm run test:coverage`** - Runs tests and generates coverage report

### Code Quality Scripts

- **`npm run lint`** - Lints TypeScript files with ESLint (zero warnings policy)
- **`npm run format`** - Checks code formatting with Prettier
- **`npm run format:write`** - Automatically formats code with Prettier

## Testing

This project uses **Vitest** as the testing framework. Test files should follow the naming convention `*.test.ts` or `*.spec.ts`.

### Test Configuration

- Tests are located in the `tests/` directory
- Test configuration is in `vitest.config.ts`
- Tests run in Node.js environment
- Global test utilities are available
- Coverage reports exclude generated files and configuration

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

- Place test files in the `tests/` directory
- Test helpers are available in `tests/test-helpers.ts`
- The project uses MSW (Mock Service Worker) for API mocking

Example test structure:

```typescript
import { describe, it, expect } from 'vitest'
import { YourModule } from '../src/your-module.js'

describe('YourModule', () => {
  it('should do something', () => {
    // Your test here
    expect(true).toBe(true)
  })
})
```

## OpenAPI Type Generation

The SDK automatically generates TypeScript types from the Amigo API's OpenAPI specification.

### How it Works

1. The `scripts/gen.mjs` script fetches the OpenAPI schema from `https://api.amigo.ai/v1/openapi.json`
2. Uses `openapi-typescript` to convert the schema into TypeScript types
3. Generates types in `src/generated/api-types.ts`
4. These types are used throughout the SDK for type safety

### Regenerating Types

Types are automatically regenerated during the build process, but you can manually regenerate them:

```bash
npm run gen-types
```

### Important Notes

- **Never manually edit** files in `src/generated/` - they will be overwritten
- Types are regenerated on every build to stay in sync with the API
- The generated types are excluded from test coverage

## Development Workflow

1. **Start development**: `npm run dev` (builds and watches for changes)
2. **Write tests**: Add tests in the `tests/` directory
3. **Run tests**: `npm run test:watch` while developing
4. **Lint and format**: `npm run lint` and `npm run format:write`
5. **Build**: `npm run build` before submitting

## Project Structure

```
src/
├── core/           # Core SDK functionality
├── generated/      # Auto-generated OpenAPI types (do not edit)
├── resources/      # API resource modules
└── index.ts        # Main entry point

tests/
├── resources/      # Tests for resource modules
└── *.test.ts       # Core functionality tests
```

## Pull Request Guidelines

1. Ensure all tests pass: `npm test`
2. Lint your code: `npm run lint`
3. Format your code: `npm run format:write`
4. Build successfully: `npm run build`
5. Add tests for new functionality
6. Update documentation if needed
