import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { DateTime } from '../../shared/primitives.js'

/**
 * Internal system service schemas for service-to-service communication
 *
 * Basic internal health check and system status functionality
 */

// ============= Service Health =============

export const InternalHealthCheckResponse = openapi(
  z.object({
    service: z.string(),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: DateTime,
    uptime: z.number().describe('Service uptime in seconds'),
    version: z.string().optional(),
  }),
  {
    description: 'Internal service health check response',
  },
)
export type InternalHealthCheckResponse = z.infer<
  typeof InternalHealthCheckResponse
>

// ============= Resource Status =============

export const ResourceStatusResponse = openapi(
  z.object({
    database: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      responseTime: z.number().describe('Response time in milliseconds'),
      activeConnections: z.number().int().nonnegative(),
    }),
    cache: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      responseTime: z.number().describe('Response time in milliseconds'),
      memoryUsage: z.number().describe('Memory usage percentage'),
    }),
  }),
  {
    description: 'Resource status for internal monitoring',
  },
)
export type ResourceStatusResponse = z.infer<typeof ResourceStatusResponse>
