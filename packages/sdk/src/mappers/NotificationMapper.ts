import type { NotificationDomain } from '../domain/communication.js'
import type { NotificationDTO } from '../dto/communication.dto.js'
import type { UserDocument } from './UserMapper.js'

/**
 * Interface representing a database Notification document
 * Uses camelCase for fields as they come from Prisma
 */
export interface NotificationDocument {
  id: string
  userId: string
  type: string
  title: string
  description: string
  isRead: boolean
  metadata: any // Prisma returns JsonValue which we convert in mapper
  createdAt: Date
  updatedAt: Date | null
  readAt: Date | null
  // Relations
  user?: UserDocument
}

export class NotificationMapper {
  /**
   * Convert database document to domain entity
   */
  static fromDocument(doc: NotificationDocument): NotificationDomain {
    return {
      id: doc.id,
      subToken: undefined, // appVersion field removed
      userId: doc.userId,
      type: doc.type,
      title: doc.title,
      description: doc.description,
      global: false, // No longer in schema, default to false
      read: doc.isRead,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || undefined,
      readAt: doc.readAt || undefined,
    }
  }

  /**
   * Convert domain entity to API DTO
   */
  static toDTO(domain: NotificationDomain): NotificationDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      type: domain.type || 'inApp',
      status: 'delivered', // Default status for delivered notifications
      priority: 'normal', // Default priority
      title: domain.title,
      description: domain.description,
      isGlobal: domain.global,
      isRead: domain.read,
      readAt: domain.readAt?.toISOString(),
      metadata: domain.metadata || undefined,
      category: domain.metadata?.category || undefined,
      actionUrl: domain.metadata?.actionUrl || undefined,
      imageUrl: domain.metadata?.imageUrl || undefined,
      expiresAt: domain.metadata?.expiresAt || undefined,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
    }
  }

  /**
   * Convert API DTO to domain entity
   */
  static fromDTO(dto: NotificationDTO): NotificationDomain {
    return {
      id: dto.id,
      subToken: undefined, // Not exposed in DTO
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
      global: dto.isGlobal,
      read: dto.isRead,
      metadata: dto.metadata,
      createdAt: new Date(dto.createdAt),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    }
  }
}
