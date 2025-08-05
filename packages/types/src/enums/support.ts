/**
 * Support service-related enums
 */

/**
 * Support ticket status
 */
export enum TicketStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Support ticket priority levels
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Support ticket types (categories)
 */
export enum TicketType {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  GENERAL = 'general',
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
}

/**
 * Admin ticket sorting fields
 */
export enum AdminTicketSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  RESOLVED_AT = 'resolvedAt',
  PRIORITY = 'priority',
  STATUS = 'status',
}

/**
 * Comment sorting fields
 */
export enum CommentSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
