/**
 * Domain interfaces for Category service
 */

// ============= Repository Interfaces =============

/**
 * Category repository interface
 */
export interface ICategoryRepository {
  /**
   * Get all categories with optional filtering and pagination
   */
  findAll(params: CategorySearchParams): Promise<PaginatedResult<Category>>

  /**
   * Get category by ID
   */
  findById(id: string): Promise<Category | null>

  /**
   * Get multiple categories by IDs
   */
  findByIds(ids: string[]): Promise<PaginatedResult<Category>>

  /**
   * Create new category
   */
  create(data: CreateCategoryData): Promise<Category>

  /**
   * Update category by ID
   */
  update(id: string, data: UpdateCategoryData): Promise<Category>

  /**
   * Delete category by ID
   */
  delete(id: string): Promise<void>

  /**
   * Check if category exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Get category hierarchy (children)
   */
  getHierarchy(rootId?: string): Promise<Category[]>

  /**
   * Get category path (breadcrumb)
   */
  getPath(id: string): Promise<Category[]>
}

// ============= Service Interfaces =============

/**
 * Category service interface
 */
export interface ICategoryService {
  /**
   * Get all categories
   */
  getAllCategories(
    params: CategorySearchParams,
  ): Promise<PaginatedResult<Category>>

  /**
   * Get category by ID
   */
  getCategoryById(id: string): Promise<Category>

  /**
   * Get multiple categories by IDs
   */
  getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>>

  /**
   * Create new category
   */
  createCategory(data: CreateCategoryData): Promise<Category>

  /**
   * Update category
   */
  updateCategory(id: string, data: UpdateCategoryData): Promise<Category>

  /**
   * Delete category
   */
  deleteCategory(id: string): Promise<void>

  /**
   * Toggle category active status
   */
  toggleCategoryStatus(id: string): Promise<Category>

  /**
   * Move category to new parent
   */
  moveCategory(id: string, newParentId: string | null): Promise<Category>

  /**
   * Update category sort order
   */
  updateCategorySortOrder(id: string, sortOrder: number): Promise<Category>

  /**
   * Check if category exists and is active
   */
  categoryExists(id: string): Promise<boolean>

  /**
   * Get category hierarchy
   */
  getCategoryHierarchy(rootId?: string | null): Promise<Category[]>

  /**
   * Get category path (breadcrumb)
   */
  getCategoryPath(id: string): Promise<Category[]>
}

// ============= Domain Types =============

/**
 * Category domain entity
 */
export interface Category {
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
  createdAt: Date
  updatedAt: Date | null
  children?: Category[]
}

/**
 * Category search parameters
 */
export interface CategorySearchParams {
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
 * Create category data
 */
export interface CreateCategoryData {
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  createdBy: string
}

/**
 * Update category data
 */
export interface UpdateCategoryData {
  nameKey?: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  updatedBy?: string
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Category validation result
 */
export interface ValidationResult {
  valid: string[]
  invalid: string[]
  categories: Category[]
}
