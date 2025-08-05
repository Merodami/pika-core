import type { CommunicationLogDomain } from '../domain/communication.js'
import type { CommunicationLogDTO } from '../dto/communication.dto.js'
import type { TemplateDocument } from './TemplateMapper.js'
import type { UserDocument } from './UserMapper.js'

/**
 * Interface representing a database CommunicationLog document
 * Uses camelCase for fields as they come from Prisma
 */
export interface CommunicationLogDocument {
  id: string
  userId: string | null
  type: string
  recipient: string
  subject: string | null
  templateId: string | null
  status: string
  provider: string | null
  providerId: string | null
  metadata: any // Prisma returns JsonValue which we convert in mapper
  sentAt: Date | null
  deliveredAt: Date | null
  failedAt: Date | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date | null
  // Relations
  user?: UserDocument | null
  template?: TemplateDocument | null
}

export class CommunicationLogMapper {
  /**
   * Convert database document to domain entity
   */
  static fromDocument(doc: CommunicationLogDocument): CommunicationLogDomain {
    return {
      id: doc.id,
      userId: doc.userId || undefined,
      type: doc.type,
      recipient: doc.recipient,
      subject: doc.subject || undefined,
      templateId: doc.templateId || undefined,
      status: doc.status,
      provider: doc.provider || undefined,
      providerId: doc.providerId || undefined,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      sentAt: doc.sentAt || undefined,
      deliveredAt: doc.deliveredAt || undefined,
      failedAt: doc.failedAt || undefined,
      errorMessage: doc.errorMessage || undefined,
      updatedAt: doc.updatedAt || new Date(),
    }
  }

  /**
   * Convert domain entity to API DTO
   */
  static toDTO(domain: CommunicationLogDomain): CommunicationLogDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      type: domain.type,
      recipient: domain.recipient,
      subject: domain.subject,
      templateId: domain.templateId,
      status: domain.status,
      provider: domain.provider,
      providerId: domain.providerId,
      metadata: domain.metadata,
      createdAt: domain.createdAt.toISOString(),
      sentAt: domain.sentAt?.toISOString(),
      deliveredAt: domain.deliveredAt?.toISOString(),
      failedAt: domain.failedAt?.toISOString(),
      errorMessage: domain.errorMessage,
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Convert API DTO to domain entity
   */
  static fromDTO(dto: CommunicationLogDTO): CommunicationLogDomain {
    return {
      id: dto.id,
      userId: dto.userId,
      type: dto.type,
      recipient: dto.recipient,
      subject: dto.subject,
      templateId: dto.templateId,
      status: dto.status,
      provider: dto.provider,
      providerId: dto.providerId,
      metadata: dto.metadata,
      createdAt: new Date(dto.createdAt),
      sentAt: dto.sentAt ? new Date(dto.sentAt) : undefined,
      deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
      failedAt: dto.failedAt ? new Date(dto.failedAt) : undefined,
      errorMessage: dto.errorMessage,
      updatedAt: new Date(dto.updatedAt),
    }
  }
}
