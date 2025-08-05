import { REDIS_DEFAULT_TTL } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import { Cache } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { SubscriptionStatus } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import { CACHE_TTL_MULTIPLIERS } from '@subscription/types/constants.js'
import type { UserMembershipStatus } from '@subscription/types/interfaces.js'

export interface IUserMembershipService {
  getUserMembershipStatus(userId: string): Promise<UserMembershipStatus>
  hasActiveSubscription(userId: string): Promise<boolean>
  canAccessGym(userId: string, accessTime?: Date): Promise<boolean>
  updateUserActiveMembership(userId: string, isActive: boolean): Promise<void>
}

export class UserMembershipService implements IUserMembershipService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: ICacheService,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL * CACHE_TTL_MULTIPLIERS.USER_SUBSCRIPTION,
    prefix: 'user-membership',
  })
  async getUserMembershipStatus(userId: string): Promise<UserMembershipStatus> {
    logger.info('Getting user membership status', { userId })

    try {
      // Get active subscription with plan details
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['active', 'trialing'],
          },
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Credits removed - no credit tables in database

      const hasActiveSubscription = !!subscription

      const membershipStatus: UserMembershipStatus = {
        hasActiveSubscription,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status as SubscriptionStatus,
              planId: subscription.planId || '',
              planName: subscription.plan?.name || 'Unknown Plan',
              currentPeriodEnd: subscription.currentPeriodEnd || undefined,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : undefined,
      }

      return membershipStatus
    } catch (error) {
      logger.error('Failed to get user membership status', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const membershipStatus = await this.getUserMembershipStatus(userId)

    return membershipStatus.hasActiveSubscription
  }

  async canAccessGym(userId: string): Promise<boolean> {
    const membershipStatus = await this.getUserMembershipStatus(userId)

    if (
      !membershipStatus.hasActiveSubscription ||
      !membershipStatus.subscription
    ) {
      return false
    }

    const { subscription } = membershipStatus

    // Check if subscription is active
    const status = subscription.status as string

    if (status !== 'active' && status !== 'trialing') {
      return false
    }

    // Active subscription means access is granted
    return true
  }

  async updateUserActiveMembership(
    userId: string,
    isActive: boolean,
  ): Promise<void> {
    logger.info('Updating user active membership status', { userId, isActive })

    try {
      // User membership status is tracked by subscription status
      // No need to update user table as activeMembership field doesn't exist

      // Clear cache
      await this.clearUserMembershipCache(userId)

      logger.info('Updated user active membership status', { userId, isActive })
    } catch (error) {
      logger.error('Failed to update user active membership', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  private async clearUserMembershipCache(userId: string): Promise<void> {
    try {
      await this.cache.del(`user-membership:${userId}`)
    } catch (error) {
      logger.error('Failed to clear user membership cache', { userId, error })
    }
  }
}
