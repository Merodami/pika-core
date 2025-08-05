import { ICacheService } from '@pika/redis'
import {
  type CustomerVoucherDomain,
  type VoucherDomain,
  VoucherMapper,
  type VoucherScanData,
} from '@pika/sdk'
import { ErrorFactory, logger, toPrismaInclude } from '@pika/shared'
import type {
  CustomerVoucherStatus,
  PaginatedResult,
  ParsedIncludes,
  VoucherState,
} from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

import type { InternalVoucherSearchParams } from '../types/index.js'

export interface IInternalVoucherRepository {
  // Batch operations for service-to-service
  findByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>>
  // State management for internal services
  updateState(id: string, state: VoucherState): Promise<VoucherDomain>
  // Increment redemptions for internal tracking
  incrementRedemptions(id: string): Promise<void>
  // Scan tracking for analytics
  trackScan(data: VoucherScanData & { id: string }): Promise<void>
  incrementScanCount(voucherId: string): Promise<void>
  // Validation helpers
  exists(id: string): Promise<boolean>
  validateBatch(ids: string[]): Promise<{ valid: string[]; invalid: string[] }>
  // User voucher operations
  getUserVouchers(
    userId: string,
    status?: string,
  ): Promise<CustomerVoucherDomain[]>
  // Business and category queries
  findByBusinessId(
    businessId: string,
    params: InternalVoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  findByCategoryId(
    categoryId: string,
    params: InternalVoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
}

/**
 * Internal voucher repository for service-to-service operations
 * Handles batch operations, tracking, and internal state management
 */
export class InternalVoucherRepository implements IInternalVoucherRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      if (ids.length === 0) {
        // Repository builds pagination metadata for empty result
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        }
      }

      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherInclude)
          : {
              business: true,
              category: true,
              codes: true,
            }

      const vouchers = await this.prisma.voucher.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        include,
      })

      // Repository builds pagination metadata for bounded operation
      const voucherDomains = vouchers.map((voucher) =>
        VoucherMapper.fromDocument(voucher),
      )

      return {
        data: voucherDomains,
        pagination: {
          page: 1,
          limit: ids.length,
          total: vouchers.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }
    } catch (error) {
      logger.error('Failed to find vouchers by ids', { error, ids })

      throw ErrorFactory.databaseError(
        'findByIds',
        'Failed to retrieve vouchers by ids',
        error,
      )
    }
  }

  async updateState(id: string, state: VoucherState): Promise<VoucherDomain> {
    try {
      const voucher = await this.prisma.voucher.update({
        where: { id },
        data: {
          state: state,
          updatedAt: new Date(),
        },
        include: {
          business: true,
          category: true,
          codes: true,
        },
      })

      // Clear cache
      if (this.cache) {
        await Promise.all([
          this.cache.del(`voucher:${id}`),
          this.cache.del('vouchers:*'),
        ])
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to update voucher state', { error, id, state })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Voucher', id)
        }
      }

      throw ErrorFactory.databaseError(
        'updateState',
        'Failed to update voucher state',
        error,
      )
    }
  }

  async incrementRedemptions(id: string): Promise<void> {
    try {
      await this.prisma.voucher.update({
        where: { id },
        data: {
          redemptionsCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      })

      // Clear cache
      if (this.cache) {
        await Promise.all([
          this.cache.del(`voucher:${id}`),
          this.cache.del('vouchers:*'),
        ])
      }
    } catch (error) {
      logger.error('Failed to increment redemptions', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Voucher', id)
        }
      }

      throw ErrorFactory.databaseError(
        'incrementRedemptions',
        'Failed to increment voucher redemptions',
        error,
      )
    }
  }

  async trackScan(data: VoucherScanData & { id: string }): Promise<void> {
    try {
      await this.prisma.voucherScan.create({
        data: {
          id: data.id,
          voucherId: data.voucherId,
          userId: data.userId,
          scanType: data.scanType,
          scanSource: data.scanSource,
          businessId: data.businessId,
          deviceInfo: data.deviceInfo
            ? JSON.stringify(data.deviceInfo)
            : undefined,
          metadata:
            data.metadata || data.userAgent
              ? JSON.stringify({
                  ...data.metadata,
                  userAgent: data.userAgent,
                })
              : undefined,
          scannedAt: new Date(),
        },
      })
    } catch (error) {
      logger.error('Failed to track voucher scan', { error, data })

      throw ErrorFactory.databaseError(
        'trackScan',
        'Failed to track voucher scan',
        error,
      )
    }
  }

  async incrementScanCount(voucherId: string): Promise<void> {
    try {
      // This can be used for quick scan count updates without detailed tracking
      await this.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          scanCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del(`voucher:${voucherId}`)
      }
    } catch (error) {
      logger.error('Failed to increment scan count', { error, voucherId })

      // Don't throw error for scan count increment - it's not critical
      // Just log the error
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.voucher.count({
        where: {
          id,
          deletedAt: null,
        },
      })

      return count > 0
    } catch (error) {
      logger.error('Failed to check voucher existence', { error, id })

      return false
    }
  }

  async validateBatch(ids: string[]): Promise<{
    valid: string[]
    invalid: string[]
  }> {
    try {
      const existingVouchers = await this.prisma.voucher.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        select: { id: true },
      })

      const validIds = existingVouchers.map((v) => v.id)
      const invalidIds = ids.filter((id) => !validIds.includes(id))

      return {
        valid: validIds,
        invalid: invalidIds,
      }
    } catch (error) {
      logger.error('Failed to validate batch of voucher ids', { error, ids })

      throw ErrorFactory.databaseError(
        'validateBatch',
        'Failed to validate voucher ids',
        error,
      )
    }
  }

  async getUserVouchers(
    userId: string,
    status?: string,
  ): Promise<CustomerVoucherDomain[]> {
    try {
      const whereClause: any = { userId }

      if (status && status !== 'all') {
        whereClause.status = status
      }

      const customerVouchers = await this.prisma.customerVoucher.findMany({
        where: whereClause,
        include: {
          voucher: {
            include: {
              business: true,
              category: true,
              codes: true,
            },
          },
        },
        orderBy: { claimedAt: 'desc' },
      })

      return customerVouchers.map((cv) => ({
        id: cv.id,
        userId: cv.customerId,
        voucherId: cv.voucherId,
        voucher: VoucherMapper.fromDocument(cv.voucher),
        claimedAt: cv.claimedAt,
        redeemedAt: cv.redeemedAt,
        status: cv.status as CustomerVoucherStatus,
        expiresAt: cv.voucher.validUntil || new Date(),
        metadata: null,
        redemptionCode: null,
        redemptionLocation: null,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
      }))
    } catch (error) {
      logger.error('Failed to get user vouchers', { error, userId, status })
      throw ErrorFactory.databaseError(
        'getUserVouchers',
        'Failed to retrieve user vouchers',
        error,
      )
    }
  }

  async findByBusinessId(
    businessId: string,
    params: InternalVoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const where: Prisma.VoucherWhereInput = {
        businessId,
        deletedAt: params.includeDeleted ? undefined : null,
      }

      // Apply state filter
      if (params.state) {
        where.state = Array.isArray(params.state)
          ? { in: params.state }
          : params.state
      }

      // Apply expiry filter
      if (!params.includeExpired) {
        where.OR = [{ validUntil: null }, { validUntil: { gte: new Date() } }]
      }

      const [vouchers, total] = await Promise.all([
        this.prisma.voucher.findMany({
          where,
          include: {
            business: true,
            category: true,
            codes: true,
          },
          skip: ((params.page || 1) - 1) * (params.limit || 20),
          take: params.limit || 20,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.voucher.count({ where }),
      ])

      return {
        data: vouchers.map((voucher) => VoucherMapper.fromDocument(voucher)),
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total,
          totalPages: Math.ceil(total / (params.limit || 20)),
          hasNext:
            ((params.page || 1) - 1) * (params.limit || 20) + vouchers.length <
            total,
          hasPrev: (params.page || 1) > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find vouchers by business', {
        error,
        businessId,
        params,
      })
      throw ErrorFactory.databaseError(
        'findByBusinessId',
        'Failed to retrieve vouchers by business',
        error,
      )
    }
  }

  async findByCategoryId(
    categoryId: string,
    params: InternalVoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const where: Prisma.VoucherWhereInput = {
        categoryId,
        deletedAt: params.includeDeleted ? undefined : null,
      }

      // Apply state filter
      if (params.state) {
        where.state = Array.isArray(params.state)
          ? { in: params.state }
          : params.state
      }

      // Apply expiry filter
      if (!params.includeExpired) {
        where.OR = [{ validUntil: null }, { validUntil: { gte: new Date() } }]
      }

      const [vouchers, total] = await Promise.all([
        this.prisma.voucher.findMany({
          where,
          include: {
            business: true,
            category: true,
            codes: true,
          },
          skip: ((params.page || 1) - 1) * (params.limit || 20),
          take: params.limit || 20,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.voucher.count({ where }),
      ])

      return {
        data: vouchers.map((voucher) => VoucherMapper.fromDocument(voucher)),
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total,
          totalPages: Math.ceil(total / (params.limit || 20)),
          hasNext:
            ((params.page || 1) - 1) * (params.limit || 20) + vouchers.length <
            total,
          hasPrev: (params.page || 1) > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find vouchers by category', {
        error,
        categoryId,
        params,
      })
      throw ErrorFactory.databaseError(
        'findByCategoryId',
        'Failed to retrieve vouchers by category',
        error,
      )
    }
  }
}
