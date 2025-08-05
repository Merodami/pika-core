import { STRIPE_MOCK_HOST, STRIPE_MOCK_PORT } from '@pika/environment'
import Stripe from 'stripe'

export interface StripeConfig {
  apiKey: string
  apiVersion: Stripe.LatestApiVersion
  host?: string
  port?: number
  protocol?: string
}

export function getStripeConfig(): StripeConfig {
  const isTest =
    process.env.NODE_ENV === 'test' ||
    process.env.STRIPE_MOCK_ENABLED === 'true'

  if (isTest && process.env.STRIPE_MOCK_HOST) {
    return {
      apiKey: 'sk_test_123', // stripe-mock expects this format
      apiVersion: '2025-06-30.basil',
      host: STRIPE_MOCK_HOST,
      port: STRIPE_MOCK_PORT,
      protocol: 'http',
    }
  }

  // Production/development configuration
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }

  return {
    apiKey: process.env.STRIPE_SECRET_KEY,
    apiVersion: '2025-06-30.basil',
  }
}

export function createStripeInstance(config?: StripeConfig): Stripe {
  const stripeConfig = config || getStripeConfig()

  const options: Stripe.StripeConfig = {
    apiVersion: stripeConfig.apiVersion,
  }

  // Add test mode configuration if host/port are specified
  if (stripeConfig.host) {
    options.host = stripeConfig.host
    options.port = stripeConfig.port
    options.protocol = stripeConfig.protocol as any
  }

  return new Stripe(stripeConfig.apiKey, options)
}
