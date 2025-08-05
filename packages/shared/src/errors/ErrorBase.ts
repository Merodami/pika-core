/**
 * Error severity levels for classification and monitoring
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error domains for categorizing the source/context of errors
 */
export enum ErrorDomain {
  DOMAIN = 'domain', // Business logic / domain rules errors
  APPLICATION = 'application', // General application errors
  INFRASTRUCTURE = 'infrastructure', // Database, external services, etc.
  SECURITY = 'security', // Authentication, authorization errors
  VALIDATION = 'validation', // Input validation errors
  EXTERNAL = 'external', // Errors from external services/APIs
  UNKNOWN = 'unknown', // Uncategorized errors
}

/**
 * Error context with rich metadata for better debugging and logging
 */
export interface ErrorContext {
  domain: ErrorDomain
  severity: ErrorSeverity
  code: string
  httpStatus?: number
  timestamp: string
  correlationId?: string
  transactionId?: string
  source?: string
  stackId?: string
  userId?: string
  clientInfo?: {
    ip?: string
    userAgent?: string
  }
  metadata?: Record<string, any>
  suggestion?: string
  supportReferenceCode?: string
  retryable?: boolean
}

/**
 * Type for client-safe error response
 */
interface ErrorResponse {
  error: {
    code: string
    message: string
    domain: ErrorDomain
    timestamp: string
    suggestion?: string
    referenceCode?: string
    stack?: string
    [key: string]: any
  }
}

/**
 * Base error class with rich context support
 */
export class BaseError extends Error {
  public readonly context: ErrorContext

  constructor(
    message: string,
    context: Partial<ErrorContext> & { code: string; domain: ErrorDomain },
  ) {
    super(message)

    this.name = this.constructor.name

    // Set default context values if not provided
    this.context = {
      severity: ErrorSeverity.ERROR,
      timestamp: new Date().toISOString(),
      ...context,
    } as ErrorContext

    // Ensure stack trace is captured properly
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Get HTTP status code for the error
   */
  public getHttpStatus(): number {
    return this.context.httpStatus || 500
  }

  /**
   * Get error code
   */
  public getCode(): string {
    return this.context.code
  }

  /**
   * Convert error to a client-safe response object
   */
  public toResponseObject(includeStack: boolean = false): ErrorResponse {
    const response: ErrorResponse = {
      error: {
        code: this.context.code,
        message: this.message,
        domain: this.context.domain,
        timestamp: this.context.timestamp,
      },
    }

    // Add suggestion if available
    if (this.context.suggestion) {
      response.error.suggestion = this.context.suggestion
    }

    // Add support reference if available
    if (this.context.supportReferenceCode) {
      response.error.referenceCode = this.context.supportReferenceCode
    }

    // Add stack trace in development
    if (includeStack && this.stack) {
      response.error.stack = this.stack
    }

    return response
  }

  /**
   * Convert error to a structured log object for internal logging
   */
  public toLogObject(): Record<string, any> {
    return {
      message: this.message,
      ...this.context,
      stack: this.stack,
    }
  }
}
