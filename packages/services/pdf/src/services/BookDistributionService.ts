import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import type { BookDistributionDomain } from '@pika/sdk'
import { ErrorFactory, isUuidV4, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'

import type {
  BusinessDistributionStats,
  IBookDistributionRepository,
  IVoucherBookRepository,
} from '../repositories/index.js'

export interface CreateBookDistributionData {
  bookId: string
  businessId: string
  businessName: string
  locationId?: string
  locationName?: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  deliveryAddress?: string
  quantity: number
  distributionType: string // 'initial', 'reorder', 'replacement'
  notes?: string
  createdById: string
}

export interface UpdateBookDistributionData {
  businessName?: string
  locationName?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  deliveryAddress?: string
  quantity?: number
  status?: string // 'pending', 'shipped', 'delivered', 'cancelled'
  distributionType?: string
  trackingNumber?: string
  shippingCarrier?: string
  shippedAt?: Date
  deliveredAt?: Date
  notes?: string
  updatedById: string
}

export interface BookDistributionSearchParams {
  page?: number
  limit?: number
  bookId?: string
  businessId?: string
  businessName?: string
  status?: string
  distributionType?: string
  locationName?: string
  createdById?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'businessName' | 'quantity'
  sortOrder?: 'asc' | 'desc'
}

// Use PaginatedResult from @pika/types

export interface IBookDistributionService {
  createDistribution(
    data: CreateBookDistributionData,
  ): Promise<BookDistributionDomain>
  getDistributionById(id: string): Promise<BookDistributionDomain>
  getAllDistributions(
    params: BookDistributionSearchParams,
  ): Promise<PaginatedResult<BookDistributionDomain>>
  getDistributionsByVoucherBookId(
    voucherBookId: string,
  ): Promise<BookDistributionDomain[]>
  updateDistribution(
    id: string,
    data: UpdateBookDistributionData,
  ): Promise<BookDistributionDomain>
  deleteDistribution(id: string): Promise<void>
  shipDistribution(
    id: string,
    shippingData: {
      shippedQuantity: number
      trackingNumber?: string
      carrier?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistributionDomain>
  confirmDelivery(
    id: string,
    deliveryData: {
      deliveryConfirmedBy?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistributionDomain>
  getBusinessStats(): Promise<BusinessDistributionStats[]>
}

/**
 * BookDistributionService manages bulk distribution tracking and logistics.
 *
 * Distribution Lifecycle: PENDING → SHIPPED → DELIVERED
 * Features from original Pika implementation:
 * - Business-focused distribution tracking
 * - Multi-location support for business chains
 * - Complete shipping and delivery audit trail
 * - Contact management for delivery coordination
 * - Distribution analytics and reporting
 */
export class BookDistributionService implements IBookDistributionService {
  constructor(
    private readonly distributionRepository: IBookDistributionRepository,
    private readonly voucherBookRepository: IVoucherBookRepository,
    private readonly cache: ICacheService,
  ) {}

  async createDistribution(
    data: CreateBookDistributionData,
  ): Promise<BookDistributionDomain> {
    try {
      logger.info('Creating book distribution', {
        bookId: data.bookId,
        businessName: data.businessName,
        quantity: data.quantity,
      })

      // Validate voucher book exists and is published
      await this.validateVoucherBookForDistribution(data.bookId)

      // Validate business data
      this.validateBusinessData(data)

      // Create distribution with default status
      const distribution = await this.distributionRepository.create({
        ...data,
        createdBy: data.createdById,
      })

      // Invalidate related cache
      await this.invalidateRelatedCache(data.bookId)

      logger.info('Book distribution created successfully', {
        id: distribution.id,
        businessName: data.businessName,
        quantity: data.quantity,
      })

      return distribution
    } catch (error) {
      logger.error('Failed to create book distribution', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:book-distribution',
    keyGenerator: (id) => id,
  })
  async getDistributionById(id: string): Promise<BookDistributionDomain> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid distribution ID format')
      }

      const distribution = await this.distributionRepository.findById(id)

      if (!distribution) {
        throw ErrorFactory.resourceNotFound('BookDistribution', id)
      }

      return distribution
    } catch (error) {
      logger.error('Failed to get distribution by ID', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL / 2,
    prefix: 'service:book-distributions',
    keyGenerator: (params) => JSON.stringify(params),
  })
  async getAllDistributions(
    params: BookDistributionSearchParams,
  ): Promise<PaginatedResult<BookDistributionDomain>> {
    try {
      const result = await this.distributionRepository.findAll(params)

      return result
    } catch (error) {
      logger.error('Failed to get all distributions', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:book-distributions-by-book',
    keyGenerator: (bookId) => bookId,
  })
  async getDistributionsByVoucherBookId(
    bookId: string,
  ): Promise<BookDistributionDomain[]> {
    try {
      if (!isUuidV4(bookId)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const distributions =
        await this.distributionRepository.findByBookId(bookId)

      return distributions
    } catch (error) {
      logger.error('Failed to get distributions by voucher book ID', {
        error,
        bookId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateDistribution(
    id: string,
    data: UpdateBookDistributionData,
  ): Promise<BookDistributionDomain> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid distribution ID format')
      }

      const currentDistribution = await this.getDistributionById(id)

      // Validate status transitions
      if (data.status) {
        this.validateStatusTransition(currentDistribution.status, data.status)
      }

      // Validate shipping data if updating to shipped status
      if (data.status === 'shipped' || data.quantity) {
        this.validateShippingData(data, currentDistribution)
      }

      const updatedDistribution = await this.distributionRepository.update(
        id,
        data,
      )

      // Invalidate cache
      await this.cache.del(`service:book-distribution:${id}`)
      await this.invalidateRelatedCache(currentDistribution.bookId)

      logger.info('Distribution updated', {
        id,
        updatedFields: Object.keys(data),
      })

      return updatedDistribution
    } catch (error) {
      logger.error('Failed to update distribution', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteDistribution(id: string): Promise<void> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid distribution ID format')
      }

      const distribution = await this.getDistributionById(id)

      // Only allow deletion of pending distributions
      if (distribution.status !== 'pending') {
        throw ErrorFactory.badRequest(
          'Only pending distributions can be deleted',
        )
      }

      await this.distributionRepository.delete(id)

      // Invalidate cache
      await this.cache.del(`service:book-distribution:${id}`)
      await this.invalidateRelatedCache(distribution.bookId)

      logger.info('Distribution deleted', { id })
    } catch (error) {
      logger.error('Failed to delete distribution', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async shipDistribution(
    id: string,
    shippingData: {
      shippedQuantity: number
      trackingNumber?: string
      carrier?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistributionDomain> {
    try {
      const distribution = await this.getDistributionById(id)

      // Validate current status allows shipping
      if (distribution.status !== 'pending') {
        throw ErrorFactory.badRequest(
          'Only pending distributions can be shipped',
        )
      }

      // Validate shipped quantity
      if (shippingData.shippedQuantity <= 0) {
        throw ErrorFactory.badRequest('Shipped quantity must be greater than 0')
      }

      if (shippingData.shippedQuantity > distribution.quantity) {
        throw ErrorFactory.badRequest(
          'Shipped quantity cannot exceed requested quantity',
        )
      }

      const updateData: UpdateBookDistributionData = {
        status: 'shipped',
        quantity: shippingData.shippedQuantity,
        trackingNumber: shippingData.trackingNumber,
        shippingCarrier: shippingData.carrier,
        shippedAt: new Date(),
        notes: shippingData.notes || distribution.notes || undefined,
        updatedById: shippingData.updatedById,
      }

      const updatedDistribution = await this.updateDistribution(id, updateData)

      logger.info('Distribution shipped', {
        id,
        shippedQuantity: shippingData.shippedQuantity,
        trackingNumber: shippingData.trackingNumber,
      })

      return updatedDistribution
    } catch (error) {
      logger.error('Failed to ship distribution', { error, id, shippingData })
      throw ErrorFactory.fromError(error)
    }
  }

  async confirmDelivery(
    id: string,
    deliveryData: {
      deliveryConfirmedBy?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistributionDomain> {
    try {
      const distribution = await this.getDistributionById(id)

      // Validate current status allows delivery confirmation
      if (distribution.status !== 'shipped') {
        throw ErrorFactory.badRequest(
          'Only shipped distributions can be marked as delivered',
        )
      }

      const updateData: UpdateBookDistributionData = {
        status: 'delivered',
        deliveredAt: new Date(),
        notes: deliveryData.notes || distribution.notes || undefined,
        updatedById: deliveryData.updatedById,
      }

      const updatedDistribution = await this.updateDistribution(id, updateData)

      logger.info('Distribution delivery confirmed', {
        id,
        deliveryConfirmedBy: deliveryData.deliveryConfirmedBy,
      })

      return updatedDistribution
    } catch (error) {
      logger.error('Failed to confirm delivery', { error, id, deliveryData })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL * 2, // Longer cache for analytics
    prefix: 'service:business-stats',
    keyGenerator: () => 'all',
  })
  async getBusinessStats(): Promise<BusinessDistributionStats[]> {
    try {
      const stats = await this.distributionRepository.getBusinessStats()

      return stats
    } catch (error) {
      logger.error('Failed to get business stats', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Private helper methods
   */

  private async validateVoucherBookForDistribution(
    bookId: string,
  ): Promise<void> {
    if (!isUuidV4(bookId)) {
      throw ErrorFactory.badRequest('Invalid voucher book ID format')
    }

    const voucherBook = await this.voucherBookRepository.findById(bookId)

    if (!voucherBook) {
      throw ErrorFactory.resourceNotFound('VoucherBook', bookId)
    }

    // Only allow distribution for published books
    if (voucherBook.status !== 'published') {
      throw ErrorFactory.badRequest(
        'Only published voucher books can be distributed',
      )
    }
  }

  private validateBusinessData(data: CreateBookDistributionData): void {
    if (!data.businessName?.trim()) {
      throw ErrorFactory.badRequest('Business name is required')
    }

    if (data.quantity <= 0) {
      throw ErrorFactory.badRequest('Quantity must be greater than 0')
    }

    // Validate contact email format if provided
    if (data.contactEmail && !this.isValidEmail(data.contactEmail)) {
      throw ErrorFactory.badRequest('Invalid contact email format')
    }

    // Validate phone format if provided
    if (data.contactPhone && !this.isValidPhone(data.contactPhone)) {
      throw ErrorFactory.badRequest('Invalid contact phone format')
    }
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const allowedTransitions: Record<string, string[]> = {
      pending: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
    }

    const allowed =
      allowedTransitions[currentStatus as keyof typeof allowedTransitions] || []

    if (!allowed.includes(newStatus)) {
      throw ErrorFactory.badRequest(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      )
    }
  }

  private validateShippingData(
    data: UpdateBookDistributionData,
    currentDistribution: BookDistributionDomain,
  ): void {
    if (data.quantity && data.quantity <= 0) {
      throw ErrorFactory.badRequest('Shipped quantity must be greater than 0')
    }

    if (
      data.quantity &&
      currentDistribution.quantity &&
      data.quantity > currentDistribution.quantity
    ) {
      throw ErrorFactory.badRequest(
        'Shipped quantity cannot exceed requested quantity',
      )
    }
  }

  private async invalidateRelatedCache(bookId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`service:book-distributions-by-book:${bookId}`),
      this.cache.del('service:business-stats:all'),
    ])
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/

    return phoneRegex.test(phone)
  }
}
