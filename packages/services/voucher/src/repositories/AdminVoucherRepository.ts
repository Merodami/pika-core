import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { type VoucherDomain, VoucherMapper } from '@pika/sdk'
import { ErrorFactory, logger, toPrismaInclude } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes, VoucherState } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

import type {
  CreateVoucherData,
  UpdateVoucherData,
  VoucherSearchParams,
} from '../types/index.js'

export interface IAdminVoucherRepository {
  // Admin-specific CRUD operations
  create(data: CreateVoucherData): Promise<VoucherDomain>
  update(id: string, data: UpdateVoucherData): Promise<VoucherDomain>
  updateState(id: string, state: VoucherState): Promise<VoucherDomain>
  delete(id: string): Promise<void>
  findById(id: string): Promise<VoucherDomain | null>
  // Admin search with extended filters
  findAll(params: VoucherSearchParams): Promise<PaginatedResult<VoucherDomain>>
  findByBusinessId(
    businessId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  // Bulk operations for admin
  bulkUpdateState(
    ids: string[],
    state: VoucherState,
  ): Promise<{ success: number; failed: number }>
  bulkDelete(ids: string[]): Promise<{ success: number; failed: number }>
  // Analytics and reporting
  getVoucherStats(voucherId: string): Promise<{
    totalScans: number
    uniqueScans: number
    totalClaims: number
    totalRedemptions: number
    conversionRate: number
  }>
}

/**
 * Admin-specific voucher repository for management operations
 * Handles CRUD, bulk operations, and analytics
 */
export class AdminVoucherRepository implements IAdminVoucherRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(data: CreateVoucherData): Promise<VoucherDomain> {
    try {
      const voucher = await this.prisma.voucher.create({
        data: {
          businessId: data.businessId,
          categoryId: data.categoryId,
          titleKey: data.titleKey,
          descriptionKey: data.descriptionKey,
          termsAndConditionsKey: data.termsAndConditionsKey,
          type: data.type as 'percentage' | 'fixed',
          value: data.value,
          discount: data.discount,
          currency: data.currency,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          maxRedemptions: data.maxRedemptions,
          maxRedemptionsPerUser: data.maxRedemptionsPerUser,
          metadata: data.metadata,
          imageUrl: data.imageUrl,
          qrCode: data.qrCode,
          state: data.state,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to create voucher', { error, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Voucher with this QR code already exists',
            'QR code must be unique',
          )
        }

        throw ErrorFactory.databaseError(
          'create',
          'Failed to create voucher',
          error,
        )
      }

      throw error
    }
  }

  async update(id: string, data: UpdateVoucherData): Promise<VoucherDomain> {
    try {
      const updateData: any = {
        updatedAt: new Date(),
      }

      // Only include fields that are actually defined and valid for Prisma
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
      if (data.titleKey !== undefined) updateData.titleKey = data.titleKey
      if (data.descriptionKey !== undefined)
        updateData.descriptionKey = data.descriptionKey
      if (data.termsAndConditionsKey !== undefined)
        updateData.termsAndConditionsKey = data.termsAndConditionsKey
      if (data.type !== undefined) updateData.type = data.type
      if (data.value !== undefined) updateData.value = data.value
      if (data.discount !== undefined) updateData.discount = data.discount
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
      if (data.maxRedemptions !== undefined)
        updateData.maxRedemptions = data.maxRedemptions
      if (data.maxRedemptionsPerUser !== undefined)
        updateData.maxRedemptionsPerUser = data.maxRedemptionsPerUser
      if (data.metadata !== undefined) updateData.metadata = data.metadata
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.state !== undefined) updateData.state = data.state

      const voucher = await this.prisma.voucher.update({
        where: { id },
        data: updateData,
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
      logger.error('Failed to update voucher', { error, id, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Voucher', id)
        }

        throw ErrorFactory.databaseError(
          'update',
          'Failed to update voucher',
          error,
        )
      }

      throw error
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

  async delete(id: string): Promise<void> {
    try {
      // Soft delete
      await this.prisma.voucher.update({
        where: { id },
        data: {
          deletedAt: new Date(),
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
      logger.error('Failed to delete voucher', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Voucher', id)
        }
      }

      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete voucher',
        error,
      )
    }
  }

  async findById(id: string): Promise<VoucherDomain | null> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
        include: {
          business: true,
          category: true,
          codes: true,
        },
      })

      if (!voucher) {
        return null
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to find voucher by id', { error, id })
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to retrieve voucher',
        error,
      )
    }
  }

  async findAll(
    params: VoucherSearchParams = {},
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const {
        businessId,
        categoryId,
        state,
        search,
        includeDeleted = false,
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      // Build where clause for admin (includes deleted if requested)
      const where: Prisma.VoucherWhereInput = {
        ...(businessId && { businessId }),
        ...(categoryId && { categoryId }),
        ...(state && {
          state: Array.isArray(state) ? { in: state } : state,
        }),
        ...(search && {
          OR: [
            { titleKey: { contains: search, mode: 'insensitive' } },
            { descriptionKey: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(!includeDeleted && { deletedAt: null }),
      }

      const orderBy = this.buildOrderBy(sortBy, sortOrder)
      const include = this.buildInclude(parsedIncludes)

      // Execute queries
      const [total, vouchers] = await Promise.all([
        this.prisma.voucher.count({ where }),
        this.prisma.voucher.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include,
        }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: vouchers.map((voucher) => VoucherMapper.fromDocument(voucher)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find all admin vouchers', { error, params })
      throw ErrorFactory.databaseError(
        'findAllAdmin',
        'Failed to retrieve admin vouchers',
        error,
      )
    }
  }

  async findByBusinessId(
    businessId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Merge businessId into params and delegate to findAll
      const searchParams: VoucherSearchParams = {
        ...params,
        businessId,
      }

      return await this.findAll(searchParams)
    } catch (error) {
      logger.error('Failed to find vouchers by business ID', {
        error,
        businessId,
        params,
      })
      throw ErrorFactory.databaseError(
        'findByBusinessId',
        'Failed to retrieve vouchers by business ID',
        error,
      )
    }
  }

  async bulkUpdateState(
    ids: string[],
    state: VoucherState,
  ): Promise<{ success: number; failed: number }> {
    try {
      const result = await this.prisma.voucher.updateMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        data: {
          state: state,
          updatedAt: new Date(),
        },
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del('vouchers:*')
      }

      return {
        success: result.count,
        failed: ids.length - result.count,
      }
    } catch (error) {
      logger.error('Failed to bulk update voucher states', {
        error,
        ids,
        state,
      })
      throw ErrorFactory.databaseError(
        'bulkUpdateState',
        'Failed to bulk update voucher states',
        error,
      )
    }
  }

  async bulkDelete(
    ids: string[],
  ): Promise<{ success: number; failed: number }> {
    try {
      // Soft delete
      const result = await this.prisma.voucher.updateMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del('vouchers:*')
      }

      return {
        success: result.count,
        failed: ids.length - result.count,
      }
    } catch (error) {
      logger.error('Failed to bulk delete vouchers', { error, ids })
      throw ErrorFactory.databaseError(
        'bulkDelete',
        'Failed to bulk delete vouchers',
        error,
      )
    }
  }

  async getVoucherStats(voucherId: string): Promise<{
    totalScans: number
    uniqueScans: number
    totalClaims: number
    totalRedemptions: number
    conversionRate: number
  }> {
    try {
      // Get scan statistics
      const [totalScans, uniqueScans] = await Promise.all([
        this.prisma.voucherScan.count({
          where: { voucherId },
        }),
        this.prisma.voucherScan.findMany({
          where: { voucherId },
          distinct: ['userId'],
          select: { userId: true },
        }),
      ])

      // Get claim and redemption statistics
      const [totalClaims, totalRedemptions] = await Promise.all([
        this.prisma.customerVoucher.count({
          where: { voucherId },
        }),
        this.prisma.customerVoucher.count({
          where: {
            voucherId,
            status: 'redeemed',
          },
        }),
      ])

      // Calculate conversion rate (redemptions / claims)
      const conversionRate =
        totalClaims > 0 ? (totalRedemptions / totalClaims) * 100 : 0

      return {
        totalScans,
        uniqueScans: uniqueScans.filter((s) => s.userId).length,
        totalClaims,
        totalRedemptions,
        conversionRate: Math.round(conversionRate * 100) / 100,
      }
    } catch (error) {
      logger.error('Failed to get voucher stats', { error, voucherId })
      throw ErrorFactory.databaseError(
        'getVoucherStats',
        'Failed to retrieve voucher statistics',
        error,
      )
    }
  }

  // Helper methods
  private buildOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ): Prisma.VoucherOrderByWithRelationInput {
    // Validate sortBy to prevent object injection
    switch (sortBy) {
      case 'createdAt':
        return { createdAt: sortOrder }
      case 'updatedAt':
        return { updatedAt: sortOrder }
      case 'expiresAt':
        return { validUntil: sortOrder }
      case 'discountValue':
        return { discount: sortOrder }
      case 'currentRedemptions':
        return { redemptionsCount: sortOrder }
      case 'state':
        return { state: sortOrder }
      case 'businessId':
        return { businessId: sortOrder }
      default:
        return { createdAt: sortOrder }
    }
  }

  private buildInclude(
    parsedIncludes?: ParsedIncludes,
  ): Prisma.VoucherInclude | undefined {
    return parsedIncludes && Object.keys(parsedIncludes).length > 0
      ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherInclude)
      : undefined
  }
}
