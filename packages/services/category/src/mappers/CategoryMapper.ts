import type {
  Category as CategoryDomain,
  CategorySearchParams,
  CreateCategoryData,
  PaginatedResult,
  UpdateCategoryData,
  ValidationResult,
} from '@category/types/interfaces.js'
import type { Category } from '@prisma/client'

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
  createdAt: Date
  updatedAt: Date | null
}

/**
 * Interface for API category DTO
 */
export interface CategoryDTO {
  id: string
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  slug: string
  level: number
  path: string
  createdBy: string
  updatedBy?: string
  createdAt: string
  updatedAt: string | null
  children?: CategoryDTO[]
}

/**
 * Interface for internal category DTO (service-to-service communication)
 */
export interface InternalCategoryDTO {
  id: string
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
}

/**
 * Interface for category search params from API
 */
export interface CategorySearchParamsDTO {
  search?: string
  parentId?: string
  isActive?: boolean
  createdBy?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Interface for create category request from API
 */
export interface CreateCategoryRequestDTO {
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * Interface for update category request from API
 */
export interface UpdateCategoryRequestDTO {
  nameKey?: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * Comprehensive Category mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 * - API request DTOs to domain data
 */
export class CategoryMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: CategoryDocument): CategoryDomain {
    return {
      id: doc.id,
      nameKey: doc.nameKey,
      descriptionKey: doc.descriptionKey || undefined,
      icon: doc.icon || undefined,
      parentId: doc.parentId || undefined,
      isActive: doc.isActive,
      sortOrder: doc.sortOrder,
      slug: doc.slug,
      level: doc.level,
      path: doc.path,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy || undefined,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt: doc.updatedAt
        ? doc.updatedAt instanceof Date
          ? doc.updatedAt
          : new Date(doc.updatedAt)
        : null,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms and handles date formatting
   */
  static toDTO(domain: CategoryDomain): CategoryDTO {
    const formatDate = (date: Date | string | undefined | null): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return new Date().toISOString()
    }

    return {
      id: domain.id,
      nameKey: domain.nameKey,
      descriptionKey: domain.descriptionKey,
      icon: domain.icon,
      parentId: domain.parentId,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
      slug: domain.slug,
      level: domain.level,
      path: domain.path,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
      createdAt: formatDate(domain.createdAt),
      updatedAt: domain.updatedAt ? formatDate(domain.updatedAt) : null,
      children: domain.children
        ? domain.children.map((child) => this.toDTO(child))
        : undefined,
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms and handles date parsing
   */
  static fromDTO(dto: CategoryDTO): CategoryDomain {
    return {
      id: dto.id,
      nameKey: dto.nameKey,
      descriptionKey: dto.descriptionKey,
      icon: dto.icon,
      parentId: dto.parentId,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      slug: dto.slug,
      level: dto.level,
      path: dto.path,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
      createdAt: new Date(dto.createdAt),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
      children: dto.children
        ? dto.children.map((child) => this.fromDTO(child))
        : undefined,
    }
  }

  /**
   * Maps API search params to domain search params
   */
  static fromSearchParamsDTO(
    dto: CategorySearchParamsDTO,
  ): CategorySearchParams {
    return {
      search: dto.search,
      parentId: dto.parentId,
      isActive: dto.isActive,
      createdBy: dto.createdBy,
      page: dto.page || 1,
      limit: dto.limit || 20,
      sortBy: dto.sortBy || 'sortOrder',
      sortOrder: dto.sortOrder || 'asc',
    }
  }

  /**
   * Maps API create request to domain create data
   */
  static fromCreateRequestDTO(
    dto: CreateCategoryRequestDTO,
    createdBy: string,
  ): CreateCategoryData {
    return {
      nameKey: dto.nameKey,
      descriptionKey: dto.descriptionKey,
      icon: dto.icon,
      parentId: dto.parentId,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      createdBy,
    }
  }

  /**
   * Maps API update request to domain update data
   */
  static fromUpdateRequestDTO(
    dto: UpdateCategoryRequestDTO,
    updatedBy: string,
  ): UpdateCategoryData {
    return {
      nameKey: dto.nameKey,
      descriptionKey: dto.descriptionKey,
      icon: dto.icon,
      parentId: dto.parentId,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
      updatedBy,
    }
  }

  /**
   * Maps domain paginated result to API paginated response
   */
  static toPaginatedDTO(
    result: PaginatedResult<CategoryDomain>,
  ): PaginatedResult<CategoryDTO> {
    return {
      data: result.data.map((category) => this.toDTO(category)),
      pagination: result.pagination,
    }
  }

  /**
   * Maps domain validation result to API validation response
   */
  static toValidationDTO(result: ValidationResult): {
    valid: string[]
    invalid: string[]
    categories: CategoryDTO[]
  } {
    return {
      valid: result.valid,
      invalid: result.invalid,
      categories: result.categories.map((category) => this.toDTO(category)),
    }
  }

  /**
   * Maps array of domain categories to array of DTOs
   */
  static toDTOArray(categories: CategoryDomain[]): CategoryDTO[] {
    return categories.map((category) => this.toDTO(category))
  }

  /**
   * Maps array of DTOs to array of domain categories
   */
  static fromDTOArray(dtos: CategoryDTO[]): CategoryDomain[] {
    return dtos.map((dto) => this.fromDTO(dto))
  }

  /**
   * Maps Prisma Category to CategoryDocument (for type safety)
   */
  static fromPrismaCategory(category: Category): CategoryDocument {
    return {
      id: category.id,
      nameKey: category.nameKey,
      descriptionKey: category.descriptionKey,
      icon: category.icon,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      slug: category.slug,
      level: category.level,
      path: category.path,
      createdBy: category.createdBy,
      updatedBy: category.updatedBy,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }
  }

  /**
   * Maps array of Prisma Categories to Domain Categories
   */
  static fromPrismaCategoryArray(categories: Category[]): CategoryDomain[] {
    return categories.map((category) =>
      this.fromDocument(this.fromPrismaCategory(category)),
    )
  }

  /**
   * Build hierarchical structure from flat array
   */
  static buildHierarchy(categories: CategoryDomain[]): CategoryDomain[] {
    const categoryMap = new Map<string, CategoryDomain>()
    const rootCategories: CategoryDomain[] = []

    // Create a map of all categories
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // Build hierarchy
    categories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id)!

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)

        if (parent) {
          parent.children = parent.children || []
          parent.children.push(categoryWithChildren)
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })

    return rootCategories
  }

  /**
   * Flatten hierarchical structure to flat array
   */
  static flattenHierarchy(categories: CategoryDomain[]): CategoryDomain[] {
    const result: CategoryDomain[] = []

    const flatten = (cats: CategoryDomain[]) => {
      cats.forEach((category) => {
        const { children, ...categoryWithoutChildren } = category

        result.push(categoryWithoutChildren)

        if (children && children.length > 0) {
          flatten(children)
        }
      })
    }

    flatten(categories)

    return result
  }

  /**
   * Convert domain entity to internal DTO for service-to-service communication
   */
  static toInternalDTO(domain: CategoryDomain): InternalCategoryDTO {
    return {
      id: domain.id,
      nameKey: domain.nameKey,
      descriptionKey: domain.descriptionKey,
      icon: domain.icon,
      parentId: domain.parentId,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
    }
  }
}
