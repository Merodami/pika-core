import { z } from 'zod'

import { UUID } from '../../shared/primitives.js'

/**
 * System service path parameters
 */

export const MaintenanceIdParam = z.object({ id: UUID })
export type MaintenanceIdParam = z.infer<typeof MaintenanceIdParam>

export const AlertIdParam = z.object({ id: UUID })
export type AlertIdParam = z.infer<typeof AlertIdParam>

export const ServiceNameParam = z.object({
  serviceName: z.string().min(1).describe('Service name'),
})
export type ServiceNameParam = z.infer<typeof ServiceNameParam>

export const ComponentIdParam = z.object({ id: UUID })
export type ComponentIdParam = z.infer<typeof ComponentIdParam>
