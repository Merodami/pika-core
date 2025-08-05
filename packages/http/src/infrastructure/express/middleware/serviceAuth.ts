import { SERVICE_API_KEY } from '@pika/environment'
import { logger, NotAuthenticatedError } from '@pika/shared'
import { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Service-to-Service Authentication Middleware
 *
 * This middleware authenticates internal service requests using API keys.
 * It follows the principle of least privilege and is only used for internal endpoints.
 */

/**
 * Validates service API key from request headers
 */
export function validateServiceApiKey(apiKey: string | undefined): boolean {
  if (!apiKey || !SERVICE_API_KEY) {
    return false
  }

  // In production, you might want to support multiple API keys
  // or use a more sophisticated validation mechanism
  return apiKey === SERVICE_API_KEY
}

/**
 * Extracts service context from authenticated service request
 */
export interface ServiceAuthContext {
  serviceId: string
  serviceName: string
  isInternalService: boolean
}

/**
 * Middleware to require service authentication
 * Used for internal service-to-service endpoints
 */
export function requireServiceAuth(): RequestHandler {
  return async (request: Request, response: Response, next: NextFunction) => {
    const apiKey = request.headers['x-api-key'] as string
    const serviceName = request.headers['x-service-name'] as string
    const serviceId = request.headers['x-service-id'] as string

    // Validate API key
    if (!validateServiceApiKey(apiKey)) {
      logger.warn('Invalid service API key attempted', {
        serviceName,
        serviceId,
        ip: request.ip,
        url: request.url,
      })

      return next(
        new NotAuthenticatedError('Invalid or missing service authentication', {
          source: 'serviceAuth.middleware',
          correlationId: request.correlationId,
        }),
      )
    }

    // Validate service identification
    if (!serviceName || !serviceId) {
      return next(
        new NotAuthenticatedError('Service identification required', {
          source: 'serviceAuth.middleware',
          correlationId: request.correlationId,
        }),
      )
    }

    // Add service context to request
    const serviceContext: ServiceAuthContext = {
      serviceId,
      serviceName,
      isInternalService: true,
    }

    // Store in request context
    request.serviceAuth = serviceContext

    logger.debug('Service authenticated', {
      serviceName,
      serviceId,
      endpoint: request.url,
    })

    next()
  }
}

/**
 * Middleware to allow both user and service authentication
 * Useful for endpoints that can be called by both users and services
 */
export function allowServiceOrUserAuth(): RequestHandler {
  return async (request: Request, response: Response, next: NextFunction) => {
    const apiKey = request.headers['x-api-key'] as string
    const authHeader = request.headers.authorization

    // Check if it's a service request
    if (apiKey && validateServiceApiKey(apiKey)) {
      // Handle as service auth
      const serviceName = request.headers['x-service-name'] as string
      const serviceId = request.headers['x-service-id'] as string

      if (serviceName && serviceId) {
        request.serviceAuth = {
          serviceId,
          serviceName,
          isInternalService: true,
        }

        return next() // Service authenticated
      }
    }

    // If not a valid service request, it must have user auth
    if (!authHeader) {
      return next(
        new NotAuthenticatedError('Authentication required', {
          source: 'serviceAuth.middleware',
          correlationId: request.correlationId,
        }),
      )
    }

    // Let the regular auth middleware handle user authentication
    next()
  }
}
