/**
 * Standardized error codes used across the application
 */
export enum ErrorCode {
  // Health check-related errors
  HEALTH_CHECK_INVALID_DEPENDENCIES = 'HEALTH_CHECK_INVALID_DEPENDENCIES',
  HEALTH_CHECK_INVALID_DEPENDENCY = 'HEALTH_CHECK_INVALID_DEPENDENCY',
  HEALTH_CHECK_INVALID_SERVICES = 'HEALTH_CHECK_INVALID_SERVICES',
  HEALTH_CHECK_INVALID_STARTTIME = 'HEALTH_CHECK_INVALID_STARTTIME',
  HEALTH_CHECK_INVALID_VERSION = 'HEALTH_CHECK_INVALID_VERSION',
  HEALTH_CHECK_EXECUTION_FAILED = 'HEALTH_CHECK_EXECUTION_FAILED',
  HEALTH_CHECK_DEPENDENCIES_MISSING = 'HEALTH_CHECK_DEPENDENCIES_MISSING',

  // General errors
  ALREADY_DELETED = 'ALREADY_DELETED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_AGGREGATE_ID = 'INVALID_AGGREGATE_ID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  CONCURRENCY_CONFLICT = 'CONCURRENCY_CONFLICT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
  DUPLICATE_EVENT = 'DUPLICATE_EVENT',
  EVENT_SAVE_FAILED = 'EVENT_SAVE_FAILED',
  EVENT_LOOKUP_FAILED = 'EVENT_LOOKUP_FAILED',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  INVALID_QUERY = 'INVALID_QUERY',
  COMPLEXITY_LIMIT_EXCEEDED = 'COMPLEXITY_LIMIT_EXCEEDED',
  RETRY_LIMIT_EXCEEDED = 'RETRY_LIMIT_EXCEEDED',
  CONCURRENCY_ERROR = 'CONCURRENCY_ERROR',
  CONCURRENCY_ERROR_RETRY_LIMIT_EXCEEDED = 'CONCURRENCY_ERROR_RETRY_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  CONFLICT = 'CONFLICT',

  // Authentication errors
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',

  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Cache errors
  CACHE_ERROR = 'CACHE_ERROR',

  // Business rule errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',

  // Rate limit errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Service availability errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',

  // Resource conflict errors
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Not found errors
  URL_NOT_FOUND = 'URL_NOT_FOUND',

  // No changes errors
  NO_CHANGES = 'NO_CHANGES',

  // Item errors
  ITEM_LOOKUP_FAILED = 'ITEM_LOOKUP_FAILED',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  ITEM_ALREADY_EXISTS = 'ITEM_ALREADY_EXISTS',
}

/**
 * Get HTTP status code for an error code
 */
export function getStatusCodeForError(code: ErrorCode): number {
  switch (code) {
    // 400 Bad Request
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.ALREADY_DELETED:
    case ErrorCode.INVALID_OPERATION:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.BUSINESS_RULE_VIOLATION:
      return 400

    // 401 Unauthorized
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.NOT_AUTHENTICATED:
      return 401

    // 403 Forbidden
    case ErrorCode.FORBIDDEN:
    case ErrorCode.NOT_AUTHORIZED:
      return 403

    // 404 Not Found
    case ErrorCode.NOT_FOUND:
    case ErrorCode.URL_NOT_FOUND:
    case ErrorCode.ITEM_NOT_FOUND:
      return 404

    // 409 Conflict
    case ErrorCode.DUPLICATE_ENTITY:
    case ErrorCode.COMPLEXITY_LIMIT_EXCEEDED:
    case ErrorCode.CONCURRENCY_CONFLICT:
    case ErrorCode.CONCURRENCY_ERROR:
    case ErrorCode.DUPLICATE_EVENT:
    case ErrorCode.ITEM_ALREADY_EXISTS:
    case ErrorCode.RESOURCE_CONFLICT:
      return 409

    // 422 Unprocessable Entity
    case ErrorCode.NO_CHANGES:
      return 422

    // 429 Too Many Requests
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429

    // 500 Internal Server Error
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CONFIGURATION_ERROR:
    case ErrorCode.CACHE_ERROR:
    case ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES:
    case ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCY:
    case ErrorCode.HEALTH_CHECK_INVALID_SERVICES:
    case ErrorCode.HEALTH_CHECK_INVALID_STARTTIME:
    case ErrorCode.HEALTH_CHECK_INVALID_VERSION:
    case ErrorCode.HEALTH_CHECK_EXECUTION_FAILED:
    case ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING:
      return 500

    // 501 Not Implemented
    case ErrorCode.NOT_IMPLEMENTED:
      return 501

    // 502 Bad Gateway
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 502

    // 503 Service Unavailable
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503

    // Default to 500 for unhandled error codes
    default:
      return 500
  }
}

/**
 * Get default error message for an error code
 */
export function getDefaultMessageForError(code: ErrorCode): string {
  switch (code) {
    // General errors
    case ErrorCode.VALIDATION_ERROR:
      return 'Validation error'

    case ErrorCode.INTERNAL_ERROR:
      return 'An internal server error occurred'

    case ErrorCode.UNEXPECTED_ERROR:
      return 'An unexpected error occurred'

    case ErrorCode.NOT_FOUND:
      return 'Resource not found'

    case ErrorCode.ALREADY_DELETED:
      return 'Resource already deleted'

    case ErrorCode.INVALID_INPUT:
      return 'Invalid input provided'

    case ErrorCode.DUPLICATE_ENTITY:
      return 'Entity already exists'

    // Authentication errors
    case ErrorCode.UNAUTHORIZED:
      return 'Unauthorized access'

    case ErrorCode.NOT_AUTHENTICATED:
      return 'Authentication required'

    case ErrorCode.FORBIDDEN:
      return 'Access forbidden'

    case ErrorCode.NOT_AUTHORIZED:
      return 'You are not authorized to perform this action'

    // Business rule errors
    case ErrorCode.BUSINESS_RULE_VIOLATION:
      return 'Business rule violation'

    case ErrorCode.INVALID_OPERATION:
      return 'Invalid operation'

    // Database errors
    case ErrorCode.DATABASE_ERROR:
      return 'A database error occurred'

    case ErrorCode.CONCURRENCY_ERROR:
      return 'Concurrency error'

    case ErrorCode.CONCURRENCY_CONFLICT:
      return 'Concurrency conflict'

    case ErrorCode.FOREIGN_KEY_VIOLATION:
      return 'Foreign key constraint violation'

    case ErrorCode.INVALID_QUERY:
      return 'Invalid database query'

    // Infrastructure errors
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 'Error communicating with external service'

    case ErrorCode.CACHE_ERROR:
      return 'Cache operation failed'

    case ErrorCode.CONFIGURATION_ERROR:
      return 'Configuration error'

    // Health check errors
    case ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES:
      return 'Invalid health check dependencies configuration'

    case ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCY:
      return 'Invalid health check dependency configuration'

    case ErrorCode.HEALTH_CHECK_INVALID_SERVICES:
      return 'Invalid service health results'

    case ErrorCode.HEALTH_CHECK_INVALID_STARTTIME:
      return 'Invalid service start time'

    case ErrorCode.HEALTH_CHECK_INVALID_VERSION:
      return 'Service version is required'

    case ErrorCode.HEALTH_CHECK_EXECUTION_FAILED:
      return 'Health check execution failed'

    case ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING:
      return 'No health check dependencies configured'

    // URL errors
    case ErrorCode.URL_NOT_FOUND:
      return 'The requested URL was not found'

    // Operation errors
    case ErrorCode.NO_CHANGES:
      return 'Update request contains no changes to apply'

    case ErrorCode.COMPLEXITY_LIMIT_EXCEEDED:
      return 'Operation complexity limit exceeded'

    case ErrorCode.RETRY_LIMIT_EXCEEDED:
      return 'Retry limit exceeded'

    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'Rate limit exceeded'

    // Service availability errors
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 'Service temporarily unavailable'

    case ErrorCode.NOT_IMPLEMENTED:
      return 'Feature not implemented'

    // Resource conflict errors
    case ErrorCode.RESOURCE_CONFLICT:
      return 'Resource conflict detected'

    // Event system errors
    case ErrorCode.DUPLICATE_EVENT:
      return 'Duplicate event detected'

    case ErrorCode.EVENT_SAVE_FAILED:
      return 'Failed to save event'

    case ErrorCode.EVENT_LOOKUP_FAILED:
      return 'Failed to lookup event'

    // Item-related errors
    case ErrorCode.ITEM_LOOKUP_FAILED:
      return 'Failed to lookup item'

    case ErrorCode.ITEM_NOT_FOUND:
      return 'Item not found'

    case ErrorCode.ITEM_ALREADY_EXISTS:
      return 'Item already exists'

    // Default case
    default:
      return 'An error occurred'
  }
}
