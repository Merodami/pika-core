import { z } from 'zod'

/**
 * System service enums
 */

export const SystemComponentType = z.enum([
  'API_GATEWAY',
  'DATABASE',
  'CACHE',
  'MESSAGE_QUEUE',
  'STORAGE',
  'EMAIL',
  'SMS',
  'MONITORING',
])
export type SystemComponentType = z.infer<typeof SystemComponentType>

export const MaintenanceType = z.enum([
  'SCHEDULED',
  'EMERGENCY',
  'UPGRADE',
  'PATCH',
  'ROLLBACK',
])
export type MaintenanceType = z.infer<typeof MaintenanceType>

export const MaintenanceStatus = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
])
export type MaintenanceStatus = z.infer<typeof MaintenanceStatus>

export const LogLevel = z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])
export type LogLevel = z.infer<typeof LogLevel>

export const AlertSeverity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export type AlertSeverity = z.infer<typeof AlertSeverity>

export const SystemMetricType = z.enum([
  'CPU_USAGE',
  'MEMORY_USAGE',
  'DISK_USAGE',
  'NETWORK_IO',
  'REQUEST_COUNT',
  'RESPONSE_TIME',
  'ERROR_RATE',
])
export type SystemMetricType = z.infer<typeof SystemMetricType>
