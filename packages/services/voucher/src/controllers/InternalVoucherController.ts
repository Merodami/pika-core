import { voucherCommon, voucherInternal } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { paginatedResponse, validateResponse } from '@pika/http'
import { VoucherMapper } from '@pika/sdk'
import { parseIncludeParam } from '@pika/shared'
import { VoucherState } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type {
  BatchProcessOperation,
  IInternalVoucherService,
} from '../services/InternalVoucherService.js'

/**
 * Handles internal voucher operations for service-to-service communication
 */
export class InternalVoucherController {
  constructor(
    private readonly internalVoucherService: IInternalVoucherService,
  ) {
    // Bind methods to preserve 'this' context
    this.getVouchersByIds = this.getVouchersByIds.bind(this)
    this.validateVoucher = this.validateVoucher.bind(this)
    this.updateVoucherState = this.updateVoucherState.bind(this)
    this.checkVoucherExists = this.checkVoucherExists.bind(this)
    this.getVouchersByBusiness = this.getVouchersByBusiness.bind(this)
    this.getVouchersByCategory = this.getVouchersByCategory.bind(this)
    this.getUserVouchers = this.getUserVouchers.bind(this)
    this.trackRedemption = this.trackRedemption.bind(this)
    this.batchProcessVouchers = this.batchProcessVouchers.bind(this)
    this.batchUpdateVoucherState = this.batchUpdateVoucherState.bind(this)
    // Voucher book endpoints
    this.getVouchersForBook = this.getVouchersForBook.bind(this)
    this.generateVoucherTokens = this.generateVoucherTokens.bind(this)
    this.validateBookStateTransition =
      this.validateBookStateTransition.bind(this)
  }

  /**
   * POST /internal/vouchers/by-ids
   * Get multiple vouchers by IDs
   */
  async getVouchersByIds(
    req: Request<{}, {}, voucherInternal.GetVouchersByIdsRequest>,
    res: Response<voucherInternal.GetVouchersByIdsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherIds, include } = req.body

      const parsedIncludes = include ? parseIncludeParam(include) : undefined

      // Get paginated result from service (following Repository Pagination Pattern)
      const result = await this.internalVoucherService.getVouchersByIds(
        voucherIds,
        parsedIncludes,
      )

      const notFound = voucherIds.filter(
        (id) => !result.data.find((v) => v.id === id),
      )

      // Controller uses service result directly (lines 387-400 pattern)
      const response = {
        data: result.data.map(VoucherMapper.toDTO), // Use regular toDTO like business service pattern
        pagination: result.pagination, // Pass through pagination
        notFound, // Additional bulk-specific field
      }

      const validatedResponse = validateResponse(
        voucherInternal.GetVouchersByIdsResponse,
        response,
        'InternalVoucherController.getVouchersByIds',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/validate
   * Validate voucher availability and constraints
   */
  async validateVoucher(
    req: Request<{}, {}, voucherInternal.ValidateVoucherRequest>,
    res: Response<voucherInternal.ValidateVoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        voucherId,
        userId,
        checkRedemptionLimit,
        checkExpiry,
        checkState,
      } = req.body

      const validation = await this.internalVoucherService.validateVoucher(
        voucherId,
        {
          userId,
          checkRedemptionLimit,
          checkExpiry,
          checkState,
        },
      )

      // Transform and validate voucher validation response
      const responseData = {
        isValid: validation.isValid,
        reason: validation.reason,
        voucher: validation.voucher
          ? VoucherMapper.toAdminDTO(validation.voucher)
          : undefined,
      }
      const validatedResponse = validateResponse(
        voucherInternal.ValidateVoucherResponse,
        responseData,
        'InternalVoucherController.validateVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /internal/vouchers/:id/state
   * Internal voucher state update
   */
  async updateVoucherState(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherInternal.InternalUpdateVoucherStateRequest
    >,
    res: Response<voucherInternal.InternalUpdateVoucherStateResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { state, reason, serviceId: _serviceId } = req.body

      // Get current voucher to check previous state
      const currentVoucher =
        await this.internalVoucherService.getVoucherById(voucherId)
      const previousState = currentVoucher.state

      const updatedVoucher =
        await this.internalVoucherService.updateVoucherStateInternal(
          voucherId,
          state as VoucherState,
          reason,
        )

      // Transform and validate state update response
      const responseData = {
        success: true,
        previousState,
        newState: updatedVoucher.state,
      }
      const validatedResponse = validateResponse(
        voucherInternal.InternalUpdateVoucherStateResponse,
        responseData,
        'InternalVoucherController.updateVoucherState',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/exists
   * Check if voucher exists by ID or code
   */
  async checkVoucherExists(
    req: Request<{}, {}, voucherInternal.CheckVoucherExistsRequest>,
    res: Response<voucherInternal.CheckVoucherExistsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherId, code } = req.body

      const exists = await this.internalVoucherService.checkVoucherExists({
        voucherId,
        code,
      })

      // Transform and validate voucher exists response
      const responseData = {
        exists: exists.exists,
        voucherId: exists.voucherId,
      }
      const validatedResponse = validateResponse(
        voucherInternal.CheckVoucherExistsResponse,
        responseData,
        'InternalVoucherController.checkVoucherExists',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/business
   * Get all vouchers for a business
   */
  async getVouchersByBusiness(
    req: Request<{}, {}, voucherInternal.GetVouchersByBusinessRequest>,
    res: Response<voucherInternal.GetVouchersByBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { businessId, state, includeExpired, includeDeleted, page, limit } =
        req.body

      const params = {
        businessId,
        state: state as VoucherState | undefined,
        includeExpired,
        includeDeleted,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result =
        await this.internalVoucherService.getVouchersByBusinessInternal(
          businessId,
          params,
        )

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, VoucherMapper.toAdminDTO)
      const validatedResponse = validateResponse(
        voucherInternal.GetVouchersByBusinessResponse,
        responseData,
        'InternalVoucherController.getVouchersByBusiness',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/category
   * Get all vouchers for a category
   */
  async getVouchersByCategory(
    req: Request<{}, {}, voucherInternal.GetVouchersByCategoryRequest>,
    res: Response<voucherInternal.GetVouchersByCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryId, state, includeExpired, page, limit } = req.body

      const params = {
        categoryId,
        state: state as VoucherState | undefined,
        includeExpired,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result =
        await this.internalVoucherService.getVouchersByCategoryInternal(
          categoryId,
          params,
        )

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, VoucherMapper.toAdminDTO)
      const validatedResponse = validateResponse(
        voucherInternal.GetVouchersByCategoryResponse,
        responseData,
        'InternalVoucherController.getVouchersByCategory',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/user
   * Get vouchers claimed/redeemed by user
   */
  async getUserVouchers(
    req: Request<{}, {}, voucherInternal.GetUserVouchersRequest>,
    res: Response<voucherInternal.GetUserVouchersResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, status, page, limit } = req.body

      const params = {
        userId,
        status,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result = await this.internalVoucherService.getUserVouchers(params)

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(
        result,
        VoucherMapper.toUserVoucherDTO,
      )
      const validatedResponse = validateResponse(
        voucherInternal.GetUserVouchersResponse,
        responseData,
        'InternalVoucherController.getUserVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/redemption
   * Internal redemption tracking
   */
  async trackRedemption(
    req: Request<{}, {}, voucherInternal.TrackRedemptionRequest>,
    res: Response<voucherInternal.TrackRedemptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherId, userId, code, metadata } = req.body

      const result = await this.internalVoucherService.trackRedemption({
        voucherId,
        userId,
        code,
        metadata,
      })

      // Transform and validate track redemption response
      const responseData = {
        redemptionId: result.redemptionId,
        success: result.success,
        currentRedemptions: result.currentRedemptions,
        maxRedemptions: result.maxRedemptions ?? null,
      }
      const validatedResponse = validateResponse(
        voucherInternal.TrackRedemptionResponse,
        responseData,
        'InternalVoucherController.trackRedemption',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/batch-process
   * Batch voucher processing for service-to-service operations
   */
  async batchProcessVouchers(
    req: Request<{}, {}, voucherInternal.BatchVoucherProcessRequest>,
    res: Response<voucherInternal.BatchVoucherProcessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherIds, operation, context } = req.body

      const batchOperation: BatchProcessOperation = {
        voucherIds,
        operation: operation as 'expire' | 'validate' | 'activate',
        context,
      }

      const result =
        await this.internalVoucherService.batchProcessVouchers(batchOperation)

      // Transform and validate batch process response
      const responseData = {
        successful: result.successCount,
        failed: result.failedCount,
        total: result.processedCount,
        results: result.results.map((r) => ({
          voucherId: r.voucherId,
          success: r.success,
          error: r.error,
        })),
        processingTime: 0, // The internal service doesn't track this, but we need it for API compatibility
      }
      const validatedResponse = validateResponse(
        voucherInternal.BatchVoucherProcessResponse,
        responseData,
        'InternalVoucherController.batchProcessVouchers',
      )

      res.status(200).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/batch-state-update
   * Batch voucher state updates for inter-service communication
   */
  async batchUpdateVoucherState(
    req: Request<{}, {}, voucherInternal.BatchUpdateVoucherStateRequest>,
    res: Response<voucherInternal.BatchUpdateVoucherStateResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { updates } = req.body

      const updateResults = []

      let successful = 0
      let failed = 0

      for (const update of updates) {
        try {
          // Get current state
          const currentVoucher =
            await this.internalVoucherService.getVoucherById(update.voucherId)
          const oldState = currentVoucher.state

          // Update state
          const updatedVoucher =
            await this.internalVoucherService.updateVoucherStateInternal(
              update.voucherId,
              update.state as VoucherState,
              update.reason,
            )

          updateResults.push({
            voucherId: update.voucherId,
            success: true,
            oldState,
            newState: updatedVoucher.state,
          })
          successful++
        } catch (error) {
          updateResults.push({
            voucherId: update.voucherId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          failed++
        }
      }

      // Transform and validate batch state update response
      const responseData = {
        successful,
        failed,
        total: updates.length,
        updates: updateResults,
      }
      const validatedResponse = validateResponse(
        voucherInternal.BatchUpdateVoucherStateResponse,
        responseData,
        'InternalVoucherController.batchUpdateVoucherState',
      )

      res.status(200).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/for-book
   * Get vouchers for book generation with security tokens
   */
  async getVouchersForBook(
    req: Request<{}, {}, voucherInternal.GetVouchersForBookRequest>,
    res: Response<voucherInternal.GetVouchersForBookResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { businessIds, month, year } = req.body

      // Get vouchers for the specified businesses
      const vouchers = await this.internalVoucherService.getVouchersForBook(
        businessIds,
        month,
        year,
      )

      // Generate security tokens in batch for better performance
      const batchId = `book-${year}-${month}`
      const tokenRequest = {
        vouchers: vouchers.map((v) => ({
          voucherId: v.id,
          providerId: v.businessId,
        })),
        batchId,
      }

      const tokensMap =
        await this.internalVoucherService.generateBatchVoucherTokens(
          tokenRequest,
        )

      // Merge tokens with voucher data
      const vouchersWithTokens = vouchers.map((voucher) => {
        const tokenData = tokensMap.get(voucher.id)

        return {
          ...voucher,
          qrPayload: tokenData?.qrPayload || '',
          shortCode: tokenData?.shortCode || '',
        }
      })

      const response = {
        vouchers: vouchersWithTokens,
        count: vouchersWithTokens.length,
      }

      const validatedResponse = validateResponse(
        voucherInternal.GetVouchersForBookResponse,
        response,
        'InternalVoucherController.getVouchersForBook',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/generate-tokens
   * Generate security tokens for vouchers
   */
  async generateVoucherTokens(
    req: Request<{}, {}, voucherInternal.GenerateVoucherTokensRequest>,
    res: Response<voucherInternal.GenerateVoucherTokensResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { vouchers, batchId } = req.body

      const tokens =
        await this.internalVoucherService.generateBatchVoucherTokens({
          vouchers,
          batchId,
        })

      // Convert Map to array format for response
      const tokenArray = Array.from(tokens.entries()).map(
        ([voucherId, tokenData]) => ({
          voucherId,
          qrPayload: tokenData.qrPayload,
          shortCode: tokenData.shortCode,
          batchId: tokenData.batchId,
        }),
      )

      const response = {
        tokens: tokenArray,
        count: tokenArray.length,
      }

      const validatedResponse = validateResponse(
        voucherInternal.GenerateVoucherTokensResponse,
        response,
        'InternalVoucherController.generateVoucherTokens',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/book/validate-transition
   * Validate voucher book state transition
   */
  async validateBookStateTransition(
    req: Request<{}, {}, voucherInternal.ValidateBookStateTransitionRequest>,
    res: Response<voucherInternal.ValidateBookStateTransitionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { currentStatus, newStatus } = req.body

      const result = this.internalVoucherService.validateBookStateTransition(
        currentStatus,
        newStatus,
      )

      const validatedResponse = validateResponse(
        voucherInternal.ValidateBookStateTransitionResponse,
        result,
        'InternalVoucherController.validateBookStateTransition',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
