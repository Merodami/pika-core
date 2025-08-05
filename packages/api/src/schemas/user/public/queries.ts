import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * Query parameters for getting user by ID
 */
export const GetUserByIdQuery = openapi(
  z.object({
    includeProfessional: z
      .string()
      .optional()
      .transform((val) => val === 'true')
      .describe('Include professional profile information'),
    includeParq: z
      .string()
      .optional()
      .transform((val) => val === 'true')
      .describe(
        'Include PARQ (Physical Activity Readiness Questionnaire) data',
      ),
    includeFriends: z
      .string()
      .optional()
      .transform((val) => val === 'true')
      .describe('Include friends/social connections'),
  }),
  {
    description:
      'Query parameters for retrieving user details with optional includes',
  },
)

export type GetUserByIdQuery = z.infer<typeof GetUserByIdQuery>
