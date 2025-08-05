import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Category-specific parameter schemas
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

/**
 * Category path parameters
 */
export const CategoryPathParams = z.object({
  id: UUID.describe('Category ID'),
})

export type CategoryPathParams = z.infer<typeof CategoryPathParams>
