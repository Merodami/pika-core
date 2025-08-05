import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Reusable parameter schemas for user API endpoints
 */

/**
 * Address ID path parameter
 */
export const AddressIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Address ID path parameter',
  },
)

export type AddressIdParam = z.infer<typeof AddressIdParam>
