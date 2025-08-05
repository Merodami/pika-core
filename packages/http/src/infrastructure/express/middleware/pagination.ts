// Import the shared type definitions
import '../../../types/express.js'

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from '@pika/environment'
import { logger } from '@pika/shared'
import { PaginationMetadata } from '@pika/types'
import { NextFunction, Request, RequestHandler, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number
        limit: number
      }
    }
  }
}

/**
 * Express middleware that processes pagination parameters from query strings
 *
 * @returns {RequestHandler} Express middleware handler
 */
export const paginationMiddleware: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  // Apply limit constraints from environment variables or default values
  let limit: number = PAGINATION_DEFAULT_LIMIT

  const maxLimit: number = PAGINATION_MAX_LIMIT

  try {
    // Extract query parameters
    const query = request.query as Record<string, string>

    // Extract and compute the page number. Ensure it is at least 1
    const page: number = Math.max(1, query.page ? parseInt(query.page, 10) : 1)

    if (query.limit) {
      limit = parseInt(query.limit, 10)

      // Ensure the limit is within the allowed range
      limit = Math.max(1, Math.min(maxLimit, limit))
    }

    // Add pagination to the request object
    request.pagination = {
      page,
      limit,
    }
  } catch (error: unknown) {
    // If any error occurs, default to the initial pagination values
    request.pagination = {
      page: 1,
      limit,
    }

    // Log the error for debugging purposes
    logger.error('Error in pagination middleware:', error)
  }

  next()
}

/**
 * Helper function for applying pagination to database queries
 *
 * @param pagination - The pagination object
 * @returns Object with skip and limit properties for database queries
 */
export function getPaginationParams(pagination: PaginationMetadata): {
  skip: number
  limit: number
} {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    limit: pagination.limit,
  }
}

// Export for backward compatibility
export const paginationHook = paginationMiddleware
