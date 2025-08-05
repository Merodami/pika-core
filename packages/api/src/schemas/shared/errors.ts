import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'
import { DateTime, UUID } from './primitives.js'

/**
 * Common error response schemas
 */

// ============= Error Response =============

/**
 * Standard error response
 */
export const ErrorResponse = openapi(
  z.object({
    statusCode: z.number().int().min(100).max(599),
    error: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
          code: z.string().optional(),
        }),
      )
      .optional(),
    correlationId: UUID.optional().describe('Request correlation ID'),
    timestamp: DateTime.optional(),
  }),
  {
    description: 'Standard error response',
  },
)

export type ErrorResponse = z.infer<typeof ErrorResponse>

// ============= Validation Error =============

/**
 * Validation error response (400)
 */
export const ValidationErrorResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(400),
    error: z.literal('Bad Request'),
  }),
  {
    description: 'Validation error response',
  },
)

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponse>

// ============= Authentication Errors =============

/**
 * Unauthorized error response (401)
 */
export const UnauthorizedResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(401),
    error: z.literal('Unauthorized'),
  }),
  {
    description: 'Authentication required',
  },
)

export type UnauthorizedResponse = z.infer<typeof UnauthorizedResponse>

/**
 * Forbidden error response (403)
 */
export const ForbiddenResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(403),
    error: z.literal('Forbidden'),
  }),
  {
    description: 'Insufficient permissions',
  },
)

export type ForbiddenResponse = z.infer<typeof ForbiddenResponse>

// ============= Resource Errors =============

/**
 * Not found error response (404)
 */
export const NotFoundResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(404),
    error: z.literal('Not Found'),
    resource: z.string().optional(),
    resourceId: z.string().optional(),
  }),
  {
    description: 'Resource not found',
  },
)

export type NotFoundResponse = z.infer<typeof NotFoundResponse>

/**
 * Conflict error response (409)
 */
export const ConflictResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(409),
    error: z.literal('Conflict'),
    conflictingField: z.string().optional(),
    existingValue: z.any().optional(),
  }),
  {
    description: 'Resource conflict',
  },
)

export type ConflictResponse = z.infer<typeof ConflictResponse>

// ============= Server Errors =============

/**
 * Internal server error response (500)
 */
export const InternalServerErrorResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(500),
    error: z.literal('Internal Server Error'),
  }),
  {
    description: 'Internal server error',
  },
)

export type InternalServerErrorResponse = z.infer<
  typeof InternalServerErrorResponse
>

/**
 * Service unavailable error response (503)
 */
export const ServiceUnavailableResponse = openapi(
  ErrorResponse.extend({
    statusCode: z.literal(503),
    error: z.literal('Service Unavailable'),
    retryAfter: z.number().int().positive().optional(),
  }),
  {
    description: 'Service temporarily unavailable',
  },
)

export type ServiceUnavailableResponse = z.infer<
  typeof ServiceUnavailableResponse
>
