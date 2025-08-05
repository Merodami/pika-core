/**
 * Category Domain Models
 * These represent the core business entities used internally
 */

// ============= Category Domain =============

export interface CategoryDomain {
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
  updatedAt: Date
  deletedAt: Date | null
  // Optional relations
  parent?: CategoryDomain
  children?: CategoryDomain[]
}

// ============= Category Creation and Update =============

export interface CreateCategoryData {
  nameKey: string
  descriptionKey?: string | null
  icon?: string | null
  parentId?: string | null
  isActive?: boolean
  sortOrder?: number
  createdBy: string
}

export interface UpdateCategoryData {
  nameKey?: string
  descriptionKey?: string | null
  icon?: string | null
  parentId?: string | null
  isActive?: boolean
  sortOrder?: number
  updatedBy?: string
}
