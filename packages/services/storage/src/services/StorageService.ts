import { NODE_ENV, REDIS_DEFAULT_TTL } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import { Cache } from '@pika/redis'
import type {
  BatchUploadDTO,
  FileStorageLogDomain,
  UploadFileDTO,
} from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type {
  FileStorageLogSearchParams,
  IFileStorageLogRepository,
} from '@storage/repositories/FileStorageLogRepository.js'
import { v4 as uuid } from 'uuid'

import {
  type ProviderConfig,
  ProviderFactory,
} from './providers/ProviderFactory.js'
import type {
  FileDeleteParams,
  FileUploadParams,
  FileUrlParams,
  StorageProvider,
} from './providers/StorageProvider.js'

export interface StorageConfig {
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  bucketName?: string
  endpoint?: string
}

export interface UploadFileInput extends UploadFileDTO {
  userId?: string
  fileBuffer: Buffer
}

export interface BatchUploadInput extends Omit<BatchUploadDTO, 'files'> {
  files: Array<{
    fileName: string
    fileBuffer: Buffer
    contentType: string
    metadata?: Record<string, any>
  }>
  userId?: string
}

export interface BatchUploadResult {
  uploaded: number
  failed: number
  total: number
  logs: FileStorageLogDomain[]
}

export interface IStorageService {
  uploadFile(input: UploadFileInput): Promise<FileStorageLogDomain>
  uploadBatch(input: BatchUploadInput): Promise<BatchUploadResult>
  deleteFile(fileId: string, userId?: string): Promise<void>
  getFileUrl(
    fileId: string,
    expiresIn?: number,
    userId?: string,
  ): Promise<string>
  getFileHistory(
    userId: string,
    params: FileStorageLogSearchParams,
  ): Promise<PaginatedResult<FileStorageLogDomain>>
  getFileById(id: string, userId?: string): Promise<FileStorageLogDomain>
  serveFile(filePath: string, response: any): Promise<void>
}

export class StorageService implements IStorageService {
  private readonly providerFactory: ProviderFactory

  constructor(
    private readonly fileStorageLogRepository: IFileStorageLogRepository,
    private readonly cache: ICacheService,
    private readonly storageConfig: StorageConfig,
  ) {
    // Initialize provider factory with configuration
    const providerConfig: ProviderConfig = {
      environment: NODE_ENV as any,
      storage: {
        aws: {
          region: storageConfig.region,
          accessKeyId: storageConfig.accessKeyId,
          secretAccessKey: storageConfig.secretAccessKey,
          bucketName: storageConfig.bucketName,
          endpoint:
            storageConfig.endpoint ||
            process.env.AWS_S3_ENDPOINT ||
            process.env.AWS_ENDPOINT_URL,
        },
      },
    }

    this.providerFactory = new ProviderFactory(providerConfig)
  }

  async uploadFile(input: UploadFileInput): Promise<FileStorageLogDomain> {
    const startTime = Date.now()
    const fileId = uuid()

    let storageProvider: StorageProvider | undefined

    try {
      // Get storage provider
      storageProvider = await this.providerFactory.getStorageProvider()
      logger.info('Uploading file', {
        provider: storageProvider.getProviderName(),
        fileName: input.fileName,
        contentType: input.contentType,
        size: input.fileBuffer.length,
        folder: input.folder,
      })

      // Prepare file upload parameters
      const uploadParams: FileUploadParams = {
        fileId,
        fileName: input.fileName,
        fileBuffer: input.fileBuffer,
        contentType: input.contentType,
        metadata: input.metadata,
        folder: input.folder,
        isPublic: input.isPublic,
      }

      // Upload file using provider
      const result = await storageProvider.uploadFile(uploadParams)

      // Create file storage log
      const logData = {
        fileId,
        fileName: input.fileName,
        contentType: input.contentType,
        size: input.fileBuffer.length,
        folder: input.folder,
        isPublic: input.isPublic,
        url: result.url,
        storageKey: result.storageKey,
        status: result.success ? ('uploaded' as const) : ('failed' as const),
        userId: input.userId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        provider: storageProvider.getProviderName(),
        uploadedAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
        processingTimeMs: Date.now() - startTime,
      }

      const fileStorageLog = await this.fileStorageLogRepository.create(logData)

      if (!result.success) {
        throw ErrorFactory.badRequest(
          'File upload failed: ' + (result.error || 'Unknown error'),
        )
      }

      logger.info('File uploaded successfully', {
        fileId,
        fileName: input.fileName,
        provider: storageProvider.getProviderName(),
        url: result.url,
        processingTime: Date.now() - startTime,
      })

      return fileStorageLog
    } catch (error) {
      logger.error('Failed to upload file', error)

      // Create failed file storage log
      try {
        const logData = {
          fileId,
          fileName: input.fileName,
          contentType: input.contentType,
          size: input.fileBuffer.length,
          folder: input.folder,
          isPublic: input.isPublic,
          url: '',
          status: 'failed' as const,
          userId: input.userId,
          provider: storageProvider?.getProviderName() || 'unknown',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: Date.now() - startTime,
        }

        const fileStorageLog =
          await this.fileStorageLogRepository.create(logData)

        return fileStorageLog
      } catch (logError) {
        logger.error('Failed to create file storage log', logError)
      }

      throw ErrorFactory.fromError(error)
    }
  }

  async uploadBatch(input: BatchUploadInput): Promise<BatchUploadResult> {
    const startTime = Date.now()

    let storageProvider: StorageProvider | undefined

    try {
      // Get storage provider
      storageProvider = await this.providerFactory.getStorageProvider()
      logger.info('Uploading batch files', {
        provider: storageProvider.getProviderName(),
        fileCount: input.files.length,
        folder: input.folder,
      })

      const logs: FileStorageLogDomain[] = []

      let uploaded = 0
      let failed = 0

      for (const file of input.files) {
        const fileId = uuid()

        try {
          const uploadParams: FileUploadParams = {
            fileId,
            fileName: file.fileName,
            fileBuffer: file.fileBuffer,
            contentType: file.contentType,
            metadata: file.metadata,
            folder: input.folder,
            isPublic: input.isPublic,
          }

          const result = await storageProvider.uploadFile(uploadParams)

          const logData = {
            fileId,
            fileName: file.fileName,
            contentType: file.contentType,
            size: file.fileBuffer.length,
            folder: input.folder,
            isPublic: input.isPublic,
            url: result.url,
            status: result.success
              ? ('uploaded' as const)
              : ('failed' as const),
            userId: input.userId,
            metadata: file.metadata ? JSON.stringify(file.metadata) : undefined,
            provider: storageProvider.getProviderName(),
            uploadedAt: result.success ? new Date() : undefined,
            errorMessage: result.error,
            processingTimeMs: Date.now() - startTime,
          }

          const log = await this.fileStorageLogRepository.create(logData)

          logs.push(log)

          if (result.success) {
            uploaded++
          } else {
            failed++
          }
        } catch (fileError) {
          failed++

          const logData = {
            fileId,
            fileName: file.fileName,
            contentType: file.contentType,
            size: file.fileBuffer.length,
            folder: input.folder,
            isPublic: input.isPublic,
            url: '',
            status: 'failed' as const,
            userId: input.userId,
            provider: storageProvider.getProviderName(),
            errorMessage:
              fileError instanceof Error ? fileError.message : 'Unknown error',
            processingTimeMs: Date.now() - startTime,
          }

          const log = await this.fileStorageLogRepository.create(logData)

          logs.push(log)
        }
      }

      const summary = {
        uploaded,
        failed,
        total: input.files.length,
        logs,
      }

      logger.info('Batch upload completed', {
        ...summary,
        provider: storageProvider.getProviderName(),
        processingTime: Date.now() - startTime,
      })

      return summary
    } catch (error) {
      logger.error('Failed to upload batch files', error)
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteFile(fileId: string, userId?: string): Promise<void> {
    try {
      // Get file record
      const fileRecord =
        await this.fileStorageLogRepository.findByFileId(fileId)

      if (!fileRecord) {
        throw ErrorFactory.resourceNotFound('File', fileId)
      }

      // Check access permissions
      if (userId && fileRecord.userId !== userId) {
        throw ErrorFactory.forbidden('Access denied')
      }

      // Get storage provider
      const storageProvider = await this.providerFactory.getStorageProvider()

      // Delete file using provider
      const deleteParams: FileDeleteParams = {
        fileId,
        storageKey: fileRecord.storageKey,
        folder: fileRecord.folder,
      }

      const result = await storageProvider.deleteFile(deleteParams)

      // Update file record status
      await this.fileStorageLogRepository.updateStatus(fileId, 'deleted')

      if (!result.success) {
        throw ErrorFactory.badRequest(
          'File deletion failed: ' + (result.error || 'Unknown error'),
        )
      }

      logger.info('File deleted successfully', {
        fileId,
        provider: storageProvider.getProviderName(),
      })
    } catch (error) {
      logger.error('Failed to delete file', error)
      throw ErrorFactory.fromError(error)
    }
  }

  async getFileUrl(
    fileId: string,
    expiresIn: number = 3600,
    userId?: string,
  ): Promise<string> {
    try {
      // Get file record
      const fileRecord =
        await this.fileStorageLogRepository.findByFileId(fileId)

      if (!fileRecord) {
        throw ErrorFactory.resourceNotFound('File', fileId)
      }

      // Check access permissions for private files
      if (!fileRecord.isPublic && userId && fileRecord.userId !== userId) {
        throw ErrorFactory.forbidden('Access denied')
      }

      // Get storage provider
      const storageProvider = await this.providerFactory.getStorageProvider()

      // Get file URL using provider
      const urlParams: FileUrlParams = {
        fileId,
        storageKey: fileRecord.storageKey,
        folder: fileRecord.folder,
        expiresIn,
      }

      const result = await storageProvider.getFileUrl(urlParams)

      if (!result.success) {
        throw ErrorFactory.badRequest(
          'Failed to generate file URL: ' + (result.error || 'Unknown error'),
        )
      }

      return result.url
    } catch (error) {
      logger.error('Failed to get file URL', error)
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({ ttl: REDIS_DEFAULT_TTL, prefix: 'file-history' })
  async getFileHistory(
    userId: string,
    params: FileStorageLogSearchParams,
  ): Promise<PaginatedResult<FileStorageLogDomain>> {
    const searchParams = {
      ...params,
      userId,
    }

    return this.fileStorageLogRepository.findAll(searchParams)
  }

  async getFileById(
    id: string,
    userId?: string,
  ): Promise<FileStorageLogDomain> {
    const file = await this.fileStorageLogRepository.findById(id)

    if (!file) {
      throw ErrorFactory.resourceNotFound('File', id)
    }

    // Check access permissions
    if (userId && file.userId !== userId) {
      throw ErrorFactory.forbidden('Access denied')
    }

    return file
  }

  /**
   * Serve a file directly
   * This is used for serving static files like avatars
   */
  async serveFile(filePath: string, response: any): Promise<void> {
    try {
      logger.info('Serving file from storage', { filePath })

      // Look up the file in the database using storage key
      const fileRecords =
        await this.fileStorageLogRepository.findByStorageKey(filePath)

      if (!fileRecords.length) {
        throw new Error('File not found in storage records')
      }

      const fileRecord = fileRecords[0]

      const provider = this.providerFactory.getPrimaryProvider()

      // Get a signed URL and redirect
      const fileUrl = await provider.getFileUrl({
        fileId: fileRecord.fileId,
        storageKey: filePath,
        expiresIn: 3600,
      })

      if (fileUrl.success) {
        response.redirect(fileUrl.url)
      } else {
        throw new Error(fileUrl.error || 'Failed to get file URL')
      }
    } catch (error) {
      logger.error('Failed to serve file', { error, filePath })
      throw ErrorFactory.fromError(error)
    }
  }
}
