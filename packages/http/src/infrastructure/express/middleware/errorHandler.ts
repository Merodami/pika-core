import { NODE_ENV } from '@pika/environment'
import { BaseError, createErrorHandler, ErrorFactory } from '@pika/shared'
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { get, set } from 'lodash-es'

/**
 * Options for the error middleware
 */
export interface ErrorMiddlewareOptions {
  enableStackTrace?: boolean
}

/**
 * Express validation error interface
 */
interface ValidationError extends Error {
  validation?: any[]
  status?: number
  content?: any
}

/**
 * Shared error handling middleware for Express applications.
 * This middleware consistently formats errors across services.
 */
export function errorMiddleware(
  options: ErrorMiddlewareOptions,
): ErrorRequestHandler {
  const _enableStackTrace =
    typeof options.enableStackTrace !== 'undefined'
      ? options.enableStackTrace
      : NODE_ENV !== 'production'

  const errorHandler = createErrorHandler(NODE_ENV === 'production')

  return async (
    error: Error | ValidationError,
    request: Request,
    reply: Response,
    next: NextFunction,
  ) => {
    if (reply.headersSent) {
      next(error)

      return
    }

    if (error instanceof BaseError) {
      console.log('[ERROR_MIDDLEWARE] Handling as BaseError')
      errorHandler(error, request, reply)

      return
    }

    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
    ) {
      const statusCode = (error as any).status || 500

      console.log(
        '[ERROR_MIDDLEWARE] Handling as status/message error, status:',
        statusCode,
      )

      reply.status(statusCode).json({
        status: statusCode,
        message: error.message,
        content: (error as any).content || {},
      })

      return
    }

    // Handle validation errors from Zod middleware and other validation sources
    if (
      (error as any).code === 'VALIDATION_ERROR' ||
      (error as ValidationError).validation
    ) {
      const validationErrors = (error as ValidationError).validation || []

      const errorsByField: Record<string, string[]> = {}

      validationErrors.forEach((validation: any) => {
        if (!validation) return // Skip undefined/null validation objects

        let field = 'request'

        if (
          validation.keyword === 'required' &&
          validation.params?.missingProperty
        ) {
          field = validation.params.missingProperty
        } else if (validation.instancePath) {
          // Extract field name from instancePath like /body/email
          const pathMatch = validation.instancePath.match(/^\/(\w+)\/(.+)$/)

          if (pathMatch) {
            field = pathMatch[2]
          } else {
            field = validation.instancePath.slice(1) || field
          }
        } else if (validation.dataPath) {
          field = validation.dataPath.slice(1) || field
        }

        const message = validation.message || 'Invalid value'
        const existingErrors = get(errorsByField, field, [])

        set(errorsByField, field, [...existingErrors, message])
      })

      const validationError = ErrorFactory.validationError(errorsByField, {
        correlationId: request.correlationId,
        source: `${request.method} ${request.url}`,
      })

      errorHandler(validationError, request, reply)

      return
    }

    const convertedError = ErrorFactory.fromError(error)

    errorHandler(convertedError, request, reply)
  }
}
