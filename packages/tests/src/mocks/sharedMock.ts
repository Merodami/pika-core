// packages/tests/src/mocks/sharedMock.ts

/**
 * Setup shared module for testing, using the real implementation
 * but silencing the logger to avoid console output during tests
 *
 * @example
 * ```ts
 * // In your test file
 * import { setupSharedMock } from '@tests/mocks/sharedMock.js'
 *
 * // Setup the mock before importing any modules that use shared
 * vi.doMock('@pika/shared', setupSharedMock())
 *
 * // Then import modules that use shared
 * import { logger } from '@pika/shared'
 * ```
 */
export function setupSharedMock() {
  return async () => {
    // Use the real module implementation
    const module = await import('@pika/shared')

    // Only mock the logger to prevent console output during tests
    return {
      ...module,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {},
      },
    }
  }
}
