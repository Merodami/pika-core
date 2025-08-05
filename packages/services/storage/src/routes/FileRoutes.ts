import { storageCommon, storagePublic } from '@pika/api'
import {
  allowServiceOrUserAuth,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { ErrorFactory } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { FileController } from '@storage/controllers/FileController.js'
import { FileStorageLogRepository } from '@storage/repositories/FileStorageLogRepository.js'
import {
  type StorageConfig,
  StorageService,
} from '@storage/services/StorageService.js'
import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

// Multer error handler middleware
function handleMulterError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const error = ErrorFactory.badRequest('File size exceeds limit of 10MB', {
        httpStatus: 413,
        source: 'multer',
        metadata: { code: err.code },
      })

      return next(error)
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      const error = ErrorFactory.badRequest('Too many files uploaded', {
        httpStatus: 413,
        source: 'multer',
        metadata: { code: err.code },
      })

      return next(error)
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      const error = ErrorFactory.badRequest(`Unexpected field: ${err.field}`)

      return next(error)
    }
  }
  next(err)
}

export function createFileRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  storageConfig: StorageConfig,
): Router {
  const router = Router()

  // Initialize repositories
  const fileStorageLogRepository = new FileStorageLogRepository(prisma, cache)

  // Initialize service
  const storageService = new StorageService(
    fileStorageLogRepository,
    cache,
    storageConfig,
  )

  // Initialize controller
  const controller = new FileController(storageService)

  // File routes
  router.post(
    '/upload',
    allowServiceOrUserAuth(),
    upload.single('file'),
    handleMulterError,
    validateBody(storagePublic.FileUploadRequest),
    controller.uploadFile,
  )

  router.post(
    '/upload-batch',
    allowServiceOrUserAuth(),
    upload.array('files', 10), // Maximum 10 files
    handleMulterError,
    validateBody(storagePublic.BatchFileUploadRequest),
    controller.uploadBatch,
  )

  router.delete(
    '/:fileId',
    requireAuth(),
    validateParams(storageCommon.FileIdParam),
    controller.deleteFile,
  )

  router.get(
    '/:fileId/url',
    requireAuth(),
    validateParams(storageCommon.FileIdParam),
    validateQuery(storagePublic.GetFileUrlQuery),
    controller.getFileUrl,
  )

  router.get(
    '/history',
    requireAuth(),
    validateQuery(storagePublic.GetFileHistoryQuery),
    controller.getFileHistory,
  )

  router.get(
    '/history/:id',
    requireAuth(),
    validateParams(storageCommon.FileHistoryIdParam),
    controller.getFileById,
  )

  return router
}
