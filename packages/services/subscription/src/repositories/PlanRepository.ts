import type { ICacheService } from '@pika/redis'
import type { SubscriptionPlanDomain } from '@pika/sdk'
import { SubscriptionPlanMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type { PlanSearchParams } from '@subscription/types/search.js'

export interface CreatePlanInput {
  name: string
  description?: string
  price: number
  currency?: string
  intervalCount?: number
  trialPeriodDays?: number
  features: string[]
  isActive?: boolean
  metadata?: any
  stripeProductId?: string
  stripePriceId?: string
}

export interface UpdatePlanInput {
  name?: string
  description?: string
  price?: number
  features?: string[]
  isActive?: boolean
  metadata?: any
}

export interface IPlanRepository {
  create(data: CreatePlanInput): Promise<SubscriptionPlanDomain>
  findById(id: string): Promise<SubscriptionPlanDomain | null>
  findByStripePriceId(
    stripePriceId: string,
  ): Promise<SubscriptionPlanDomain | null>
  findAll(
    params: PlanSearchParams,
  ): Promise<PaginatedResult<SubscriptionPlanDomain>>
  update(id: string, data: UpdatePlanInput): Promise<SubscriptionPlanDomain>
  delete(id: string): Promise<void>
}

export class PlanRepository implements IPlanRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(data: CreatePlanInput): Promise<SubscriptionPlanDomain> {
    logger.info('Creating subscription plan', {
      name: data.name,
      price: data.price,
    })

    try {
      const plan = await this.prisma.subscriptionPlan.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          intervalCount: data.intervalCount ?? 1,
          trialPeriodDays: data.trialPeriodDays,
          features: data.features,
          isActive: data.isActive ?? true,
          metadata: data.metadata,
          stripeProductId: data.stripeProductId,
          stripePriceId: data.stripePriceId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return SubscriptionPlanMapper.fromDocument(plan)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Plan with this name already exists',
            'Name must be unique',
          )
        }
      }
      throw ErrorFactory.databaseError('create', 'SubscriptionPlan', error)
    }
  }

  async findById(id: string): Promise<SubscriptionPlanDomain | null> {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      })

      return plan ? SubscriptionPlanMapper.fromDocument(plan) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'SubscriptionPlan', error)
    }
  }

  async findByStripePriceId(
    stripePriceId: string,
  ): Promise<SubscriptionPlanDomain | null> {
    try {
      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: { stripePriceId },
      })

      return plan ? SubscriptionPlanMapper.fromDocument(plan) : null
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByStripePriceId',
        'SubscriptionPlan',
        error,
      )
    }
  }

  async findAll(
    params: PlanSearchParams,
  ): Promise<PaginatedResult<SubscriptionPlanDomain>> {
    const { page = 1, limit = 20, isActive, search } = params

    const skip = (page - 1) * limit

    const where: Prisma.SubscriptionPlanWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    try {
      const [plans, total] = await Promise.all([
        this.prisma.subscriptionPlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            price: 'asc',
          },
        }),
        this.prisma.subscriptionPlan.count({ where }),
      ])

      const data = plans.map(SubscriptionPlanMapper.fromDocument)

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
      throw ErrorFactory.databaseError('findAll', 'SubscriptionPlan', error)
    }
  }

  async update(
    id: string,
    data: UpdatePlanInput,
  ): Promise<SubscriptionPlanDomain> {
    try {
      const plan = await this.prisma.subscriptionPlan.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          features: data.features,
          isActive: data.isActive,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
      })

      return SubscriptionPlanMapper.fromDocument(plan)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('SubscriptionPlan', id)
        }
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Plan with this name already exists',
            'Name must be unique',
          )
        }
      }
      throw ErrorFactory.databaseError('update', 'SubscriptionPlan', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.subscriptionPlan.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('SubscriptionPlan', id)
        }
        if (error.code === 'P2003') {
          throw ErrorFactory.businessRuleViolation(
            'Cannot delete plan',
            'Plan is being used by active subscriptions',
          )
        }
      }
      throw ErrorFactory.databaseError('delete', 'SubscriptionPlan', error)
    }
  }
}
