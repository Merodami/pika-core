import { supportAdmin, supportCommon } from '@pika/api'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { ProblemMapper } from '@pika/sdk'
import { ErrorFactory, logger, parseIncludeParam } from '@pika/shared'
import type { IProblemService } from '@support/services/ProblemService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin support ticket operations
 */
export class AdminSupportController {
  constructor(private readonly problemService: IProblemService) {
    // Bind methods to preserve 'this' context
    this.getAllTickets = this.getAllTickets.bind(this)
    this.getTicketById = this.getTicketById.bind(this)
    this.updateTicketStatus = this.updateTicketStatus.bind(this)
    this.assignTicket = this.assignTicket.bind(this)
  }

  /**
   * GET /admin/support/tickets
   * List all support tickets with filtering
   */
  async getAllTickets(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = getValidatedQuery<supportAdmin.AdminTicketQueryParams>(req)

      // Parse include parameter - always include user for admin tickets since userEmail is required
      const baseIncludes = 'user'
      const requestedIncludes = params.include
        ? `${baseIncludes},${params.include}`
        : baseIncludes
      const parsedIncludes = parseIncludeParam(
        requestedIncludes,
        supportAdmin.ADMIN_PROBLEM_RELATIONS as unknown as string[],
      )

      const result = await this.problemService.searchProblems({
        search: params.search,
        ticketNumber: params.ticketNumber,
        userId: params.userId,
        assignedTo: params.assignedTo,
        status: params.status,
        priority: params.priority,
        type: params.type,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
          ? (params.sortOrder.toUpperCase() as 'ASC' | 'DESC')
          : undefined,
        parsedIncludes,
      })

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, ProblemMapper.toAdminDTO)
      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketListResponse,
        response,
        'AdminSupportController.getAllTickets',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/support/tickets/:id
   * Get single ticket details
   */
  async getTicketById(
    req: Request<supportCommon.TicketIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      // Parse include parameter
      const query = getValidatedQuery<{ include?: string }>(req)
      const parsedIncludes = parseIncludeParam(
        query.include,
        supportAdmin.ADMIN_PROBLEM_RELATIONS as unknown as string[],
      )

      const problem = await this.problemService.getProblemById(
        id,
        parsedIncludes,
      )

      if (!problem) {
        throw ErrorFactory.resourceNotFound('Ticket', id)
      }

      // Transform and validate single entity response
      const responseData = ProblemMapper.toAdminDTO(problem)
      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketDetailResponse,
        responseData,
        'AdminSupportController.getTicketById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/support/tickets/:id/status
   * Update ticket status
   */
  async updateTicketStatus(
    req: Request<
      supportCommon.TicketIdParam,
      {},
      supportAdmin.UpdateTicketStatusRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { status } = req.body
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      logger.info('Admin updating ticket status', {
        ticketId: id,
        status,
        adminUserId,
      })

      const updated = await this.problemService.updateProblem(
        id,
        { status },
        { user: true },
      )

      // Transform and validate update response
      const responseData = ProblemMapper.toAdminDTO(updated)
      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketDetailResponse,
        responseData,
        'AdminSupportController.updateTicketStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/support/tickets/:id/assign
   * Assign ticket to admin user
   */
  async assignTicket(
    req: Request<
      supportCommon.TicketIdParam,
      {},
      supportAdmin.AssignTicketRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { assigneeId, priority } = req.body
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      logger.info('Admin assigning ticket', {
        ticketId: id,
        assigneeId,
        priority,
        adminUserId,
      })

      const updates: any = { assignedTo: assigneeId }

      if (priority) {
        updates.priority = priority
      }

      const updated = await this.problemService.updateProblem(id, updates, {
        user: true,
      })

      // Transform and validate assign response
      const responseData = ProblemMapper.toAdminDTO(updated)
      const validatedResponse = validateResponse(
        supportAdmin.AdminTicketDetailResponse,
        responseData,
        'AdminSupportController.assignTicket',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
