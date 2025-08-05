// Credits DTOs
export interface CreateCreditsDTO {
  amountDemand?: number
  amountSub?: number
  userId: string
}

export interface UpdateCreditsDTO {
  amountDemand?: number
  amountSub?: number
}

export interface CreditsDTO {
  id: string
  amountDemand: number
  amountSub: number
  userId: string
  createdAt: string
  updatedAt: string
}

// Credits History DTOs
export interface CreateCreditsHistoryDTO {
  userId: string
  creditsId: string
  amount: number
  description: string
  operation: 'increase' | 'decrease'
  type?: 'demand' | 'subscription'
  transactionId?: string
}

export interface CreditsHistoryDTO {
  id: string
  userId: string
  creditsId: string
  amount: number
  description: string
  operation: 'increase' | 'decrease'
  type: 'demand' | 'subscription'
  transactionId?: string
  date: string
}

// Credits Pack DTOs
export interface CreateCreditsPackDTO {
  type: string
  amount: number
  frequency: number
  price: number
  active?: boolean
  createdBy: string
}

export interface UpdateCreditsPackDTO {
  type?: string
  amount?: number
  frequency?: number
  price?: number
  active?: boolean
}

export interface CreditsPackDTO {
  id: string
  type: string
  amount: number
  frequency: number
  price: number
  active: boolean
  createdBy: string
  createdAt: string
  updatedAt?: string
}

// Promo Code DTOs
export interface CreatePromoCodeDTO {
  code: string
  discount: number
  active?: boolean
  allowedTimes: number
  amountAvailable: number
  expirationDate: string
  createdBy: string
}

export interface UpdatePromoCodeDTO {
  code?: string
  discount?: number
  active?: boolean
  allowedTimes?: number
  amountAvailable?: number
  expirationDate?: string
}

export interface PromoCodeDTO {
  id: string
  code: string
  discount: number
  active: boolean
  allowedTimes: number
  amountAvailable: number
  expirationDate: string
  createdBy: string
  createdAt: string
  updatedAt: string
  cancelledAt?: string
}

// Promo Code Usage DTOs
export interface CreatePromoCodeUsageDTO {
  promoCodeId: string
  userId: string
  transactionId?: string
}

export interface PromoCodeUsageDTO {
  id: string
  promoCodeId: string
  userId: string
  transactionId?: string
  usedAt: string
}

// Additional utility DTOs
export interface CreditsWithHistoryDTO extends CreditsDTO {
  history: CreditsHistoryDTO[]
}

export interface PromoCodeWithUsagesDTO extends PromoCodeDTO {
  usages: PromoCodeUsageDTO[]
}

// Membership DTOs
export interface CreateMembershipDTO {
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  active?: boolean
  subscriptionStatus?: string
  planType?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UpdateMembershipDTO {
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  active?: boolean
  subscriptionStatus?: string
  planType?: string
  lastPaymentDate?: Date
  updatedAt?: Date
}

export interface MembershipDTO {
  id: string
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  active: boolean
  subscriptionStatus: string
  planType: string
  lastPaymentDate?: string
  createdAt: string
  updatedAt: string
}
