// Subscription Plan Domain
export interface SubscriptionPlanDomain {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  intervalCount: number
  trialPeriodDays?: number
  features: string[]
  isActive: boolean
  metadata?: Record<string, any>
  stripeProductId?: string
  stripePriceId?: string
  createdAt: Date
  updatedAt: Date
}

// Subscription Domain (moved from payment.ts)
export interface SubscriptionDomain {
  id: string
  userId: string
  planId?: string
  status: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  startDate?: Date
  endDate?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Extended interfaces with relations
export interface SubscriptionWithPlanDomain extends SubscriptionDomain {
  plan?: SubscriptionPlanDomain
}

export interface SubscriptionPlanWithSubscriptionsDomain
  extends SubscriptionPlanDomain {
  subscriptions: SubscriptionDomain[]
}
