import { ErrorFactory } from '@pika/shared'
import { UserRole } from '@pika/types'
import type { Request } from 'express'

/**
 * User context extracted from request headers
 * This is the standard pattern for passing user context in microservices
 */
export interface UserContext {
  userId: string
  email: string
  role: UserRole
  correlationId?: string
  sessionId?: string
}

/**
 * Request context helper for extracting user information from headers
 * Following the "context propagation" pattern used in distributed systems
 *
 * @example
 * ```typescript
 * // In your controller:
 * const context = RequestContext.fromHeaders(request)
 * const result = await handler.execute(dto, context)
 * ```
 */
export class RequestContext {
  /**
   * Extract user context from request headers
   * These headers are set by the API Gateway after authentication
   */
  static fromHeaders<T extends Request>(request: T): UserContext {
    const userId = request.headers['x-user-id'] as string
    const email = request.headers['x-user-email'] as string
    const role = request.headers['x-user-role'] as UserRole
    const correlationId = request.headers['x-correlation-id'] as
      | string
      | undefined
    const sessionId = request.headers['x-session-id'] as string | undefined

    if (!userId || !email || !role) {
      throw ErrorFactory.unauthorized(
        'Authentication required - missing user context headers',
        {
          suggestion: 'Include a valid JWT token in the Authorization header',
          metadata: {
            missingHeaders: {
              userId: !userId,
              email: !email,
              role: !role,
            },
          },
        },
      )
    }

    return {
      userId,
      email,
      role,
      correlationId,
      sessionId,
    }
  }

  /**
   * Check if the user has a specific role
   */
  static hasRole(context: UserContext, role: UserRole): boolean {
    return context.role === role
  }

  /**
   * Check if the user is an admin
   */
  static isAdmin(context: UserContext): boolean {
    return context.role === UserRole.ADMIN
  }

  /**
   * Check if the user is a regular user (not admin)
   */
  static isUser(context: UserContext): boolean {
    return context.role === UserRole.CUSTOMER
  }

  /**
   * Extract user context from the authenticated request user
   * This is useful when the auth middleware has already set req.user
   */
  static fromAuthenticatedRequest<T extends Request>(request: T): UserContext {
    if (!request.user) {
      throw ErrorFactory.unauthorized(
        'Authentication required - no user found on request',
        {
          suggestion:
            'Ensure the auth middleware is applied before accessing user context',
        },
      )
    }

    return {
      userId: request.user.id,
      email: request.user.email,
      role: request.user.role,
      correlationId: request.correlationId,
      sessionId: request.user.sessionId,
    }
  }

  /**
   * Get user context from either headers or authenticated user
   * Tries headers first (for service-to-service), then falls back to req.user
   */
  static getContext<T extends Request>(request: T): UserContext {
    // Try to get from headers first (service-to-service communication)
    const userId = request.headers['x-user-id'] as string

    if (userId) {
      return this.fromHeaders(request)
    }

    // Fall back to authenticated user
    return this.fromAuthenticatedRequest(request)
  }
}
