import { ICacheService } from '@pika/redis'
import { UserRole } from '@pika/types'

declare global {
  namespace Express {
    interface Request {
      correlationId?: string
      user?: {
        id: string
        email: string
        role: UserRole
        type?: string
        permissions?: string[]
        sessionId?: string
        issuedAt?: Date
        expiresAt?: Date
      }
      serviceAuth?: {
        serviceId: string
        serviceName: string
        isInternalService: boolean
      }
      accepts?: any
    }

    interface Application {
      cacheService?: ICacheService
    }
  }
}

export {}
