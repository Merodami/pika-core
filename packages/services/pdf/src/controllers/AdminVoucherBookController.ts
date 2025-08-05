import { pdfAdmin, pdfCommon } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedBody,
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import { VoucherBookMapper } from '../mappers/VoucherBookMapper.js'
import type { IAdminVoucherBookService } from '../services/AdminVoucherBookService.js'

/**
 * Handles admin voucher book management operations
 */
export class AdminVoucherBookController {
  constructor(private readonly voucherBookService: IAdminVoucherBookService) {
    // Bind methods to preserve 'this' context
    this.getAllVoucherBooks = this.getAllVoucherBooks.bind(this)
    this.getVoucherBookById = this.getVoucherBookById.bind(this)
    this.createVoucherBook = this.createVoucherBook.bind(this)
    this.updateVoucherBook = this.updateVoucherBook.bind(this)
    this.deleteVoucherBook = this.deleteVoucherBook.bind(this)
    this.updateVoucherBookStatus = this.updateVoucherBookStatus.bind(this)
    this.generatePDF = this.generatePDF.bind(this)
    this.bulkArchiveVoucherBooks = this.bulkArchiveVoucherBooks.bind(this)
    this.getVoucherBookStatistics = this.getVoucherBookStatistics.bind(this)
  }

  /**
   * GET /admin/voucher-books
   * Get all voucher books with admin filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:voucher-books',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVoucherBooks(
    req: Request,
    res: Response<pdfAdmin.AdminVoucherBookListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<pdfAdmin.AdminVoucherBookQueryParams>(req)

      // Map API query to service params
      const params = {
        search: query.search,
        bookType: query.bookType,
        status: query.status,
        year: query.year,
        month: query.month,
        createdBy: query.createdBy,
        updatedBy: query.updatedBy,
        hasContent: query.hasContent,
        hasPdf: query.hasPdf,
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }

      const result = await this.voucherBookService.getAllVoucherBooks(params)

      // Use mapper for proper response transformation
      const response = paginatedResponse(result, VoucherBookMapper.toAdminDTO)

      const validatedResponse = validateResponse(
        pdfAdmin.AdminVoucherBookListResponse,
        response,
        'AdminVoucherBookController.getAllVoucherBooks',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/voucher-books/:id
   * Get voucher book by ID with full details
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:voucher-book',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherBookById(
    req: Request<pdfCommon.VoucherBookIdParam>,
    res: Response<pdfAdmin.AdminVoucherBookResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const voucherBook = await this.voucherBookService.getVoucherBookById(id)

      const dto = VoucherBookMapper.toDTO(voucherBook)
      const validatedResponse = validateResponse(
        pdfAdmin.AdminVoucherBookResponse,
        dto,
        'AdminVoucherBookController.getVoucherBookById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/voucher-books
   * Create new voucher book
   */
  async createVoucherBook(
    req: Request<{}, {}, pdfAdmin.CreateVoucherBookRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const data = getValidatedBody<pdfAdmin.CreateVoucherBookRequest>(req)

      if (!context.userId) {
        throw ErrorFactory.unauthorized('User context not found')
      }

      const createData = VoucherBookMapper.fromCreateDTO(data, context.userId)

      const voucherBook =
        await this.voucherBookService.createVoucherBook(createData)

      const dto = VoucherBookMapper.toDTO(voucherBook)
      const validatedResponse = validateResponse(
        pdfAdmin.AdminVoucherBookResponse,
        dto,
        'AdminVoucherBookController.createVoucherBook',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/voucher-books/:id
   * Update voucher book information
   */
  async updateVoucherBook(
    req: Request<
      pdfCommon.VoucherBookIdParam,
      {},
      pdfAdmin.UpdateVoucherBookRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const { id } = req.params
      const data = getValidatedBody<pdfAdmin.UpdateVoucherBookRequest>(req)

      const updateData = VoucherBookMapper.fromUpdateDTO(data, context.userId)

      const voucherBook = await this.voucherBookService.updateVoucherBook(
        id,
        updateData,
      )

      const dto = VoucherBookMapper.toDTO(voucherBook)
      const validatedResponse = validateResponse(
        pdfAdmin.AdminVoucherBookResponse,
        dto,
        'AdminVoucherBookController.updateVoucherBook',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/voucher-books/:id
   * Delete voucher book (soft delete)
   */
  async deleteVoucherBook(
    req: Request<pdfCommon.VoucherBookIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.voucherBookService.deleteVoucherBook(id)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/voucher-books/:id/status
   * Update voucher book status
   */
  async updateVoucherBookStatus(
    req: Request<
      pdfCommon.VoucherBookIdParam,
      {},
      pdfAdmin.UpdateVoucherBookStatusRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const { id } = req.params
      const { status } =
        getValidatedBody<pdfAdmin.UpdateVoucherBookStatusRequest>(req)

      const voucherBook = await this.voucherBookService.updateVoucherBookStatus(
        id,
        status,
        context.userId,
      )

      const dto = VoucherBookMapper.toDTO(voucherBook)
      const validatedResponse = validateResponse(
        pdfAdmin.AdminVoucherBookResponse,
        dto,
        'AdminVoucherBookController.updateVoucherBookStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/voucher-books/:id/generate-pdf
   * Generate PDF for voucher book
   */
  async generatePDF(
    req: Request<pdfCommon.VoucherBookIdParam, {}, pdfAdmin.GeneratePdfRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const { id } = req.params

      if (!context.userId) {
        throw ErrorFactory.unauthorized('User context not found')
      }

      getValidatedBody<pdfAdmin.GeneratePdfRequest>(req)

      const result = await this.voucherBookService.generatePDF(
        id,
        context.userId,
      )

      // Use mapper for proper response transformation
      const response = VoucherBookMapper.toGeneratePDFResponse(result)
      const validatedResponse = validateResponse(
        pdfAdmin.GeneratePdfResponse,
        response,
        'AdminVoucherBookController.generatePDF',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/voucher-books/bulk-archive
   * Bulk archive voucher books (efficient bulk operation)
   */
  async bulkArchiveVoucherBooks(
    req: Request<{}, {}, pdfAdmin.BulkArchiveVoucherBooksRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const { voucherBookIds } =
        getValidatedBody<pdfAdmin.BulkArchiveVoucherBooksRequest>(req)

      // Use efficient bulk operation instead of Promise.all
      const result = await this.voucherBookService.bulkArchiveVoucherBooks(
        voucherBookIds,
        context.userId,
      )

      // Use mapper for proper response transformation
      const response = VoucherBookMapper.toBulkOperationResponse({
        successCount: result.successCount,
        failedCount: result.failedCount,
        results: result.results,
      })
      const validatedResponse = validateResponse(
        pdfAdmin.BulkVoucherBookOperationResponse,
        response,
        'AdminVoucherBookController.bulkArchiveVoucherBooks',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/voucher-books/statistics
   * Get voucher book statistics
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:voucher-books:stats',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherBookStatistics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<pdfAdmin.VoucherBookStatsQueryParams>(req)

      const stats = await this.voucherBookService.getAdminStatistics(
        query.year,
        query.month,
      )

      // Use mapper for proper response transformation
      const response = VoucherBookMapper.toStatisticsResponse(stats)
      const validatedResponse = validateResponse(
        pdfAdmin.VoucherBookStatsResponse,
        response,
        'AdminVoucherBookController.getVoucherBookStatistics',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
