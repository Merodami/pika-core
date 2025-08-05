import { SortOrder } from '@pika/types'
import { FileSortBy, FileStatus, FileType, StorageProvider } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { SortOrderSchema } from '../../common/enums.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  FileSortBySchema,
  FileStatusSchema,
  FileTypeSchema,
  StorageProviderSchema,
} from '../common/enums.js'

/**
 * Storage service admin management schemas
 */

// ============= Constants =============

export const ADMIN_FILE_RELATIONS = ['user'] as const

// ============= Admin File Management =============

export const AdminFileDetailResponse = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    userName: z.string().optional(),
    userEmail: z.string().email().optional(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
    mimeType: z.string(),
    fileType: FileTypeSchema,
    status: FileStatusSchema,
    provider: StorageProviderSchema,
    bucketName: z.string().optional(),
    region: z.string().optional(),
    uploadedAt: DateTime.optional(),
    deletedAt: DateTime.optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    error: z.string().optional(),
    isPublic: z.boolean().default(false),
    downloadCount: z.number().int().nonnegative().default(0),
    lastAccessedAt: DateTime.optional(),
  }),
  {
    description: 'Admin file details with user information',
  },
)
export type AdminFileDetailResponse = z.infer<typeof AdminFileDetailResponse>

// ============= Admin File Search =============

export const AdminFileQueryParams = openapi(
  z.object({
    search: z.string().optional().describe('Search in filename or file key'),
    userId: UserId.optional(),
    fileType: FileTypeSchema.optional(),
    status: FileStatusSchema.optional(),
    provider: StorageProviderSchema.optional(),
    mimeType: z.string().optional(),
    minSize: z.coerce.number().int().positive().optional(),
    maxSize: z.coerce.number().int().positive().optional(),
    isPublic: z.coerce.boolean().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: FileSortBySchema.default(FileSortBy.UPLOADED_AT),
    sortOrder: SortOrderSchema.default(SortOrder.DESC),
    ...createIncludeParam(ADMIN_FILE_RELATIONS).shape,
  }),
  {
    description: 'Admin file search parameters',
  },
)
export type AdminFileQueryParams = z.infer<typeof AdminFileQueryParams>

export const AdminFileListResponse = paginatedResponse(AdminFileDetailResponse)
export type AdminFileListResponse = z.infer<typeof AdminFileListResponse>

// ============= Admin File Actions =============

export const AdminUpdateFileRequest = openapi(
  z.object({
    fileName: z.string().optional(),
    status: FileStatusSchema.optional(),
    isPublic: z.boolean().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  }),
  {
    description: 'Admin update file details',
  },
)
export type AdminUpdateFileRequest = z.infer<typeof AdminUpdateFileRequest>

export const AdminBulkFileActionRequest = openapi(
  z.object({
    fileIds: z.array(UUID).min(1).max(100),
    action: z.enum(['delete', 'make_public', 'make_private', 'change_status']),
    newStatus: FileStatusSchema.optional(),
  }),
  {
    description: 'Bulk action on multiple files',
  },
)
export type AdminBulkFileActionRequest = z.infer<
  typeof AdminBulkFileActionRequest
>

export const AdminBulkFileActionResponse = openapi(
  z.object({
    successful: z.array(UUID),
    failed: z.array(
      z.object({
        fileId: UUID,
        error: z.string(),
      }),
    ),
    totalProcessed: z.number().int().nonnegative(),
    totalSuccessful: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
  }),
  {
    description: 'Bulk file action results',
  },
)
export type AdminBulkFileActionResponse = z.infer<
  typeof AdminBulkFileActionResponse
>

// ============= Storage Analytics =============

export const StorageAnalyticsResponse = openapi(
  z.object({
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    totalFiles: z.number().int().nonnegative(),
    totalSize: z.number().int().nonnegative().describe('Total size in bytes'),
    newFiles: z.number().int().nonnegative(),
    deletedFiles: z.number().int().nonnegative(),
    averageFileSize: z.number().optional().describe('Average size in bytes'),
    filesByType: z.object({
      [FileType.IMAGE]: z.number().int().nonnegative().optional(),
      [FileType.VIDEO]: z.number().int().nonnegative().optional(),
      [FileType.DOCUMENT]: z.number().int().nonnegative().optional(),
      [FileType.AUDIO]: z.number().int().nonnegative().optional(),
      [FileType.OTHER]: z.number().int().nonnegative().optional(),
    }),
    filesByStatus: z.object({
      [FileStatus.PENDING]: z.number().int().nonnegative().optional(),
      [FileStatus.UPLOADED]: z.number().int().nonnegative().optional(),
      [FileStatus.PROCESSING]: z.number().int().nonnegative().optional(),
      [FileStatus.PROCESSED]: z.number().int().nonnegative().optional(),
      [FileStatus.FAILED]: z.number().int().nonnegative().optional(),
      [FileStatus.DELETED]: z.number().int().nonnegative().optional(),
    }),
    filesByProvider: z.object({
      [StorageProvider.AWS_S3]: z.number().int().nonnegative().optional(),
      [StorageProvider.LOCAL]: z.number().int().nonnegative().optional(),
      [StorageProvider.MINIO]: z.number().int().nonnegative().optional(),
    }),
    storageByProvider: z.object({
      [StorageProvider.AWS_S3]: z.number().int().nonnegative().optional(),
      [StorageProvider.LOCAL]: z.number().int().nonnegative().optional(),
      [StorageProvider.MINIO]: z.number().int().nonnegative().optional(),
    }),
    topUsers: z
      .array(
        z.object({
          userId: UserId,
          userName: z.string(),
          fileCount: z.number().int().nonnegative(),
          totalSize: z.number().int().nonnegative(),
        }),
      )
      .max(10),
  }),
  {
    description: 'Storage usage analytics',
  },
)
export type StorageAnalyticsResponse = z.infer<typeof StorageAnalyticsResponse>

// ============= Storage Configuration =============

export const StorageConfigurationResponse = openapi(
  z.object({
    providers: z.array(
      z.object({
        name: StorageProviderSchema,
        isActive: z.boolean(),
        isDefault: z.boolean(),
        config: z.object({
          bucket: z.string().optional(),
          region: z.string().optional(),
          endpoint: z.string().optional(),
          maxFileSize: z.number().int().positive(),
          allowedMimeTypes: z.array(z.string()),
        }),
      }),
    ),
    globalSettings: z.object({
      maxFileSize: z.number().int().positive(),
      maxFilesPerUser: z.number().int().positive().optional(),
      defaultExpiration: z.number().int().positive(),
      compressionEnabled: z.boolean(),
      virusScanEnabled: z.boolean(),
    }),
  }),
  {
    description: 'Storage service configuration',
  },
)
export type StorageConfigurationResponse = z.infer<
  typeof StorageConfigurationResponse
>

export const UpdateStorageConfigurationRequest = openapi(
  z.object({
    provider: StorageProviderSchema,
    config: z
      .object({
        bucket: z.string().optional(),
        region: z.string().optional(),
        endpoint: z.string().optional(),
        maxFileSize: z.number().int().positive().optional(),
        allowedMimeTypes: z.array(z.string()).optional(),
      })
      .optional(),
    globalSettings: z
      .object({
        maxFileSize: z.number().int().positive().optional(),
        maxFilesPerUser: z.number().int().positive().optional(),
        defaultExpiration: z.number().int().positive().optional(),
        compressionEnabled: z.boolean().optional(),
        virusScanEnabled: z.boolean().optional(),
      })
      .optional(),
  }),
  {
    description: 'Update storage configuration',
  },
)
export type UpdateStorageConfigurationRequest = z.infer<
  typeof UpdateStorageConfigurationRequest
>
