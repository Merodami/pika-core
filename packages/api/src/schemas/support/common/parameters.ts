import { z } from 'zod'

import { UUID } from '../../shared/primitives.js'

/**
 * Support service path parameters
 */

export const TicketIdParam = z.object({ id: UUID })
export type TicketIdParam = z.infer<typeof TicketIdParam>

export const ProblemIdParam = z.object({ id: UUID })
export type ProblemIdParam = z.infer<typeof ProblemIdParam>

export const SupportCommentIdParam = z.object({ id: UUID })
export type SupportCommentIdParam = z.infer<typeof SupportCommentIdParam>

export const ProblemIdForCommentsParam = z.object({ problemId: UUID })
export type ProblemIdForCommentsParam = z.infer<
  typeof ProblemIdForCommentsParam
>
