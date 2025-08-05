import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import {
  type CustomerVoucherDocument,
  type CustomerVoucherDomain,
  type VoucherDomain,
  VoucherMapper,
} from '@pika/sdk'
import { ErrorFactory, logger, toPrismaInclude } from '@pika/shared'
import type { ParsedIncludes } from '@pika/types'
import type { PaginatedResult, VoucherState } from '@pika/types'
import { CustomerVoucherStatus, VoucherCodeType } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

import type { VoucherSearchParams } from '../types/index.js'

export interface IVoucherRepository {
  findAll(params: VoucherSearchParams): Promise<PaginatedResult<VoucherDomain>>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherDomain | null>
  findByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>>
  findByBusinessId(
    businessId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  findByUserId(
    userId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  findUserVoucher(
    userId: string,
    voucherId: string,
  ): Promise<VoucherDomain | null>
  claimVoucher(
    voucherId: string,
    userId: string,
  ): Promise<CustomerVoucherDomain>
  redeemVoucher(
    voucherId: string,
    userId: string,
  ): Promise<CustomerVoucherDomain>
  findCustomerVoucher(
    userId: string,
    voucherId: string,
  ): Promise<CustomerVoucherDomain | null>
  getCustomerVouchers(
    userId: string,
    status?: string,
  ): Promise<PaginatedResult<CustomerVoucherDomain>>
  // Code-based voucher lookup methods (critical for QR scanning)
  findByQRCode(qrCode: string): Promise<VoucherDomain | null>
  findByShortCode(shortCode: string): Promise<VoucherDomain | null>
  findByStaticCode(staticCode: string): Promise<VoucherDomain | null>
  findByAnyCode(code: string): Promise<VoucherDomain | null>
}

export class VoucherRepository implements IVoucherRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(
    params: VoucherSearchParams = {},
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const {
        businessId,
        type,
        state,
        search,
        minValue,
        maxValue,
        minDiscount,
        maxDiscount,
        validFrom,
        validUntil,
        maxRedemptions,
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const where: any = {
        deletedAt: null,
      }

      // General search across multiple fields
      if (search) {
        where.OR = [
          { titleKey: { contains: search, mode: 'insensitive' } },
          { qrCode: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (businessId) {
        where.businessId = businessId
      }

      if (type) {
        where.type = type
      }

      if (state) {
        if (Array.isArray(state)) {
          where.state = { in: state }
        } else {
          where.state = state
        }
      }

      // Value filters
      if (minValue !== undefined || maxValue !== undefined) {
        where.value = {}
        if (minValue !== undefined) where.value.gte = minValue
        if (maxValue !== undefined) where.value.lte = maxValue
      }

      // Discount filters
      if (minDiscount !== undefined || maxDiscount !== undefined) {
        where.discount = {}
        if (minDiscount !== undefined) where.discount.gte = minDiscount
        if (maxDiscount !== undefined) where.discount.lte = maxDiscount
      }

      // Date filters
      if (validFrom) {
        where.validFrom = { lte: validFrom }
      }

      if (validUntil) {
        where.validUntil = { gte: validUntil }
      }

      if (maxRedemptions !== undefined) {
        where.maxRedemptions = { gte: maxRedemptions }
      }

      const orderBy = this.buildOrderBy(sortBy, sortOrder)
      const include = this.buildInclude(parsedIncludes)

      const [items, total] = await Promise.all([
        this.prisma.voucher.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include,
        }),
        this.prisma.voucher.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: items.map((item) => VoucherMapper.fromDocument(item)),
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find all vouchers', { error, params })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findAll',
          'Failed to retrieve vouchers',
          error,
        )
      }

      throw error
    }
  }

  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherDomain | null> {
    try {
      const include = this.buildInclude(parsedIncludes)

      const voucher = await this.prisma.voucher.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include,
      })

      return voucher ? VoucherMapper.fromDocument(voucher) : null
    } catch (error) {
      logger.error('Failed to find voucher by id', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findById',
          'Failed to retrieve voucher',
          error,
        )
      }

      throw error
    }
  }

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

      const include = this.buildInclude(parsedIncludes)

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

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findByIds',
          'Failed to retrieve vouchers',
          error,
        )
      }

      throw error
    }
  }

  async findByBusinessId(
    businessId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    return this.findAll({ ...params, businessId })
  }

  async findByUserId(
    userId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const {
        state,
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'claimedAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const where: any = {
        customerId: userId,
        voucher: {
          deletedAt: null,
        },
      }

      if (state) {
        if (Array.isArray(state)) {
          where.state = { in: state }
        } else {
          where.state = state
        }
      }

      const include = {
        voucher: {
          include: this.buildInclude(parsedIncludes),
        },
      }

      const [items, total] = await Promise.all([
        this.prisma.customerVoucher.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * limit,
          take: limit,
          include,
        }),
        this.prisma.customerVoucher.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: items.map((item) => {
          const voucher = VoucherMapper.fromDocument(item.voucher)

          // Add user-specific state based on customer voucher status
          voucher.state =
            item.status === CustomerVoucherStatus.claimed
              ? ('claimed' as VoucherState)
              : item.status === CustomerVoucherStatus.redeemed
                ? ('redeemed' as VoucherState)
                : voucher.state

          return voucher
        }),
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find vouchers by user id', { error, userId })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findByUserId',
          'Failed to retrieve user vouchers',
          error,
        )
      }

      throw error
    }
  }

  async findUserVoucher(
    userId: string,
    voucherId: string,
  ): Promise<VoucherDomain | null> {
    try {
      const customerVoucher = await this.prisma.customerVoucher.findUnique({
        where: {
          customerId_voucherId: {
            customerId: userId,
            voucherId,
          },
        },
        include: {
          voucher: true,
        },
      })

      if (!customerVoucher) {
        return null
      }

      const voucher = VoucherMapper.fromDocument(customerVoucher.voucher)

      // Add user-specific state based on customer voucher status
      voucher.state =
        customerVoucher.status === CustomerVoucherStatus.claimed
          ? ('claimed' as VoucherState)
          : customerVoucher.status === CustomerVoucherStatus.redeemed
            ? ('redeemed' as VoucherState)
            : voucher.state

      return voucher
    } catch (error) {
      logger.error('Failed to find user voucher', {
        error,
        customerId: userId,
        voucherId,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findUserVoucher',
          'Failed to retrieve user voucher',
          error,
        )
      }

      throw error
    }
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    // Handle nested sorting for related fields
    if (sortBy.includes('.')) {
      const [relation, field] = sortBy.split('.')

      return {
        [relation]: {
          [field]: sortOrder,
        },
      }
    }

    return {
      [sortBy]: sortOrder,
    }
  }

  private buildInclude(
    parsedIncludes?: ParsedIncludes,
  ): Prisma.VoucherInclude | undefined {
    return parsedIncludes && Object.keys(parsedIncludes).length > 0
      ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherInclude)
      : undefined
  }

  async findByQRCode(qrCode: string): Promise<VoucherDomain | null> {
    try {
      const voucher = await this.prisma.voucher.findFirst({
        where: {
          qrCode,
          deletedAt: null,
        },
        include: this.buildInclude(),
      })

      if (!voucher) {
        return null
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to find voucher by QR code', { error, qrCode })
      throw ErrorFactory.fromError(error)
    }
  }

  async findByShortCode(shortCode: string): Promise<VoucherDomain | null> {
    try {
      const voucher = await this.prisma.voucher.findFirst({
        where: {
          OR: [
            { qrCode: shortCode }, // QR code field also stores short codes
            {
              codes: {
                some: {
                  code: shortCode,
                  type: VoucherCodeType.short,
                  isActive: true,
                },
              },
            },
          ],
          deletedAt: null,
        },
        include: this.buildInclude(),
      })

      if (!voucher) {
        return null
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to find voucher by short code', { error, shortCode })
      throw ErrorFactory.fromError(error)
    }
  }

  async findByStaticCode(staticCode: string): Promise<VoucherDomain | null> {
    try {
      const voucher = await this.prisma.voucher.findFirst({
        where: {
          codes: {
            some: {
              code: staticCode,
              type: VoucherCodeType.static,
              isActive: true,
            },
          },
          deletedAt: null,
        },
        include: this.buildInclude(),
      })

      if (!voucher) {
        return null
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to find voucher by static code', {
        error,
        staticCode,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async findByAnyCode(code: string): Promise<VoucherDomain | null> {
    try {
      // Try all code types in order of likelihood
      // 1. QR code (most common for scanning)
      let voucher = await this.findByQRCode(code)

      if (voucher) return voucher

      // 2. Short code (human-readable codes)
      voucher = await this.findByShortCode(code)
      if (voucher) return voucher

      // 3. Static code (campaign codes)
      voucher = await this.findByStaticCode(code)
      if (voucher) return voucher

      return null
    } catch (error) {
      logger.error('Failed to find voucher by any code', { error, code })
      throw ErrorFactory.fromError(error)
    }
  }

  async claimVoucher(
    voucherId: string,
    userId: string,
  ): Promise<CustomerVoucherDomain> {
    try {
      // Create customer voucher relationship
      const customerVoucher = await this.prisma.customerVoucher.create({
        data: {
          customerId: userId,
          voucherId,
          status: CustomerVoucherStatus.claimed,
          claimedAt: new Date(),
        },
        include: {
          voucher: true,
        },
      })

      return VoucherMapper.mapCustomerVoucherFromDocument(
        this.convertPrismaCustomerVoucherToDocument(customerVoucher),
      )
    } catch (error) {
      logger.error('Failed to claim voucher', { error, voucherId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async redeemVoucher(
    voucherId: string,
    userId: string,
  ): Promise<CustomerVoucherDomain> {
    try {
      // Update customer voucher to redeemed status
      const customerVoucher = await this.prisma.customerVoucher.update({
        where: {
          customerId_voucherId: {
            customerId: userId,
            voucherId,
          },
        },
        data: {
          status: CustomerVoucherStatus.redeemed,
          redeemedAt: new Date(),
        },
        include: {
          voucher: true,
        },
      })

      // Increment the voucher's redemption count
      await this.incrementRedemptions(voucherId)

      return VoucherMapper.mapCustomerVoucherFromDocument(
        this.convertPrismaCustomerVoucherToDocument(customerVoucher),
      )
    } catch (error) {
      logger.error('Failed to redeem voucher', { error, voucherId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async findCustomerVoucher(
    userId: string,
    voucherId: string,
  ): Promise<CustomerVoucherDomain | null> {
    try {
      const customerVoucher = await this.prisma.customerVoucher.findUnique({
        where: {
          customerId_voucherId: {
            customerId: userId,
            voucherId,
          },
        },
        include: {
          voucher: true,
        },
      })

      if (!customerVoucher) {
        return null
      }

      return VoucherMapper.mapCustomerVoucherFromDocument(
        this.convertPrismaCustomerVoucherToDocument(customerVoucher),
      )
    } catch (error) {
      logger.error('Failed to find customer voucher', {
        error,
        customerId: userId,
        voucherId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getCustomerVouchers(
    userId: string,
    status?: string,
  ): Promise<PaginatedResult<CustomerVoucherDomain>> {
    try {
      const whereClause: any = { customerId: userId }

      if (status && status !== 'all') {
        whereClause.status = status
      }

      const customerVouchers = await this.prisma.customerVoucher.findMany({
        where: whereClause,
        include: {
          voucher: true,
        },
        orderBy: {
          claimedAt: 'desc',
        },
      })

      // Repository builds pagination metadata for bounded operation
      const customerVoucherDomains = customerVouchers.map((cv) => {
        // Map Prisma result to CustomerVoucherDocument format
        const customerVoucherDoc: CustomerVoucherDocument = {
          id: cv.id,
          userId: cv.customerId, // Map customerId to userId
          voucherId: cv.voucherId,
          status: cv.status,
          claimedAt: cv.claimedAt,
          redeemedAt: cv.redeemedAt,
          expiresAt: cv.voucher?.validUntil || new Date(),
          redemptionCode: null,
          redemptionLocation: null,
          metadata: cv.notificationPreferences,
          createdAt: cv.createdAt,
          updatedAt: cv.updatedAt,
          voucher: cv.voucher as any,
        }

        return VoucherMapper.mapCustomerVoucherFromDocument(customerVoucherDoc)
      })

      return {
        data: customerVoucherDomains,
        pagination: {
          page: 1,
          limit: customerVouchers.length,
          total: customerVouchers.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }
    } catch (error) {
      logger.error('Failed to get customer vouchers', {
        error,
        customerId: userId,
        status,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  private async incrementRedemptions(voucherId: string): Promise<void> {
    try {
      await this.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          redemptionsCount: { increment: 1 },
        },
      })
    } catch (error) {
      logger.error('Failed to increment redemptions', { error, voucherId })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Helper method to convert Prisma CustomerVoucher to CustomerVoucherDocument
   */
  private convertPrismaCustomerVoucherToDocument(
    prismaCustomerVoucher: any,
  ): CustomerVoucherDocument {
    return {
      id: prismaCustomerVoucher.id,
      userId: prismaCustomerVoucher.customerId, // Map customerId to userId
      voucherId: prismaCustomerVoucher.voucherId,
      status: prismaCustomerVoucher.status,
      claimedAt: prismaCustomerVoucher.claimedAt,
      redeemedAt: prismaCustomerVoucher.redeemedAt,
      expiresAt: prismaCustomerVoucher.voucher?.validUntil || new Date(),
      redemptionCode: null,
      redemptionLocation: null,
      metadata: prismaCustomerVoucher.notificationPreferences,
      createdAt: prismaCustomerVoucher.createdAt,
      updatedAt: prismaCustomerVoucher.updatedAt,
      voucher: prismaCustomerVoucher.voucher || undefined,
    }
  }
}
