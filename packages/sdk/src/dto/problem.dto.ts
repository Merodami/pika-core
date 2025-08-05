import type { TicketPriority, TicketStatus, TicketType } from '@pika/types'

import type { SupportCommentDTO } from './supportComment.dto.js'
import type { UserDTO } from './user.dto.js'

export interface ProblemDTO {
  id: string
  userId: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  createdAt: string
  updatedAt?: string | null
  resolvedAt?: string | null
  ticketNumber?: string | null
  assignedTo?: string | null
  files: string[]

  // Relations
  user?: UserDTO | null
  assignedUser?: UserDTO | null
  comments?: SupportCommentDTO[]
}

export interface CreateProblemDTO {
  userId: string
  title: string
  description: string
  priority?: TicketPriority
  type?: TicketType
  files?: string[]
}

export interface UpdateProblemDTO {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  type?: TicketType
  resolvedAt?: string | null
  assignedTo?: string | null
  files?: string[]
}
