// src/types/domain.ts
import type { SubscriptionDomain } from '@pika/sdk'

// Service operation types
export interface SubscriptionClaimData {
  notificationPreferences?: {
    enableReminders: boolean
    reminderDaysBefore?: number
  }
}

export interface SubscriptionValidateOptions {
  checkActive?: boolean
  checkExpiry?: boolean
  includeRelations?: boolean
}

export interface SubscriptionValidationResult {
  isValid: boolean
  reason?: string
  subscription?: SubscriptionDomain
}

// Analytics types
export interface SubscriptionAnalytics {
  totalSubscriptions: number
  activeSubscriptions: number
  averageRevenue: number
  subscriptionsByStatus: Record<string, number>
}

// Batch operation types
export interface BatchSubscriptionOperation {
  subscriptionIds: string[]
  operation: 'activate' | 'deactivate' | 'cancel'
  context?: Record<string, any>
}

export interface BatchSubscriptionResult {
  processedCount: number
  successCount: number
  failedCount: number
  results: Array<{
    subscriptionId: string
    success: boolean
    error?: string
  }>
}
