import { FileType } from '@pika/types'

import type {
  FileStorageLogDomain,
  FileUploadDomain,
} from '../domain/file-storage.js'
import type { FileStorageLogDTO } from '../dto/file-storage.dto.js'
import type { UserDocument } from './UserMapper.js'

/**
 * Interface representing a database FileStorageLog document
 * Uses camelCase for fields as they come from Prisma
 */
export interface FileStorageLogDocument {
  id: string
  fileId: string
  fileName: string
  contentType: string
  size: number
  folder: string | null
  isPublic: boolean
  url: string
  storageKey: string | null
  status: string
  userId: string | null
  metadata: any // Prisma returns JsonValue which we convert in mapper
  provider: string | null
  uploadedAt: Date | null
  deletedAt: Date | null
  errorMessage: string | null
  processingTimeMs: number | null
  createdAt: Date
  updatedAt: Date | null
  // Relations
  user?: UserDocument | null
}

export class FileStorageLogMapper {
  /**
   * Convert database document to domain entity
   */
  static fromDocument(doc: FileStorageLogDocument): FileStorageLogDomain {
    return {
      id: doc.id,
      fileId: doc.fileId,
      fileName: doc.fileName,
      contentType: doc.contentType,
      size: doc.size,
      folder: doc.folder || undefined,
      isPublic: doc.isPublic,
      url: doc.url,
      storageKey: doc.storageKey || undefined,
      status: doc.status,
      userId: doc.userId || undefined,
      metadata: doc.metadata,
      provider: doc.provider || undefined,
      uploadedAt: doc.uploadedAt || undefined,
      deletedAt: doc.deletedAt || undefined,
      errorMessage: doc.errorMessage || undefined,
      processingTimeMs: doc.processingTimeMs || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || new Date(),
    }
  }

  /**
   * Convert FileStorageLogDomain to FileUploadDomain for API responses
   */
  static toFileUploadDomain(log: FileStorageLogDomain): FileUploadDomain {
    return {
      fileId: log.fileId,
      fileKey: log.storageKey || log.fileId,
      fileName: log.fileName,
      fileSize: log.size,
      mimeType: log.contentType,
      fileType: FileStorageLogMapper.determineFileType(log.contentType) as any,
      url: log.url,
      uploadedAt: log.uploadedAt || log.createdAt,
    }
  }

  /**
   * Convert FileUploadDomain to API DTO
   */
  static fileUploadToDTO(domain: FileUploadDomain) {
    return {
      fileId: domain.fileId,
      fileKey: domain.fileKey,
      fileName: domain.fileName,
      fileSize: domain.fileSize,
      mimeType: domain.mimeType,
      fileType: domain.fileType,
      url: domain.url,
      uploadedAt: domain.uploadedAt.toISOString(),
    }
  }

  /**
   * Convert FileStorageLogDomain to FileUploadResponse format
   * Used for upload endpoints that return a different schema
   */
  static toFileUploadResponse(domain: FileStorageLogDomain) {
    // Parse metadata if it's a string (from database)
    let parsedMetadata: Record<string, any> | undefined

    if (domain.metadata) {
      try {
        if (typeof domain.metadata === 'string') {
          parsedMetadata = JSON.parse(domain.metadata)
        } else {
          parsedMetadata = domain.metadata
        }
      } catch {
        parsedMetadata = undefined
      }
    }

    return {
      id: domain.id,
      fileId: domain.fileId,
      fileKey: domain.storageKey || domain.fileId,
      fileName: domain.fileName,
      fileSize: domain.size,
      mimeType: domain.contentType,
      fileType: FileStorageLogMapper.determineFileType(domain.contentType),
      status: domain.status,
      provider: domain.provider || 'local',
      url: domain.url,
      uploadedAt: (domain.uploadedAt || domain.createdAt).toISOString(),
      metadata: parsedMetadata,
    }
  }

  /**
   * Helper to determine file type from MIME type using FileType enum
   */
  private static determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE
    if (mimeType.startsWith('video/')) return FileType.VIDEO
    if (mimeType.startsWith('audio/')) return FileType.AUDIO
    if (
      mimeType === 'application/pdf' ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('word') ||
      mimeType.includes('excel')
    )
      return FileType.DOCUMENT

    return FileType.OTHER
  }

  /**
   * Convert domain entity to API DTO
   */
  static toDTO(domain: FileStorageLogDomain): FileStorageLogDTO {
    // Parse metadata if it's a string (from database)
    let parsedMetadata: Record<string, any> | undefined

    if (domain.metadata) {
      try {
        if (typeof domain.metadata === 'string') {
          parsedMetadata = JSON.parse(domain.metadata)
        } else {
          parsedMetadata = domain.metadata
        }
      } catch {
        parsedMetadata = undefined
      }
    }

    return {
      id: domain.id,
      userId: domain.userId || '',
      fileKey: domain.storageKey || domain.fileId,
      fileName: domain.fileName,
      fileSize: domain.size,
      mimeType: domain.contentType,
      fileType: FileStorageLogMapper.determineFileType(domain.contentType),
      status: domain.status,
      provider: domain.provider || 'local',
      bucketName: undefined,
      region: undefined,
      uploadedAt: domain.uploadedAt?.toISOString(),
      deletedAt: domain.deletedAt?.toISOString(),
      metadata: parsedMetadata,
      error: domain.errorMessage,
      createdAt: domain.createdAt.toISOString(),
      updatedAt:
        domain.updatedAt?.toISOString() || domain.createdAt.toISOString(),
    }
  }

  /**
   * Convert API DTO to domain entity
   */
  static fromDTO(dto: FileStorageLogDTO): FileStorageLogDomain {
    return {
      id: dto.id,
      fileId: dto.fileKey, // API uses fileKey, domain uses fileId
      fileName: dto.fileName,
      contentType: dto.mimeType, // API uses mimeType, domain uses contentType
      size: dto.fileSize, // API uses fileSize, domain uses size
      folder: undefined, // Not in API DTO
      isPublic: true, // Default value, not in API DTO
      url: '', // Not in API DTO, should come from different source
      storageKey: dto.fileKey, // API uses fileKey
      status: dto.status,
      userId: dto.userId || undefined,
      metadata: dto.metadata,
      provider: dto.provider,
      uploadedAt: dto.uploadedAt ? new Date(dto.uploadedAt) : undefined,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : undefined,
      errorMessage: dto.error, // API uses error, domain uses errorMessage
      processingTimeMs: undefined, // Not in API DTO
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}
