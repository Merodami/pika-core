import type { ICacheService } from '@pika/redis'
import type { ProblemDomain } from '@pika/sdk'
import { ProblemMapper } from '@pika/sdk'
import { ErrorFactory, toPrismaInclude } from '@pika/shared'
import {
  type PaginatedResult,
  type ParsedIncludes,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'
import type { SearchParams } from '@support/types/search.js'
import { get } from 'lodash-es'

export interface CreateProblemInput {
  userId: string
  title: string
  description: string
  priority?: TicketPriority
  type?: TicketType
  files?: string[]
}

export interface UpdateProblemInput extends Partial<CreateProblemInput> {
  status?: TicketStatus
  resolvedAt?: Date | null
  assignedTo?: string | null
}

export interface ProblemSearchParams extends SearchParams {
  status?: TicketStatus
  priority?: TicketPriority
  type?: TicketType
  userId?: string
  assignedTo?: string
  ticketNumber?: string
  parsedIncludes?: ParsedIncludes
}

export interface IProblemRepository {
  findAll(params: ProblemSearchParams): Promise<PaginatedResult<ProblemDomain>>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain | null>
  findByUserId(
    userId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain[]>
  create(data: CreateProblemInput): Promise<ProblemDomain>
  update(
    id: string,
    data: UpdateProblemInput,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain>
  delete(id: string): Promise<void>
}

export class ProblemRepository implements IProblemRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Build include based on parsedIncludes parameter
   */
  private buildInclude(
    parsedIncludes?: ParsedIncludes,
  ): Prisma.ProblemInclude | undefined {
    return parsedIncludes && Object.keys(parsedIncludes).length > 0
      ? (toPrismaInclude(parsedIncludes) as Prisma.ProblemInclude)
      : undefined
  }

  /**
   * Map API sort field names to Prisma field names
   */
  private mapSortField(sortBy: string): string {
    const sortFieldMap: Record<string, string> = {
      title: 'title',
      status: 'status',
      priority: 'priority',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      resolvedAt: 'resolvedAt',
    }

    return get(sortFieldMap, sortBy, 'createdAt')
  }

  async findAll(
    params: ProblemSearchParams,
  ): Promise<PaginatedResult<ProblemDomain>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      status,
      priority,
      type,
      userId,
      assignedTo,
      ticketNumber,
      parsedIncludes,
    } = params

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ProblemWhereInput = {}

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (ticketNumber) {
      where.ticketNumber = ticketNumber
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (type) {
      where.type = type
    }

    if (userId) {
      where.userId = userId
    }

    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    const include = this.buildInclude(parsedIncludes)

    try {
      const [problems, total] = await Promise.all([
        this.prisma.problem.findMany({
          where,
          include,
          skip,
          take: limit,
          orderBy: {
            [this.mapSortField(sortBy)]: sortOrder === 'DESC' ? 'desc' : 'asc',
          },
        }),
        this.prisma.problem.count({ where }),
      ])

      const data = problems.map(ProblemMapper.fromDocument)

      const totalPages = Math.ceil(total / limit)

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError('findAll', 'Problem', error)
    }
  }

  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain | null> {
    try {
      const include = this.buildInclude(parsedIncludes)

      const problem = await this.prisma.problem.findUnique({
        where: { id },
        include,
      })

      return problem ? ProblemMapper.fromDocument(problem) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'Problem', error)
    }
  }

  async findByUserId(
    userId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain[]> {
    try {
      const problems = await this.prisma.problem.findMany({
        where: {
          userId,
        },
        include: this.buildInclude(parsedIncludes),
        orderBy: {
          createdAt: 'desc',
        },
      })

      return problems.map(ProblemMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('findByUserId', 'Problem', error)
    }
  }

  async create(data: CreateProblemInput): Promise<ProblemDomain> {
    try {
      // Validate user exists
      const userExists = await this.prisma.user.findUnique({
        where: { id: data.userId },
      })

      if (!userExists) {
        throw ErrorFactory.businessRuleViolation(
          'User not found',
          'Cannot create problem for non-existent user',
        )
      }

      const problem = await this.prisma.problem.create({
        data: {
          userId: data.userId,
          title: data.title,
          description: data.description,
          priority: data.priority || TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          type: data.type || TicketType.GENERAL,
          files: data.files || [],
        },
      })

      return ProblemMapper.fromDocument(problem)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Problem with this title already exists for this user',
            'Problem titles must be unique per user',
          )
        }
      }
      throw ErrorFactory.databaseError('create', 'Problem', error)
    }
  }

  async update(
    id: string,
    data: UpdateProblemInput,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain> {
    try {
      // Set resolvedAt automatically when status changes to RESOLVED
      const updateData: any = { ...data }

      if (data.status === TicketStatus.RESOLVED && !data.resolvedAt) {
        updateData.resolvedAt = new Date()
      } else if (data.status && data.status !== TicketStatus.RESOLVED) {
        updateData.resolvedAt = null
      }

      const include = this.buildInclude(parsedIncludes)

      const problem = await this.prisma.problem.update({
        where: { id },
        data: updateData,
        include,
      })

      return ProblemMapper.fromDocument(problem)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Problem', id)
        }
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'Problem with this title already exists for this user',
            'Problem titles must be unique per user',
          )
        }
      }
      throw ErrorFactory.databaseError('update', 'Problem', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.problem.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Problem', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'Problem', error)
    }
  }
}
