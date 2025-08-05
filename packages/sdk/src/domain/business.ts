/**
 * Business Domain Models
 * These represent the core business entities used internally
 */

import type { CategoryDomain } from './category.js'
import type { UserDomain } from './user.js'

// ============= Business Domain =============

export interface BusinessDomain {
  id: string
  userId: string
  businessNameKey: string
  businessDescriptionKey: string | null
  categoryId: string
  verified: boolean
  active: boolean
  avgRating: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  // Optional relations
  user?: UserDomain
  category?: CategoryDomain
}

// ============= Business Creation and Update =============

export interface CreateBusinessData {
  userId: string
  businessNameKey: string
  businessDescriptionKey?: string | null
  categoryId: string
  verified?: boolean
  active?: boolean
}

export interface UpdateBusinessData {
  businessNameKey?: string
  businessDescriptionKey?: string | null
  categoryId?: string
  verified?: boolean
  active?: boolean
}
