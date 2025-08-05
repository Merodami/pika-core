import { PAYMENT_API_URL } from '@pika/environment'
import type { ServiceContext } from '@pika/types'

import { BaseServiceClient } from '../BaseServiceClient.js'

// Payment service client types
export interface ProcessInternalPaymentRequest {
  userId: string
  amount: number
  currency: string
  description?: string
}

export interface ProcessInternalPaymentResponse {
  paymentId: string
  success: boolean
  transactionId?: string
}

export interface ProcessInternalRefundRequest {
  paymentId: string
  amount?: number
  reason?: string
}

export interface ProcessInternalRefundResponse {
  refundId: string
  success: boolean
  refundedAmount: number
}

// Temporary interface to avoid circular dependency
export interface CreditsDomain {
  id: string
  amountDemand: number
  amountSub: number
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentProcessCreditsRequest {
  subscriptionId: string
  userId: string
  creditsAmount: number
  description: string
}

export interface PaymentProcessCreditsResponse {
  credits: CreditsDomain
  transactionId: string
}

export interface CreateProductRequest {
  name: string
  description?: string
  metadata?: Record<string, string>
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  active?: boolean
  metadata?: Record<string, string>
}

export interface CreatePriceRequest {
  productId: string
  amount: number
  currency: string
  intervalCount?: number
}

export interface ProductResponse {
  id: string
  name: string
  description?: string
  active: boolean
  metadata: Record<string, string>
}

export interface PriceResponse {
  id: string
  productId: string
  amount: number
  currency: string
  active: boolean
  recurring?: {
    intervalCount: number
  }
}

/**
 * Client for communicating with the Payment service
 * Used by Subscription service for credit operations
 */
export class PaymentServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = PAYMENT_API_URL) {
    super({
      serviceUrl,
      serviceName: 'PaymentServiceClient',
    })
  }

  /**
   * Process subscription credits through payment service
   */
  async processSubscriptionCredits(
    data: PaymentProcessCreditsRequest,
    context?: ServiceContext,
  ): Promise<PaymentProcessCreditsResponse> {
    return this.post<PaymentProcessCreditsResponse>(
      '/credits/subscription',
      data,
      context,
    )
  }

  /**
   * Get user credits
   */
  async getUserCredits(
    userId: string,
    context?: ServiceContext,
  ): Promise<CreditsDomain | null> {
    try {
      return this.get<CreditsDomain>(`/credits/user/${userId}`, {
        context,
        useServiceAuth: true,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(
    userId: string,
    amount: number,
    context?: ServiceContext,
  ): Promise<boolean> {
    const credits = await this.getUserCredits(userId, context)

    if (!credits) return false

    return credits.amountDemand + credits.amountSub >= amount
  }

  /**
   * Create a product in Stripe via payment service
   */
  async createProduct(
    data: CreateProductRequest,
    context?: ServiceContext,
  ): Promise<ProductResponse> {
    return this.post<ProductResponse>('/products', data, context)
  }

  /**
   * Update a product in Stripe via payment service
   */
  async updateProduct(
    productId: string,
    data: UpdateProductRequest,
    context?: ServiceContext,
  ): Promise<ProductResponse> {
    return this.put<ProductResponse>(`/products/${productId}`, data, context)
  }

  /**
   * Create a price in Stripe via payment service
   */
  async createPrice(
    data: CreatePriceRequest,
    context?: ServiceContext,
  ): Promise<PriceResponse> {
    return this.post<PriceResponse>('/prices', data, context)
  }

  /**
   * Deactivate a price in Stripe via payment service
   */
  async deactivatePrice(
    priceId: string,
    context?: ServiceContext,
  ): Promise<PriceResponse> {
    return this.put<PriceResponse>(`/prices/${priceId}/deactivate`, {}, context)
  }

  /**
   * List products from Stripe via payment service
   */
  async listProducts(
    limit?: number,
    context?: ServiceContext,
  ): Promise<{ data: ProductResponse[] }> {
    const path = limit ? `/products?limit=${limit}` : '/products'

    return this.get<{ data: ProductResponse[] }>(path, {
      context,
      useServiceAuth: true,
    })
  }

  /**
   * List prices from Stripe via payment service
   */
  async listPrices(
    productId?: string,
    limit?: number,
    context?: ServiceContext,
  ): Promise<{ data: PriceResponse[] }> {
    const queryParams = new URLSearchParams()

    if (productId) queryParams.append('productId', productId)
    if (limit) queryParams.append('limit', limit.toString())

    const path = queryParams.toString()
      ? `/prices?${queryParams.toString()}`
      : '/prices'

    return this.get<{ data: PriceResponse[] }>(path, {
      context,
      useServiceAuth: true,
    })
  }

  /**
   * Process internal payment (for session bookings, etc.)
   */
  async processInternalPayment(
    data: ProcessInternalPaymentRequest,
    context?: ServiceContext,
  ): Promise<ProcessInternalPaymentResponse> {
    return this.post<ProcessInternalPaymentResponse>(
      '/internal/payments',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Process internal refund (for cancelled sessions, etc.)
   */
  async processInternalRefund(
    data: ProcessInternalRefundRequest,
    context?: ServiceContext,
  ): Promise<ProcessInternalRefundResponse> {
    return this.post<ProcessInternalRefundResponse>('/internal/refunds', data, {
      ...context,
      useServiceAuth: true,
    })
  }
}
