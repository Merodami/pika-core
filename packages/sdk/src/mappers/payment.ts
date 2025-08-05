import type { UserDocument } from './UserMapper.js'

/**
 * Interface representing a database Credits document
 * Uses camelCase for fields as they come from Prisma
 */
export interface CreditsDocument {
  id: string
  amountDemand: number
  amountSub: number
  userId: string
  createdAt: Date
  updatedAt: Date
  // Relations
  user?: UserDocument
  history?: CreditsHistoryDocument[]
}

/**
 * Interface representing a database CreditsHistory document
 */
export interface CreditsHistoryDocument {
  id: string
  userId: string
  creditsId: string
  amount: number
  description: string
  operation: string
  type: string
  transactionId: string | null
  date: Date
  // Relations
  user?: UserDocument
  credits?: CreditsDocument
}

/**
 * Interface representing a database CreditsPack document
 */
export interface CreditsPackDocument {
  id: string
  type: string
  amount: number
  frequency: number
  price: number
  active: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date | null
}

/**
 * Interface representing a database Membership document
 */
export interface MembershipDocument {
  id: string
  userId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  active: boolean
  subscriptionStatus: string
  planType: string
  subscriptionStartDate: Date | null
  subscriptionEndDate: Date | null
  lastPaymentDate: Date | null
  createdAt: Date
  updatedAt: Date
  // Relations
  user?: UserDocument
}

/**
 * Interface representing a database PromoCode document
 */
export interface PromoCodeDocument {
  id: string
  code: string
  discount: number
  active: boolean
  allowedTimes: number
  amountAvailable: number
  expirationDate: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  cancelledAt: Date | null
  // Relations
  usages?: PromoCodeUsageDocument[]
}

/**
 * Interface representing a database PromoCodeUsage document
 */
export interface PromoCodeUsageDocument {
  id: string
  promoCodeId: string
  userId: string
  transactionId: string | null
  usedAt: Date
  // Relations
  promoCode?: PromoCodeDocument
  user?: UserDocument
}

import {
  type CreditsDomain,
  type CreditsHistoryDomain,
  type CreditsPackDomain,
  type CreditsWithHistoryDomain,
  type MembershipDomain,
  type PromoCodeDomain,
  type PromoCodeUsageDomain,
  type PromoCodeWithUsagesDomain,
} from '../domain/payment.js'
import {
  type CreditsDTO,
  type CreditsHistoryDTO,
  type CreditsPackDTO,
  type CreditsWithHistoryDTO,
  type MembershipDTO,
  type PromoCodeDTO,
  type PromoCodeUsageDTO,
  type PromoCodeWithUsagesDTO,
} from '../dto/payment.dto.js'

export class CreditsMapper {
  static fromDocument(doc: CreditsDocument): CreditsDomain {
    return {
      id: doc.id,
      amountDemand: doc.amountDemand,
      amountSub: doc.amountSub,
      userId: doc.userId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  static toDTO(domain: CreditsDomain): CreditsDTO {
    return {
      id: domain.id,
      amountDemand: domain.amountDemand,
      amountSub: domain.amountSub,
      userId: domain.userId,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  static fromDTO(dto: CreditsDTO): CreditsDomain {
    return {
      id: dto.id,
      amountDemand: dto.amountDemand,
      amountSub: dto.amountSub,
      userId: dto.userId,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}

export class CreditsHistoryMapper {
  static fromDocument(doc: CreditsHistoryDocument): CreditsHistoryDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      creditsId: doc.creditsId,
      amount: doc.amount,
      description: doc.description,
      operation: doc.operation as 'increase' | 'decrease',
      type: doc.type as 'demand' | 'subscription',
      transactionId: doc.transactionId || undefined,
      date: doc.date,
    }
  }

  static toDTO(domain: CreditsHistoryDomain): CreditsHistoryDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      creditsId: domain.creditsId,
      amount: domain.amount,
      description: domain.description,
      operation: domain.operation,
      type: domain.type,
      transactionId: domain.transactionId,
      date: domain.date.toISOString(),
    }
  }

  static fromDTO(dto: CreditsHistoryDTO): CreditsHistoryDomain {
    return {
      id: dto.id,
      userId: dto.userId,
      creditsId: dto.creditsId,
      amount: dto.amount,
      description: dto.description,
      operation: dto.operation,
      type: dto.type,
      transactionId: dto.transactionId,
      date: new Date(dto.date),
    }
  }
}

export class CreditsPackMapper {
  static fromDocument(doc: CreditsPackDocument): CreditsPackDomain {
    return {
      id: doc.id,
      type: doc.type,
      amount: doc.amount,
      frequency: doc.frequency,
      price: doc.price,
      active: doc.active,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || undefined,
    }
  }

  static toDTO(domain: CreditsPackDomain): CreditsPackDTO {
    return {
      id: domain.id,
      type: domain.type,
      amount: domain.amount,
      frequency: domain.frequency,
      price: domain.price,
      active: domain.active,
      createdBy: domain.createdBy,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
    }
  }

  static fromDTO(dto: CreditsPackDTO): CreditsPackDomain {
    return {
      id: dto.id,
      type: dto.type,
      amount: dto.amount,
      frequency: dto.frequency,
      price: dto.price,
      active: dto.active,
      createdBy: dto.createdBy,
      createdAt: new Date(dto.createdAt),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    }
  }
}

export class PromoCodeMapper {
  static fromDocument(doc: PromoCodeDocument): PromoCodeDomain {
    return {
      id: doc.id,
      code: doc.code,
      discount: doc.discount,
      active: doc.active,
      allowedTimes: doc.allowedTimes,
      amountAvailable: doc.amountAvailable,
      expirationDate: doc.expirationDate,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      cancelledAt: doc.cancelledAt || undefined,
    }
  }

  static toDTO(domain: PromoCodeDomain): PromoCodeDTO {
    return {
      id: domain.id,
      code: domain.code,
      discount: domain.discount,
      active: domain.active,
      allowedTimes: domain.allowedTimes,
      amountAvailable: domain.amountAvailable,
      expirationDate: domain.expirationDate.toISOString(),
      createdBy: domain.createdBy,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      cancelledAt: domain.cancelledAt?.toISOString(),
    }
  }

  static fromDTO(dto: PromoCodeDTO): PromoCodeDomain {
    return {
      id: dto.id,
      code: dto.code,
      discount: dto.discount,
      active: dto.active,
      allowedTimes: dto.allowedTimes,
      amountAvailable: dto.amountAvailable,
      expirationDate: new Date(dto.expirationDate),
      createdBy: dto.createdBy,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : undefined,
    }
  }
}

export class PromoCodeUsageMapper {
  static fromDocument(doc: PromoCodeUsageDocument): PromoCodeUsageDomain {
    return {
      id: doc.id,
      promoCodeId: doc.promoCodeId,
      userId: doc.userId,
      transactionId: doc.transactionId || undefined,
      usedAt: doc.usedAt,
    }
  }

  static toDTO(domain: PromoCodeUsageDomain): PromoCodeUsageDTO {
    return {
      id: domain.id,
      promoCodeId: domain.promoCodeId,
      userId: domain.userId,
      transactionId: domain.transactionId,
      usedAt: domain.usedAt.toISOString(),
    }
  }

  static fromDTO(dto: PromoCodeUsageDTO): PromoCodeUsageDomain {
    return {
      id: dto.id,
      promoCodeId: dto.promoCodeId,
      userId: dto.userId,
      transactionId: dto.transactionId,
      usedAt: new Date(dto.usedAt),
    }
  }
}

// Complex mappers for entities with relations
export class CreditsWithHistoryMapper {
  static fromDocumentWithHistory(
    doc: CreditsDocument & { history: CreditsHistoryDocument[] },
  ): CreditsWithHistoryDomain {
    return {
      ...CreditsMapper.fromDocument(doc),
      history: doc.history.map(CreditsHistoryMapper.fromDocument),
    }
  }

  static toDTO(domain: CreditsWithHistoryDomain): CreditsWithHistoryDTO {
    return {
      ...CreditsMapper.toDTO(domain),
      history: domain.history.map(CreditsHistoryMapper.toDTO),
    }
  }
}

export class PromoCodeWithUsagesMapper {
  static fromDocumentWithUsages(
    doc: PromoCodeDocument & { usages: PromoCodeUsageDocument[] },
  ): PromoCodeWithUsagesDomain {
    return {
      ...PromoCodeMapper.fromDocument(doc),
      usages: doc.usages.map(PromoCodeUsageMapper.fromDocument),
    }
  }

  static toDTO(domain: PromoCodeWithUsagesDomain): PromoCodeWithUsagesDTO {
    return {
      ...PromoCodeMapper.toDTO(domain),
      usages: domain.usages.map(PromoCodeUsageMapper.toDTO),
    }
  }
}

export class MembershipMapper {
  static fromDocument(doc: MembershipDocument): MembershipDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      stripeCustomerId: doc.stripeCustomerId || undefined,
      stripeSubscriptionId: doc.stripeSubscriptionId || undefined,
      active: doc.active,
      subscriptionStatus: doc.subscriptionStatus,
      planType: doc.planType,
      lastPaymentDate: doc.lastPaymentDate || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  static toDTO(domain: MembershipDomain): MembershipDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      stripeCustomerId: domain.stripeCustomerId,
      stripeSubscriptionId: domain.stripeSubscriptionId,
      active: domain.active,
      subscriptionStatus: domain.subscriptionStatus,
      planType: domain.planType,
      lastPaymentDate: domain.lastPaymentDate?.toISOString(),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  static fromDTO(dto: MembershipDTO): MembershipDomain {
    return {
      id: dto.id,
      userId: dto.userId,
      stripeCustomerId: dto.stripeCustomerId,
      stripeSubscriptionId: dto.stripeSubscriptionId,
      active: dto.active,
      subscriptionStatus: dto.subscriptionStatus,
      planType: dto.planType,
      lastPaymentDate: dto.lastPaymentDate
        ? new Date(dto.lastPaymentDate)
        : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}
