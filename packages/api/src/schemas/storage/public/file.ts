import { FileSortBy } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  FileSortBySchema,
  FileStatusSchema,
  FileTypeSchema,
  StorageProviderSchema,
} from '../common/enums.js'

/**
 * File storage schemas for public API
 */

// Enums are now imported from common/

// ============= File Schema =============

/**
 * File storage log entry
 */
export const FileStorageLog = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    fileKey: z.string().describe('Storage key/path'),
    fileName: z.string(),
    fileSize: z.number().int().positive().describe('Size in bytes'),
    mimeType: z.string(),
    fileType: FileTypeSchema,
    status: FileStatusSchema,
    provider: StorageProviderSchema,
    bucketName: z.string().optional(),
    region: z.string().optional(),
    uploadedAt: DateTime.optional(),
    deletedAt: DateTime.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    error: z.string().optional(),
  }),
  {
    description: 'File storage log entry',
  },
)

export type FileStorageLog = z.infer<typeof FileStorageLog>

// ============= Upload Response =============

/**
 * File upload response
 */
export const FileUploadResponse = openapi(
  z.object({
    id: UUID.describe('Storage log ID'),
    fileId: UUID,
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileType: FileTypeSchema,
    status: FileStatusSchema,
    provider: StorageProviderSchema,
    url: z.string().url().optional().describe('Presigned URL if applicable'),
    uploadedAt: DateTime,
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('File metadata'),
  }),
  {
    description: 'Response after successful file upload',
  },
)

export type FileUploadResponse = z.infer<typeof FileUploadResponse>

/**
 * Batch upload response
 */
export const BatchUploadResponse = openapi(
  z.object({
    successful: z.array(FileUploadResponse),
    failed: z.array(
      z.object({
        fileName: z.string(),
        error: z.string(),
      }),
    ),
    totalUploaded: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
  }),
  {
    description: 'Response after batch file upload',
  },
)

export type BatchUploadResponse = z.infer<typeof BatchUploadResponse>

// ============= File URL Response =============

/**
 * Get file URL response
 */
export const FileUrlResponse = openapi(
  z.object({
    url: z.string().url(),
    expiresAt: DateTime,
    fileId: UUID,
    fileName: z.string(),
    mimeType: z.string(),
  }),
  {
    description: 'Presigned URL for file access',
  },
)

export type FileUrlResponse = z.infer<typeof FileUrlResponse>

// ============= Query Parameters =============

/**
 * Get file history query parameters
 */
export const GetFileHistoryQuery = openapi(
  z.object({
    status: z.string().optional(),
    folder: z.string().optional(),
    contentType: z.string().optional(),
    provider: z.string().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: FileSortBySchema.default(FileSortBy.UPLOADED_AT),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  {
    description: 'Query parameters for file history',
  },
)

export type GetFileHistoryQuery = z.infer<typeof GetFileHistoryQuery>

/**
 * File history response
 */
export const FileHistoryResponse = paginatedResponse(FileStorageLog)

export type FileHistoryResponse = z.infer<typeof FileHistoryResponse>

// Path parameters are now imported from common/

// ============= Upload Validation =============

// AllowedMimeTypes is now imported from common/

/**
 * File upload metadata
 */
export const FileUploadMetadata = openapi(
  z.object({
    category: z.string().optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string()).max(10).optional(),
    isPublic: z.boolean().default(false),
  }),
  {
    description: 'Optional metadata for file upload',
  },
)

export type FileUploadMetadata = z.infer<typeof FileUploadMetadata>

// ============= Request Schemas =============

/**
 * File upload request body schema (for multipart form data)
 */
export const FileUploadRequest = openapi(
  z.object({
    folder: z.string().optional().describe('Target folder for upload'),
    isPublic: z
      .string()
      .transform((val) => val === 'true')
      .optional()
      .describe('Whether file should be publicly accessible'),
    metadata: z
      .string()
      .transform((val) => {
        try {
          return val ? JSON.parse(val) : undefined
        } catch {
          return undefined
        }
      })
      .optional()
      .describe('JSON string of additional metadata'),
  }),
  {
    description: 'File upload request body (from multipart form)',
  },
)

export type FileUploadRequest = z.infer<typeof FileUploadRequest>

/**
 * Batch file upload request body schema
 */
export const BatchFileUploadRequest = openapi(
  z.object({
    folder: z.string().optional().describe('Target folder for uploads'),
    isPublic: z
      .string()
      .transform((val) => val === 'true')
      .optional()
      .describe('Whether files should be publicly accessible'),
  }),
  {
    description: 'Batch file upload request body',
  },
)

export type BatchFileUploadRequest = z.infer<typeof BatchFileUploadRequest>

/**
 * Get file URL query parameters
 */
export const GetFileUrlQuery = openapi(
  z.object({
    expiresIn: z.coerce
      .number()
      .int()
      .positive()
      .max(86400)
      .default(3600)
      .describe('URL expiration time in seconds'),
  }),
  {
    description: 'Query parameters for getting file URL',
  },
)

export type GetFileUrlQuery = z.infer<typeof GetFileUrlQuery>
