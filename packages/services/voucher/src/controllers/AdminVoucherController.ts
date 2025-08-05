import { businessCommon, voucherAdmin, voucherCommon } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getRequestLanguage,
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory, logger, parseIncludeParam } from '@pika/shared'
import { VoucherState } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type { IAdminVoucherService } from '../services/AdminVoucherService.js'
import type { VoucherSearchParams } from '../types/index.js'

/**
 * Handles admin voucher management operations
 */
export class AdminVoucherController {
  constructor(private readonly voucherService: IAdminVoucherService) {
    // Bind methods to preserve 'this' context
    this.getAllVouchers = this.getAllVouchers.bind(this)
    this.getVoucherById = this.getVoucherById.bind(this)
    this.createVoucher = this.createVoucher.bind(this)
    this.updateVoucher = this.updateVoucher.bind(this)
    this.deleteVoucher = this.deleteVoucher.bind(this)
    this.updateVoucherState = this.updateVoucherState.bind(this)
    this.generateVoucherCodes = this.generateVoucherCodes.bind(this)
    this.uploadVoucherImage = this.uploadVoucherImage.bind(this)
    this.updateVoucherTranslations = this.updateVoucherTranslations.bind(this)
    this.getVoucherTranslations = this.getVoucherTranslations.bind(this)
    this.bulkUpdateVouchers = this.bulkUpdateVouchers.bind(this)
    this.getVoucherAnalytics = this.getVoucherAnalytics.bind(this)
    this.getBusinessVoucherStats = this.getBusinessVoucherStats.bind(this)
    this.publishVoucher = this.publishVoucher.bind(this)
    this.expireVoucher = this.expireVoucher.bind(this)
  }

  /**
   * GET /admin/vouchers
   * Get all vouchers with admin filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:vouchers',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVouchers(
    req: Request,
    res: Response<voucherAdmin.AdminVoucherListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<voucherAdmin.AdminVoucherQueryParams>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            ...voucherCommon.ADMIN_VOUCHER_ALLOWED_RELATIONS,
          ])
        : {}

      // Map API query to service params - admins can see all vouchers
      const params: VoucherSearchParams = {
        businessId: query.businessId,
        categoryId: query.categoryId,
        state: query.state as VoucherState | undefined,
        discountType: query.discountType,
        minDiscount: query.minDiscount,
        maxDiscount: query.maxDiscount,
        currency: query.currency,
        validFromStart: query.validFromStart,
        validFromEnd: query.validFromEnd,
        expiresAtStart: query.expiresAtStart,
        expiresAtEnd: query.expiresAtEnd,
        createdFromStart: query.createdFromStart,
        createdFromEnd: query.createdFromEnd,
        minRedemptions: query.minRedemptions,
        maxRedemptions: query.maxRedemptions,
        minScans: query.minScans,
        maxScans: query.maxScans,
        isDeleted: query.isDeleted,
        search: query.search,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: voucherCommon.adminVoucherSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder,
        parsedIncludes,
      }

      const result = await this.voucherService.getAllVouchers(params, language)

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, (voucher) =>
        VoucherMapper.toAdminDTO(voucher),
      )
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherListResponse,
        responseData,
        'AdminVoucherController.getAllVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id
   * Get voucher by ID with full details for admin
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:voucher',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherById(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query = getValidatedQuery<voucherAdmin.AdminVoucherQueryParams>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            ...voucherCommon.ADMIN_VOUCHER_ALLOWED_RELATIONS,
          ])
        : {}

      const voucher = await this.voucherService.getVoucherById(
        voucherId,
        parsedIncludes,
        language,
      )

      // Transform and validate single entity response
      const responseData = VoucherMapper.toAdminDTO(voucher)
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherDetailResponse,
        responseData,
        'AdminVoucherController.getVoucherById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers
   * Create new voucher (admin)
   */
  async createVoucher(
    req: Request<{}, {}, voucherAdmin.CreateVoucherRequest>,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId
      const data = VoucherMapper.fromCreateRequestData(req.body)
      const language = getRequestLanguage(req)

      logger.info('Admin creating voucher', {
        adminUserId,
        voucherData: { title: data.title, businessId: data.businessId },
      })

      const voucher = await this.voucherService.createVoucher(data, language)

      // Transform and validate create response
      const responseData = VoucherMapper.toAdminDTO(voucher)
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherDetailResponse,
        responseData,
        'AdminVoucherController.createVoucher',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/vouchers/:id
   * Update voucher (admin)
   */
  async updateVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.UpdateVoucherRequest
    >,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId
      const data = VoucherMapper.fromUpdateRequestData(req.body)
      const language = getRequestLanguage(req)

      logger.info('Admin updating voucher', {
        voucherId,
        adminUserId,
      })

      const voucher = await this.voucherService.updateVoucher(
        voucherId,
        data,
        language,
      )

      // Transform and validate update response
      const responseData = VoucherMapper.toAdminDTO(voucher)
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherDetailResponse,
        responseData,
        'AdminVoucherController.updateVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/vouchers/:id
   * Delete voucher (admin)
   */
  async deleteVoucher(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      logger.info('Admin deleting voucher', {
        voucherId,
        adminUserId,
      })

      await this.voucherService.deleteVoucher(voucherId)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/vouchers/:id/state
   * Update voucher state (admin)
   */
  async updateVoucherState(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.UpdateVoucherStateRequest
    >,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { state, reason: _reason } = req.body
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId
      const language = getRequestLanguage(req)

      logger.info('Admin updating voucher state', {
        voucherId,
        state,
        adminUserId,
      })

      const voucher = await this.voucherService.updateVoucherState(
        voucherId,
        state as VoucherState,
        language,
      )

      // Transform and validate state update response
      const responseData = VoucherMapper.toAdminDTO(voucher)
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherDetailResponse,
        responseData,
        'AdminVoucherController.updateVoucherState',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/codes
   * Generate voucher codes (admin)
   */
  async generateVoucherCodes(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.GenerateVoucherCodesRequest
    >,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { codeType, quantity, customCodes } = req.body

      const _codes = await this.voucherService.generateVoucherCodes(voucherId, {
        codeType,
        quantity,
        customCodes,
      })

      // Get the updated voucher with the new codes
      const voucher = await this.voucherService.getVoucherById(voucherId)

      // Transform and validate generate codes response
      const responseData = VoucherMapper.toAdminDTO(voucher)
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherDetailResponse,
        responseData,
        'AdminVoucherController.generateVoucherCodes',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/image
   * Upload voucher image (admin)
   */
  async uploadVoucherImage(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.UploadVoucherImageResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params

      // Get the uploaded file from Multer
      const file = req.file

      if (!file) {
        throw ErrorFactory.badRequest('No file uploaded')
      }

      const imageUrl = await this.voucherService.uploadVoucherImage(
        voucherId,
        file,
      )

      // Transform and validate upload image response
      const responseData = { imageUrl }
      const validatedResponse = validateResponse(
        voucherAdmin.UploadVoucherImageResponse,
        responseData,
        'AdminVoucherController.uploadVoucherImage',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/vouchers/:id/translations
   * Update voucher translations (admin)
   */
  async updateVoucherTranslations(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.UpdateVoucherTranslationsRequest
    >,
    res: Response<voucherAdmin.VoucherTranslationsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { translations } = req.body

      // Map API 'terms' to domain 'termsAndConditions'
      const domainTranslations = VoucherMapper.fromTranslationsDTO(translations)

      await this.voucherService.updateVoucherTranslations(
        voucherId,
        domainTranslations,
      )

      // Transform and validate translations update response
      const responseData = {
        voucherId,
        translations: {
          title: translations.title || {},
          description: translations.description || {},
          terms: translations.terms || {},
        },
      }
      const validatedResponse = validateResponse(
        voucherAdmin.VoucherTranslationsResponse,
        responseData,
        'AdminVoucherController.updateVoucherTranslations',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id/translations
   * Get voucher translations (admin)
   */
  async getVoucherTranslations(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.VoucherTranslationsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params

      const translations =
        await this.voucherService.getVoucherTranslations(voucherId)

      // Map domain 'termsAndConditions' back to API 'terms'
      const apiTranslations = VoucherMapper.toTranslationsDTO(translations)

      // Transform and validate get translations response
      const responseData = {
        voucherId,
        translations: apiTranslations,
      }
      const validatedResponse = validateResponse(
        voucherAdmin.VoucherTranslationsResponse,
        responseData,
        'AdminVoucherController.getVoucherTranslations',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/vouchers/bulk
   * Bulk update vouchers (admin)
   */
  async bulkUpdateVouchers(
    req: Request<{}, {}, voucherAdmin.BulkVoucherUpdateRequest>,
    res: Response<voucherAdmin.BulkVoucherOperationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherIds, updates, reason: _reason } = req.body
      const language = getRequestLanguage(req)

      // Convert the bulk update data to UpdateVoucherDTO format
      const updateDTO = {
        ...(updates.state && { state: updates.state }),
        ...(updates.expiresAt && {
          expiresAt: updates.expiresAt.toISOString(),
        }),
        ...(updates.maxRedemptions !== undefined && {
          maxRedemptions: updates.maxRedemptions,
        }),
        ...(updates.maxRedemptionsPerUser && {
          maxRedemptionsPerUser: updates.maxRedemptionsPerUser,
        }),
      }

      const updateData = VoucherMapper.fromUpdateDTO(updateDTO)

      const result = await this.voucherService.bulkUpdateVouchers(
        {
          ids: voucherIds,
          updates: updateData,
        },
        language,
      )

      // Transform and validate bulk update response
      const responseData = VoucherMapper.toBulkUpdateResponseDTO(result)
      const validatedResponse = validateResponse(
        voucherAdmin.BulkVoucherOperationResponse,
        responseData,
        'AdminVoucherController.bulkUpdateVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id/analytics
   * Get voucher analytics (admin)
   */
  async getVoucherAnalytics(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.VoucherAnalyticsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query =
        getValidatedQuery<voucherAdmin.VoucherAnalyticsQueryParams>(req)

      const analytics = await this.voucherService.getVoucherAnalytics({
        startDate: query.startDate,
        endDate: query.endDate,
      })

      // Transform and validate analytics response
      const responseData = VoucherMapper.toVoucherAnalyticsDTO(
        analytics,
        voucherId,
        {
          startDate: query.startDate,
          endDate: query.endDate,
        },
      )
      const validatedResponse = validateResponse(
        voucherAdmin.VoucherAnalyticsResponse,
        responseData,
        'AdminVoucherController.getVoucherAnalytics',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/business/:businessId/stats
   * Get business voucher statistics (admin)
   */
  async getBusinessVoucherStats(
    req: Request<businessCommon.BusinessIdParam>,
    res: Response<voucherAdmin.BusinessVoucherStatsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const _query =
        getValidatedQuery<voucherAdmin.BusinessVoucherStatsQueryParams>(req)

      const stats =
        await this.voucherService.getBusinessVoucherStats(businessId)

      // Transform and validate business stats response
      const responseData = VoucherMapper.toBusinessVoucherStatsDTO(stats)
      const validatedResponse = validateResponse(
        voucherAdmin.BusinessVoucherStatsResponse,
        responseData,
        'AdminVoucherController.getBusinessVoucherStats',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/publish
   * Publish voucher (admin workflow)
   */
  async publishVoucher(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.AdminVoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.publishVoucher(id, language)
      const dto = VoucherMapper.toAdminDTO(voucher)

      // Transform and validate publish response
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherResponse,
        dto,
        'AdminVoucherController.publishVoucher',
      )

      res.status(200).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/expire
   * Expire voucher (admin workflow)
   */
  async expireVoucher(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.AdminVoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.expireVoucher(id, language)
      const dto = VoucherMapper.toAdminDTO(voucher)

      // Transform and validate expire response
      const validatedResponse = validateResponse(
        voucherAdmin.AdminVoucherResponse,
        dto,
        'AdminVoucherController.expireVoucher',
      )

      res.status(200).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
