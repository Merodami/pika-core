import type { UserDomain } from './user.js'

export interface SupportCommentDomain {
  id: string
  problemId: string
  userId: string
  content: string
  isInternal: boolean
  createdAt: Date
  updatedAt: Date

  // Relations
  user?: UserDomain | null
}
