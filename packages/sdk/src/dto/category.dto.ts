/**
 * Category DTOs for API responses
 * These define the shape of data sent over the API
 */

// ============= Category DTO =============

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
  updatedAt: string
  deletedAt?: string
  // Optional relations
  parent?: CategoryDTO
  children?: CategoryDTO[]
}

// ============= Category List Response DTO =============

export interface CategoryListDTO {
  data: CategoryDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============= Category Creation Request DTO =============

export interface CreateCategoryDTO {
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  createdBy: string
}

// ============= Category Update Request DTO =============

export interface UpdateCategoryDTO {
  nameKey?: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  updatedBy?: string
}
