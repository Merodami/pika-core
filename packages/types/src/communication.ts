/**
 * Communication and template-related types
 * Shared across all services that need to reference email templates
 */

/**
 * Template categories for organization
 */
export enum TemplateCategory {
  AUTH = 'auth',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  SYSTEM = 'system',
}

/**
 * Email template identifiers - type-safe template keys
 * These correspond to file-based templates in the communication service
 */
export enum EmailTemplateId {
  // Authentication templates
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset',
  PASSWORD_RESET_CONFIRMATION = 'password-reset-confirmation',
  WELCOME = 'welcome',

  // Booking templates
  BOOKING_CONFIRMATION = 'booking-confirmation',
  BOOKING_REMINDER = 'booking-reminder',
  BOOKING_CANCELLED = 'booking-cancelled',

  // Payment templates
  PAYMENT_SUCCESS = 'payment-success',
  PAYMENT_FAILED = 'payment-failed',
  SUBSCRIPTION_ACTIVATED = 'subscription-activated',
  SUBSCRIPTION_EXPIRING = 'subscription-expiring',
  SUBSCRIPTION_EXPIRED = 'subscription-expired',

  // Account status templates
  ACCOUNT_BANNED = 'account-banned',
  ACCOUNT_UNBANNED = 'account-unbanned',
}

/**
 * Type alias for backward compatibility
 * @deprecated Use EmailTemplateId instead
 */
export type TemplateKey = EmailTemplateId

/**
 * Email template variables interface
 * Common variables that most templates expect
 */
export interface BaseTemplateVariables {
  firstName?: string
  lastName?: string
  email?: string
  frontendUrl?: string
  unsubscribeUrl?: string
}

/**
 * Template-specific variable interfaces
 */
export interface EmailVerificationVariables extends BaseTemplateVariables {
  verificationUrl: string
}

export interface PasswordResetVariables extends BaseTemplateVariables {
  resetLink: string
  expirationHours: string
}

export interface WelcomeVariables extends BaseTemplateVariables {
  // No additional variables required
}

export interface BookingConfirmationVariables extends BaseTemplateVariables {
  sessionType: string
  trainerName: string
  sessionDate: string
  sessionTime: string
  gymName?: string
  sessionUrl?: string
}

export interface PaymentVariables extends BaseTemplateVariables {
  amount: string
  currency?: string
  transactionId?: string
  planName?: string
}

/**
 * Union type of all possible template variables
 */
export type TemplateVariables =
  | BaseTemplateVariables
  | EmailVerificationVariables
  | PasswordResetVariables
  | WelcomeVariables
  | BookingConfirmationVariables
  | PaymentVariables
