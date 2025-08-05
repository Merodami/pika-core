import { z } from 'zod'

/**
 * Communication-specific enums
 */

// ============= Email Enums =============

export const EmailStatus = z.enum([
  'queued',
  'sent',
  'delivered',
  'failed',
  'bounced',
  'complained',
  'rejected',
])

export type EmailStatus = z.infer<typeof EmailStatus>

export const EmailPriority = z.enum(['low', 'normal', 'high'])

export type EmailPriority = z.infer<typeof EmailPriority>

export const BounceType = z.enum(['soft', 'hard'])

export type BounceType = z.infer<typeof BounceType>

export const EmailEvent = z.enum([
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'unsubscribed',
])

export type EmailEvent = z.infer<typeof EmailEvent>

export const EmailSortBy = z.enum([
  'createdAt',
  'sentAt',
  'deliveredAt',
  'subject',
])

export type EmailSortBy = z.infer<typeof EmailSortBy>

// ============= Notification Enums =============

export const NotificationType = z.enum(['email', 'inApp', 'sms', 'push'])

export type NotificationType = z.infer<typeof NotificationType>

export const NotificationStatus = z.enum([
  'pending',
  'sent',
  'delivered',
  'failed',
  'read',
])

export type NotificationStatus = z.infer<typeof NotificationStatus>

export const NotificationPriority = z.enum(['low', 'normal', 'high', 'urgent'])

export type NotificationPriority = z.infer<typeof NotificationPriority>

export const NotificationSortBy = z.enum(['createdAt', 'priority', 'expiresAt'])

export type NotificationSortBy = z.infer<typeof NotificationSortBy>

export const CommunicationLogSortBy = z.enum([
  'createdAt',
  'sentAt',
  'deliveredAt',
])

export type CommunicationLogSortBy = z.infer<typeof CommunicationLogSortBy>

export const TemplateSortBy = z.enum([
  'name',
  'createdAt',
  'updatedAt',
  'category',
])

export type TemplateSortBy = z.infer<typeof TemplateSortBy>

export const DevicePlatform = z.enum(['ios', 'android', 'web'])

export type DevicePlatform = z.infer<typeof DevicePlatform>

// ============= Communication Log Enums =============

export const CommunicationChannel = z.enum([
  'email',
  'sms',
  'push',
  'inApp',
  'webhook',
])

export type CommunicationChannel = z.infer<typeof CommunicationChannel>

export const CommunicationStatus = z.enum([
  'pending',
  'queued',
  'sent',
  'delivered',
  'failed',
  'cancelled',
])

export type CommunicationStatus = z.infer<typeof CommunicationStatus>

export const CommunicationDirection = z.enum(['inbound', 'outbound'])

export type CommunicationDirection = z.infer<typeof CommunicationDirection>

export const CommunicationGroupBy = z.enum(['day', 'week', 'month'])

export type CommunicationGroupBy = z.infer<typeof CommunicationGroupBy>

// ============= Template Enums =============

export const TemplateType = z.enum(['email', 'sms', 'push', 'inApp'])

export type TemplateType = z.infer<typeof TemplateType>

export const TemplateCategory = z.enum([
  'transactional',
  'marketing',
  'system',
  'notification',
])

export type TemplateCategory = z.infer<typeof TemplateCategory>

export const TemplateVariableType = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'array',
  'object',
])

export type TemplateVariableType = z.infer<typeof TemplateVariableType>

// ============= Internal Service Enums =============

export const NotificationCategory = z.enum([
  'system',
  'security',
  'billing',
  'marketing',
])

export type NotificationCategory = z.infer<typeof NotificationCategory>

export const TemplateKey = z.enum([
  'welcome',
  'passwordReset',
  'emailVerification',
  'paymentSuccess',
  'paymentFailed',
  'subscriptionActivated',
  'subscriptionCancelled',
])

export type TemplateKey = z.infer<typeof TemplateKey>

export const MessageType = z.enum([
  'verification',
  'alert',
  'reminder',
  'marketing',
])

export type MessageType = z.infer<typeof MessageType>

export const InAppNotificationType = z.enum([
  'info',
  'warning',
  'error',
  'success',
])

export type InAppNotificationType = z.infer<typeof InAppNotificationType>
