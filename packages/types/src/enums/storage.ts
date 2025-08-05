/**
 * Storage service-related enums
 */

/**
 * File type categories
 */
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * File processing status
 */
export enum FileStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

/**
 * Supported storage providers
 */
export enum StorageProvider {
  AWS_S3 = 'aws_s3',
  LOCAL = 'local',
  MINIO = 'minio',
}

/**
 * File sorting fields
 */
export enum FileSortBy {
  UPLOADED_AT = 'uploadedAt',
  FILE_SIZE = 'fileSize',
  FILE_NAME = 'fileName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * System health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Allowed MIME types for file uploads
 */
export enum AllowedMimeTypes {
  // Images
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  SVG = 'image/svg+xml',
  // Documents
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Videos
  MP4 = 'video/mp4',
  MPEG = 'video/mpeg',
  QUICKTIME = 'video/quicktime',
  AVI = 'video/x-msvideo',
  // Audio
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  OGG = 'audio/ogg',
}
