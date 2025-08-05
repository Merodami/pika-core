import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * HTTP header schemas for payment endpoints
 */

// ============= Stripe Webhook Headers =============

/**
 * Stripe webhook signature headers
 */
export const StripeWebhookHeaders = openapi(
  z.object({
    'stripe-signature': z
      .string()
      .describe('Stripe webhook signature for request validation'),
  }),
  {
    description: 'Headers required for Stripe webhook signature verification',
  },
)

export type StripeWebhookHeaders = z.infer<typeof StripeWebhookHeaders>
