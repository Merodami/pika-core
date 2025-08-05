// Communication domain types

export interface CommunicationLogDomain {
  id: string
  userId?: string
  type: string
  recipient: string
  subject?: string
  templateId?: string
  status: string
  provider?: string
  providerId?: string
  metadata?: any
  createdAt: Date
  sentAt?: Date
  deliveredAt?: Date
  failedAt?: Date
  errorMessage?: string
  updatedAt: Date
}

export interface TemplateDomain {
  id: string
  name: string
  type: string
  category?: string
  externalId: string
  subject?: string
  body: string
  description?: string
  variables?: any
  metadata?: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationDomain {
  id: string
  subToken?: string
  userId?: string
  type?: string
  title?: string
  description?: string
  global: boolean
  read: boolean
  metadata?: any
  createdAt: Date
  updatedAt?: Date
  readAt?: Date
}
