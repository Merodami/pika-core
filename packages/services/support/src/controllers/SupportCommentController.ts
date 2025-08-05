import { supportCommon, supportPublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { SupportCommentMapper } from '@pika/sdk'
import type { ISupportCommentService } from '@support/services/SupportCommentService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles support ticket comments
 */
export class SupportCommentController {
  constructor(private readonly commentService: ISupportCommentService) {
    // Bind all methods to preserve 'this' context
    this.getCommentsByProblemId = this.getCommentsByProblemId.bind(this)
    this.getCommentById = this.getCommentById.bind(this)
    this.createComment = this.createComment.bind(this)
    this.updateComment = this.updateComment.bind(this)
    this.deleteComment = this.deleteComment.bind(this)
  }

  /**
   * GET /support-comments/problem/:problemId
   * Get comments for a support ticket
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'problem-comments',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCommentsByProblemId(
    request: Request<supportCommon.ProblemIdForCommentsParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { problemId } = request.params
      const query =
        getValidatedQuery<supportPublic.SupportCommentSearchParams>(request)

      const params = {
        problemId,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder.toUpperCase() as 'ASC' | 'DESC',
      }

      const result = await this.commentService.getCommentsByProblemId(params)

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, SupportCommentMapper.toDTO)
      const validatedResponse = validateResponse(
        supportPublic.SupportCommentListResponse,
        responseData,
        'SupportCommentController.getCommentsByProblemId',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /support-comments/:id
   * Get comment by ID
   */
  async getCommentById(
    request: Request<supportCommon.SupportCommentIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      const comment = await this.commentService.getCommentById(id)

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      const validatedResponse = validateResponse(
        supportPublic.SupportCommentResponse,
        dto,
        'SupportCommentController.getCommentById',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /support-comments
   * Create new comment on support ticket
   */
  async createComment(
    request: Request<{}, {}, supportPublic.CreateSupportCommentRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated user
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const comment = await this.commentService.createComment(
        userId,
        request.body,
      )

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      const validatedResponse = validateResponse(
        supportPublic.SupportCommentResponse,
        dto,
        'SupportCommentController.createComment',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /support-comments/:id
   * Update comment
   */
  async updateComment(
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

      // Use authenticated user
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const comment = await this.commentService.updateComment(
        id,
        userId,
        request.body,
      )

      // Transform to DTO
      const dto = SupportCommentMapper.toDTO(comment)

      const validatedResponse = validateResponse(
        supportPublic.SupportCommentResponse,
        dto,
        'SupportCommentController.updateComment',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /support-comments/:id
   * Delete comment
   */
  async deleteComment(
    request: Request<supportCommon.SupportCommentIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      // Use authenticated user
      const context = RequestContext.getContext(request)
      const userId = context.userId

      await this.commentService.deleteComment(id, userId)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
