export interface CreditsDomain {
  id: string
  amountDemand: number
  amountSub: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreditsHistoryDomain {
  id: string
  userId: string
  creditsId: string
  amount: number
  description: string
  operation: 'increase' | 'decrease'
  type: 'demand' | 'subscription'
  transactionId?: string
  date: Date
}

export interface CreditsPackDomain {
  id: string
  type: string
  amount: number
  frequency: number
  price: number
  active: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface PromoCodeDomain {
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
  cancelledAt?: Date
}

export interface PromoCodeUsageDomain {
  id: string
  promoCodeId: string
  userId: string
  transactionId?: string
  usedAt: Date
}

// Extended interfaces with relations
export interface CreditsWithHistoryDomain extends CreditsDomain {
  history: CreditsHistoryDomain[]
}

export interface PromoCodeWithUsagesDomain extends PromoCodeDomain {
  usages: PromoCodeUsageDomain[]
}

// Membership Domain
export interface MembershipDomain {
  id: string
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  active: boolean
  subscriptionStatus: string
  planType: string
  lastPaymentDate?: Date
  createdAt: Date
  updatedAt: Date
}
