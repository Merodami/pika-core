import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import type {
  UserVoucherData,
  VoucherClaimResult,
  VoucherRedeemResult,
  VoucherScanData,
  VoucherScanResult,
} from '@pika/sdk'
import { type VoucherDomain } from '@pika/sdk'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  ErrorFactory,
  isUuidV4,
  logger,
  UserServiceClient,
  VoucherBusinessRules,
} from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import {
  type LanguageCode,
  type PaginatedResult,
  VoucherScanSource,
  VoucherScanType,
  VoucherState,
} from '@pika/types'
import { v4 as uuid } from 'uuid'

import type { IVoucherRepository } from '../repositories/VoucherRepository.js'
import type {
  UserVoucherSearchParams,
  VoucherClaimData,
  VoucherRedeemData,
  VoucherSearchParams,
} from '../types/index.js'
import type { IInternalVoucherService } from './InternalVoucherService.js'

export interface IVoucherService {
  getAllVouchers(
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>>
  getVoucherById(
    id: string,
    parsedIncludes?: any,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  getVouchersByBusinessId(
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>>
  getVouchersByUserId(
    userId: string,
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>>
  getUserVouchers(
    params: UserVoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<UserVoucherData>>
  getVouchersByIds(
    ids: string[],
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>>
  claimVoucher(
    voucherId: string,
    userId: string,
    data?: VoucherClaimData,
    language?: LanguageCode,
  ): Promise<VoucherClaimResult>
  redeemVoucher(
    voucherId: string,
    data: VoucherRedeemData,
    language?: LanguageCode,
  ): Promise<VoucherRedeemResult>
  scanVoucher(
    voucherId: string,
    data: VoucherScanData,
    language?: LanguageCode,
  ): Promise<VoucherScanResult>
  // Code-based voucher lookup methods (critical for QR scanning)
  getVoucherByQRCode(
    qrCode: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  getVoucherByShortCode(
    shortCode: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  getVoucherByStaticCode(
    staticCode: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  getVoucherByAnyCode(
    code: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
}

export class VoucherService implements IVoucherService {
  constructor(
    private readonly repository: IVoucherRepository,
    private readonly cache: ICacheService,
    private readonly translationClient: TranslationClient,
    private readonly translationResolver: TranslationResolver,
    private readonly internalVoucherService: IInternalVoucherService, // Now required
    private readonly communicationClient?: CommunicationServiceClient,
    private readonly userServiceClient?: UserServiceClient,
    private readonly businessServiceClient?: BusinessServiceClient,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:vouchers',
    keyGenerator: (params) => JSON.stringify(params),
  })
  async getAllVouchers(
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const result = await this.repository.findAll(params)

      // Resolve translations if language is provided - one line!
      if (language) {
        const resolvedData = await this.translationResolver.resolveArray(
          result.data,
          language,
        )

        return { data: resolvedData, pagination: result.pagination }
      }

      return result
    } catch (error) {
      logger.error('Failed to get all vouchers', { error, params, language })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:voucher',
    keyGenerator: (id, parsedIncludes) =>
      `${id}:${JSON.stringify(parsedIncludes || {})}`,
  })
  async getVoucherById(
    id: string,
    parsedIncludes?: any,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      // Validate UUID format
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid voucher ID format')
      }

      const voucher = await this.repository.findById(id, parsedIncludes)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Resolve translations if language is provided - one line!
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by id', { error, id, language })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:vouchers:business',
    keyGenerator: (params) => {
      const searchParams = params as unknown as VoucherSearchParams

      return `${searchParams.businessId}:${JSON.stringify(searchParams)}`
    },
  })
  async getVouchersByBusinessId(
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Validate UUID format
      if (!params.businessId) {
        throw ErrorFactory.badRequest('Business ID is required')
      }

      if (!isUuidV4(params.businessId)) {
        throw ErrorFactory.badRequest('Invalid business ID format')
      }

      const result = await this.repository.findByBusinessId(
        params.businessId,
        params,
      )

      // Resolve translations if language is provided - one line!
      if (language) {
        const resolvedData = await this.translationResolver.resolveArray(
          result.data,
          language,
        )

        return { data: resolvedData, pagination: result.pagination }
      }

      return result
    } catch (error) {
      logger.error('Failed to get vouchers by business id', {
        error,
        params,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:vouchers:user',
    keyGenerator: (userId, params) => `${userId}:${JSON.stringify(params)}`,
  })
  async getVouchersByUserId(
    userId: string,
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Validate UUID format
      if (!isUuidV4(userId)) {
        throw ErrorFactory.badRequest('Invalid user ID format')
      }

      const result = await this.repository.findByUserId(userId, params)

      // Resolve translations if language is provided - one line!
      if (language) {
        const resolvedData = await this.translationResolver.resolveArray(
          result.data,
          language,
        )

        return { data: resolvedData, pagination: result.pagination }
      }

      return result
    } catch (error) {
      logger.error('Failed to get vouchers by user id', {
        error,
        userId,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserVouchers(
    params: UserVoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<UserVoucherData>> {
    try {
      // Validate UUID format
      if (!isUuidV4(params.userId)) {
        throw ErrorFactory.badRequest('Invalid user ID format')
      }

      // Convert status filter to array if provided
      const statusFilter =
        params.status && params.status !== 'all'
          ? [params.status as VoucherState]
          : undefined

      const searchParams: VoucherSearchParams = {
        userId: params.userId,
        state: statusFilter,
        page: params.page || 1,
        limit: params.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: params.sortBy || 'claimedAt',
        sortOrder: params.sortOrder || 'desc',
      }

      const result = await this.repository.findByUserId(
        params.userId,
        searchParams,
      )

      // Resolve translations if language is provided
      let resolvedVouchers = result.data

      if (language) {
        resolvedVouchers = await this.translationResolver.resolveArray(
          result.data,
          language,
        )
      }

      // Convert VoucherDomain results to UserVoucherData
      const userVoucherData: UserVoucherData[] = resolvedVouchers.map(
        (voucher) => ({
          voucher,
          claimedAt: voucher.createdAt, // This should come from userVoucher table in repository
          status: voucher.state as string,
          redeemedAt: undefined, // This should come from userVoucher table in repository
        }),
      )

      return {
        data: userVoucherData,
        pagination: result.pagination,
      }
    } catch (error) {
      logger.error('Failed to get user vouchers', { error, params, language })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByIds(
    ids: string[],
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Validate all IDs are UUID format
      const invalidIds = ids.filter((id) => !isUuidV4(id))

      if (invalidIds.length > 0) {
        throw ErrorFactory.badRequest(
          `Invalid voucher ID format: ${invalidIds.join(', ')}`,
        )
      }

      // Service passes through repository result (Repository Pagination Pattern)
      const result = await this.repository.findByIds(ids)

      // Resolve translations if language is provided
      if (language) {
        const translatedData = await this.translationResolver.resolveArray(
          result.data,
          language,
        )

        return {
          data: translatedData,
          pagination: result.pagination, // Pass through pagination
        }
      }

      return result // No modification needed
    } catch (error) {
      logger.error('Failed to get vouchers by ids', { error, ids, language })
      throw ErrorFactory.fromError(error)
    }
  }

  async claimVoucher(
    voucherId: string,
    userId: string,
    data?: VoucherClaimData,
    language?: LanguageCode,
  ): Promise<VoucherClaimResult> {
    try {
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Validate voucher can be claimed using shared business rules
      VoucherBusinessRules.validateCanClaim(voucher)

      // Check if user already claimed this voucher using customer voucher table
      const existingClaim = await this.repository.findCustomerVoucher(
        userId,
        voucherId,
      )

      if (existingClaim) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher already claimed',
          'User has already claimed this voucher',
        )
      }

      // Create customer voucher association (proper tracking)
      const customerVoucher = await this.repository.claimVoucher(
        voucherId,
        userId,
      )

      // Invalidate cache
      await this.invalidateCache(voucherId)

      // Resolve translations if language is provided
      let resolvedVoucher = customerVoucher.voucher || voucher

      if (language) {
        resolvedVoucher = await this.translationResolver.resolve(
          resolvedVoucher,
          language,
        )
      }

      // Create claim result using customer voucher data
      const claimResult: VoucherClaimResult = {
        claimId: customerVoucher.id,
        voucher: resolvedVoucher,
        claimedAt: customerVoucher.claimedAt,
        expiresAt: customerVoucher.expiresAt,
        walletPosition: 1, // This could be calculated based on user's voucher count
      }

      return claimResult
    } catch (error) {
      logger.error('Failed to claim voucher', {
        error,
        voucherId,
        userId,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async redeemVoucher(
    voucherId: string,
    data: VoucherRedeemData,
    language?: LanguageCode,
  ): Promise<VoucherRedeemResult> {
    try {
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      const { userId } = data

      if (!userId) {
        throw ErrorFactory.badRequest('User ID is required for redemption')
      }

      // Check if user has claimed this voucher using customer voucher table
      const customerVoucher = await this.repository.findCustomerVoucher(
        userId,
        voucherId,
      )

      if (!customerVoucher) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher not claimed',
          'User must claim voucher before redeeming',
        )
      }

      if (customerVoucher.status === 'redeemed') {
        throw ErrorFactory.businessRuleViolation(
          'Voucher already redeemed',
          'This voucher has already been redeemed',
        )
      }

      // Check max redemptions
      if (
        voucher.maxRedemptions &&
        voucher.currentRedemptions >= voucher.maxRedemptions
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Maximum redemptions reached',
          'This voucher has reached its redemption limit',
        )
      }

      // Redeem the voucher in customer voucher table
      const redeemedCustomerVoucher = await this.repository.redeemVoucher(
        voucherId,
        userId,
      )

      // Invalidate cache
      await this.invalidateCache(voucherId)

      // Resolve translations if language is provided
      let resolvedVoucher = redeemedCustomerVoucher.voucher || voucher

      if (language) {
        resolvedVoucher = await this.translationResolver.resolve(
          resolvedVoucher,
          language,
        )
      }

      // Create redemption result using customer voucher data
      const redeemResult: VoucherRedeemResult = {
        message: 'Voucher redeemed successfully',
        voucherId,
        redeemedAt: redeemedCustomerVoucher.redeemedAt || new Date(),
        discountApplied: voucher.discountValue || 0,
        voucher: resolvedVoucher,
      }

      return redeemResult
    } catch (error) {
      logger.error('Failed to redeem voucher', {
        error,
        voucherId,
        data,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async scanVoucher(
    voucherId: string,
    data: VoucherScanData,
    language?: LanguageCode,
  ): Promise<VoucherScanResult> {
    try {
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Verify business owns this voucher (if businessId provided)
      if (data.businessId && voucher.businessId !== data.businessId) {
        throw ErrorFactory.unauthorized('Business does not own this voucher')
      }

      let alreadyClaimed = false
      let canClaim = true

      // If userId provided, check if they have claimed it using customer voucher table
      if (data.userId) {
        const customerVoucher = await this.repository.findCustomerVoucher(
          data.userId,
          voucherId,
        )

        alreadyClaimed = !!customerVoucher

        // Check if voucher can still be claimed
        if (!alreadyClaimed) {
          canClaim =
            voucher.state === VoucherState.published &&
            (!voucher.expiresAt || voucher.expiresAt > new Date()) &&
            (!voucher.maxRedemptions ||
              voucher.currentRedemptions < voucher.maxRedemptions)
        }
      }

      // TODO: Implement nearby locations logic based on data.location
      const nearbyLocations = data.location ? [] : undefined

      // Resolve translations if language is provided
      let resolvedVoucher = voucher

      if (language) {
        resolvedVoucher = await this.translationResolver.resolve(
          voucher,
          language,
        )
      }

      // Create scan result
      const scanResult: VoucherScanResult = {
        voucher: resolvedVoucher,
        scanId: uuid(),
        canClaim,
        alreadyClaimed,
        nearbyLocations,
      }

      // Track scan analytics in database
      const scanData: VoucherScanData = {
        voucherId,
        userId: data.userId || null,
        scanType: data.businessId
          ? VoucherScanType.business
          : VoucherScanType.customer,
        scanSource: data.scanSource || VoucherScanSource.camera,
        deviceInfo: data.deviceInfo || null,
        location: data.location || null,
        businessId: data.businessId || null,
        userAgent: data.userAgent || null,
        metadata: {
          ipAddress: undefined, // Would come from request in controller
          ...data.metadata,
        },
      }

      // Track scan using internal service
      await this.internalVoucherService.trackScan({
        ...scanData,
        id: scanResult.scanId,
      })

      logger.info('Voucher scanned and tracked', {
        voucherId,
        userId: data.userId,
        businessId: data.businessId,
        source: data.scanSource,
        scanId: scanResult.scanId,
      })

      return scanResult
    } catch (error) {
      logger.error('Failed to scan voucher', {
        error,
        voucherId,
        data,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherByQRCode(
    qrCode: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByQRCode(qrCode)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', `QR code: ${qrCode}`)
      }

      // Resolve translations if language is provided - one line!
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by QR code', {
        error,
        qrCode,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherByShortCode(
    shortCode: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByShortCode(shortCode)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound(
          'Voucher',
          `Short code: ${shortCode}`,
        )
      }

      // Resolve translations if language is provided - one line!
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by short code', {
        error,
        shortCode,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherByStaticCode(
    staticCode: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByStaticCode(staticCode)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound(
          'Voucher',
          `Static code: ${staticCode}`,
        )
      }

      // Resolve translations if language is provided - one line!
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by static code', {
        error,
        staticCode,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:voucher:code',
    keyGenerator: (code) => code,
  })
  async getVoucherByAnyCode(
    code: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByAnyCode(code)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', `Code: ${code}`)
      }

      // Resolve translations if language is provided - one line!
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by any code', {
        error,
        code,
        language,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Validates voucher state transitions based on legacy voucher-old business rules
   * Allowed transitions from UpdateVoucherStateCommandHandler:
   * - DRAFT → PUBLISHED
   * - PUBLISHED → CLAIMED, EXPIRED
   * - CLAIMED → REDEEMED, EXPIRED
   * - REDEEMED → EXPIRED
   * - EXPIRED → (none)
   */

  private async invalidateCache(voucherId?: string): Promise<void> {
    try {
      // Invalidate specific voucher cache if ID provided
      if (voucherId) {
        await this.cache.del(`service:voucher:${voucherId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:vouchers:*')
      await this.cache.delPattern?.('vouchers:*')
      await this.cache.delPattern?.('voucher:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }
}
