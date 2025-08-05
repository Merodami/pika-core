/**
 * Business DTOs for API responses
 * These define the shape of data sent over the API
 */

import type { CategoryDTO } from './category.dto.js'
import type { UserDTO } from './user.dto.js'

// ============= Business DTO =============

export interface BusinessDTO {
  id: string
  userId: string
  businessNameKey: string
  businessDescriptionKey?: string
  categoryId: string
  verified: boolean
  active: boolean
  avgRating: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  // Optional relations
  user?: UserDTO
  category?: CategoryDTO
}

// ============= Business List Response DTO =============

export interface BusinessListDTO {
  data: BusinessDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============= Business Creation Request DTO =============

export interface CreateBusinessDTO {
  userId: string
  businessNameKey: string
  businessDescriptionKey?: string
  categoryId: string
  verified?: boolean
  active?: boolean
}

// ============= Business Update Request DTO =============

export interface UpdateBusinessDTO {
  businessNameKey?: string
  businessDescriptionKey?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}
