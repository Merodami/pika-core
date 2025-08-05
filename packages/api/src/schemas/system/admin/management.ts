import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { DateTime } from '../../shared/primitives.js'

/**
 * System service admin management schemas
 *
 * Basic admin functionality for system monitoring and configuration
 */

// ============= System Information =============

export const SystemInfoResponse = openapi(
  z.object({
    environment: z.enum(['development', 'staging', 'production']),
    version: z.string(),
    buildNumber: z.string().optional(),
    deployedAt: DateTime,
    nodeVersion: z.string(),
    uptime: z.number().describe('Server uptime in seconds'),
  }),
  {
    description: 'Basic system information',
  },
)
export type SystemInfoResponse = z.infer<typeof SystemInfoResponse>

// ============= Cache Management =============

export const ClearCacheRequest = openapi(
  z.object({
    pattern: z
      .string()
      .optional()
      .describe('Cache key pattern to clear (e.g., "user:*")'),
  }),
  {
    description: 'Clear cache entries',
  },
)
export type ClearCacheRequest = z.infer<typeof ClearCacheRequest>

export const CacheStatsResponse = openapi(
  z.object({
    hitRate: z.number().min(0).max(100).describe('Cache hit rate percentage'),
    totalKeys: z.number().int().nonnegative(),
    memoryUsage: z
      .number()
      .int()
      .nonnegative()
      .describe('Memory usage in bytes'),
    evictions: z.number().int().nonnegative(),
  }),
  {
    description: 'Cache statistics',
  },
)
export type CacheStatsResponse = z.infer<typeof CacheStatsResponse>

// ============= Basic Actions =============

export const SystemActionResponse = openapi(
  z.object({
    success: z.boolean(),
    message: z.string(),
    timestamp: DateTime,
  }),
  {
    description: 'System action result',
  },
)
export type SystemActionResponse = z.infer<typeof SystemActionResponse>
