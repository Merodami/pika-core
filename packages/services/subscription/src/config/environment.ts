import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '@pika/environment'

export function getStripeConfig() {
  return {
    secretKey: STRIPE_SECRET_KEY || '',
    webhookSecret: STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2024-12-18.acacia' as const,
  }
}

export function getSubscriptionDefaults() {
  return {
    trialPeriodDays: 14,
    gracePeriodDays: 3,
    maxPaymentRetries: 3,
    defaultCurrency: 'usd',
  }
}

export function getPlanLimits() {
  return {
    maxPlansPerQuery: 100,
    maxFeaturesPerPlan: 20,
    minPrice: 0,
    maxPrice: 999999,
  }
}

export function getWebhookConfig() {
  return {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  }
}
