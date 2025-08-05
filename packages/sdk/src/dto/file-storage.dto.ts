// File Storage DTOs

import type { FileType } from '@pika/types'

export interface FileStorageLogDTO {
  id: string
  userId: string
  fileKey: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: FileType
  status: string
  provider: string
  bucketName?: string
  region?: string
  uploadedAt?: string
  deletedAt?: string
  metadata?: Record<string, any>
  error?: string
  createdAt: string
  updatedAt: string
}

// Request DTOs
export interface UploadFileDTO {
  fileName: string
  contentType: string
  folder?: string
  isPublic?: boolean
  metadata?: Record<string, any>
}

export interface BatchUploadDTO {
  files: Array<{
    fileName: string
    contentType: string
    metadata?: Record<string, any>
  }>
  folder?: string
  isPublic?: boolean
}

export interface FileUrlRequestDTO {
  expiresIn?: number
}

export interface FileUrlResponseDTO {
  url: string
  expiresIn: number
  expiresAt: string
}
