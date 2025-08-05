import type { TemplateDomain } from '../domain/communication.js'
import type { TemplateDTO } from '../dto/communication.dto.js'

/**
 * Interface representing a database Template document
 * Uses camelCase for fields as they come from Prisma
 */
export interface TemplateDocument {
  id: string
  name: string
  type: string
  category: string | null
  externalId: string
  subject: string | null
  body: string
  description: string | null
  variables: any // Prisma returns JsonValue which we convert in mapper
  metadata: any // Prisma returns JsonValue which we convert in mapper
  isActive: boolean
  createdAt: Date
  updatedAt: Date | null
}

export class TemplateMapper {
  /**
   * Convert database document to domain entity
   */
  static fromDocument(doc: TemplateDocument): TemplateDomain {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      category: doc.category || undefined,
      externalId: doc.externalId,
      subject: doc.subject || undefined,
      body: doc.body,
      description: doc.description || undefined,
      variables: doc.variables,
      metadata: doc.metadata,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || new Date(),
    }
  }

  /**
   * Convert domain entity to API DTO
   */
  static toDTO(domain: TemplateDomain): TemplateDTO {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      category: domain.category,
      externalId: domain.externalId,
      subject: domain.subject,
      body: domain.body,
      description: domain.description,
      variables: domain.variables,
      metadata: domain.metadata,
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Convert API DTO to domain entity
   */
  static fromDTO(dto: TemplateDTO): TemplateDomain {
    return {
      id: dto.id,
      name: dto.name,
      type: dto.type,
      category: dto.category,
      externalId: dto.externalId,
      subject: dto.subject,
      body: dto.body,
      description: dto.description,
      variables: dto.variables,
      metadata: dto.metadata,
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}
