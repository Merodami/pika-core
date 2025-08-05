import type { ICacheService } from '@pika/redis'
import type { CommunicationLogDomain } from '@pika/sdk'
import { CommunicationLogMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

export interface CreateCommunicationLogInput {
  userId?: string
  type: string
  recipient: string
  subject?: string
  templateId?: string
  status: string
  metadata?: any
  provider?: string
  providerId?: string
}

export interface UpdateCommunicationLogInput {
  status?: string
  sentAt?: Date
  deliveredAt?: Date
  failedAt?: Date
  errorMessage?: string
  metadata?: any
}

export interface CommunicationLogSearchParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  userId?: string
  recipient?: string
  templateId?: string
  fromDate?: Date
  toDate?: Date
}

export interface ICommunicationLogRepository {
  create(data: CreateCommunicationLogInput): Promise<CommunicationLogDomain>
  findById(id: string): Promise<CommunicationLogDomain | null>
  findByUser(
    userId: string,
    params: CommunicationLogSearchParams,
  ): Promise<PaginatedResult<CommunicationLogDomain>>
  findAll(
    params: CommunicationLogSearchParams,
  ): Promise<PaginatedResult<CommunicationLogDomain>>
  update(
    id: string,
    data: UpdateCommunicationLogInput,
  ): Promise<CommunicationLogDomain>
  updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<CommunicationLogDomain>
}

export class CommunicationLogRepository implements ICommunicationLogRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(
    data: CreateCommunicationLogInput,
  ): Promise<CommunicationLogDomain> {
    logger.info('Creating communication log', {
      type: data.type,
      recipient: data.recipient,
    })

    try {
      const communicationLog = await this.prisma.communicationLog.create({
        data: {
          userId: data.userId,
          type: data.type,
          recipient: data.recipient,
          subject: data.subject,
          templateId: data.templateId,
          status: data.status,
          metadata: data.metadata,
          provider: data.provider,
          providerId: data.providerId,
          createdAt: new Date(),
        },
      })

      return CommunicationLogMapper.fromDocument(communicationLog)
    } catch (error) {
      throw ErrorFactory.databaseError('create', 'CommunicationLog', error)
    }
  }

  async findById(id: string): Promise<CommunicationLogDomain | null> {
    try {
      const communicationLog = await this.prisma.communicationLog.findUnique({
        where: { id },
        include: {
          user: true,
        },
      })

      return communicationLog
        ? CommunicationLogMapper.fromDocument({
            ...communicationLog,
            metadata: communicationLog.metadata as Record<
              string,
              unknown
            > | null,
          })
        : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'CommunicationLog', error)
    }
  }

  async findByUser(
    userId: string,
    params: CommunicationLogSearchParams,
  ): Promise<PaginatedResult<CommunicationLogDomain>> {
    const searchParams = { ...params, userId }

    return this.findAll(searchParams)
  }

  async findAll(
    params: CommunicationLogSearchParams,
  ): Promise<PaginatedResult<CommunicationLogDomain>> {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      userId,
      recipient,
      templateId,
      fromDate,
      toDate,
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.CommunicationLogWhereInput = {
      ...(userId && { userId: userId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(recipient && {
        recipient: { contains: recipient, mode: 'insensitive' },
      }),
      ...(templateId && { templateId: templateId }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate }),
            },
          }
        : {}),
    }

    try {
      const [logs, total] = await Promise.all([
        this.prisma.communicationLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: true,
          },
        }),
        this.prisma.communicationLog.count({ where }),
      ])

      const data = logs.map((log) =>
        CommunicationLogMapper.fromDocument({
          ...log,
          metadata: log.metadata as Record<string, unknown> | null,
        }),
      )

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      throw ErrorFactory.databaseError('findAll', 'CommunicationLog', error)
    }
  }

  async update(
    id: string,
    data: UpdateCommunicationLogInput,
  ): Promise<CommunicationLogDomain> {
    try {
      const communicationLog = await this.prisma.communicationLog.update({
        where: { id },
        data: {
          status: data.status,
          sentAt: data.sentAt,
          deliveredAt: data.deliveredAt,
          failedAt: data.failedAt,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      })

      return CommunicationLogMapper.fromDocument(communicationLog)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('CommunicationLog', id)
        }
      }
      throw ErrorFactory.databaseError('update', 'CommunicationLog', error)
    }
  }

  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<CommunicationLogDomain> {
    const updateData: UpdateCommunicationLogInput = {
      status,
      ...(errorMessage && { errorMessage }),
    }

    // Set timestamp based on status
    if (status === 'sent') {
      updateData.sentAt = new Date()
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date()
    } else if (status === 'failed') {
      updateData.failedAt = new Date()
    }

    return this.update(id, updateData)
  }
}
