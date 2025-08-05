import {
  AllowedMimeTypes,
  FileSortBy,
  FileStatus,
  FileType,
  HealthStatus,
  StorageProvider,
} from '@pika/types'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Storage service enum schemas
 *
 * Naming convention:
 * - TypeScript enums from @pika/types: Original name (e.g., FileType)
 * - Zod schemas: Add 'Schema' suffix (e.g., FileTypeSchema)
 */

// ============= Storage Service Enum Schemas =============

/**
 * File type schema
 */
export const FileTypeSchema = openapi(createZodEnum(FileType), {
  description: 'File type category',
  example: FileType.IMAGE,
})

/**
 * File status schema
 */
export const FileStatusSchema = openapi(createZodEnum(FileStatus), {
  description: 'File processing status',
  example: FileStatus.UPLOADED,
})

/**
 * Storage provider schema
 */
export const StorageProviderSchema = openapi(createZodEnum(StorageProvider), {
  description: 'Supported storage provider',
  example: StorageProvider.AWS_S3,
})

/**
 * File sorting fields schema
 */
export const FileSortBySchema = openapi(createZodEnum(FileSortBy), {
  description: 'Field to sort files by',
  example: FileSortBy.UPLOADED_AT,
})

/**
 * Health status schema
 */
export const HealthStatusSchema = openapi(createZodEnum(HealthStatus), {
  description: 'System health status',
  example: HealthStatus.HEALTHY,
})

/**
 * Allowed MIME types schema
 */
export const AllowedMimeTypesSchema = openapi(createZodEnum(AllowedMimeTypes), {
  description: 'Allowed MIME types for file uploads',
  example: AllowedMimeTypes.JPEG,
})
