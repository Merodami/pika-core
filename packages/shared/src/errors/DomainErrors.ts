import { ErrorCode } from '@pika/types'
import { get } from 'lodash-es'

import {
  BaseError,
  ErrorContext,
  ErrorDomain,
  ErrorSeverity,
} from './ErrorBase.js'

/**
 * Base class for all domain-specific errors
 */
export class DomainError extends BaseError {
  constructor(
    message: string,
    context: Partial<Omit<ErrorContext, 'domain'>> & { code: string },
  ) {
    super(message, {
      ...context,
      domain: ErrorDomain.DOMAIN,
    })
  }
}

/**
 * Error indicating a resource was not found
 */
export class ResourceNotFoundError extends DomainError {
  constructor(
    resourceType: string,
    resourceId: string,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    // Select the specific resource not found code if available, otherwise use generic NOT_FOUND
    let code: string

    const specificCode =
      `${resourceType.toUpperCase()}_NOT_FOUND` as keyof typeof ErrorCode

    // Check if there's a specific error code for this resource type using lodash get
    // which is safer than direct property access
    const specificErrorCode = get(ErrorCode, specificCode)

    if (specificErrorCode) {
      code = specificErrorCode
    } else {
      code = ErrorCode.NOT_FOUND
    }

    const message = `${resourceType} with ID ${resourceId} not found`

    super(message, {
      ...context,
      code,
      httpStatus: 404,
      severity: ErrorSeverity.INFO, // Not found is usually not a critical error
      suggestion: `Verify the ${resourceId} exists and you have permission to access it`,
      metadata: {
        ...context.metadata,
        resourceType,
        resourceId,
      },
    })
  }
}

/**
 * Error for invalid domain operations
 */
export class InvalidOperationError extends DomainError {
  constructor(
    operation: string,
    reason: string,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.INVALID_OPERATION
    const message = `Invalid operation: ${operation}. Reason: ${reason}`

    super(message, {
      ...context,
      code,
      httpStatus: 400,
      metadata: {
        ...context.metadata,
        operation,
        reason,
      },
    })
  }
}

/**
 * Error for business rule violations
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(
    rule: string,
    details: string,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.BUSINESS_RULE_VIOLATION
    const message = `Business rule violated: ${rule}. Details: ${details}`

    super(message, {
      ...context,
      code,
      httpStatus: 422, // Unprocessable Entity
      metadata: {
        ...context.metadata,
        rule,
        details,
      },
    })
  }
}

/**
 * Error for entity uniqueness constraint violations (e.g., duplicate slugs, emails)
 */
export class UniqueConstraintViolationError extends DomainError {
  public readonly field: string
  public readonly value: string

  constructor(
    entityName: string,
    field: string,
    value: string,
    context: Partial<Omit<ErrorContext, 'domain' | 'code' | 'httpStatus'>> = {},
  ) {
    const code = ErrorCode.CONFLICT
    const message = `${entityName} with this ${field} already exists: ${value}`

    super(message, {
      ...context,
      code,
      httpStatus: 409, // Conflict - appropriate for uniqueness violations
      severity: ErrorSeverity.INFO,
      metadata: {
        ...context.metadata,
        entityName,
        field,
        value,
      },
    })

    this.field = field
    this.value = value
  }

  /**
   * Override to include field and value details in the response
   */
  public toResponseObject(includeStack: boolean = false) {
    const baseResponse = super.toResponseObject(includeStack)

    return {
      ...baseResponse,
      error: {
        ...baseResponse.error,
        field: this.field,
        value: this.value,
      },
    }
  }
}
