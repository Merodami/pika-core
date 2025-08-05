import { ECDSAService, type JWTConfig, VoucherQRService } from '@pika/crypto'
import { JWT_ISSUER, PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import type { UserVoucherData, VoucherDomain, VoucherScanData } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes, VoucherState } from '@pika/types'
import { VoucherScanSource, VoucherScanType } from '@pika/types'
import { get } from 'lodash-es'

import type { IInternalVoucherRepository } from '../repositories/InternalVoucherRepository.js'
import type { IVoucherRepository } from '../repositories/VoucherRepository.js'
import type {
  BatchProcessOperation,
  BatchProcessResult,
  BatchTokenGenerationRequest,
  GenerateTokenOptions,
  InternalVoucherSearchParams,
  RedemptionTrackingData,
  RedemptionTrackingResult,
  UserVoucherSearchParams,
  VoucherBookStateTransition,
  VoucherBookStatus,
  VoucherBookValidation,
  VoucherExistsOptions,
  VoucherExistsResult,
  VoucherForBook,
  VoucherSearchParams,
  VoucherTokenData,
  VoucherValidationOptions,
  VoucherValidationResult,
} from '../types/index.js'
import {
  generateBatchCode,
  generateSecureShortCode,
} from '../utils/codeGenerator.js'

// Re-export types that are part of the service's public API
export type {
  BatchProcessOperation,
  BatchProcessResult,
  RedemptionTrackingData,
  RedemptionTrackingResult,
  VoucherExistsOptions,
  VoucherExistsResult,
  VoucherValidationOptions,
  VoucherValidationResult,
} from '../types/index.js'

export interface IInternalVoucherService {
  // Voucher retrieval operations
  getVoucherById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherDomain>
  getVouchersByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>>
  getUserVouchers(
    params: UserVoucherSearchParams,
  ): Promise<PaginatedResult<UserVoucherData>>

  // Validation operations
  validateVoucher(
    voucherId: string,
    options: VoucherValidationOptions,
  ): Promise<VoucherValidationResult>

  // Existence checks
  checkVoucherExists(
    options: VoucherExistsOptions,
  ): Promise<VoucherExistsResult>

  // State updates for internal use
  updateVoucherStateInternal(
    voucherId: string,
    state: VoucherState,
    reason?: string,
  ): Promise<VoucherDomain>

  // Scan tracking
  trackScan(data: VoucherScanData & { id: string }): Promise<void>

  // Redemption tracking
  trackRedemption(
    data: RedemptionTrackingData,
  ): Promise<RedemptionTrackingResult>

  // Batch operations
  batchProcessVouchers(
    operation: BatchProcessOperation,
  ): Promise<BatchProcessResult>

  // Internal queries
  getVouchersByBusinessInternal(
    businessId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>>

  getVouchersByCategoryInternal(
    categoryId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>>

  // Cleanup operations
  cleanupExpiredVouchers(): Promise<number>
  cleanupOrphanedCustomerVouchers(): Promise<number>

  // Voucher Security operations
  generateVoucherTokens(
    options: GenerateTokenOptions,
  ): Promise<VoucherTokenData>
  generateBatchVoucherTokens(
    request: BatchTokenGenerationRequest,
  ): Promise<Map<string, VoucherTokenData>>

  // Voucher Book operations
  getVouchersForBook(
    businessIds: string[],
    month: string,
    year: number,
  ): Promise<VoucherForBook[]>
  validateBookStateTransition(
    currentStatus: VoucherBookStatus,
    newStatus: VoucherBookStatus,
  ): VoucherBookStateTransition
  validateBookReadyForPublication(
    book: VoucherBookValidation,
  ): VoucherBookStateTransition
}

export class InternalVoucherService implements IInternalVoucherService {
  private voucherQRService: VoucherQRService
  private ecdsaService: ECDSAService
  private keyPair: { privateKey: string; publicKey: string } | null = null

  // Allowed state transitions for voucher books
  private readonly allowedBookTransitions: Record<
    VoucherBookStatus,
    VoucherBookStatus[]
  > = {
    draft: ['ready_for_print', 'archived'],
    ready_for_print: ['published', 'draft', 'archived'],
    published: ['archived'],
    archived: [],
  }

  constructor(
    private readonly internalRepository: IInternalVoucherRepository,
    private readonly publicRepository: IVoucherRepository, // For methods that need full repository access
    private readonly cache: ICacheService,
  ) {
    if (!JWT_ISSUER) {
      throw new Error(
        'JWT_ISSUER environment variable is required for voucher security',
      )
    }

    const jwtConfig: JWTConfig = {
      algorithm: 'ES256',
      issuer: JWT_ISSUER,
      audience: 'pika-vouchers',
      keyId: 'voucher-security-key',
    }

    this.voucherQRService = new VoucherQRService(jwtConfig)
    this.ecdsaService = new ECDSAService({ curve: 'P-256' })
  }

  async getVoucherById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherDomain> {
    try {
      const result = await this.internalRepository.findByIds(
        [id],
        parsedIncludes,
      )

      if (result.data.length === 0) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      return result.data[0]
    } catch (error) {
      logger.error('Failed to get voucher by id', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Service passes through repository result (Repository Pagination Pattern)
      const result = await this.internalRepository.findByIds(
        ids,
        parsedIncludes,
      )

      return result // No modification needed
    } catch (error) {
      logger.error('Failed to get vouchers by ids', { error, ids })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserVouchers(
    params: UserVoucherSearchParams,
  ): Promise<PaginatedResult<UserVoucherData>> {
    try {
      // Get customer vouchers from repository
      const customerVouchers = await this.internalRepository.getUserVouchers(
        params.userId,
        params.status,
      )

      // Apply pagination
      const startIndex =
        ((params.page || 1) - 1) * (params.limit || PAGINATION_DEFAULT_LIMIT)
      const endIndex = startIndex + (params.limit || PAGINATION_DEFAULT_LIMIT)
      const paginatedData = customerVouchers.slice(startIndex, endIndex)

      // Convert CustomerVoucherDomain to UserVoucherData
      const userVoucherData: UserVoucherData[] = paginatedData.map((cv) => ({
        voucher: cv.voucher!,
        claimedAt: cv.claimedAt,
        status: cv.status,
        redeemedAt: cv.redeemedAt || undefined,
      }))

      return {
        data: userVoucherData,
        pagination: {
          page: params.page || 1,
          limit: params.limit || PAGINATION_DEFAULT_LIMIT,
          total: customerVouchers.length,
          totalPages: Math.ceil(
            customerVouchers.length /
              (params.limit || PAGINATION_DEFAULT_LIMIT),
          ),
          hasNext: endIndex < customerVouchers.length,
          hasPrev: (params.page || 1) > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to get user vouchers', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  async validateVoucher(
    voucherId: string,
    options: VoucherValidationOptions,
  ): Promise<VoucherValidationResult> {
    try {
      // Use publicRepository for findById as it's not in internal repository
      const voucher = await this.publicRepository.findById(voucherId)

      if (!voucher) {
        return {
          isValid: false,
          reason: 'Voucher not found',
        }
      }

      // Check state if requested
      if (options.checkState) {
        if (voucher.state !== 'published') {
          return {
            isValid: false,
            reason: `Voucher is ${voucher.state}`,
            voucher,
          }
        }
      }

      // Check expiry if requested
      if (options.checkExpiry) {
        const now = new Date()

        if (voucher.validFrom && voucher.validFrom > now) {
          return {
            isValid: false,
            reason: 'Voucher not yet valid',
            voucher,
          }
        }

        if (voucher.expiresAt && voucher.expiresAt < now) {
          return {
            isValid: false,
            reason: 'Voucher has expired',
            voucher,
          }
        }
      }

      // Check redemption limit if requested
      if (options.checkRedemptionLimit) {
        if (
          voucher.maxRedemptions &&
          voucher.currentRedemptions >= voucher.maxRedemptions
        ) {
          return {
            isValid: false,
            reason: 'Maximum redemptions reached',
            voucher,
          }
        }

        // Check user-specific redemption limit if userId provided
        if (options.userId && voucher.maxRedemptionsPerUser) {
          // Use publicRepository for findCustomerVoucher
          const customerVoucher =
            await this.publicRepository.findCustomerVoucher(
              options.userId,
              voucherId,
            )

          if (
            customerVoucher &&
            customerVoucher.redemptionCode &&
            voucher.maxRedemptionsPerUser === 1
          ) {
            return {
              isValid: false,
              reason: 'User redemption limit reached',
              voucher,
            }
          }
        }
      }

      return {
        isValid: true,
        voucher,
      }
    } catch (error) {
      logger.error('Failed to validate voucher', { error, voucherId, options })
      throw ErrorFactory.fromError(error)
    }
  }

  async checkVoucherExists(
    options: VoucherExistsOptions,
  ): Promise<VoucherExistsResult> {
    try {
      let voucher: VoucherDomain | null = null

      if (options.voucherId) {
        // Use publicRepository for findById
        voucher = await this.publicRepository.findById(options.voucherId)
      } else if (options.code) {
        // Use publicRepository for findByAnyCode
        voucher = await this.publicRepository.findByAnyCode(options.code)
      }

      return {
        exists: !!voucher,
        voucherId: voucher?.id,
      }
    } catch (error) {
      logger.error('Failed to check voucher existence', { error, options })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucherStateInternal(
    voucherId: string,
    state: VoucherState,
    reason?: string,
  ): Promise<VoucherDomain> {
    try {
      // Use internalRepository for updateState
      const updatedVoucher = await this.internalRepository.updateState(
        voucherId,
        state,
      )

      // Invalidate cache
      await this.invalidateCache(voucherId)

      logger.info('Internal voucher state updated', {
        voucherId,
        previousState: state, // We don't have the previous state here
        newState: state,
        reason,
      })

      return updatedVoucher
    } catch (error) {
      logger.error('Failed to update voucher state internally', {
        error,
        voucherId,
        state,
        reason,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async trackScan(data: VoucherScanData & { id: string }): Promise<void> {
    try {
      // Track the scan
      await this.internalRepository.trackScan(data)

      // Increment scan count
      await this.internalRepository.incrementScanCount(data.voucherId)

      logger.info('Voucher scan tracked', {
        scanId: data.id,
        voucherId: data.voucherId,
        scanType: data.scanType,
        scanSource: data.scanSource,
      })
    } catch (error) {
      logger.error('Failed to track voucher scan', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async trackRedemption(
    data: RedemptionTrackingData,
  ): Promise<RedemptionTrackingResult> {
    try {
      const { voucherId, userId, code: _code, metadata } = data

      // Check if voucher exists using internal repository
      const exists = await this.internalRepository.exists(voucherId)

      if (!exists) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Increment redemption count
      await this.internalRepository.incrementRedemptions(voucherId)

      // Track the redemption scan
      const scanId = `red-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await this.internalRepository.trackScan({
        id: scanId,
        voucherId,
        userId,
        scanType: VoucherScanType.business,
        scanSource: VoucherScanSource.share,
        metadata,
      })

      // Get updated voucher for current redemption count
      const result = await this.internalRepository.findByIds([voucherId])
      const updatedVoucher = result.data[0]

      logger.info('Redemption tracked', {
        redemptionId: scanId,
        voucherId,
        userId,
        currentRedemptions: updatedVoucher?.currentRedemptions || 0,
      })

      return {
        redemptionId: scanId,
        success: true,
        currentRedemptions: updatedVoucher?.currentRedemptions || 0,
        maxRedemptions: updatedVoucher?.maxRedemptions || undefined,
      }
    } catch (error) {
      logger.error('Failed to track redemption', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async batchProcessVouchers(
    operation: BatchProcessOperation,
  ): Promise<BatchProcessResult> {
    const startTime = Date.now()
    const results: Array<{
      voucherId: string
      success: boolean
      error?: string
    }> = []

    let successCount = 0
    let failedCount = 0

    try {
      const { voucherIds, operation: op, context } = operation

      for (const voucherId of voucherIds) {
        try {
          switch (op) {
            case 'expire':
              await this.updateVoucherStateInternal(
                voucherId,
                'expired' as VoucherState,
                context?.reason || 'Batch expiration',
              )
              break

            case 'validate': {
              const validation = await this.validateVoucher(voucherId, {
                checkState: true,
                checkExpiry: true,
                checkRedemptionLimit: true,
              })

              if (!validation.isValid) {
                throw new Error(validation.reason || 'Validation failed')
              }
              break
            }

            case 'activate':
              await this.updateVoucherStateInternal(
                voucherId,
                'published' as VoucherState,
                context?.reason || 'Batch activation',
              )
              break

            default:
              throw new Error(`Unknown operation: ${op}`)
          }

          results.push({ voucherId, success: true })
          successCount++
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          results.push({ voucherId, success: false, error: errorMessage })
          failedCount++

          logger.error('Failed to process voucher in batch', {
            voucherId,
            operation: op,
            error,
          })
        }
      }

      const duration = Date.now() - startTime

      logger.info('Batch voucher processing completed', {
        operation: op,
        totalCount: voucherIds.length,
        successCount,
        failedCount,
        duration,
      })

      return {
        processedCount: voucherIds.length,
        successCount,
        failedCount,
        results,
      }
    } catch (error) {
      logger.error('Failed to batch process vouchers', { error, operation })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByBusinessInternal(
    businessId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const params: InternalVoucherSearchParams = {
        businessId,
        state: filters?.state,
        includeExpired: filters?.includeExpired,
        includeDeleted: filters?.includeDeleted,
        page: filters?.page || 1,
        limit: filters?.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: filters?.sortBy || 'createdAt',
        sortOrder: filters?.sortOrder || 'desc',
      }

      return await this.internalRepository.findByBusinessId(businessId, params)
    } catch (error) {
      logger.error('Failed to get vouchers by business internally', {
        error,
        businessId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByCategoryInternal(
    categoryId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const params: InternalVoucherSearchParams = {
        categoryId,
        state: filters?.state,
        includeExpired: filters?.includeExpired,
        includeDeleted: filters?.includeDeleted,
        page: filters?.page || 1,
        limit: filters?.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: filters?.sortBy || 'createdAt',
        sortOrder: filters?.sortOrder || 'desc',
      }

      return await this.internalRepository.findByCategoryId(categoryId, params)
    } catch (error) {
      logger.error('Failed to get vouchers by category internally', {
        error,
        categoryId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async cleanupExpiredVouchers(): Promise<number> {
    try {
      // Find all vouchers that should be expired but aren't
      const now = new Date()
      const params: VoucherSearchParams = {
        state: ['published', 'claimed'] as VoucherState[],
        expiresAtEnd: now,
        page: 1,
        limit: 1000, // Process in batches
      }

      // Use publicRepository for findAll
      const result = await this.publicRepository.findAll(params)

      let expiredCount = 0

      for (const voucher of result.data) {
        if (voucher.expiresAt && voucher.expiresAt < now) {
          try {
            await this.updateVoucherStateInternal(
              voucher.id,
              'expired' as VoucherState,
              'Automatic expiration cleanup',
            )
            expiredCount++
          } catch (error) {
            logger.error('Failed to expire voucher in cleanup', {
              error,
              voucherId: voucher.id,
            })
          }
        }
      }

      logger.info('Expired vouchers cleanup completed', { expiredCount })

      return expiredCount
    } catch (error) {
      logger.error('Failed to cleanup expired vouchers', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async cleanupOrphanedCustomerVouchers(): Promise<number> {
    try {
      // This would require a custom repository method to find customer vouchers
      // without corresponding vouchers (orphaned records)
      // For now, returning 0 as placeholder

      logger.info('Orphaned customer vouchers cleanup completed', {
        cleanedCount: 0,
      })

      return 0
    } catch (error) {
      logger.error('Failed to cleanup orphaned customer vouchers', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  private async invalidateCache(voucherId?: string): Promise<void> {
    try {
      if (voucherId) {
        await this.cache.del(`service:voucher:${voucherId}`)
        await this.cache.del(`internal:voucher:${voucherId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:vouchers:*')
      await this.cache.delPattern?.('internal:vouchers:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }

  // ============= Voucher Security Methods =============

  /**
   * Initialize ECDSA key pair for voucher token generation
   */
  private async initializeKeyPair(): Promise<void> {
    if (!this.keyPair) {
      this.keyPair = await this.ecdsaService.generateKeyPair()
      logger.info('Generated ECDSA key pair for voucher security')
    }
  }

  /**
   * Get the private key, generating it if necessary
   */
  private async getPrivateKey(): Promise<string> {
    await this.initializeKeyPair()

    return this.keyPair!.privateKey
  }

  async generateVoucherTokens(
    options: GenerateTokenOptions,
  ): Promise<VoucherTokenData> {
    try {
      const privateKey = await this.getPrivateKey()

      // Generate QR payload using print voucher format for voucher books
      const qrResult = await this.voucherQRService.generatePrintVoucherQR(
        options.voucherId,
        options.batchId || `batch-${Date.now()}`,
        privateKey,
        { ttl: options.ttl || 31536000 }, // 1 year default for printed vouchers
      )

      // Generate short code
      const shortCode = await generateSecureShortCode({
        length: 8,
        includeDash: true,
      })

      logger.debug('Generated voucher tokens', {
        voucherId: options.voucherId,
        providerId: options.providerId,
        shortCode,
        batchId: options.batchId,
      })

      return {
        voucherId: options.voucherId,
        qrPayload: qrResult.qrPayload,
        shortCode,
        batchId: options.batchId,
      }
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to generate voucher tokens', {
        source: 'InternalVoucherService.generateVoucherTokens',
      })
    }
  }

  async generateBatchVoucherTokens(
    request: BatchTokenGenerationRequest,
  ): Promise<Map<string, VoucherTokenData>> {
    const tokensMap = new Map<string, VoucherTokenData>()

    try {
      // Generate batch ID if not provided
      const finalBatchId = request.batchId || (await generateBatchCode())

      // Generate tokens in parallel for better performance
      const promises = request.vouchers.map(async (voucher) => {
        const tokenData = await this.generateVoucherTokens({
          ...voucher,
          batchId: finalBatchId,
        })

        return tokenData
      })

      const results = await Promise.all(promises)

      for (const tokenData of results) {
        tokensMap.set(tokenData.voucherId, tokenData)
      }

      logger.info('Generated batch voucher tokens', {
        batchId: finalBatchId,
        count: tokensMap.size,
      })

      return tokensMap
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to generate batch voucher tokens',
        {
          source: 'InternalVoucherService.generateBatchVoucherTokens',
        },
      )
    }
  }

  // ============= Voucher Book Methods =============

  async getVouchersForBook(
    businessIds: string[],
    month: string,
    year: number,
  ): Promise<VoucherForBook[]> {
    try {
      const vouchersForBook: VoucherForBook[] = []

      // Get all active vouchers for the specified businesses
      for (const businessId of businessIds) {
        const params: InternalVoucherSearchParams = {
          businessId,
          state: 'published' as VoucherState,
          includeExpired: false,
          page: 1,
          limit: 100, // Adjust based on expected vouchers per business
        }

        const result = await this.internalRepository.findByBusinessId(
          businessId,
          params,
        )

        // Transform vouchers to book format
        for (const voucher of result.data) {
          const voucherForBook: VoucherForBook = {
            id: voucher.id,
            businessId: voucher.businessId,
            // TODO: Implement proper multi-language translation fetching
            // For now, use resolved content or fallback to keys
            title: voucher.title
              ? { en: voucher.title }
              : { en: voucher.titleKey },
            description: voucher.description
              ? { en: voucher.description }
              : { en: voucher.descriptionKey },
            terms: voucher.termsAndConditions
              ? { en: voucher.termsAndConditions }
              : { en: voucher.termsAndConditionsKey },
            discountType: voucher.discountType,
            discountValue: voucher.discountValue,
            validFrom: voucher.validFrom,
            validTo: voucher.expiresAt, // Use expiresAt instead of validTo
            businessName: '', // Would need to be populated from business service
            businessLogo: undefined,
            category: voucher.categoryId, // Would need category name from category service
          }

          vouchersForBook.push(voucherForBook)
        }
      }

      logger.info('Retrieved vouchers for book', {
        businessCount: businessIds.length,
        voucherCount: vouchersForBook.length,
        month,
        year,
      })

      return vouchersForBook
    } catch (error) {
      logger.error('Failed to get vouchers for book', {
        error,
        businessIds,
        month,
        year,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  validateBookStateTransition(
    currentStatus: VoucherBookStatus,
    newStatus: VoucherBookStatus,
  ): VoucherBookStateTransition {
    const allowedStates: VoucherBookStatus[] = get(
      this.allowedBookTransitions,
      currentStatus,
      [],
    )

    if (!allowedStates.includes(newStatus)) {
      return {
        allowed: false,
        reason: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedStates.join(', ')}`,
      }
    }

    return { allowed: true }
  }

  validateBookReadyForPublication(
    book: VoucherBookValidation,
  ): VoucherBookStateTransition {
    const missingFields: string[] = []

    if (!book.title) missingFields.push('title')
    if (!book.description) missingFields.push('description')
    if (!book.month) missingFields.push('month')
    if (!book.year) missingFields.push('year')
    if (!book.totalPages || book.totalPages < 1)
      missingFields.push('totalPages')
    if (!book.voucherCount || book.voucherCount < 1)
      missingFields.push('voucherCount')

    if (missingFields.length > 0) {
      return {
        allowed: false,
        reason: 'Book is missing required fields for publication',
        requiredFields: missingFields,
      }
    }

    return { allowed: true }
  }
}
