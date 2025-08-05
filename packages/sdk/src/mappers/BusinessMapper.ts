import type {
  BusinessDomain,
  CreateBusinessData,
  UpdateBusinessData,
} from '../domain/business.js'
import type {
  BusinessDTO,
  CreateBusinessDTO,
  UpdateBusinessDTO,
} from '../dto/business.dto.js'
import { formatDateToISO } from '../utils/dateUtils.js'
import { type CategoryDocument, CategoryMapper } from './CategoryMapper.js'
import { type UserDocument, UserMapper } from './UserMapper.js'

/**
 * Interface representing a database Business document
 * Uses camelCase for fields as they come from Prisma
 */
export interface BusinessDocument {
  id: string
  userId: string
  businessNameKey: string
  businessDescriptionKey: string | null
  categoryId: string
  verified: boolean
  active: boolean
  avgRating: number | string // Prisma Decimal comes as number or string
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  // Optional relations
  user?: UserDocument | null
  category?: CategoryDocument | null
}

/**
 * Business mapper that handles all transformations between database, domain, and DTO layers
 */
export class BusinessMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: BusinessDocument): BusinessDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      businessNameKey: doc.businessNameKey,
      businessDescriptionKey: doc.businessDescriptionKey,
      categoryId: doc.categoryId,
      verified: doc.verified,
      active: doc.active,
      avgRating: Number(doc.avgRating), // Convert Decimal to number
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt
          : doc.createdAt
            ? new Date(doc.createdAt)
            : new Date(),
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt
          : doc.updatedAt
            ? new Date(doc.updatedAt)
            : new Date(),
      deletedAt: doc.deletedAt
        ? doc.deletedAt instanceof Date
          ? doc.deletedAt
          : new Date(doc.deletedAt)
        : null,
      // Relations using existing mappers
      user: doc.user ? UserMapper.fromDocument(doc.user) : undefined,
      category: doc.category
        ? CategoryMapper.fromDocument(doc.category)
        : undefined,
    }
  }

  /**
   * Maps a domain entity to an Admin API DTO
   * Admin responses include branded types and Date objects
   */
  static toAdminDTO(domain: BusinessDomain): any {
    return {
      id: domain.id,
      userId: domain.userId,
      businessNameKey: domain.businessNameKey,
      businessDescriptionKey: domain.businessDescriptionKey || undefined,
      categoryId: domain.categoryId,
      verified: domain.verified,
      active: domain.active,
      avgRating: domain.avgRating,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt || undefined,
      // Relations using existing mappers
      user: domain.user ? UserMapper.toAdminDTO(domain.user) : undefined,
      category: domain.category
        ? CategoryMapper.toDTO(domain.category)
        : undefined,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   */
  static toDTO(domain: BusinessDomain): BusinessDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      businessNameKey: domain.businessNameKey,
      businessDescriptionKey: domain.businessDescriptionKey || undefined,
      categoryId: domain.categoryId,
      verified: domain.verified,
      active: domain.active,
      avgRating: domain.avgRating,
      createdAt: formatDateToISO(domain.createdAt),
      updatedAt: formatDateToISO(domain.updatedAt),
      deletedAt: domain.deletedAt ? formatDateToISO(domain.deletedAt) : null,
      // Relations using existing mappers
      user: domain.user ? UserMapper.toDTO(domain.user) : undefined,
      category: domain.category
        ? CategoryMapper.toDTO(domain.category)
        : undefined,
    }
  }

  /**
   * Maps an API DTO to a domain entity
   */
  static fromDTO(dto: BusinessDTO): BusinessDomain {
    return {
      id: dto.id,
      userId: dto.userId,
      businessNameKey: dto.businessNameKey,
      businessDescriptionKey: dto.businessDescriptionKey || null,
      categoryId: dto.categoryId,
      verified: dto.verified,
      active: dto.active,
      avgRating: dto.avgRating,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      // Relations using existing mappers
      user: dto.user ? UserMapper.fromDTO(dto.user) : undefined,
      category: dto.category ? CategoryMapper.fromDTO(dto.category) : undefined,
    }
  }

  /**
   * Maps create DTO to domain create data
   */
  static fromCreateDTO(dto: CreateBusinessDTO): CreateBusinessData {
    return {
      userId: dto.userId,
      businessNameKey: dto.businessNameKey,
      businessDescriptionKey: dto.businessDescriptionKey || null,
      categoryId: dto.categoryId,
      verified: dto.verified || false,
      active: dto.active || true,
    }
  }

  /**
   * Maps update DTO to domain update data
   */
  static fromUpdateDTO(dto: UpdateBusinessDTO): UpdateBusinessData {
    const updates: UpdateBusinessData = {}

    if (dto.businessNameKey !== undefined)
      updates.businessNameKey = dto.businessNameKey
    if (dto.businessDescriptionKey !== undefined)
      updates.businessDescriptionKey = dto.businessDescriptionKey
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId
    if (dto.verified !== undefined) updates.verified = dto.verified
    if (dto.active !== undefined) updates.active = dto.active

    return updates
  }

  /**
   * Transform array of documents to array of domains
   */
  static fromDocumentArray(docs: BusinessDocument[]): BusinessDomain[] {
    return docs.map((doc) => this.fromDocument(doc))
  }

  /**
   * Transform array of domains to array of DTOs
   */
  static toDTOArray(domains: BusinessDomain[]): BusinessDTO[] {
    return domains.map((domain) => this.toDTO(domain))
  }
}
