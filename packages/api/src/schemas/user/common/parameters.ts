import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * User-specific path parameter schemas
 */

/**
 * Sub token path parameter (user-specific)
 */
export const SubTokenParam = openapi(
  z.object({
    subToken: z.string(),
  }),
  {
    description: 'Sub token path parameter for user verification',
  },
)

export type SubTokenParam = z.infer<typeof SubTokenParam>
