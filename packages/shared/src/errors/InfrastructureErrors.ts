import { ErrorCode } from '@pika/types'

import {
  BaseError,
  ErrorContext,
  ErrorDomain,
  ErrorSeverity,
} from './ErrorBase.js'

/**
 * Base class for all infrastructure-related errors
 */
export class InfrastructureError extends BaseError {
  constructor(
    message: string,
    context: Partial<Omit<ErrorContext, 'domain'>> & { code: string },
  ) {
    super(message, {
      ...context,
      domain: ErrorDomain.INFRASTRUCTURE,
    })
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends InfrastructureError {
  constructor(
    operation: string,
    details: string,
    originalError?: any,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.DATABASE_ERROR
    const message = `Database error during ${operation}: ${details}`

    super(message, {
      ...context,
      code,
      httpStatus: 500,
      severity: ErrorSeverity.ERROR,
      metadata: {
        ...context.metadata,
        operation,
        details,
        originalError: originalError
          ? {
              message: originalError.message,
              name: originalError.name,
              code: originalError.code,
            }
          : undefined,
      },
      retryable: true, // Most database errors are retryable
    })
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends InfrastructureError {
  constructor(
    serviceName: string,
    operation: string,
    details: string,
    originalError?: any,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.EXTERNAL_SERVICE_ERROR
    const message = `Error from ${serviceName} during ${operation}: ${details}`

    super(message, {
      ...context,
      code,
      httpStatus: 502, // Bad Gateway
      severity: ErrorSeverity.ERROR,
      metadata: {
        ...context.metadata,
        serviceName,
        operation,
        details,
        originalError: originalError
          ? {
              message: originalError.message,
              name: originalError.name,
              code: originalError.code,
            }
          : undefined,
      },
      retryable: true, // External service errors are often retryable
    })
  }
}

/**
 * Cache-related errors
 */
export class CacheError extends InfrastructureError {
  constructor(
    operation: string,
    details: string,
    originalError?: any,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.CACHE_ERROR
    const message = `Cache error during ${operation}: ${details}`

    super(message, {
      ...context,
      code,
      httpStatus: 500,
      severity: ErrorSeverity.WARNING, // Cache errors are usually not critical
      metadata: {
        ...context.metadata,
        operation,
        details,
        originalError: originalError
          ? {
              message: originalError.message,
              name: originalError.name,
              code: originalError.code,
            }
          : undefined,
      },
      retryable: true,
    })
  }
}
