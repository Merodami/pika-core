import { SUBSCRIPTION_API_URL } from '@pika/environment'
import type { ServiceContext } from '@pika/types'

// TODO: Fix circular dependency - move domain types to shared or separate package
// import type { SubscriptionDomain, SubscriptionWithPlanDomain } from '@pika
import { BaseServiceClient } from '../BaseServiceClient.js'

// Temporary interfaces to avoid circular dependency
export interface SubscriptionPlanDomain {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  creditsAmount: number
  trialPeriodDays?: number
  features: string[]
  isActive: boolean
  metadata?: Record<string, any>
  stripeProductId?: string
  stripePriceId?: string
  membershipType?: string
  membershipPackage?: string
  gymAccessTimes?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionDomain {
  id: string
  userId: string
  planId?: string
  planType: string
  status: string
  billingInterval: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  startDate?: Date
  endDate?: Date
  lastProcessedAt?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionWithPlanDomain extends SubscriptionDomain {
  plan?: SubscriptionPlanDomain
}

export interface UpdateSubscriptionStatusRequest {
  subscriptionId: string
  status: string
  currentPeriodStart?: string // ISO date string
  currentPeriodEnd?: string // ISO date string
  trialEnd?: string // ISO date string
  cancelAtPeriodEnd?: boolean
  cancelledAt?: string // ISO date string
  endedAt?: string // ISO date string
}

export interface ProcessSubscriptionCreditsRequest {
  subscriptionId: string
  creditsAmount: number
}

export interface UpdateUserMembershipRequest {
  userId: string
  isActive: boolean
}

export interface SubscriptionCreatedRequest {
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEnd?: string
}

/**
 * Client for communicating with the Subscription service
 * Used by Payment service for webhook-driven subscription updates
 */
export class SubscriptionServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = SUBSCRIPTION_API_URL) {
    super({
      serviceUrl,
      serviceName: 'SubscriptionServiceClient',
    })
  }

  /**
   * Update subscription status from Stripe webhook
   */
  async updateSubscriptionStatus(
    data: UpdateSubscriptionStatusRequest,
    context?: ServiceContext,
  ): Promise<SubscriptionDomain> {
    return await this.put<SubscriptionDomain>(
      `/subscriptions/${data.subscriptionId}/status`,
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Process subscription credits after successful payment
   */
  async processSubscriptionCredits(
    data: ProcessSubscriptionCreditsRequest,
    context?: ServiceContext,
  ): Promise<{ success: boolean; creditsAdded: number }> {
    return await this.post<{ success: boolean; creditsAdded: number }>(
      `/subscriptions/${data.subscriptionId}/process-credits`,
      { creditsAmount: data.creditsAmount },
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Update user membership active status
   */
  async updateUserMembership(
    data: UpdateUserMembershipRequest,
    context?: ServiceContext,
  ): Promise<{ success: boolean }> {
    return await this.put<{ success: boolean }>(
      `/users/${data.userId}/membership`,
      { isActive: data.isActive },
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Create subscription from Stripe (webhook-driven)
   */
  async createSubscriptionFromStripe(
    data: SubscriptionCreatedRequest,
    context?: ServiceContext,
  ): Promise<SubscriptionDomain> {
    return await this.post<SubscriptionDomain>(
      '/subscriptions/from-stripe',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getSubscriptionByStripeId(
    stripeSubscriptionId: string,
    context?: ServiceContext,
  ): Promise<SubscriptionWithPlanDomain | null> {
    try {
      return await this.get<SubscriptionWithPlanDomain>(
        `/subscriptions/stripe/${stripeSubscriptionId}`,
        { ...context, useServiceAuth: true },
      )
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(
    userId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    const result = await this.get<{ hasActiveSubscription: boolean }>(
      `/users/${userId}/membership/status`,
      { ...context, useServiceAuth: true },
    )

    return result.hasActiveSubscription
  }
}
