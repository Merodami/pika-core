import type { ICacheService } from '@pika/redis'
import type { FileStorageLogDomain } from '@pika/sdk'
import { FileStorageLogMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

export interface CreateFileStorageLogInput {
  fileId: string
  fileName: string
  contentType: string
  size: number
  folder?: string
  isPublic?: boolean
  url: string
  storageKey?: string
  status: string
  userId?: string
  metadata?: string
  provider?: string
  uploadedAt?: Date
  errorMessage?: string
  processingTimeMs?: number
}

export interface UpdateFileStorageLogInput {
  status?: string
  url?: string
  deletedAt?: Date
  errorMessage?: string
  metadata?: string
}

export interface FileStorageLogSearchParams {
  page?: number
  limit?: number
  status?: string
  userId?: string
  folder?: string
  contentType?: string
  provider?: string
  fromDate?: Date
  toDate?: Date
}

export interface IFileStorageLogRepository {
  create(data: CreateFileStorageLogInput): Promise<FileStorageLogDomain>
  findById(id: string): Promise<FileStorageLogDomain | null>
  findByFileId(fileId: string): Promise<FileStorageLogDomain | null>
  findByUser(
    userId: string,
    params: FileStorageLogSearchParams,
  ): Promise<PaginatedResult<FileStorageLogDomain>>
  findAll(
    params: FileStorageLogSearchParams,
  ): Promise<PaginatedResult<FileStorageLogDomain>>
  update(
    id: string,
    data: UpdateFileStorageLogInput,
  ): Promise<FileStorageLogDomain>
  updateStatus(
    fileId: string,
    status: string,
    errorMessage?: string,
  ): Promise<FileStorageLogDomain>
  findByStorageKey(storageKey: string): Promise<FileStorageLogDomain[]>
}

export class FileStorageLogRepository implements IFileStorageLogRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async create(data: CreateFileStorageLogInput): Promise<FileStorageLogDomain> {
    logger.info('Creating file storage log', {
      fileId: data.fileId,
      fileName: data.fileName,
      size: data.size,
    })

    try {
      const fileStorageLog = await this.prisma.fileStorageLog.create({
        data: {
          fileId: data.fileId,
          fileName: data.fileName,
          contentType: data.contentType,
          size: data.size,
          folder: data.folder,
          isPublic: data.isPublic || false,
          url: data.url,
          storageKey: data.storageKey,
          status: data.status,
          userId: data.userId,
          metadata: data.metadata,
          provider: data.provider,
          uploadedAt: data.uploadedAt,
          errorMessage: data.errorMessage,
          processingTimeMs: data.processingTimeMs,
          createdAt: new Date(),
        },
      })

      return FileStorageLogMapper.fromDocument({
        ...fileStorageLog,
        metadata: fileStorageLog.metadata as Record<string, unknown> | null,
      })
    } catch (error) {
      throw ErrorFactory.databaseError('create', 'FileStorageLog', error)
    }
  }

  async findById(id: string): Promise<FileStorageLogDomain | null> {
    try {
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (!uuidRegex.test(id)) {
        return null
      }

      const fileStorageLog = await this.prisma.fileStorageLog.findUnique({
        where: { id },
        include: {
          user: true,
        },
      })

      return fileStorageLog
        ? FileStorageLogMapper.fromDocument({
            ...fileStorageLog,
            metadata: fileStorageLog.metadata as Record<string, unknown> | null,
          })
        : null
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'FileStorageLog', error)
    }
  }

  async findByFileId(fileId: string): Promise<FileStorageLogDomain | null> {
    try {
      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (!uuidRegex.test(fileId)) {
        return null
      }

      const fileStorageLog = await this.prisma.fileStorageLog.findFirst({
        where: { fileId },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return fileStorageLog
        ? FileStorageLogMapper.fromDocument({
            ...fileStorageLog,
            metadata: fileStorageLog.metadata as Record<string, unknown> | null,
          })
        : null
    } catch (error) {
      throw ErrorFactory.databaseError('findByFileId', 'FileStorageLog', error)
    }
  }

  async findByUser(
    userId: string,
    params: FileStorageLogSearchParams,
  ): Promise<PaginatedResult<FileStorageLogDomain>> {
    const searchParams = { ...params, userId }

    return this.findAll(searchParams)
  }

  async findAll(
    params: FileStorageLogSearchParams,
  ): Promise<PaginatedResult<FileStorageLogDomain>> {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      folder,
      contentType,
      provider,
      fromDate,
      toDate,
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.FileStorageLogWhereInput = {
      ...(userId && { userId: userId }),
      ...(status && { status }),
      ...(folder && { folder }),
      ...(contentType && {
        contentType: { contains: contentType, mode: 'insensitive' },
      }),
      ...(provider && { provider }),
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
        this.prisma.fileStorageLog.findMany({
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
        this.prisma.fileStorageLog.count({ where }),
      ])

      const data = logs.map((log) =>
        FileStorageLogMapper.fromDocument({
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
      throw ErrorFactory.databaseError('findAll', 'FileStorageLog', error)
    }
  }

  async update(
    id: string,
    data: UpdateFileStorageLogInput,
  ): Promise<FileStorageLogDomain> {
    try {
      const fileStorageLog = await this.prisma.fileStorageLog.update({
        where: { id },
        data: {
          status: data.status,
          url: data.url,
          deletedAt: data.deletedAt,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
        include: {
          user: true,
        },
      })

      return FileStorageLogMapper.fromDocument({
        ...fileStorageLog,
        metadata: fileStorageLog.metadata as Record<string, unknown> | null,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('FileStorageLog', id)
        }
      }
      throw ErrorFactory.databaseError('update', 'FileStorageLog', error)
    }
  }

  async updateStatus(
    fileId: string,
    status: string,
    errorMessage?: string,
  ): Promise<FileStorageLogDomain> {
    const updateData: UpdateFileStorageLogInput = {
      status,
      ...(errorMessage && { errorMessage }),
    }

    // Set timestamp based on status
    if (status === 'deleted') {
      updateData.deletedAt = new Date()
    }

    try {
      await this.prisma.fileStorageLog.updateMany({
        where: { fileId },
        data: {
          status: updateData.status,
          deletedAt: updateData.deletedAt,
          errorMessage: updateData.errorMessage,
          updatedAt: new Date(),
        },
      })

      // Get the updated record
      const updatedRecord = await this.findByFileId(fileId)

      if (!updatedRecord) {
        throw ErrorFactory.resourceNotFound('FileStorageLog', fileId)
      }

      return updatedRecord
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('FileStorageLog', fileId)
        }
      }
      throw ErrorFactory.databaseError('updateStatus', 'FileStorageLog', error)
    }
  }

  async findByStorageKey(storageKey: string): Promise<FileStorageLogDomain[]> {
    try {
      logger.info('Finding files by storage key', { storageKey })

      const records = await this.prisma.fileStorageLog.findMany({
        where: {
          storageKey,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return records.map((record) =>
        FileStorageLogMapper.fromDocument({
          ...record,
          metadata: record.metadata as Record<string, unknown> | null,
        }),
      )
    } catch (error) {
      logger.error('Failed to find files by storage key', { error, storageKey })
      throw ErrorFactory.databaseError(
        'findByStorageKey',
        'FileStorageLog',
        error,
      )
    }
  }
}
