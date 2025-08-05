import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, UserId } from '../../shared/branded.js'

/**
 * Path parameter schemas for user admin routes
 */

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

/**
 * Sub token path parameter
 */
export const SubTokenParam = openapi(
  z.object({
    subToken: z.string(),
  }),
  {
    description: 'Sub token path parameter',
  },
)

export type SubTokenParam = z.infer<typeof SubTokenParam>
