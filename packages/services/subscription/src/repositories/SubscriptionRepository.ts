import type { ICacheService } from '@pika/redis'
import type { SubscriptionDomain, SubscriptionWithPlanDomain } from '@pika/sdk'
import { SubscriptionMapper, SubscriptionWithPlanMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { SubscriptionStatus } from '@prisma/client'
import { Prisma as PrismaErrors } from '@prisma/client'

export interface CreateSubscriptionInput {
  userId: string
  planId: string
  status: SubscriptionStatus | string // Allow both Prisma enum and string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  metadata?: any
}

export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus | string // Allow both Prisma enum and string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  cancelledAt?: Date
  endDate?: Date
  metadata?: any
}

export interface SubscriptionSearchParams {
  page?: number
  limit?: number
  status?: SubscriptionStatus | string // Allow both Prisma enum and string
  userId?: string
  planId?: string
  cancelAtPeriodEnd?: boolean
  fromDate?: Date
  toDate?: Date
}

export interface ISubscriptionRepository {
  create(data: CreateSubscriptionInput): Promise<SubscriptionDomain>
  findById(id: string): Promise<SubscriptionDomain | null>
  findByIdWithPlan(id: string): Promise<SubscriptionWithPlanDomain | null>
  findByUserId(userId: string): Promise<SubscriptionDomain | null>
  findByUserIdWithPlan(
    userId: string,
  ): Promise<SubscriptionWithPlanDomain | null>
  findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDomain | null>
  findAll(
    params: SubscriptionSearchParams,
  ): Promise<PaginatedResult<SubscriptionDomain>>
  findAllActive(): Promise<SubscriptionDomain[]>
  update(id: string, data: UpdateSubscriptionInput): Promise<SubscriptionDomain>
  delete(id: string): Promise<void>
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(data: CreateSubscriptionInput): Promise<SubscriptionDomain> {
    logger.info('Creating subscription', {
      userId: data.userId,
      planId: data.planId,
    })

    try {
      const subscription = await this.prisma.subscription.create({
        data: {
          userId: data.userId,
          planId: data.planId,
          status: data.status as SubscriptionStatus,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          trialEnd: data.trialEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripeCustomerId: data.stripeCustomerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          plan: true,
        },
      })

      return SubscriptionMapper.fromDocument(subscription)
    } catch (error) {
      if (error instanceof PrismaErrors.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'User already has an active subscription',
            'Only one active subscription per user allowed',
          )
        }
      }
      throw ErrorFactory.databaseError('create', 'Subscription', error)
    }
  }

  async findById(id: string): Promise<SubscriptionDomain | null> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id },
      })

      return subscription ? SubscriptionMapper.fromDocument(subscription) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'Subscription', error)
    }
  }

  async findByIdWithPlan(
    id: string,
  ): Promise<SubscriptionWithPlanDomain | null> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id },
        include: {
          plan: true,
        },
      })

      return subscription
        ? SubscriptionWithPlanMapper.fromDocumentWithPlan(subscription)
        : null
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByIdWithPlan',
        'Subscription',
        error,
      )
    }
  }

  async findByUserId(userId: string): Promise<SubscriptionDomain | null> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['active', 'trialing', 'past_due'],
          },
        },
      })

      return subscription ? SubscriptionMapper.fromDocument(subscription) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findByUserId', 'Subscription', error)
    }
  }

  async findByUserIdWithPlan(
    userId: string,
  ): Promise<SubscriptionWithPlanDomain | null> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['active', 'trialing', 'past_due'],
          },
        },
        include: {
          plan: true,
        },
      })

      return subscription
        ? SubscriptionWithPlanMapper.fromDocumentWithPlan(subscription)
        : null
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByUserIdWithPlan',
        'Subscription',
        error,
      )
    }
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDomain | null> {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: { stripeSubscriptionId },
      })

      return subscription ? SubscriptionMapper.fromDocument(subscription) : null
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByStripeSubscriptionId',
        'Subscription',
        error,
      )
    }
  }

  async findAll(
    params: SubscriptionSearchParams,
  ): Promise<PaginatedResult<SubscriptionDomain>> {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      planId,
      cancelAtPeriodEnd,
      fromDate,
      toDate,
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.SubscriptionWhereInput = {
      ...(userId && { userId }),
      ...(planId && { planId }),
      ...(status && { status: status as SubscriptionStatus }),
      ...(cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
    }

    try {
      const [subscriptions, total] = await Promise.all([
        this.prisma.subscription.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            plan: true,
          },
        }),
        this.prisma.subscription.count({ where }),
      ])

      const data = subscriptions.map(SubscriptionMapper.fromDocument)

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError('findAll', 'Subscription', error)
    }
  }

  async findAllActive(): Promise<SubscriptionDomain[]> {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          status: 'active',
          cancelAtPeriodEnd: false,
        },
      })

      return subscriptions.map(SubscriptionMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('findAllActive', 'Subscription', error)
    }
  }

  async update(
    id: string,
    data: UpdateSubscriptionInput,
  ): Promise<SubscriptionDomain> {
    try {
      const subscription = await this.prisma.subscription.update({
        where: { id },
        data: {
          status: data.status as SubscriptionStatus,
          currentPeriodStart: data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd,
          trialEnd: data.trialEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          cancelledAt: data.cancelledAt,
          endDate: data.endDate,
          updatedAt: new Date(),
        },
      })

      return SubscriptionMapper.fromDocument(subscription)
    } catch (error) {
      if (error instanceof PrismaErrors.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Subscription', id)
        }
      }
      throw ErrorFactory.databaseError('update', 'Subscription', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.subscription.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof PrismaErrors.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Subscription', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'Subscription', error)
    }
  }
}
