import { ErrorCode } from '@pika/types'

import {
  BaseError,
  ErrorContext,
  ErrorDomain,
  ErrorSeverity,
} from './ErrorBase.js'

/**
 * Base class for all application-level errors
 */
export class ApplicationError extends BaseError {
  constructor(
    message: string,
    context: Partial<Omit<ErrorContext, 'domain'>> & { code: string },
  ) {
    super(message, {
      ...context,
      domain: ErrorDomain.APPLICATION,
    })
  }
}

/**
 * Validation errors
 */

export class ValidationError extends BaseError {
  public readonly validationErrors: Record<string, string[]>

  constructor(
    validationErrors: Record<string, string[]>,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.VALIDATION_ERROR

    // If there's exactly one validation error for a required field, make the message clearer
    const errorFields = Object.keys(validationErrors)
    const allErrors = Object.values(validationErrors).flat()
    const errorCount = allErrors.length

    // Create a more helpful message for common validation errors
    let message: string

    if (errorCount === 1 && errorFields.length === 1) {
      const field = errorFields[0]
      const errorMsg = allErrors[0]

      if (errorMsg.includes('required') || errorMsg === 'is required.') {
        message = `The '${field}' field is required`
      } else {
        message = `Invalid value for field '${field}': ${errorMsg}`
      }
    } else {
      message = `Validation failed with ${errorCount} error${errorCount === 1 ? '' : 's'}`
    }

    super(message, {
      ...context,
      code,
      domain: ErrorDomain.VALIDATION,
      httpStatus: 400,
      severity: ErrorSeverity.INFO,
      metadata: {
        ...context.metadata,
        validationErrors,
      },
    })

    this.validationErrors = validationErrors
  }

  /**
   * Override to include validation details in the response
   */
  public toResponseObject(includeStack: boolean = false) {
    const baseResponse = super.toResponseObject(includeStack)

    return {
      ...baseResponse,
      error: {
        ...baseResponse.error,
        validationErrors: this.validationErrors,
      },
    }
  }
}

/**
 * Not authorized error
 */
export class NotAuthorizedError extends BaseError {
  constructor(
    reason: string = 'You are not authorized to perform this action',
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.NOT_AUTHORIZED

    super(reason, {
      ...context,
      code,
      domain: ErrorDomain.SECURITY,
      httpStatus: 403,
      severity: ErrorSeverity.WARNING,
    })
  }
}

/**
 * Not authenticated error
 */
export class NotAuthenticatedError extends BaseError {
  constructor(
    reason: string = 'Authentication required',
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.NOT_AUTHENTICATED

    super(reason, {
      ...context,
      code,
      domain: ErrorDomain.SECURITY,
      httpStatus: 401,
      severity: ErrorSeverity.INFO,
    })
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends ApplicationError {
  constructor(
    configKey: string,
    issue: string,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.CONFIGURATION_ERROR
    const message = `Configuration error for '${configKey}': ${issue}`

    super(message, {
      ...context,
      code,
      httpStatus: 500,
      severity: ErrorSeverity.ERROR,
      metadata: {
        ...context.metadata,
        configKey,
        issue,
      },
    })
  }
}
