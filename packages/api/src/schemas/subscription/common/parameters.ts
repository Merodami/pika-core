import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Subscription service path parameters
 */

export const PlanIdParam = openapi(
  z.object({
    id: UUID.describe('Subscription plan ID'),
  }),
  {
    description: 'Subscription plan ID parameter',
  },
)
export type PlanIdParam = z.infer<typeof PlanIdParam>

export const SubscriptionIdParam = openapi(
  z.object({
    id: UUID.describe('Subscription ID'),
  }),
  {
    description: 'Subscription ID parameter',
  },
)
export type SubscriptionIdParam = z.infer<typeof SubscriptionIdParam>
