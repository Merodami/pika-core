import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * Shared subscription request/response types
 */

/**
 * Cancel subscription request - used by both public and admin
 */
export const CancelSubscriptionRequest = openapi(
  z.object({
    cancelAtPeriodEnd: z
      .boolean()
      .default(true)
      .describe('Whether to cancel at period end'),
    reason: z.string().optional().describe('Cancellation reason'),
    feedback: z.string().optional().describe('User feedback'),
  }),
  {
    description: 'Cancel a subscription',
  },
)

export type CancelSubscriptionRequest = z.infer<
  typeof CancelSubscriptionRequest
>
