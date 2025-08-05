import { logger } from '@pika/shared'
import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { fromZodError } from 'zod-validation-error'

/**
 * Production-ready Zod validation middleware for API Gateway
 * Based on express-zod-safe patterns but adapted for our architecture
 */

export interface ValidationSchema {
  body?: z.ZodTypeAny
  query?: z.ZodTypeAny
  params?: z.ZodTypeAny
  headers?: z.ZodTypeAny
}

export interface ValidationOptions {
  /**
   * Whether to strip unknown properties from the validated data
   * @default true
   */
  stripUnknown?: boolean

  /**
   * Custom error handler
   */
  errorHandler?: (error: z.ZodError<any>, req: Request, res: Response) => void

  /**
   * Whether to log validation errors
   * @default true
   */
  logErrors?: boolean
}

/**
 * Create a validation middleware for Express routes
 * This follows the express-zod-safe pattern but with our error format
 */
export function createValidationMiddleware(
  schema: ValidationSchema,
  options: ValidationOptions = {},
) {
  const { errorHandler, logErrors = true } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate each part of the request
      const validatedData: Record<string, any> = {}
      const errors: z.ZodError<any>[] = []

      // Validate body
      if (schema.body) {
        try {
          const parsed = await schema.body.parseAsync(req.body)

          req.body = parsed
          validatedData.body = parsed
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(error)
          }
        }
      }

      // Validate query
      if (schema.query) {
        try {
          const parsed = await schema.query.parseAsync(req.query)

          req.query = parsed as any
          validatedData.query = parsed
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(error)
          }
        }
      }

      // Validate params
      if (schema.params) {
        try {
          const parsed = await schema.params.parseAsync(req.params)

          req.params = parsed as any
          validatedData.params = parsed
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(error)
          }
        }
      }

      // Validate headers (only specified headers)
      if (schema.headers) {
        try {
          const relevantHeaders = extractRelevantHeaders(
            req.headers,
            schema.headers,
          )
          const parsed = await schema.headers.parseAsync(relevantHeaders)

          validatedData.headers = parsed
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(error)
          }
        }
      }

      // If there are any errors, handle them
      if (errors.length > 0) {
        const combinedError = combineZodErrors(errors)

        if (logErrors) {
          logger.warn('Validation failed', {
            path: req.path,
            method: req.method,
            errors: combinedError.issues,
          })
        }

        if (errorHandler) {
          return errorHandler(combinedError, req, res)
        }

        return handleValidationError(combinedError, req, res)
      }

      // Attach validated data to request for downstream use
      ;(req as any).validated = validatedData

      next()
    } catch (error) {
      // Handle unexpected errors
      logger.error('Unexpected error in validation middleware', error as Error)
      res.status(500).json({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
        correlationId: getCorrelationId(req),
      })
    }
  }
}

/**
 * Validation middleware factory functions
 */
export const validate = {
  /**
   * Validate request body
   */
  body: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ body: schema }, options),

  /**
   * Validate query parameters
   */
  query: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ query: schema }, options),

  /**
   * Validate URL parameters
   */
  params: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ params: schema }, options),

  /**
   * Validate headers
   */
  headers: <T extends z.ZodTypeAny>(schema: T, options?: ValidationOptions) =>
    createValidationMiddleware({ headers: schema }, options),

  /**
   * Validate multiple parts of the request
   */
  request: (schema: ValidationSchema, options?: ValidationOptions) =>
    createValidationMiddleware(schema, options),
}

/**
 * Extract only the headers that are defined in the schema
 */
function extractRelevantHeaders(
  headers: any,
  headerSchema: z.ZodTypeAny,
): Record<string, any> {
  const relevantHeaders: Record<string, any> = {}

  if (headerSchema instanceof z.ZodObject) {
    const shape = headerSchema.shape

    for (const key of Object.keys(shape)) {
      const headerKey = key.toLowerCase()

      if (headers[headerKey] !== undefined) {
        relevantHeaders[key] = headers[headerKey]
      }
    }
  }

  return relevantHeaders
}

/**
 * Combine multiple ZodErrors into a single error
 */
function combineZodErrors(errors: z.ZodError<any>[]): z.ZodError<any> {
  const allIssues = errors.flatMap((error) => error.issues)

  return new z.ZodError(allIssues)
}

/**
 * Get correlation ID from request
 */
function getCorrelationId(req: Request): string {
  return (req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    'unknown') as string
}

/**
 * Default validation error handler
 */
function handleValidationError(
  error: z.ZodError<any>,
  req: Request,
  res: Response,
): void {
  // Use zod-validation-error for better error messages
  const validationError = fromZodError(error as any)

  // Format errors to match our API error format
  const formattedErrors = error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    ...(err.code === 'invalid_type' && { received: (err as any).received }),
  }))

  res.status(400).json({
    statusCode: 400,
    error: 'Bad Request',
    message: validationError.message,
    details: formattedErrors,
    correlationId: getCorrelationId(req),
    timestamp: new Date().toISOString(),
  })
}
