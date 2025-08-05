import { resolve } from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Core package aliases (for internal imports within packages)
      '@shared': resolve(__dirname, './packages/shared/src'),
      '@api': resolve(__dirname, './packages/api/src'),
      '@types': resolve(__dirname, './packages/types/src'),
      '@sdk': resolve(__dirname, './packages/sdk/src'),
      '@api-gateway': resolve(__dirname, './packages/api-gateway/src'),
      '@database': resolve(__dirname, './packages/database/src'),
      '@redis': resolve(__dirname, './packages/redis/src'),
      '@http': resolve(__dirname, './packages/http/src'),
      '@auth': resolve(__dirname, './packages/auth/src'),
      '@tests': resolve(__dirname, './packages/tests/src'),
      '@environment': resolve(__dirname, './packages/environment/src'),
      // @pika/* aliases (needed for cross-package imports in tests)
      '@pika/shared': resolve(__dirname, './packages/shared/src'),
      '@pika/api': resolve(__dirname, './packages/api/src'),
      '@pika/types': resolve(__dirname, './packages/types/src'),
      '@pika/sdk': resolve(__dirname, './packages/sdk/src'),
      '@pika/http': resolve(__dirname, './packages/http/src'),
      '@pika/redis': resolve(__dirname, './packages/redis/src'),
      '@pika/auth': resolve(__dirname, './packages/auth/src'),
      '@pika/database': resolve(__dirname, './packages/database/src'),
      '@pika/environment': resolve(__dirname, './packages/environment/src'),
      '@pika/tests': resolve(__dirname, './packages/tests/src'),
      '@pika/user': resolve(__dirname, './packages/services/user/src'),
      '@pika/auth-service': resolve(__dirname, './packages/services/auth/src'),
      '@pika/business': resolve(__dirname, './packages/services/business/src'),
      '@pika/category': resolve(__dirname, './packages/services/category/src'),
      '@pika/communication': resolve(
        __dirname,
        './packages/services/communication/src',
      ),
      '@pika/payment': resolve(__dirname, './packages/services/payment/src'),
      '@pika/pdf': resolve(__dirname, './packages/services/pdf/src'),
      '@pika/storage': resolve(__dirname, './packages/services/storage/src'),
      '@pika/subscription': resolve(
        __dirname,
        './packages/services/subscription/src',
      ),
      '@pika/support': resolve(__dirname, './packages/services/support/src'),
      '@pika/voucher-service': resolve(
        __dirname,
        './packages/services/voucher/src',
      ),
      // Service aliases (for internal imports within services)
      '@user': resolve(__dirname, './packages/services/user/src'),
      '@auth-service': resolve(__dirname, './packages/services/auth/src'),
      '@business': resolve(__dirname, './packages/services/business/src'),
      '@category': resolve(__dirname, './packages/services/category/src'),
      '@communication': resolve(
        __dirname,
        './packages/services/communication/src',
      ),
      '@payment': resolve(__dirname, './packages/services/payment/src'),
      '@pdf': resolve(__dirname, './packages/services/pdf/src'),
      '@storage': resolve(__dirname, './packages/services/storage/src'),
      '@subscription': resolve(
        __dirname,
        './packages/services/subscription/src',
      ),
      '@support': resolve(__dirname, './packages/services/support/src'),
      '@voucher': resolve(__dirname, './packages/services/voucher/src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    env: loadEnv('test', process.cwd(), ''),
    setupFiles: ['./packages/tests/src/utils/setupTests.ts'],
    include: ['packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['verbose'],
    // Extended timeouts for all tests
    testTimeout: 60000, // 60 seconds for individual tests
    hookTimeout: 120000, // 120 seconds for setup/teardown hooks
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/previous-architecture/**',
    ],
    // Enable test isolation to prevent worker crashes
    isolate: true,
    poolOptions: {
      threads: {
        // Limit the number of threads to prevent resource exhaustion
        maxThreads: 4,
        minThreads: 1,
        // Enable isolation for thread safety
        isolate: true,
      },
      forks: {
        maxForks: 2,
        minForks: 1,
        isolate: true,
      },
    },
    // Allow some concurrency but with limits
    pool: 'threads',
    maxConcurrency: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
      ],
    },
  },
})
