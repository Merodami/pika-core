import { supportAdmin, supportCommon, supportPublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { SupportCommentMapper } from '@pika/sdk'
import { parseIncludeParam } from '@pika/shared'
import type { IAdminSupportCommentService } from '@support/services/AdminSupportCommentService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin comment management operations
 */
export class AdminCommentController {
  constructor(
    private readonly adminCommentService: IAdminSupportCommentService,
  ) {
    // Bind all methods to preserve 'this' context
    this.getAllComments = this.getAllComments.bind(this)
    this.getCommentsByProblemId = this.getCommentsByProblemId.bind(this)
    this.createInternalComment = this.createInternalComment.bind(this)
    this.updateAnyComment = this.updateAnyComment.bind(this)
    this.deleteAnyComment = this.deleteAnyComment.bind(this)
  }

  /**
   * GET /admin/comments
   * Get all comments with filtering (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-comments',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllComments(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate query parameters
      const query =
        getValidatedQuery<supportAdmin.AdminGetAllCommentsQuery>(request)

      // Parse include query parameter
      const parsedIncludes = parseIncludeParam(
        query.include,
        supportAdmin.ADMIN_COMMENT_RELATIONS as unknown as string[],
      )

      const comments =
        await this.adminCommentService.getAllComments(parsedIncludes)

      // Transform to DTOs
      const dtos = comments.map(SupportCommentMapper.toDTO)
      const responseData = { data: dtos }

      const validatedResponse = validateResponse(
        supportAdmin.AdminCommentListResponse,
        responseData,
        'AdminCommentController.getAllComments',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/comments/problem/:problemId
   * Get all comments for a problem (including internal notes)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-problem-comments',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCommentsByProblemId(
    request: Request<supportCommon.ProblemIdForCommentsParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { problemId } = request.params

      // Validate query parameters
      const query =
        getValidatedQuery<supportAdmin.AdminCommentsByProblemQuery>(request)

      // Parse include query parameter
      const parsedIncludes = parseIncludeParam(
        query.include,
        supportAdmin.ADMIN_COMMENT_RELATIONS as unknown as string[],
      )

      // Build search params from query
      const params = {
        problemId,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: (query.sortOrder || 'DESC') as 'ASC' | 'DESC',
      }

      const result = await this.adminCommentService.getCommentsByProblemId(
        params,
        parsedIncludes,
      )

      // Use paginatedResponse utility + validation (following documented pattern)
      const responseData = paginatedResponse(result, SupportCommentMapper.toDTO)

      const validatedResponse = validateResponse(
        supportAdmin.AdminCommentListResponse,
        responseData,
        'AdminCommentController.getCommentsByProblemId',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/comments
   * Create internal comment/note (admin only)
   */
  async createInternalComment(
    request: Request<
      {},
      {},
      supportPublic.CreateSupportCommentRequest & { isInternal?: boolean }
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated admin user
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const commentData = {
        ...request.body,
        isInternal: request.body.isInternal ?? true, // Default to internal for admin comments
      }

      const comment = await this.adminCommentService.createInternalComment(
        userId,
        commentData,
      )

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      const validatedResponse = validateResponse(
        supportAdmin.AdminCommentResponse,
        dto,
        'AdminCommentController.createInternalComment',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/comments/:id
   * Update any comment (admin only)
   */
  async updateAnyComment(
    request: Request<
      supportCommon.SupportCommentIdParam,
      {},
      supportPublic.UpdateSupportCommentRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      // Admin can update any comment
      const comment = await this.adminCommentService.updateAnyComment(
        id,
        request.body,
      )

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      const validatedResponse = validateResponse(
        supportAdmin.AdminCommentResponse,
        dto,
        'AdminCommentController.updateAnyComment',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/comments/:id
   * Delete any comment (admin only)
   */
  async deleteAnyComment(
    request: Request<supportCommon.SupportCommentIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      // Admin can delete any comment
      await this.adminCommentService.deleteAnyComment(id)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
