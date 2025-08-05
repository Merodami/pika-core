import '../../../types/express.js'

import { JwtTokenService, TokenValidationResult } from '@pika/auth'
import {
  JWT_ACCESS_EXPIRY,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_REFRESH_EXPIRY,
  JWT_SECRET,
  NODE_ENV,
  SKIP_AUTH,
} from '@pika/environment'
import { logger, NotAuthenticatedError, NotAuthorizedError } from '@pika/shared'
import { mapRoleToPermissions, UserRole } from '@pika/types'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'

import { ApiTokenOptions } from '../../../domain/types/server.js'

// Role to permissions mapping is now imported from @pika/types

/**
 * Enhanced API token authentication middleware for Express.
 * Delegates JWT token validation to @pikaice (single source of truth).
 * Provides correlation IDs, security headers, and standardized user context.
 */
export function authMiddleware(options: ApiTokenOptions): RequestHandler {
  const { headerName = 'Authorization', excludePaths = [] } = options

  // Initialize JWT service from @pika/auth (single source of truth)
  // Always use environment configuration - no overrides
  const jwtService = new JwtTokenService(
    JWT_SECRET,
    JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY,
    JWT_ISSUER,
    JWT_AUDIENCE,
    options.cacheService, // Optional Redis service for token blacklisting
    JWT_ALGORITHM as jwt.Algorithm,
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
  )

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Add correlation ID for request tracing
      addCorrelationId(req)

      // Skip authentication for testing when explicitly requested
      if (NODE_ENV === 'test' && SKIP_AUTH === true) {
        addSecurityHeaders(res)

        return next()
      }

      // Skip authentication for excluded paths
      // Check both req.path and req.originalUrl for compatibility
      const pathExcluded = isExcludedPath(req.path, excludePaths)
      const originalUrlExcluded = isExcludedPath(req.originalUrl, excludePaths)

      if (pathExcluded || originalUrlExcluded) {
        addSecurityHeaders(res)

        return next()
      }

      // Skip JWT authentication if this is a service-to-service request
      const serviceApiKey = req.headers['x-api-key'] as string
      const serviceName = req.headers['x-service-name'] as string

      if (serviceApiKey && serviceName) {
        addSecurityHeaders(res)

        return next()
      }

      // Extract and validate authorization header
      const authHeader = req.headers[headerName.toLowerCase()]

      if (!authHeader || typeof authHeader !== 'string') {
        logger.warn('Missing authorization header', {
          correlationId: req.correlationId,
          url: req.url,
          method: req.method,
        })

        throw new NotAuthenticatedError(
          'Authentication required. Please provide a valid Bearer token.',
          {
            source: 'authMiddleware',
            correlationId: req.correlationId,
          },
        )
      }

      // Validate Bearer token format
      const token = extractBearerToken(authHeader)

      if (!token) {
        logger.warn('Invalid authorization header format', {
          correlationId: req.correlationId,
          authHeader: authHeader.substring(0, 20) + '...', // Log partial header for debugging
        })

        throw new NotAuthenticatedError(
          'Invalid token format. Please provide a valid Bearer token.',
          {
            source: 'authMiddleware',
            correlationId: req.correlationId,
          },
        )
      }

      // Debug logging for JWT issues
      if (NODE_ENV === 'test') {
        logger.debug('JWT verification attempt', {
          algorithm: JWT_ALGORITHM,
          hasPrivateKey: !!JWT_PRIVATE_KEY,
          hasPublicKey: !!JWT_PUBLIC_KEY,
          tokenPrefix: token.substring(0, 50),
        })
      }

      // Delegate token verification to @pikaice (single source of truth)
      const validation: TokenValidationResult = await jwtService.verifyToken(
        token,
        'access',
      )

      if (!validation.isValid || !validation.payload) {
        logger.warn('Token validation failed', {
          correlationId: req.correlationId,
          error: validation.error,
          algorithm: JWT_ALGORITHM,
          hasKeys: { private: !!JWT_PRIVATE_KEY, public: !!JWT_PUBLIC_KEY },
        })

        throw new NotAuthenticatedError(
          validation.error || 'Invalid token. Please sign in again.',
          {
            source: 'authMiddleware',
            correlationId: req.correlationId,
          },
        )
      }

      const { payload } = validation

      // Map role to permissions for RBAC
      const permissions = mapRoleToPermissions(payload.role)

      // Create user context matching Express Request.user interface
      const user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        type: payload.role?.toUpperCase(),
        permissions,
        sessionId: undefined, // Will be added when session management is implemented
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
      }

      // Attach user context to request
      req.user = user

      // Add user context headers for downstream services
      addUserContextHeaders(req, user)

      logger.debug('Authentication successful', {
        correlationId: req.correlationId,
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      // Add security headers
      addSecurityHeaders(res)

      // Add correlation ID to response headers
      if (req.correlationId) {
        res.setHeader('X-Correlation-ID', req.correlationId)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Check if the current path should be excluded from authentication
 */
function isExcludedPath(url: string, excludePaths: string[]): boolean {
  return excludePaths.some((pattern) => {
    const exactMatch = pattern === url
    const wildcardMatch =
      pattern.endsWith('*') && url.startsWith(pattern.slice(0, -1))

    return exactMatch || wildcardMatch
  })
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string): string | null {
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

/**
 * Add correlation ID for request tracing
 */
function addCorrelationId(request: Request): void {
  // Use existing correlation ID from headers or generate new one
  const correlationId =
    (request.headers['x-correlation-id'] as string) ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

  request.correlationId = correlationId
}

/**
 * Add user context headers for downstream services
 */
function addUserContextHeaders(
  request: Request,
  user: NonNullable<Request['user']>,
): void {
  // Add user context headers that backend services can use
  request.headers['x-user-id'] = user.id
  request.headers['x-user-email'] = user.email
  request.headers['x-user-role'] = user.role

  if (user.sessionId) {
    request.headers['x-session-id'] = user.sessionId
  }

  if (request.correlationId) {
    request.headers['x-correlation-id'] = request.correlationId
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(reply: Response): void {
  reply.setHeader('X-Content-Type-Options', 'nosniff')
  reply.setHeader('X-Frame-Options', 'DENY')
  reply.setHeader('X-XSS-Protection', '1; mode=block')
  reply.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  reply.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
}

/**
 * Authorization helper functions for route protection
 */

/**
 * Require any authenticated user
 */
export function requireAuth(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }
    next()
  }
}

/**
 * Require admin role
 */
export function requireAdmin(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    if (req.user.role !== UserRole.ADMIN) {
      return next(new NotAuthorizedError('Admin access required'))
    }

    next()
  }
}

/**
 * Require user role
 */
export function requireUser(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    if (req.user.role !== UserRole.CUSTOMER) {
      return next(new NotAuthorizedError('User access required'))
    }

    next()
  }
}

/**
 * Require specific roles (any of the provided roles)
 */
export function requireRoles(...roles: UserRole[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new NotAuthorizedError(
          `Access denied. Required roles: ${roles.join(', ')}`,
        ),
      )
    }

    next()
  }
}

/**
 * Require user to own the resource (check userId parameter matches authenticated user)
 */
export function requireOwnership(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    const userId = req.params.userId || req.params.id

    if (!userId) {
      return next(new NotAuthorizedError('User ID parameter is required'))
    }

    if (req.user.id !== userId && req.user.role !== UserRole.ADMIN) {
      return next(
        new NotAuthorizedError('You can only access your own resources'),
      )
    }

    next()
  }
}

/**
 * Require specific permissions with support for wildcards and ownership
 *
 * Permission format: resource:action:scope
 * - Exact match: 'users:read' matches 'users:read'
 * - Wildcard: 'admin:*' matches any 'admin:' permission
 * - Ownership: 'users:read:own' requires ownership check in controller
 *
 * @param permissions - Required permissions (ALL must be satisfied)
 */
export function requirePermissions(...permissions: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    const userPermissions = req.user.permissions || []

    const hasAllPermissions = permissions.every((permission) => {
      // Check exact permission match
      if (userPermissions.includes(permission)) {
        return true
      }

      // Check wildcard permissions (e.g., 'admin:*' matches 'admin:dashboard')
      const permissionParts = permission.split(':')
      const resource = permissionParts[0]

      // Check for resource-level wildcard
      if (userPermissions.includes(`${resource}:*`)) {
        return true
      }

      // For admin users, check if they have admin:* which grants all permissions
      if (
        req.user?.role === UserRole.ADMIN &&
        userPermissions.includes('admin:*')
      ) {
        return true
      }

      // For ':own' permissions, only check for exact match or resource wildcard
      // Ownership validation must be done in the controller
      if (permission.endsWith(':own')) {
        return (
          userPermissions.includes(permission) ||
          userPermissions.includes(`${resource}:*`)
        )
      }

      return false
    })

    if (!hasAllPermissions) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        requiredPermissions: permissions,
        userPermissions: userPermissions,
        correlationId: req.correlationId,
      })

      return next(
        new NotAuthorizedError(
          `Missing required permissions: ${permissions.join(', ')}`,
          {
            userId: req.user.id,
            correlationId: req.correlationId,
            metadata: {
              required: permissions,
              user: req.user.id,
            },
          },
        ),
      )
    }

    logger.debug('Permission granted', {
      userId: req.user.id,
      requiredPermissions: permissions,
      correlationId: req.correlationId,
    })

    next()
  }
}

/**
 * Require business role
 */
export function requireBusinessRole(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    if (req.user.role !== UserRole.BUSINESS) {
      return next(new NotAuthorizedError('Business access required'))
    }

    next()
  }
}
