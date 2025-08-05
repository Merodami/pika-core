import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email as EmailAddress, UserId } from '../../shared/branded.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  CommunicationLogSortBy,
  DevicePlatform,
  EmailStatus,
  InAppNotificationType,
  MessageType,
  NotificationCategory,
  NotificationPriority,
  NotificationSortBy,
  NotificationType,
  TemplateKey,
} from '../common/enums.js'

/**
 * Internal communication service schemas for service-to-service communication
 */

// ============= Internal Data Types =============

/**
 * Internal email data (minimal fields for service consumption)
 */
export const InternalEmailData = openapi(
  z.object({
    id: UUID,
    userId: UserId.optional(),
    type: z.string(),
    recipient: EmailAddress,
    subject: z.string().optional(),
    templateId: z.string().optional(),
    status: EmailStatus,
    sentAt: DateTime.optional(),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'Internal email data for services',
  },
)

export type InternalEmailData = z.infer<typeof InternalEmailData>

/**
 * Internal notification data
 */
export const InternalNotificationData = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    type: z.string(),
    title: z.string(),
    description: z.string(),
    isRead: z.boolean(),
    isGlobal: z.boolean(),
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: DateTime,
    updatedAt: DateTime.optional(),
  }),
  {
    description: 'Internal notification data',
  },
)

export type InternalNotificationData = z.infer<typeof InternalNotificationData>

// ============= Query Parameters =============

/**
 * Internal email history query parameters
 * Following standardized pagination pattern
 */
export const InternalEmailHistoryParams = openapi(
  SearchParams.extend({
    userId: UserId.optional(),
    status: EmailStatus.optional(),
    startDate: DateTime.optional(),
    endDate: DateTime.optional(),
    sortBy: CommunicationLogSortBy.default('createdAt'),
  }),
  {
    description: 'Query parameters for internal email history',
  },
)

export type InternalEmailHistoryParams = z.infer<
  typeof InternalEmailHistoryParams
>

/**
 * Get notifications query parameters for internal services
 * Following standardized pagination pattern
 */
export const InternalNotificationsParams = openapi(
  SearchParams.extend({
    userId: UserId,
    isRead: z.boolean().optional(),
    sortBy: NotificationSortBy.default('createdAt'),
  }),
  {
    description: 'Query parameters for internal notifications',
  },
)

export type InternalNotificationsParams = z.infer<
  typeof InternalNotificationsParams
>

/**
 * Get unread count query parameters
 * Single value request - no pagination needed
 */
export const GetUnreadCountParams = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'Query parameters for unread count',
  },
)

export type GetUnreadCountParams = z.infer<typeof GetUnreadCountParams>

// ============= System Notifications =============

/**
 * Send system notification request
 */
export const SendSystemNotificationRequest = openapi(
  z.object({
    // Recipients
    userIds: z.array(UserId).optional(),
    broadcast: z.boolean().default(false).describe('Send to all users'),

    // Content
    title: z.string().max(255),
    message: z.string(),
    category: NotificationCategory,
    priority: NotificationPriority.default('normal'),

    // Channels
    channels: z.array(NotificationType).default(['inApp']),

    // Template
    templateId: z.string().optional(),
    templateVariables: z.record(z.string(), z.any()).optional(),

    // Options
    actionUrl: z.string().url().optional(),
    expiresAt: DateTime.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Send system notification',
  },
)

export type SendSystemNotificationRequest = z.infer<
  typeof SendSystemNotificationRequest
>

/**
 * Send system notification response
 */
export const SendSystemNotificationResponse = openapi(
  z.object({
    notificationId: UUID,
    recipientCount: z.number().int().nonnegative(),
    channels: z.record(
      z.string(),
      z.object({
        sent: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
      }),
    ),
    timestamp: DateTime,
  }),
  {
    description: 'System notification result',
  },
)

export type SendSystemNotificationResponse = z.infer<
  typeof SendSystemNotificationResponse
>

// ============= Transactional Emails =============

/**
 * Send transactional email request
 */
export const SendTransactionalEmailRequest = openapi(
  z.object({
    userId: UserId,
    templateKey: TemplateKey,
    variables: z.record(z.string(), z.any()),

    // Override options
    subject: z.string().optional().describe('Override template subject'),
    replyTo: EmailAddress.optional(),
    attachments: z
      .array(
        z.object({
          filename: z.string(),
          content: z.string().describe('Base64 encoded'),
          contentType: z.string(),
        }),
      )
      .optional(),

    // Delivery options
    sendAt: DateTime.optional(),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
  }),
  {
    description: 'Send transactional email',
  },
)

export type SendTransactionalEmailRequest = z.infer<
  typeof SendTransactionalEmailRequest
>

/**
 * Send transactional email response
 */
export const SendTransactionalEmailResponse = openapi(
  z.object({
    messageId: z.string(),
    status: EmailStatus,
    scheduledAt: DateTime.optional(),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'Transactional email result',
  },
)

export type SendTransactionalEmailResponse = z.infer<
  typeof SendTransactionalEmailResponse
>

// ============= SMS Service =============

/**
 * Send SMS request
 */
export const SendSMSRequest = openapi(
  z.object({
    userId: UserId,
    phoneNumber: z.string().optional().describe('Override user phone'),
    message: z.string().max(160),
    type: MessageType,
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Send SMS message',
  },
)

export type SendSMSRequest = z.infer<typeof SendSMSRequest>

/**
 * Send SMS response
 */
export const SendSMSResponse = openapi(
  z.object({
    messageId: z.string(),
    status: z.enum(['SENT', 'FAILED', 'QUEUED']),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'SMS send result',
  },
)

export type SendSMSResponse = z.infer<typeof SendSMSResponse>

// ============= Push Notifications =============

/**
 * Send push notification request
 */
export const SendPushNotificationRequest = openapi(
  z.object({
    userIds: z.array(UserId),
    title: z.string().max(100),
    body: z.string().max(255),

    // Push specific
    badge: z.number().int().nonnegative().optional(),
    sound: z.string().optional(),
    data: z.record(z.string(), z.any()).optional(),

    // iOS specific
    subtitle: z.string().optional(),
    threadId: z.string().optional(),

    // Android specific
    channelId: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),

    // Options
    priority: NotificationPriority.default('normal'),
    ttl: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Time to live in seconds'),
  }),
  {
    description: 'Send push notification',
  },
)

export type SendPushNotificationRequest = z.infer<
  typeof SendPushNotificationRequest
>

/**
 * Send push notification response
 */
export const SendPushNotificationResponse = openapi(
  z.object({
    sent: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    failures: z
      .array(
        z.object({
          userId: UserId,
          reason: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Push notification result',
  },
)

export type SendPushNotificationResponse = z.infer<
  typeof SendPushNotificationResponse
>

// ============= Communication Preferences =============

/**
 * Get user communication preferences
 */
export const GetUserCommunicationPreferencesRequest = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'Get user communication preferences',
  },
)

export type GetUserCommunicationPreferencesRequest = z.infer<
  typeof GetUserCommunicationPreferencesRequest
>

/**
 * User communication preferences response
 */
export const UserCommunicationPreferencesResponse = openapi(
  z.object({
    userId: UserId,

    // Channel preferences
    email: z.object({
      enabled: z.boolean(),
      categories: z.record(z.string(), z.boolean()),
    }),
    push: z.object({
      enabled: z.boolean(),
      categories: z.record(z.string(), z.boolean()),
      tokens: z.array(
        z.object({
          token: z.string(),
          platform: DevicePlatform,
          active: z.boolean(),
        }),
      ),
    }),
    sms: z.object({
      enabled: z.boolean(),
      categories: z.record(z.string(), z.boolean()),
      phoneNumber: z.string().optional(),
    }),

    // Quiet hours
    quietHours: z
      .object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
        timezone: z.string(),
      })
      .optional(),

    // Unsubscribe
    unsubscribedAt: DateTime.optional(),
  }),
  {
    description: 'User communication preferences',
  },
)

export type UserCommunicationPreferencesResponse = z.infer<
  typeof UserCommunicationPreferencesResponse
>

// ============= Regular Email Operations =============

/**
 * Send email request
 */
export const SendEmailRequest = openapi(
  z.object({
    to: EmailAddress,
    subject: z.string().optional().describe('Optional when using templateId'),
    templateId: z.string().optional(),
    templateParams: z.record(z.string(), z.any()).optional(),
    body: z.string().optional(),
    isHtml: z.boolean().default(false),
    replyTo: EmailAddress.optional(),
    cc: z.array(EmailAddress).optional(),
    bcc: z.array(EmailAddress).optional(),
    userId: UserId.nullish().describe('User ID for tracking and logging'),
  }),
  {
    description: 'Send email request',
  },
)

export type SendEmailRequest = z.infer<typeof SendEmailRequest>

/**
 * Send email response
 */
export const SendEmailResponse = openapi(
  z.object({
    id: z.string(),
    status: z.string(),
    type: z.string().optional(),
    recipient: z.string().optional(),
    userId: z.string().optional(),
    subject: z.string().optional(),
    templateId: z.string().optional(),
    createdAt: z.string().optional(),
    sentAt: z.string().optional(),
  }),
  {
    description: 'Send email result with communication log details',
  },
)

export type SendEmailResponse = z.infer<typeof SendEmailResponse>

/**
 * Bulk email request
 */
export const BulkEmailRequest = openapi(
  z.object({
    templateId: z.string(),
    recipients: z.array(
      z.object({
        to: EmailAddress,
        variables: z.record(z.string(), z.any()).optional(),
      }),
    ),
  }),
  {
    description: 'Send bulk emails request',
  },
)

export type BulkEmailRequest = z.infer<typeof BulkEmailRequest>

/**
 * Bulk email response
 */
export const BulkEmailResponse = openapi(
  z.object({
    sent: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  {
    description: 'Bulk email result',
  },
)

export type BulkEmailResponse = z.infer<typeof BulkEmailResponse>

// ============= In-App Notifications =============

/**
 * Create notification request
 */
export const CreateNotificationRequest = openapi(
  z.object({
    userId: UserId,
    title: z.string(),
    description: z.string(),
    type: InAppNotificationType.optional(),
    metadata: z.record(z.string(), z.any()).nullish(),
  }),
  {
    description: 'Create in-app notification',
  },
)

export type CreateNotificationRequest = z.infer<
  typeof CreateNotificationRequest
>

/**
 * Create notification response
 */
export const CreateNotificationResponse = openapi(
  z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.string(),
    isRead: z.boolean(),
    isGlobal: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  }),
  {
    description: 'Create notification result',
  },
)

export type CreateNotificationResponse = z.infer<
  typeof CreateNotificationResponse
>

// ============= Batch Operations =============

/**
 * Batch notification status update
 */
export const BatchUpdateNotificationStatusRequest = openapi(
  z.object({
    updates: z
      .array(
        z.object({
          messageId: z.string(),
          status: z.enum([
            'DELIVERED',
            'OPENED',
            'CLICKED',
            'BOUNCED',
            'FAILED',
          ]),
          timestamp: DateTime,
          metadata: z.record(z.string(), z.any()).optional(),
        }),
      )
      .min(1)
      .max(1000),
  }),
  {
    description: 'Batch update notification statuses',
  },
)

export type BatchUpdateNotificationStatusRequest = z.infer<
  typeof BatchUpdateNotificationStatusRequest
>

/**
 * Batch update response
 */
export const BatchUpdateResponse = openapi(
  z.object({
    processed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    errors: z
      .array(
        z.object({
          messageId: z.string(),
          error: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Batch update result',
  },
)

export type BatchUpdateResponse = z.infer<typeof BatchUpdateResponse>

// ============= Email History =============

/**
 * Email history response for internal services
 * Using standardized pagination
 */
export const InternalEmailHistoryResponse = paginatedResponse(
  InternalEmailData,
  {
    description: 'Paginated email history for internal services',
  },
)

export type InternalEmailHistoryResponse = z.infer<
  typeof InternalEmailHistoryResponse
>

// ============= Batch Notifications =============

/**
 * Batch create notifications request
 * This is a bounded operation (max 100) so no pagination needed
 */
export const BatchCreateNotificationsRequest = openapi(
  z.object({
    notifications: z
      .array(
        z.object({
          userId: UserId,
          title: z.string(),
          description: z.string(),
          type: InAppNotificationType.default('info'),
          metadata: z.record(z.string(), z.any()).nullish(),
        }),
      )
      .min(1)
      .max(100), // Bounded operation
  }),
  {
    description: 'Create multiple notifications (max 100)',
  },
)

export type BatchCreateNotificationsRequest = z.infer<
  typeof BatchCreateNotificationsRequest
>

/**
 * Batch create notifications response
 * Bounded operation - direct array response
 */
export const BatchCreateNotificationsResponse = openapi(
  z.object({
    created: z.number().int().nonnegative(),
    notifications: z.array(InternalNotificationData), // Always ≤ 100 items
  }),
  {
    description: 'Batch notification creation result',
  },
)

export type BatchCreateNotificationsResponse = z.infer<
  typeof BatchCreateNotificationsResponse
>

// ============= Get Notifications =============

/**
 * Get notifications response for internal services
 * Using standardized pagination
 */
export const InternalNotificationsResponse = paginatedResponse(
  InternalNotificationData,
  {
    description: 'Paginated notifications for internal services',
  },
)

export type InternalNotificationsResponse = z.infer<
  typeof InternalNotificationsResponse
>

// ============= Unread Count =============

/**
 * Get unread count response
 * Single entity response - no pagination
 */
export const GetUnreadCountResponse = openapi(
  z.object({
    userId: UserId,
    unreadCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Unread notification count',
  },
)

export type GetUnreadCountResponse = z.infer<typeof GetUnreadCountResponse>
