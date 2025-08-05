import type { SupportCommentDomain } from '../domain/supportComment.js'
import type {
  CreateSupportCommentDTO,
  SupportCommentDTO,
  UpdateSupportCommentDTO,
} from '../dto/supportComment.dto.js'
import { type UserDocument, UserMapper } from './UserMapper.js'

/**
 * Interface representing a database SupportComment document
 * Uses camelCase for fields as they come from Prisma
 */
export interface SupportCommentDocument {
  id: string
  problemId: string
  userId: string
  content: string
  isInternal: boolean
  createdAt: Date
  updatedAt: Date
  // Relations
  user?: UserDocument | null
}

export class SupportCommentMapper {
  /**
   * Convert database document to domain entity
   */
  static fromDocument(doc: SupportCommentDocument): SupportCommentDomain {
    return {
      id: doc.id,
      problemId: doc.problemId,
      userId: doc.userId,
      content: doc.content,
      isInternal: doc.isInternal,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      user: doc.user ? UserMapper.fromDocument(doc.user) : undefined,
    }
  }

  /**
   * Convert domain entity to API DTO
   */
  static toDTO(domain: SupportCommentDomain): SupportCommentDTO {
    return {
      id: domain.id,
      problemId: domain.problemId,
      userId: domain.userId,
      content: domain.content,
      isInternal: domain.isInternal,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
      user: domain.user ? UserMapper.toDTO(domain.user) : null,
    }
  }

  /**
   * Convert create DTO to domain entity
   */
  static fromCreateDTO(
    dto: CreateSupportCommentDTO,
  ): Partial<SupportCommentDomain> {
    return {
      problemId: dto.problemId,
      content: dto.content,
      isInternal: dto.isInternal,
    }
  }

  /**
   * Convert update DTO to domain entity
   */
  static fromUpdateDTO(
    dto: UpdateSupportCommentDTO,
  ): Partial<SupportCommentDomain> {
    return {
      content: dto.content,
      isInternal: dto.isInternal,
    }
  }
}
