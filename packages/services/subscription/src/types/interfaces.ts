import type { ICacheService } from '@pika/redis'
import type { SubscriptionStatus } from '@pika/types'
import type { PrismaClient } from '@prisma/client'

// Service configuration interfaces
export interface SubscriptionServiceConfig {
  prisma: PrismaClient
  cacheService: ICacheService
}

// Plan configuration interfaces
export interface PlanConfiguration {
  features: string[]
}

// Credit processing interfaces removed - credits system discontinued

// Subscription management interfaces
export interface SubscriptionCreationData {
  userId: string
  planId: string
  stripeCustomerId?: string
  trialEnd?: Date
  metadata?: Record<string, any>
}

export interface SubscriptionUpdateData {
  planId?: string
  status?: SubscriptionStatus
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  cancelledAt?: Date
  metadata?: Record<string, any>
}

// Plan management interfaces
export interface PlanCreationData {
  name: string
  description?: string
  price: number
  currency: string
  intervalCount: number
  trialPeriodDays?: number
  features: string[]
  // Removed gym-related properties
  metadata?: Record<string, any>
}

export interface PlanUpdateData {
  name?: string
  description?: string
  price?: number
  features?: string[]
  isActive?: boolean
  metadata?: Record<string, any>
}

// Search and filtering interfaces moved to search.ts

// User membership status interface
export interface UserMembershipStatus {
  hasActiveSubscription: boolean
  subscription?: {
    id: string
    status: SubscriptionStatus
    planId: string
    planName: string
    // Removed gym-related properties
    currentPeriodEnd?: Date
    cancelAtPeriodEnd: boolean
  }
}
