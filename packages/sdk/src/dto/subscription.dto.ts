// Subscription Plan DTOs
export interface CreateSubscriptionPlanDTO {
  name: string
  description?: string
  price: number
  currency?: string
  intervalCount?: number
  trialPeriodDays?: number
  features: string[]
  isActive?: boolean
  metadata?: Record<string, any>
}

export interface UpdateSubscriptionPlanDTO {
  name?: string
  description?: string
  price?: number
  features?: string[]
  isActive?: boolean
  metadata?: Record<string, any>
}

export interface SubscriptionPlanDTO {
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
  createdAt: string
  updatedAt: string
}

// Subscription DTOs (moved from payment.dto.ts)
export interface CreateSubscriptionDTO {
  planId: string
  stripeCustomerId?: string
  trialEnd?: Date
  metadata?: Record<string, any>
}

// DTO for creating subscription from webhook (Payment Service → Subscription Service)
export interface CreateSubscriptionFromWebhookDTO {
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
}

export interface UpdateSubscriptionDTO {
  planId?: string
  status?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  cancelledAt?: Date
  metadata?: Record<string, any>
}

export interface SubscriptionDTO {
  id: string
  userId: string
  planId?: string
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  startDate?: string
  endDate?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

// Extended DTOs
export interface SubscriptionWithPlanDTO extends SubscriptionDTO {
  plan?: SubscriptionPlanDTO
}
