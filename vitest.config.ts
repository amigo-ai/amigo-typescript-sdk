import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'coverage/**', '**/*.config.*', '**/*.test.*'],
    },
    projects: [
      // Unit (non-integration) tests
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
          exclude: ['node_modules', 'dist', 'tests/integration/**'],
        },
      },
      // Integration tests
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**'],
          env: { RUN_INTEGRATION: 'true' },
          pool: 'forks',
        },
      },
    ],
  },
  resolve: {
    alias: {
      // Handle .js imports in TypeScript files
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
})
