import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import { createSearchSchema } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Admin support comment schemas
 */

// ============= Request Schemas =============

export const AdminCreateCommentRequest = openapi(
  z.object({
    problemId: UUID,
    content: z.string().min(1).max(5000),
    isInternal: z.boolean().optional().default(false),
  }),
  {
    description: 'Admin create support comment',
  },
)
export type AdminCreateCommentRequest = z.infer<
  typeof AdminCreateCommentRequest
>

export const AdminUpdateCommentRequest = openapi(
  z.object({
    content: z.string().min(1).max(5000),
    isInternal: z.boolean().optional(),
  }),
  {
    description: 'Admin update support comment',
  },
)
export type AdminUpdateCommentRequest = z.infer<
  typeof AdminUpdateCommentRequest
>

// ============= Response Schemas =============

export const AdminCommentResponse = openapi(
  withTimestamps({
    id: UUID,
    problemId: UUID,
    userId: UserId,
    content: z.string(),
    isInternal: z.boolean(),
  }),
  {
    description: 'Admin support comment',
  },
)
export type AdminCommentResponse = z.infer<typeof AdminCommentResponse>

export const AdminCommentListResponse = paginatedResponse(AdminCommentResponse)
export type AdminCommentListResponse = z.infer<typeof AdminCommentListResponse>

// ============= Search Parameters =============

// Sort fields for admin comments
const ADMIN_COMMENT_SORT_FIELDS = ['CREATED_AT', 'UPDATED_AT'] as const

// Admin search schema with more capabilities
export const AdminCommentSearchParams = createSearchSchema({
  sortFields: ADMIN_COMMENT_SORT_FIELDS,
  includeRelations: ['user', 'problem'],
  defaultSortField: 'CREATED_AT',
  additionalParams: {
    isInternal: z.boolean().optional(),
    problemId: UUID.optional(),
    userId: UserId.optional(),
  },
})
export type AdminCommentSearchParams = z.infer<typeof AdminCommentSearchParams>
