import { supportAdmin, supportCommon } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery, validateResponse } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ProblemMapper } from '@pika/sdk'
import { ErrorFactory, parseIncludeParam } from '@pika/shared'
import type { IProblemService } from '@support/services/ProblemService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin problem management operations
 */
export class AdminProblemController {
  constructor(private readonly problemService: IProblemService) {
    // Bind all methods to preserve 'this' context
    this.getAllProblems = this.getAllProblems.bind(this)
    this.getProblemById = this.getProblemById.bind(this)
    this.updateProblem = this.updateProblem.bind(this)
    this.deleteProblem = this.deleteProblem.bind(this)
  }

  /**
   * GET /admin/problems
   * Get all support tickets with filtering
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-problems',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllProblems(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<supportAdmin.AdminTicketQueryParams>(request)

      // Transform API query to service params
      const problemParams = {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder.toUpperCase() as 'ASC' | 'DESC',
        search: query.search,
        status: query.status,
        priority: query.priority,
        userId: query.userId,
        assignedTo: query.assignedTo,
        ticketNumber: query.ticketNumber,
        type: query.type,
        include: query.include,
      }

      const result = await this.problemService.getAllProblems(problemParams)

      // Transform to Admin DTOs
      const dtoResult = {
        data: result.data.map(ProblemMapper.toAdminDTO),
        pagination: result.pagination,
      }

      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketListResponse,
        dtoResult,
        'AdminProblemController.getAllProblems',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/problems/:id
   * Get support ticket by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin-problem',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getProblemById(
    request: Request<supportCommon.ProblemIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const query =
        getValidatedQuery<supportAdmin.AdminTicketByIdQuery>(request)

      const parsedIncludes = query.include
        ? parseIncludeParam(query.include)
        : undefined

      const problem = await this.problemService.getProblemById(
        id,
        parsedIncludes,
      )

      if (!problem) {
        throw ErrorFactory.resourceNotFound('Problem', id)
      }

      // Transform to DTO
      const dto = ProblemMapper.toAdminDTO(problem)

      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketDetailResponse,
        dto,
        'AdminProblemController.getProblemById',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/problems/:id
   * Update support ticket
   */
  async updateProblem(
    request: Request<
      supportCommon.ProblemIdParam,
      {},
      supportAdmin.AdminUpdateProblemRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const requestData = request.body

      // Transform API request to service DTO
      const data = {
        ...requestData,
        resolvedAt: requestData.resolvedAt?.toISOString() || null,
      }

      const problem = await this.problemService.updateProblem(id, data)

      // Transform to DTO
      const dto = ProblemMapper.toAdminDTO(problem)

      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketDetailResponse,
        dto,
        'AdminProblemController.updateProblem',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/problems/:id
   * Delete support ticket
   */
  async deleteProblem(
    request: Request<supportCommon.ProblemIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      await this.problemService.deleteProblem(id)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
