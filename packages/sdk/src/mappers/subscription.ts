import type { UserDocument } from './UserMapper.js'

/**
 * Interface representing a database SubscriptionPlan document
 * Uses camelCase for fields as they come from Prisma
 */
export interface SubscriptionPlanDocument {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  intervalCount: number
  trialPeriodDays: number | null
  features: string[]
  isActive: boolean
  metadata: any // Prisma returns JsonValue which we convert in mapper
  stripeProductId: string | null
  stripePriceId: string | null
  createdAt: Date
  updatedAt: Date
  // Relations
  subscriptions?: SubscriptionDocument[]
}

/**
 * Interface representing a database Subscription document
 * Uses camelCase for fields as they come from Prisma
 */
export interface SubscriptionDocument {
  id: string
  userId: string
  planId: string | null
  status: string
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  startDate: Date | null
  endDate: Date | null
  cancelledAt: Date | null
  createdAt: Date
  updatedAt: Date
  // Relations
  user?: UserDocument
  plan?: SubscriptionPlanDocument | null
}

import {
  type SubscriptionDomain,
  type SubscriptionPlanDomain,
  type SubscriptionPlanWithSubscriptionsDomain,
  type SubscriptionWithPlanDomain,
} from '../domain/subscription.js'
import {
  type SubscriptionDTO,
  type SubscriptionPlanDTO,
  type SubscriptionWithPlanDTO,
} from '../dto/subscription.dto.js'

export class SubscriptionPlanMapper {
  static fromDocument(doc: SubscriptionPlanDocument): SubscriptionPlanDomain {
    return {
      id: doc.id,
      name: doc.name,
      description: doc.description || undefined,
      price: doc.price,
      currency: doc.currency,
      intervalCount: doc.intervalCount,
      trialPeriodDays: doc.trialPeriodDays || undefined,
      features: doc.features,
      isActive: doc.isActive,
      metadata: doc.metadata || undefined,
      stripeProductId: doc.stripeProductId || undefined,
      stripePriceId: doc.stripePriceId || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  static toDTO(domain: SubscriptionPlanDomain): SubscriptionPlanDTO {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      price: domain.price,
      currency: domain.currency,
      intervalCount: domain.intervalCount,
      trialPeriodDays: domain.trialPeriodDays,
      features: domain.features,
      isActive: domain.isActive,
      metadata: domain.metadata,
      stripeProductId: domain.stripeProductId,
      stripePriceId: domain.stripePriceId,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  static fromDTO(dto: SubscriptionPlanDTO): SubscriptionPlanDomain {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      currency: dto.currency,
      intervalCount: dto.intervalCount,
      trialPeriodDays: dto.trialPeriodDays,
      features: dto.features,
      isActive: dto.isActive,
      metadata: dto.metadata,
      stripeProductId: dto.stripeProductId,
      stripePriceId: dto.stripePriceId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}

export class SubscriptionMapper {
  static fromDocument(doc: SubscriptionDocument): SubscriptionDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      planId: doc.planId || undefined,
      status: doc.status,
      currentPeriodStart: doc.currentPeriodStart || undefined,
      currentPeriodEnd: doc.currentPeriodEnd || undefined,
      trialEnd: doc.trialEnd || undefined,
      cancelAtPeriodEnd: doc.cancelAtPeriodEnd,
      stripeCustomerId: doc.stripeCustomerId || undefined,
      stripeSubscriptionId: doc.stripeSubscriptionId || undefined,
      stripePriceId: doc.stripePriceId || undefined,
      startDate: doc.startDate || undefined,
      endDate: doc.endDate || undefined,
      cancelledAt: doc.cancelledAt || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  static toDTO(domain: SubscriptionDomain): SubscriptionDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      planId: domain.planId,
      status: domain.status,
      currentPeriodStart: domain.currentPeriodStart?.toISOString(),
      currentPeriodEnd: domain.currentPeriodEnd?.toISOString(),
      trialEnd: domain.trialEnd?.toISOString(),
      cancelAtPeriodEnd: domain.cancelAtPeriodEnd,
      stripeCustomerId: domain.stripeCustomerId,
      stripeSubscriptionId: domain.stripeSubscriptionId,
      stripePriceId: domain.stripePriceId,
      startDate: domain.startDate?.toISOString(),
      endDate: domain.endDate?.toISOString(),
      cancelledAt: domain.cancelledAt?.toISOString(),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  static fromDTO(dto: SubscriptionDTO): SubscriptionDomain {
    return {
      id: dto.id,
      userId: dto.userId,
      planId: dto.planId,
      status: dto.status,
      currentPeriodStart: dto.currentPeriodStart
        ? new Date(dto.currentPeriodStart)
        : undefined,
      currentPeriodEnd: dto.currentPeriodEnd
        ? new Date(dto.currentPeriodEnd)
        : undefined,
      trialEnd: dto.trialEnd ? new Date(dto.trialEnd) : undefined,
      cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
      stripeCustomerId: dto.stripeCustomerId,
      stripeSubscriptionId: dto.stripeSubscriptionId,
      stripePriceId: dto.stripePriceId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}

// Complex mappers for entities with relations
export class SubscriptionWithPlanMapper {
  static fromDocumentWithPlan(
    doc: SubscriptionDocument & { plan: SubscriptionPlanDocument | null },
  ): SubscriptionWithPlanDomain {
    return {
      ...SubscriptionMapper.fromDocument(doc),
      plan: doc.plan
        ? SubscriptionPlanMapper.fromDocument(doc.plan)
        : undefined,
    }
  }

  static toDTO(domain: SubscriptionWithPlanDomain): SubscriptionWithPlanDTO {
    return {
      ...SubscriptionMapper.toDTO(domain),
      plan: domain.plan ? SubscriptionPlanMapper.toDTO(domain.plan) : undefined,
    }
  }
}

export class SubscriptionPlanWithSubscriptionsMapper {
  static fromDocumentWithSubscriptions(
    doc: SubscriptionPlanDocument & { subscriptions: SubscriptionDocument[] },
  ): SubscriptionPlanWithSubscriptionsDomain {
    return {
      ...SubscriptionPlanMapper.fromDocument(doc),
      subscriptions: doc.subscriptions.map(SubscriptionMapper.fromDocument),
    }
  }
}
