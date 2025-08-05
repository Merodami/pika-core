import type { UserDTO } from './user.dto.js'

export interface SupportCommentDTO {
  id: string
  problemId: string
  userId: string
  content: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
  user?: UserDTO | null
}

export interface CreateSupportCommentDTO {
  problemId: string
  content: string
  isInternal?: boolean
}

export interface UpdateSupportCommentDTO {
  content?: string
  isInternal?: boolean
}
