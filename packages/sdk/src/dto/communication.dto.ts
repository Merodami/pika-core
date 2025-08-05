// Communication DTOs

export interface CommunicationLogDTO {
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
  createdAt: string
  sentAt?: string
  deliveredAt?: string
  failedAt?: string
  errorMessage?: string
  updatedAt: string
}

export interface TemplateDTO {
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
  createdAt: string
  updatedAt: string
}

export interface NotificationDTO {
  id: string
  userId?: string
  type?: string
  status?: string
  priority?: string
  title?: string
  description?: string
  isGlobal: boolean
  isRead: boolean
  readAt?: string
  metadata?: any
  category?: string
  actionUrl?: string
  imageUrl?: string
  expiresAt?: string
  createdAt: string
  updatedAt?: string
}

// Request DTOs
export interface SendEmailDTO {
  to: string
  subject?: string // Optional when using templateId
  templateId?: string
  templateParams?: Record<string, any>
  body?: string
  isHtml?: boolean
  replyTo?: string
  cc?: string[]
  bcc?: string[]
}

export interface BulkEmailDTO {
  recipients: string[]
  to: string[]
  subject: string
  templateId?: string
  templateParams?: Record<string, any>
  templateVariables?: Record<string, any>[]
  body?: string
  isHtml?: boolean
  replyTo?: string
}

export interface CreateNotificationDTO {
  userId?: string
  subToken?: string
  type?: string
  title?: string
  description: string
  isGlobal?: boolean
  metadata?: any
}

export interface UpdateNotificationDTO {
  isRead?: boolean
  metadata?: any
}

export interface CreateTemplateDTO {
  name: string
  type: string
  category?: string
  externalId: string
  subject?: string
  body: string
  description?: string
  variables?: any
  metadata?: any
  isActive?: boolean
}

export interface UpdateTemplateDTO {
  name?: string
  category?: string
  externalId?: string
  subject?: string
  body?: string
  description?: string
  variables?: any
  metadata?: any
  isActive?: boolean
}
