/**
 * Pika API Schemas with Zod
 * Main entry point for all Zod schemas and utilities
 *
 * NOTE: Import z directly from 'zod' package to avoid circular dependencies
 * Example: import { z } from 'zod'
 */

// Export all schemas from the main schemas index
export * from './schemas/index.js'

// Export common utilities
export * from './common/registry/base.js'
export * from './common/utils/openapi.js'
export * from './common/utils/sorting.js'
export * from './common/utils/validators.js'

import type { z } from 'zod'

/**
 * Extract TypeScript type from Zod schema
 */
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>

/**
 * Get the shape of a Zod object schema
 */
export type InferShape<T extends z.ZodObject<any>> = T['shape']

/**
 * Make schema properties optional
 */
export type PartialSchema<T extends z.ZodObject<any>> = z.ZodObject<{
  [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]>
}>
