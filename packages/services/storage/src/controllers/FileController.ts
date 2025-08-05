import { storageCommon, storagePublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { FileStorageLogMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { IStorageService } from '@storage/services/StorageService.js'
import type { NextFunction, Request, Response } from 'express'

export interface IFileController {
  uploadFile(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  uploadBatch(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  deleteFile(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  getFileUrl(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  getFileHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  getFileById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
  serveFile(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>
}

/**
 * Handles file storage and retrieval operations
 */
export class FileController implements IFileController {
  constructor(private readonly storageService: IStorageService) {
    // Bind all methods to preserve 'this' context
    this.uploadFile = this.uploadFile.bind(this)
    this.uploadBatch = this.uploadBatch.bind(this)
    this.deleteFile = this.deleteFile.bind(this)
    this.getFileUrl = this.getFileUrl.bind(this)
    this.getFileHistory = this.getFileHistory.bind(this)
    this.getFileById = this.getFileById.bind(this)
    this.serveFile = this.serveFile.bind(this)
  }

  /**
   * POST /files/upload
   * Upload a single file
   */
  async uploadFile(
    request: Request<{}, {}, storagePublic.FileUploadRequest>,
    response: Response<storagePublic.FileUploadResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!request.file) {
        throw ErrorFactory.badRequest('No file provided')
      }

      const { folder, isPublic, metadata } = request.body

      // Try to get user context - first from headers (service-to-service), then from JWT (direct user)
      let userId: string | undefined

      try {
        const context = RequestContext.getContext(request)

        userId = context.userId
      } catch {
        // Not a user request, might be a service request without user context
        userId = undefined
      }

      logger.info('File upload request', {
        fileName: request.file.originalname,
        contentType: request.file.mimetype,
        size: request.file.size,
        folder,
        userId,
      })

      const result = await this.storageService.uploadFile({
        fileName: request.file.originalname,
        fileBuffer: request.file.buffer,
        contentType: request.file.mimetype,
        folder,
        isPublic: isPublic || false,
        metadata,
        userId,
      })

      // Transform FileStorageLogDomain to FileUploadResponse format
      const responseData = FileStorageLogMapper.toFileUploadResponse(result)
      const validatedResponse = validateResponse(
        storagePublic.FileUploadResponse,
        responseData,
        'FileController.uploadFile',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /files/upload-batch
   * Upload multiple files
   */
  async uploadBatch(
    request: Request<{}, {}, storagePublic.BatchFileUploadRequest>,
    response: Response<storagePublic.BatchUploadResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (
        !request.files ||
        !Array.isArray(request.files) ||
        request.files.length === 0
      ) {
        throw ErrorFactory.badRequest('No files provided')
      }

      const { folder, isPublic } = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Batch upload request', {
        fileCount: request.files.length,
        folder,
        userId,
      })

      const files = request.files.map((file: Express.Multer.File) => ({
        fileName: file.originalname,
        fileBuffer: file.buffer,
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          size: file.size,
        },
      }))

      const result = await this.storageService.uploadBatch({
        files,
        folder,
        isPublic: isPublic || false,
        userId,
      })

      // Transform BatchUploadResult to BatchUploadResponse format
      const successful: any[] = []
      const failed: any[] = []

      result.logs.forEach((log) => {
        if (log.status === 'uploaded') {
          // Convert successful uploads to FileUploadResponse format
          successful.push(FileStorageLogMapper.toFileUploadResponse(log))
        } else {
          // Convert failed uploads to error format
          failed.push({
            fileName: log.fileName,
            error: log.errorMessage || 'Upload failed',
          })
        }
      })

      const responseData = {
        successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length,
      }

      const validatedResponse = validateResponse(
        storagePublic.BatchUploadResponse,
        responseData,
        'FileController.uploadBatch',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /files/:fileId
   * Delete a file
   */
  async deleteFile(
    request: Request<storageCommon.FileIdParam>,
    response: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { fileId } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('File delete request', { fileId, userId })

      await this.storageService.deleteFile(fileId, userId)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /files/:fileId/url
   * Get signed URL for file access
   */
  async getFileUrl(
    request: Request<storageCommon.FileIdParam>,
    response: Response<storagePublic.FileUrlResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { fileId } = request.params
      const query = getValidatedQuery<storagePublic.GetFileUrlQuery>(request)
      const { expiresIn } = query
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Get file URL request', { fileId, expiresIn, userId })

      const url = await this.storageService.getFileUrl(
        fileId,
        expiresIn,
        userId,
      )

      const responseData = {
        url,
        fileId,
        fileName: '',
        mimeType: '',
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      }
      const validatedResponse = validateResponse(
        storagePublic.FileUrlResponse,
        responseData,
        'FileController.getFileUrl',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /files/history
   * Get file upload history
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'file-history',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getFileHistory(
    request: Request,
    res: Response<storagePublic.FileHistoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId
      const query =
        getValidatedQuery<storagePublic.GetFileHistoryQuery>(request)

      // Transform API query to service params
      const params = {
        page: query.page,
        limit: query.limit,
        status: query.status,
        folder: query.folder,
        contentType: query.contentType,
        provider: query.provider,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
      }

      logger.info('Getting file history', { userId, params })

      const result = await this.storageService.getFileHistory(userId, params)

      const response = paginatedResponse(result, FileStorageLogMapper.toDTO)
      const validatedResponse = validateResponse(
        storagePublic.FileHistoryResponse,
        response,
        'FileController.getFileHistory',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /files/history/:id
   * Get file details by ID
   */
  async getFileById(
    request: Request<storageCommon.FileHistoryIdParam>,
    res: Response<storagePublic.FileStorageLog>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting file by ID', { id, userId })

      const file = await this.storageService.getFileById(id, userId)

      const response = FileStorageLogMapper.toDTO(file)
      const validatedResponse = validateResponse(
        storagePublic.FileStorageLog,
        response,
        'FileController.getFileById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /uploads/*
   * Serve static files directly
   */
  async serveFile(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Get the file path from the URL
      // Remove /uploads/ prefix to get the actual path
      const filePath = request.path.replace(/^\/uploads\//, '')

      logger.info('Serving file', { filePath, url: request.path })

      // Serve the file directly from storage
      await this.storageService.serveFile(filePath, response)
    } catch (error) {
      logger.error('Error serving file', { error, path: request.path })
      next(error)
    }
  }
}
