import type { ICacheService } from '@pika/redis'
import type { NotificationDomain } from '@pika/sdk'
import { NotificationMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

export interface CreateNotificationInput {
  userId?: string // Optional for global notifications
  type?: string
  title: string
  description: string
  metadata?: any
  isGlobal?: boolean
}

export interface UpdateNotificationInput {
  isRead?: boolean
  metadata?: any
}

export interface NotificationSearchParams {
  page?: number
  limit?: number
  type?: string
  isRead?: boolean
  fromDate?: Date
  toDate?: Date
}

export interface INotificationRepository {
  create(data: CreateNotificationInput): Promise<NotificationDomain>
  findById(id: string): Promise<NotificationDomain | null>
  findByUser(
    userId: string,
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>>
  findAll(
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>>
  update(id: string, data: UpdateNotificationInput): Promise<NotificationDomain>
  markAsRead(id: string): Promise<NotificationDomain>
  markAllAsRead(userId: string): Promise<number>
  delete(id: string): Promise<void>
  findUserByEmail(email: string): Promise<{ id: string } | null>
}

export class NotificationRepository implements INotificationRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(data: CreateNotificationInput): Promise<NotificationDomain> {
    logger.info('Creating notification', {
      userId: data.userId,
      type: data.type,
    })

    try {
      if (!data.userId) {
        throw ErrorFactory.badRequest('userId is required for notifications')
      }

      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type || 'general',
          title: data.title,
          description: data.description,
          isRead: false,
          metadata: data.metadata,
        },
      })

      return NotificationMapper.fromDocument(notification)
    } catch (error) {
      throw ErrorFactory.databaseError('create', 'Notification', error)
    }
  }

  async findById(id: string): Promise<NotificationDomain | null> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      })

      return notification ? NotificationMapper.fromDocument(notification) : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'Notification', error)
    }
  }

  async findByUser(
    userId: string,
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>> {
    const searchParams = { ...params }
    const where: Prisma.NotificationWhereInput = {
      userId: userId,
    }

    return this.findAllWithWhere(where, searchParams)
  }

  async findAll(
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>> {
    const where: Prisma.NotificationWhereInput = {}

    // global field no longer exists in schema

    return this.findAllWithWhere(where, params)
  }

  private async findAllWithWhere(
    where: Prisma.NotificationWhereInput,
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>> {
    const { page = 1, limit = 20, isRead, fromDate, toDate } = params

    const skip = (page - 1) * limit

    // Add additional filters to where clause
    if (isRead !== undefined) {
      where.isRead = isRead
    }

    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      }
    }

    try {
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.notification.count({ where }),
      ])

      const data = notifications.map(NotificationMapper.fromDocument)

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
      throw ErrorFactory.databaseError('findAll', 'Notification', error)
    }
  }

  async update(
    id: string,
    data: UpdateNotificationInput,
  ): Promise<NotificationDomain> {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: {
          isRead: data.isRead,
          updatedAt: new Date(),
        },
      })

      return NotificationMapper.fromDocument(notification)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Notification', id)
        }
      }
      throw ErrorFactory.databaseError('update', 'Notification', error)
    }
  }

  async markAsRead(id: string): Promise<NotificationDomain> {
    try {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return NotificationMapper.fromDocument(notification)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Notification', id)
        }
      }
      throw ErrorFactory.databaseError('markAsRead', 'Notification', error)
    }
  }

  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        },
      })

      return result.count
    } catch (error) {
      throw ErrorFactory.databaseError('markAllAsRead', 'Notification', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.notification.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Notification', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'Notification', error)
    }
  }

  async findUserByEmail(email: string): Promise<{ id: string } | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
        },
      })

      return user ? { id: user.id } : null
    } catch (error) {
      throw ErrorFactory.databaseError('findUserByEmail', 'User', error)
    }
  }

  async findUserById(userId: string): Promise<{ id: string } | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: {
          id: true,
        },
      })

      return user ? { id: user.id } : null
    } catch (error) {
      throw ErrorFactory.databaseError('findUserById', 'User', error)
    }
  }
}
