import { businessCommon, shared, voucherCommon, voucherPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getRequestLanguage,
  getValidatedParams,
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { VoucherDomain, VoucherMapper } from '@pika/sdk'
import { ErrorFactory, parseIncludeParam } from '@pika/shared'
import {
  PaginatedResult,
  VoucherScanSource,
  VoucherScanType,
  VoucherState,
} from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type { IVoucherService } from '../services/VoucherService.js'

/**
 * Handles public voucher operations
 * Public routes for viewing and interacting with vouchers
 */
export class VoucherController {
  constructor(private readonly voucherService: IVoucherService) {
    // Bind methods to preserve 'this' context
    this.getAllVouchers = this.getAllVouchers.bind(this)
    this.getVoucherById = this.getVoucherById.bind(this)
    this.scanVoucher = this.scanVoucher.bind(this)
    this.claimVoucher = this.claimVoucher.bind(this)
    this.redeemVoucher = this.redeemVoucher.bind(this)
    this.getUserVouchers = this.getUserVouchers.bind(this)
    this.getBusinessVouchers = this.getBusinessVouchers.bind(this)
    this.getVoucherByCode = this.getVoucherByCode.bind(this)
  }

  /**
   * GET /vouchers
   * Get all vouchers with filters and pagination (public)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVouchers(
    req: Request,
    res: Response<voucherPublic.VoucherListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<voucherPublic.VoucherQueryParams>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            ...voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          ])
        : {}

      // Map API query to service params - only show published vouchers to public
      const params = {
        businessId: query.businessId,
        categoryId: query.categoryId,
        state: VoucherState.published, // Always filter by published for public routes
        type: query.type,
        minValue: query.minValue,
        maxValue: query.maxValue,
        minDiscount: query.minDiscount,
        maxDiscount: query.maxDiscount,
        currency: query.currency,
        validFrom: query.validFrom ? new Date(query.validFrom) : undefined,
        validUntil: query.validUntil ? new Date(query.validUntil) : undefined,
        search: query.search,
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: voucherCommon.voucherSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder,
        parsedIncludes,
      }

      const result: PaginatedResult<VoucherDomain> =
        await this.voucherService.getAllVouchers(params, language)

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, VoucherMapper.toDTO)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherListResponse,
        responseData,
        'VoucherController.getAllVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/:id
   * Get voucher by ID (public)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'voucher',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherById(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      {},
      voucherPublic.GetVoucherByIdQuery
    >,
    res: Response<voucherPublic.VoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query = getValidatedQuery<voucherPublic.GetVoucherByIdQuery>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            ...voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          ])
        : {}

      const voucher: VoucherDomain = await this.voucherService.getVoucherById(
        voucherId,
        parsedIncludes,
        language,
      )

      // Check if voucher is published for public access
      if (voucher.state !== VoucherState.published) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Transform and validate single entity response
      const responseData = VoucherMapper.toDTO(voucher)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherResponse,
        responseData,
        'VoucherController.getVoucherById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/:id/scan
   * Track voucher scan
   */
  async scanVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherScanRequest
    >,
    res: Response<voucherPublic.VoucherScanResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const scanData = req.body
      const context = RequestContext.getContext(req)
      const userId = context?.userId
      const language = getRequestLanguage(req)

      const scanResult = await this.voucherService.scanVoucher(
        voucherId,
        {
          voucherId,
          userId,
          scanType: VoucherScanType.customer,
          scanSource:
            (scanData.scanSource as VoucherScanSource) ||
            VoucherScanSource.camera,
          location: scanData.location
            ? {
                lat: scanData.location.latitude,
                lng: scanData.location.longitude,
              }
            : null,
          deviceInfo: scanData.deviceInfo || null,
        },
        language,
      )

      // Transform and validate scan response
      const responseData = VoucherMapper.toScanResponseDTO(scanResult)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherScanResponse,
        responseData,
        'VoucherController.scanVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/:id/claim
   * Claim voucher to user's wallet
   */
  async claimVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherClaimRequest
    >,
    res: Response<voucherPublic.VoucherClaimResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const claimData = req.body
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const language = getRequestLanguage(req)

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to claim vouchers',
        )
      }

      const claimResult = await this.voucherService.claimVoucher(
        voucherId,
        userId,
        claimData,
        language,
      )

      // Transform and validate claim response
      const responseData = VoucherMapper.toClaimResponseDTO(claimResult)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherClaimResponse,
        responseData,
        'VoucherController.claimVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/:id/redeem
   * Redeem voucher
   */
  async redeemVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherRedeemRequest
    >,
    res: Response<voucherPublic.VoucherRedeemResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const redeemData = req.body
      const context = RequestContext.getContext(req)
      const userId = context?.userId
      const language = getRequestLanguage(req)

      const redeemResult = await this.voucherService.redeemVoucher(
        voucherId,
        {
          ...redeemData,
          userId,
        },
        language,
      )

      // Transform and validate redeem response
      const responseData = VoucherMapper.toRedeemResponseDTO(redeemResult)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherRedeemResponse,
        responseData,
        'VoucherController.redeemVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/user/:userId
   * Get user's vouchers (claimed/redeemed)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers:user',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserVouchers(
    req: Request<shared.UserIdParam>,
    res: Response<voucherPublic.UserVouchersListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = getValidatedParams<shared.UserIdParam>(req)
      const query =
        getValidatedQuery<voucherPublic.UserVouchersQueryParams>(req)
      const context = RequestContext.getContext(req)
      const language = getRequestLanguage(req)

      // Users can only see their own vouchers unless admin
      if (
        context?.userId !== userId &&
        context?.role?.toString().toLowerCase() !== 'admin'
      ) {
        throw ErrorFactory.forbidden('You can only view your own vouchers')
      }

      const params = {
        userId,
        status: query.status,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'claimedAt',
        sortOrder: query.sortOrder,
      }

      const result = await this.voucherService.getUserVouchers(params, language)

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(
        result,
        VoucherMapper.toUserVoucherDTO,
      )
      const validatedResponse = validateResponse(
        voucherPublic.UserVouchersListResponse,
        responseData,
        'VoucherController.getUserVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/business/:businessId
   * Get business's vouchers (public)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers:business',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getBusinessVouchers(
    req: Request<businessCommon.BusinessIdParam>,
    res: Response<voucherPublic.VoucherListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } =
        getValidatedParams<businessCommon.BusinessIdParam>(req)
      const query = getValidatedQuery<voucherPublic.VoucherQueryParams>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            ...voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          ])
        : {}

      const params = {
        businessId,
        state: VoucherState.published, // Only show published vouchers
        categoryId: query.categoryId,
        discountType: query.discountType,
        minDiscount: query.minDiscount,
        maxDiscount: query.maxDiscount,
        hasAvailableUses: query.hasAvailableUses,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: voucherCommon.voucherSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder,
        parsedIncludes,
      }

      const result = await this.voucherService.getVouchersByBusinessId(
        params,
        language,
      )

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, VoucherMapper.toDTO)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherListResponse,
        responseData,
        'VoucherController.getBusinessVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/by-code/:code
   * Get voucher by any code type (QR, short, static)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'voucher:code',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherByCode(
    req: Request<voucherCommon.VoucherCodeParam>,
    res: Response<voucherPublic.VoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code } = req.params
      const query = getValidatedQuery<voucherPublic.GetVoucherByIdQuery>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            ...voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          ])
        : {}

      const voucher: VoucherDomain =
        await this.voucherService.getVoucherByAnyCode(code, language)

      // Apply includes if needed
      let voucherWithIncludes: VoucherDomain = voucher

      if (Object.keys(parsedIncludes).length > 0) {
        voucherWithIncludes = await this.voucherService.getVoucherById(
          voucher.id,
          parsedIncludes,
          language,
        )
      }

      // Transform and validate single entity response
      const responseData = VoucherMapper.toDTO(voucherWithIncludes)
      const validatedResponse = validateResponse(
        voucherPublic.VoucherResponse,
        responseData,
        'VoucherController.getVoucherByCode',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
