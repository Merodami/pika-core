import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'
import { Email, UserId } from './branded.js'
import { UUID } from './primitives.js'

/**
 * Shared parameter schemas used across all API tiers (public, admin, internal)
 */

// ============= Category Parameters =============

/**
 * Category ID path parameter
 */
export const CategoryIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Category ID path parameter',
  },
)

export type CategoryIdParam = z.infer<typeof CategoryIdParam>

// ============= User Parameters =============

/**
 * User ID path parameter
 */
export const UserIdParam = openapi(
  z.object({
    id: UserId,
  }),
  {
    description: 'User ID path parameter',
  },
)

export type UserIdParam = z.infer<typeof UserIdParam>

/**
 * Email path parameter
 */
export const EmailParam = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Email path parameter',
  },
)

export type EmailParam = z.infer<typeof EmailParam>

// ============= Generic Parameters =============

/**
 * Generic UUID path parameter
 */
export const UUIDParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'UUID path parameter',
  },
)

export type UUIDParam = z.infer<typeof UUIDParam>
