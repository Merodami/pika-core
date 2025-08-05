import { NODE_ENV } from '@pika/environment'
import { get, set } from 'lodash-es'

// Error base classes and types
export * from './ErrorBase.js'

// Domain errors
export * from './DomainErrors.js'

// Infrastructure errors
export * from './InfrastructureErrors.js'

// Application errors
export * from './ApplicationErrors.js'

// Error handler factory
import { ErrorCode } from '@pika/types'

import { logger } from '../infrastructure/logger/index.js'
import {
  ApplicationError,
  NotAuthenticatedError,
  NotAuthorizedError,
  ValidationError,
} from './ApplicationErrors.js'
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  UniqueConstraintViolationError,
} from './DomainErrors.js'
import { BaseError, ErrorContext, ErrorSeverity } from './ErrorBase.js'
import { DatabaseError, ExternalServiceError } from './InfrastructureErrors.js'

/**
 * Creates appropriate error objects based on type and context
 */
export class ErrorFactory {
  /**
   * Create a resource not found error
   */
  static resourceNotFound(
    resourceType: string,
    resourceId: string,
    context: Partial<ErrorContext> = {},
  ): ResourceNotFoundError {
    return new ResourceNotFoundError(resourceType, resourceId, context)
  }

  /**
   * Create a database error
   */
  static databaseError(
    operation: string,
    details: string,
    originalError?: any,
    context: Partial<ErrorContext> = {},
  ): DatabaseError {
    return new DatabaseError(operation, details, originalError, context)
  }

  /**
   * Create a validation error
   */
  static validationError(
    validationErrors: Record<string, string[]>,
    context: Partial<ErrorContext> = {},
  ): ValidationError {
    return new ValidationError(validationErrors, context)
  }

  /**
   * Create a bad request error
   */
  static badRequest(
    message: string,
    context: Partial<ErrorContext> = {},
  ): ApplicationError {
    return new ApplicationError(message, {
      code: ErrorCode.VALIDATION_ERROR,
      httpStatus: 400,
      severity: ErrorSeverity.WARNING,
      ...context,
    })
  }

  /**
   * Create a unique constraint violation error
   */
  static uniqueConstraintViolation(
    entityName: string,
    field: string,
    value: string,
    context: Partial<ErrorContext> = {},
  ): UniqueConstraintViolationError {
    return new UniqueConstraintViolationError(entityName, field, value, context)
  }

  /**
   * Create a business rule violation error
   */
  static businessRuleViolation(
    rule: string,
    details: string,
    context: Partial<ErrorContext> = {},
  ): BusinessRuleViolationError {
    return new BusinessRuleViolationError(rule, details, context)
  }

  /**
   * Create an unauthorized (authentication required) error
   */
  static unauthorized(
    reason: string = 'Authentication required',
    context: Partial<ErrorContext> = {},
  ): NotAuthenticatedError {
    return new NotAuthenticatedError(reason, context)
  }

  /**
   * Create a forbidden (authorization failed) error
   */
  static forbidden(
    reason: string = 'You are not authorized to perform this action',
    context: Partial<ErrorContext> = {},
  ): NotAuthorizedError {
    return new NotAuthorizedError(reason, context)
  }

  /**
   * Create an external service error
   */
  static externalServiceError(
    serviceName: string,
    details: string,
    originalError?: any,
    context: Partial<ErrorContext> = {},
  ): ExternalServiceError {
    return new ExternalServiceError(
      serviceName,
      'api_call',
      details,
      originalError,
      context,
    )
  }

  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(
    reason: string,
    context: Partial<ErrorContext> = {},
  ): ApplicationError {
    return new ApplicationError(reason, {
      code: ErrorCode.SERVICE_UNAVAILABLE,
      httpStatus: 503,
      severity: ErrorSeverity.WARNING,
      ...context,
    })
  }

  /**
   * Create a not implemented error
   */
  static notImplemented(
    feature: string,
    context: Partial<ErrorContext> = {},
  ): ApplicationError {
    return new ApplicationError(`Feature not implemented: ${feature}`, {
      code: ErrorCode.NOT_IMPLEMENTED,
      httpStatus: 501,
      severity: ErrorSeverity.INFO,
      ...context,
    })
  }

  /**
   * Create a resource conflict error
   */
  static resourceConflict(
    resourceType: string,
    conflictDetails: string,
    context: Partial<ErrorContext> = {},
  ): ApplicationError {
    return new ApplicationError(
      `${resourceType} conflict: ${conflictDetails}`,
      {
        code: ErrorCode.RESOURCE_CONFLICT,
        httpStatus: 409,
        severity: ErrorSeverity.WARNING,
        ...context,
      },
    )
  }

  /**
   * Create an error from an unknown error
   */
  static fromError(
    error: any,
    defaultMessage: string = 'An unexpected error occurred',
    context?: Partial<ErrorContext>,
  ): BaseError {
    // If it's already one of our BaseError types, return it
    if (error instanceof BaseError) {
      return error
    }

    // Parse error message, use the error.message if available, otherwise the default message
    const message = error?.message || defaultMessage

    // Check for validation errors from Zod middleware
    if (error?.code === 'VALIDATION_ERROR' && error?.validation) {
      console.log('[ERROR_FACTORY] Detected validation error from Zod')

      const errorsByField: Record<string, string[]> = {}

      error.validation.forEach((validation: any) => {
        if (!validation) return

        let field = 'request'

        const pathMatch = validation.instancePath?.match(/^\/(\w+)\/(.+)$/)

        if (pathMatch) {
          field = pathMatch[2]
        }

        const existingErrors = get(errorsByField, field, [])

        set(errorsByField, field, [
          ...existingErrors,
          validation.message || 'Invalid value',
        ])
      })

      return new ValidationError(errorsByField, {
        correlationId: context?.correlationId,
        source: context?.source,
        ...context,
      })
    }

    // Check for common error patterns to categorize
    if (
      error?.name === 'PrismaClientKnownRequestError' ||
      error?.name === 'PrismaClientValidationError'
    ) {
      return new DatabaseError('database_operation', message, error)
    }

    if (
      error?.name === 'AxiosError' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ETIMEDOUT'
    ) {
      return new ExternalServiceError(
        'external_service',
        'api_call',
        message,
        error,
      )
    }

    // Generic application error as fallback
    return new ApplicationError(message, {
      code: context?.code || ErrorCode.UNEXPECTED_ERROR,
      httpStatus: context?.httpStatus || 500,
      severity: context?.severity || ErrorSeverity.ERROR,
      metadata: {
        originalError: {
          name: error?.name,
          code: error?.code,
          stack: error?.stack,
        },
        ...context?.metadata,
      },
      ...context,
    })
  }
}

/**
 * Global error handler for express applications
 */
export function createErrorHandler(
  isProduction: boolean = NODE_ENV === 'production',
) {
  return (error: any, request: any, reply: any) => {
    let handledError: BaseError

    // Check if it's a validation error (AJV format)
    if ((error as any).validation) {
      // Handle AJV validation errors
      const validationErrors = (error as any).validation || []
      const errorsByField: Record<string, string[]> = {}

      validationErrors.forEach((validation: any) => {
        // Handle various error formats in different AJV versions
        let field = 'request'

        // Check for required property errors first
        if (
          get(validation, 'keyword') === 'required' &&
          get(validation, 'params.missingProperty')
        ) {
          field = get(validation, 'params.missingProperty')
        } else if (get(validation, 'instancePath')) {
          // Modern AJV uses instancePath
          field = get(validation, 'instancePath').slice(1) || field
        } else if (get(validation, 'dataPath')) {
          // Older AJV uses dataPath
          field = get(validation, 'dataPath').slice(1) || field
        }

        const message = get(validation, 'message', 'Invalid value')

        // Add this error to the field's errors using lodash to avoid object injection
        const existingErrors = get(errorsByField, field, [])

        set(errorsByField, field, [...existingErrors, message])
      })

      handledError = ErrorFactory.validationError(errorsByField, {
        correlationId: request?.id?.toString(),
        source: request ? `${request.method} ${request.url}` : 'unknown',
      })
    }
    // Try to handle error from proxied services
    else if (
      error &&
      typeof error === 'object' &&
      error.statusCode === 400 &&
      error.body &&
      typeof error.body === 'string'
    ) {
      try {
        // Try to parse the error body
        const parsedBody = JSON.parse(error.body)

        // If it's our validation error format or has validationErrors, extract those
        if (
          parsedBody.error &&
          (parsedBody.error.code === 'VALIDATION_ERROR' ||
            parsedBody.error.validationErrors)
        ) {
          // Create a validation error with the validation errors
          if (parsedBody.error.validationErrors) {
            handledError = ErrorFactory.validationError(
              parsedBody.error.validationErrors,
              { correlationId: request?.id?.toString() },
            )
          } else {
            // Handle case for errors that mention missing properties but aren't properly formatted
            const errorMessage = parsedBody.error.message || ''
            const missingPropMatch = errorMessage.match(
              /must have required property '([^']+)'/,
            )

            if (missingPropMatch && missingPropMatch[1]) {
              const field = missingPropMatch[1]

              handledError = ErrorFactory.validationError(
                { [field]: ['This field is required'] },
                { correlationId: request?.id?.toString() },
              )
            } else {
              // Fallback to generic error
              handledError = ErrorFactory.fromError(error)
            }
          }
        } else {
          // Not a validation error, use normal error handling
          handledError = ErrorFactory.fromError(error)
        }
      } catch {
        // Failed to parse, use normal error handling
        handledError = ErrorFactory.fromError(error)
      }
    }
    // Convert to a BaseError if it's not already
    else if (!(error instanceof BaseError)) {
      handledError = ErrorFactory.fromError(error)
    } else {
      handledError = error
    }

    // Add request context information if available
    if (request) {
      handledError.context.clientInfo = handledError.context.clientInfo || {}
      handledError.context.clientInfo.ip =
        get(request, 'ip') || get(request, 'ips[0]')
      handledError.context.clientInfo.userAgent = get(
        request,
        'headers.user-agent',
      )
      handledError.context.correlationId =
        get(request, 'headers.x-correlation-id') ||
        handledError.context.correlationId
    }

    // Log the error (with appropriate detail level based on severity)
    const logObject = handledError.toLogObject()

    switch (handledError.context.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL ERROR:', logObject)
        break
      case ErrorSeverity.ERROR:
        logger.error('ERROR:', logObject)
        break
      case ErrorSeverity.WARNING:
        logger.warn('WARNING:', logObject)
        break
      case ErrorSeverity.INFO:
        logger.info('INFO ERROR:', logObject)
        break
      default:
        logger.error('UNCATEGORIZED ERROR:', logObject)
    }

    // Prepare the client response
    const responseObject = handledError.toResponseObject(!isProduction)

    // Send the response with appropriate status code
    const statusCode = handledError.getHttpStatus()

    reply.status(statusCode).send({
      status_code: statusCode,
      ...responseObject,
    })
  }
}
