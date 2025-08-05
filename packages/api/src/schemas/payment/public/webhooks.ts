import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Money, UserId } from '../../shared/branded.js'
import { DateTime, UUID } from '../../shared/primitives.js'

/**
 * Stripe webhook schemas for payment processing
 * Based on industry standard Stripe webhook event types
 */

// ============= Stripe Event Types =============

export const StripeEventType = z.enum([
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_method.attached',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'checkout.session.completed',
  'checkout.session.expired',
])
export type StripeEventType = z.infer<typeof StripeEventType>

// ============= Stripe Objects =============

/**
 * Stripe payment intent object (simplified)
 */
export const StripePaymentIntent = z.object({
  id: z.string(),
  objectType: z.literal('payment_intent'),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  customer: z.string().nullable(),
  metadata: z.record(z.string(), z.string()).default({}),
  status: z.enum([
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
    'requires_capture',
    'canceled',
    'succeeded',
  ]),
  created: z.number().int(),
})
export type StripePaymentIntent = z.infer<typeof StripePaymentIntent>

/**
 * Stripe subscription object (simplified)
 */
export const StripeSubscription = z.object({
  id: z.string(),
  objectType: z.literal('subscription'),
  customer: z.string(),
  status: z.enum([
    'active',
    'past_due',
    'unpaid',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'trialing',
  ]),
  current_period_start: z.number().int(),
  current_period_end: z.number().int(),
  metadata: z.record(z.string(), z.string()).default({}),
})
export type StripeSubscription = z.infer<typeof StripeSubscription>

/**
 * Stripe checkout session object (simplified)
 */
export const StripeCheckoutSession = z.object({
  id: z.string(),
  objectType: z.literal('checkout.session'),
  customer: z.string().nullable(),
  payment_intent: z.string().nullable(),
  subscription: z.string().nullable(),
  amount_total: z.number().int().nullable(),
  currency: z.string().length(3).nullable(),
  metadata: z.record(z.string(), z.string()).default({}),
  payment_status: z.enum(['paid', 'unpaid', 'no_payment_required']),
})
export type StripeCheckoutSession = z.infer<typeof StripeCheckoutSession>

/**
 * Stripe invoice object (simplified)
 */
export const StripeInvoice = z.object({
  id: z.string(),
  objectType: z.literal('invoice'),
  customer: z.string(),
  subscription: z.string().nullable(),
  amount_paid: z.number().int(),
  amount_due: z.number().int(),
  currency: z.string().length(3),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
  metadata: z.record(z.string(), z.string()).default({}),
})
export type StripeInvoice = z.infer<typeof StripeInvoice>

// ============= Stripe Webhook Event =============

/**
 * Base Stripe webhook event structure
 */
export const StripeWebhookEvent = z.discriminatedUnion('type', [
  // Payment Intent Events
  z.object({
    id: z.string(),
    type: z.literal('payment_intent.succeeded'),
    data: z.object({
      objectData: StripePaymentIntent,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('payment_intent.payment_failed'),
    data: z.object({
      objectData: StripePaymentIntent,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('payment_intent.canceled'),
    data: z.object({
      objectData: StripePaymentIntent,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  // Subscription Events
  z.object({
    id: z.string(),
    type: z.literal('customer.subscription.created'),
    data: z.object({
      objectData: StripeSubscription,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('customer.subscription.updated'),
    data: z.object({
      objectData: StripeSubscription,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('customer.subscription.deleted'),
    data: z.object({
      objectData: StripeSubscription,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  // Invoice Events
  z.object({
    id: z.string(),
    type: z.literal('invoice.payment_succeeded'),
    data: z.object({
      objectData: StripeInvoice,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('invoice.payment_failed'),
    data: z.object({
      objectData: StripeInvoice,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  // Checkout Session Events
  z.object({
    id: z.string(),
    type: z.literal('checkout.session.completed'),
    data: z.object({
      objectData: StripeCheckoutSession,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('checkout.session.expired'),
    data: z.object({
      objectData: StripeCheckoutSession,
    }),
    created: z.number().int(),
    livemode: z.boolean(),
    pending_webhooks: z.number().int(),
    request: z
      .object({
        id: z.string().nullable(),
        idempotency_key: z.string().nullable(),
      })
      .nullable(),
  }),
])

export type StripeWebhookEvent = z.infer<typeof StripeWebhookEvent>

// ============= Webhook Processing =============

/**
 * Webhook processing result
 */
export const WebhookProcessingResult = openapi(
  z.object({
    eventId: z.string(),
    eventType: StripeEventType,
    processed: z.boolean(),
    message: z.string(),
    userId: UserId.optional(),
    actions: z.array(z.string()).describe('List of actions taken'),
    timestamp: DateTime,
  }),
  {
    description: 'Result of webhook processing',
  },
)

export type WebhookProcessingResult = z.infer<typeof WebhookProcessingResult>

/**
 * Webhook signature validation request
 */
export const WebhookValidationRequest = z.object({
  payload: z.string().describe('Raw webhook payload'),
  signature: z.string().describe('Stripe signature header'),
  timestamp: z.number().int().optional(),
})

export type WebhookValidationRequest = z.infer<typeof WebhookValidationRequest>

/**
 * Webhook validation result
 */
export const WebhookValidationResult = z.object({
  valid: z.boolean(),
  event: StripeWebhookEvent.optional(),
  error: z.string().optional(),
})

export type WebhookValidationResult = z.infer<typeof WebhookValidationResult>

// ============= Webhook Response =============

/**
 * Standard webhook response (Stripe expects 2xx with minimal response)
 */
export const WebhookResponse = openapi(
  z.object({
    received: z.boolean().default(true),
    eventId: z.string().optional(),
    message: z.string().optional(),
  }),
  {
    description: 'Webhook acknowledgment response',
    example: {
      received: true,
      eventId: 'evt_1234567890abcdef',
      message: 'Event processed successfully',
    },
  },
)

export type WebhookResponse = z.infer<typeof WebhookResponse>

// ============= Webhook Error Response =============

/**
 * Webhook error response
 */
export const WebhookErrorResponse = openapi(
  z.object({
    error: z.object({
      code: z.enum([
        'INVALID_SIGNATURE',
        'PROCESSING_ERROR',
        'UNKNOWN_EVENT_TYPE',
      ]),
      message: z.string(),
      eventId: z.string().optional(),
      timestamp: DateTime,
    }),
  }),
  {
    description: 'Webhook error response',
  },
)

export type WebhookErrorResponse = z.infer<typeof WebhookErrorResponse>

// ============= Webhook Metadata =============

/**
 * Internal webhook metadata for our system
 */
export const WebhookMetadata = z.object({
  userId: UserId.optional(),
  subscriptionId: UUID.optional(),
  sessionId: UUID.optional(),
  creditPackId: UUID.optional(),
  amount: Money.optional(),
  purpose: z.enum(['CREDITS', 'SUBSCRIPTION', 'SESSION_PAYMENT']).optional(),
})

export type WebhookMetadata = z.infer<typeof WebhookMetadata>
