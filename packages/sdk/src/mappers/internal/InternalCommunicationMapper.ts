import type {
  CommunicationLogDomain,
  NotificationDomain,
} from '../../domain/communication.js'

/**
 * Internal email data DTO
 */
export interface InternalEmailDataDTO {
  id: string
  userId?: string
  type: string
  recipient: string
  subject?: string
  templateId?: string
  status: string
  sentAt?: string
  errorMessage?: string
}

/**
 * Internal notification data DTO
 */
export interface InternalNotificationDataDTO {
  id: string
  userId: string
  type: string
  title: string
  description: string
  isRead: boolean
  isGlobal: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt?: string
}

/**
 * Mapper for internal communication DTOs
 */
export class InternalCommunicationMapper {
  /**
   * Convert communication log domain to internal email DTO
   */
  static toInternalEmailDTO(
    domain: CommunicationLogDomain,
  ): InternalEmailDataDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      type: domain.type,
      recipient: domain.recipient,
      subject: domain.subject,
      templateId: domain.templateId,
      status: domain.status,
      sentAt: domain.sentAt?.toISOString(),
      errorMessage: domain.errorMessage,
    }
  }

  /**
   * Convert notification domain to internal notification DTO
   */
  static toInternalNotificationDTO(
    domain: NotificationDomain,
  ): InternalNotificationDataDTO {
    return {
      id: domain.id,
      userId: domain.userId || '',
      type: domain.type || '',
      title: domain.title || '',
      description: domain.description || '',
      isRead: domain.read,
      isGlobal: domain.global,
      metadata: domain.metadata,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt?.toISOString(),
    }
  }
}
