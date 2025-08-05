import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Storage service path parameters
 */

export const FileIdParam = openapi(
  z.object({
    fileId: UUID,
  }),
  {
    description: 'File ID path parameter',
  },
)
export type FileIdParam = z.infer<typeof FileIdParam>

export const FileHistoryIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'File history ID path parameter',
  },
)
export type FileHistoryIdParam = z.infer<typeof FileHistoryIdParam>
