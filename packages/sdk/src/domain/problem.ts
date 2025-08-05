import type { TicketPriority, TicketStatus, TicketType } from '@pika/types'

import type { SupportCommentDomain } from './supportComment.js'
import type { UserDomain } from './user.js'

export interface ProblemDomain {
  id: string
  userId: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  createdAt: Date
  updatedAt?: Date | null
  resolvedAt?: Date | null

  // Admin fields
  ticketNumber?: string | null
  assignedTo?: string | null
  files: string[]

  // Relations
  user?: UserDomain | null
  assignedUser?: UserDomain | null
  comments?: SupportCommentDomain[]
}
