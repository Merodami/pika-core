import { z } from 'zod'

import { DateTime } from './primitives.js'

/**
 * Common health check schemas used across APIs
 */

// ============= Health Status =============

export const HealthStatus = z.enum(['healthy', 'degraded', 'unhealthy'])
export type HealthStatus = z.infer<typeof HealthStatus>

// ============= Service Health =============

/**
 * Individual service health
 */
export const ServiceHealth = z.object({
  status: HealthStatus,
  url: z.string().describe('Service URL'),
  responseTime: z.number().describe('Response time in milliseconds'),
})

export type ServiceHealth = z.infer<typeof ServiceHealth>

// ============= Simple Health Check =============

/**
 * Simple health check response
 */
export const SimpleHealthCheckResponse = z.object({
  status: HealthStatus,
  timestamp: DateTime,
  service: z.string().describe('Service name'),
  version: z.string().optional(),
})

export type SimpleHealthCheckResponse = z.infer<
  typeof SimpleHealthCheckResponse
>
