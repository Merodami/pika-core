import { VOUCHER_API_URL } from '@pika/environment'
import { VoucherDomain } from '@pika/sdk'
import { BaseServiceClient, logger } from '@pika/shared'
import type { ServiceContext } from '@pika/types'

export class VoucherServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = VOUCHER_API_URL) {
    super({
      serviceUrl,
      serviceName: 'VoucherServiceClient',
    })
  }

  /**
   * Get vouchers by IDs for PDF generation
   * Returns a Map for easy lookup by ID
   */
  async getVouchersByIds(
    voucherIds: string[],
    context?: ServiceContext,
  ): Promise<Map<string, any>> {
    try {
      // Call the internal endpoint with proper payload
      const response = await this.post<{ vouchers: any[] }>(
        '/internal/vouchers/by-ids',
        {
          voucherIds,
          include: ['business', 'category'],
        },
        { ...context, useServiceAuth: true },
      )

      // Convert array response to Map
      const voucherMap = new Map<string, any>()

      if (response.vouchers) {
        for (const voucher of response.vouchers) {
          voucherMap.set(voucher.id, voucher)
        }
      }

      logger.info('Fetched vouchers batch', {
        requested: voucherIds.length,
        received: voucherMap.size,
      })

      return voucherMap
    } catch (error) {
      logger.error('Failed to fetch vouchers batch', {
        voucherIds,
        error,
      })
      throw error
    }
  }

  /**
   * Get a single voucher by ID
   */
  async getVoucherById(
    voucherId: string,
    context?: ServiceContext,
  ): Promise<VoucherDomain | null> {
    try {
      return await this.get<VoucherDomain>(`/vouchers/${voucherId}`, {
        ...context,
        useServiceAuth: true,
      })
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get vouchers by provider ID
   */
  async getVouchersByProviderId(
    providerId: string,
    context?: ServiceContext,
  ): Promise<VoucherDomain[]> {
    try {
      const response = await this.get<{ data: VoucherDomain[] }>(
        `/vouchers/providers/${providerId}`,
        { ...context, useServiceAuth: true },
      )

      return response.data
    } catch (error) {
      logger.error('Failed to fetch vouchers by provider', {
        providerId,
        error,
      })
      throw error
    }
  }

  /**
   * Get vouchers for book generation with security tokens
   */
  async getVouchersForBook(
    businessIds: string[],
    month: string,
    year: number,
    context?: ServiceContext,
  ): Promise<{
    vouchers: Array<{
      id: string
      businessId: string
      title: Record<string, string>
      description: Record<string, string>
      terms: Record<string, string>
      discountType: string
      discountValue: number
      validFrom?: string
      validTo?: string
      businessName: string
      businessLogo?: string
      category: string
      qrPayload: string
      shortCode: string
    }>
    count: number
  }> {
    try {
      const response = await this.post<{
        vouchers: Array<{
          id: string
          businessId: string
          title: Record<string, string>
          description: Record<string, string>
          terms: Record<string, string>
          discountType: string
          discountValue: number
          validFrom?: string
          validTo?: string
          businessName: string
          businessLogo?: string
          category: string
          qrPayload: string
          shortCode: string
        }>
        count: number
      }>(
        '/internal/vouchers/for-book',
        { businessIds, month, year },
        { ...context, useServiceAuth: true },
      )

      logger.info('Fetched vouchers for book', {
        businessCount: businessIds.length,
        voucherCount: response.count,
        month,
        year,
      })

      return response
    } catch (error) {
      logger.error('Failed to fetch vouchers for book', {
        businessIds,
        month,
        year,
        error,
      })
      throw error
    }
  }

  /**
   * Validate voucher book state transition
   */
  async validateBookStateTransition(
    currentStatus: string,
    newStatus: string,
    context?: ServiceContext,
  ): Promise<{
    allowed: boolean
    reason?: string
    requiredFields?: string[]
  }> {
    try {
      const response = await this.post<{
        allowed: boolean
        reason?: string
        requiredFields?: string[]
      }>(
        '/internal/vouchers/book/validate-transition',
        { currentStatus, newStatus },
        { ...context, useServiceAuth: true },
      )

      logger.info('Validated book state transition', {
        currentStatus,
        newStatus,
        allowed: response.allowed,
      })

      return response
    } catch (error) {
      logger.error('Failed to validate book state transition', {
        currentStatus,
        newStatus,
        error,
      })
      throw error
    }
  }
}
