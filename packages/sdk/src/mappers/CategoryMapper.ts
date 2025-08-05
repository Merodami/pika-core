import type {
  CategoryDomain,
  CreateCategoryData,
  UpdateCategoryData,
} from '../domain/category.js'
import type {
  CategoryDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '../dto/category.dto.js'

/**
 * Interface representing a database Category document
 * Uses camelCase for fields as they come from Prisma
 */
export interface CategoryDocument {
  id: string
  nameKey: string
  descriptionKey: string | null
  icon: string | null
  parentId: string | null
  isActive: boolean
  sortOrder: number
  slug: string
  level: number
  path: string
  createdBy: string
  updatedBy: string | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  // Optional relations
  parent?: CategoryDocument | null
  children?: CategoryDocument[]
}

/**
 * Category mapper that handles transformations between database, domain, and DTO layers
 */
export class CategoryMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: CategoryDocument): CategoryDomain {
    return {
      id: doc.id,
      nameKey: doc.nameKey,
      descriptionKey: doc.descriptionKey,
      icon: doc.icon,
      parentId: doc.parentId,
      isActive: doc.isActive,
      sortOrder: doc.sortOrder,
      slug: doc.slug,
      level: doc.level,
      path: doc.path,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
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
      // Relations
      parent: doc.parent ? this.fromDocument(doc.parent) : undefined,
      children: doc.children
        ? doc.children.map((child) => this.fromDocument(child))
        : undefined,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   */
  static toDTO(domain: CategoryDomain): CategoryDTO {
    const formatDate = (
      date: Date | string | undefined | null,
    ): string | undefined => {
      if (!date) return undefined
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return undefined
    }

    return {
      id: domain.id,
      nameKey: domain.nameKey,
      descriptionKey: domain.descriptionKey || undefined,
      icon: domain.icon || undefined,
      parentId: domain.parentId || undefined,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
      slug: domain.slug,
      level: domain.level,
      path: domain.path,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy || undefined,
      createdAt: formatDate(domain.createdAt) || new Date().toISOString(),
      updatedAt: formatDate(domain.updatedAt) || new Date().toISOString(),
      deletedAt: formatDate(domain.deletedAt),
      // Relations
      parent: domain.parent ? this.toDTO(domain.parent) : undefined,
      children: domain.children
        ? domain.children.map((child) => this.toDTO(child))
        : undefined,
    }
  }

  /**
   * Maps an API DTO to a domain entity
   */
  static fromDTO(dto: CategoryDTO): CategoryDomain {
    return {
      id: dto.id,
      nameKey: dto.nameKey,
      descriptionKey: dto.descriptionKey || null,
      icon: dto.icon || null,
      parentId: dto.parentId || null,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      slug: dto.slug,
      level: dto.level,
      path: dto.path,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy || null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      // Relations
      parent: dto.parent ? this.fromDTO(dto.parent) : undefined,
      children: dto.children
        ? dto.children.map((child) => this.fromDTO(child))
        : undefined,
    }
  }

  /**
   * Maps create DTO to domain create data
   */
  static fromCreateDTO(dto: CreateCategoryDTO): CreateCategoryData {
    return {
      nameKey: dto.nameKey,
      descriptionKey: dto.descriptionKey || null,
      icon: dto.icon || null,
      parentId: dto.parentId || null,
      isActive: dto.isActive || true,
      sortOrder: dto.sortOrder || 0,
      createdBy: dto.createdBy,
    }
  }

  /**
   * Maps update DTO to domain update data
   */
  static fromUpdateDTO(dto: UpdateCategoryDTO): UpdateCategoryData {
    const updates: UpdateCategoryData = {}

    if (dto.nameKey !== undefined) updates.nameKey = dto.nameKey
    if (dto.descriptionKey !== undefined)
      updates.descriptionKey = dto.descriptionKey
    if (dto.icon !== undefined) updates.icon = dto.icon
    if (dto.parentId !== undefined) updates.parentId = dto.parentId
    if (dto.isActive !== undefined) updates.isActive = dto.isActive
    if (dto.sortOrder !== undefined) updates.sortOrder = dto.sortOrder
    if (dto.updatedBy !== undefined) updates.updatedBy = dto.updatedBy

    return updates
  }

  /**
   * Transform array of documents to array of domains
   */
  static fromDocumentArray(docs: CategoryDocument[]): CategoryDomain[] {
    return docs.map((doc) => this.fromDocument(doc))
  }

  /**
   * Transform array of domains to array of DTOs
   */
  static toDTOArray(domains: CategoryDomain[]): CategoryDTO[] {
    return domains.map((domain) => this.toDTO(domain))
  }
}
