// Service configuration interfaces
export interface CommunicationServiceConfig {
  port: number
  prisma: any // PrismaClient
  cacheService: any // ICacheService
  emailConfig: EmailServiceConfig
  smsConfig?: SmsServiceConfig
  pushConfig?: PushServiceConfig
}

export interface EmailServiceConfig {
  serviceId: string
  publicKey: string
  privateKey: string
}

export interface SmsServiceConfig {
  provider: string
  apiKey: string
  apiSecret?: string
  from: string
}

export interface PushServiceConfig {
  provider: string
  apiKey: string
  serverKey?: string
}

// Template interfaces
export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface TemplateMetadata {
  author?: string
  version?: string
  lastModified?: Date
  tags?: string[]
}

// Communication interfaces
export interface CommunicationMetadata {
  templateParams?: Record<string, any>
  response?: any
  attempts?: number
  retryAfter?: Date
  [key: string]: any
}

// Notification interfaces
export interface NotificationMetadata {
  emailId?: string
  templateId?: string
  sessionId?: string
  gymId?: string
  [key: string]: any
}

// Queue interfaces (for future implementation)
export interface QueueJobData {
  type: 'email' | 'sms' | 'push'
  payload: any
  retries?: number
  priority?: number
}

export interface QueueJobOptions {
  delay?: number
  attempts?: number
  removeOnComplete?: boolean
  removeOnFail?: boolean
}
