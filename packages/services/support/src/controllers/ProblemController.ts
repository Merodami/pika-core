import { supportPublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ProblemMapper } from '@pika/sdk'
import type { IProblemService } from '@support/services/ProblemService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles user support ticket operations
 */
export class ProblemController {
  constructor(private readonly problemService: IProblemService) {
    // Bind all methods to preserve 'this' context
    this.getUserProblems = this.getUserProblems.bind(this)
    this.createProblem = this.createProblem.bind(this)
  }

  /**
   * GET /problems
   * Get authenticated user's support tickets with pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user-problems',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserProblems(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated user for security
      const context = RequestContext.getContext(request)
      const userId = context.userId
      const query =
        getValidatedQuery<supportPublic.SupportProblemSearchParams>(request)

      // Build search params with user filter
      const params = {
        userId,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder.toUpperCase() as 'ASC' | 'DESC',
        search: query.search,
        status: query.status,
        priority: query.priority,
        type: query.type,
      }

      const result = await this.problemService.getUserProblems(params)

      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, ProblemMapper.toDTO)
      const validatedResponse = validateResponse(
        supportPublic.SupportProblemListResponse,
        responseData,
        'ProblemController.getUserProblems',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /problems
   * Create new support ticket
   */
  async createProblem(
    request: Request<{}, {}, supportPublic.CreateSupportProblemRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Use authenticated user instead of body.userId for security
      const context = RequestContext.getContext(request)
      const data = {
        ...request.body,
        userId: context.userId, // Override any userId from body
      }

      const problem = await this.problemService.createProblem(data)

      // Transform to DTO
      const dto = ProblemMapper.toDTO(problem)

      const validatedResponse = validateResponse(
        supportPublic.SupportProblemResponse,
        dto,
        'ProblemController.createProblem',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
