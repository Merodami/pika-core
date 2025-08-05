import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateRangeParams, SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  BounceType,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationGroupBy,
  CommunicationLogSortBy,
  CommunicationStatus,
  EmailEvent,
} from '../common/enums.js'

/**
 * Communication log schemas for public API
 */

// ============= Communication Log =============

/**
 * Communication log entry
 */
export const CommunicationLog = openapi(
  withTimestamps({
    id: UUID,
    channel: CommunicationChannel,
    direction: CommunicationDirection,
    status: CommunicationStatus,

    // Parties involved
    userId: UserId.optional(),
    recipient: z.string().optional().describe('Email, phone, or device ID'),
    sender: z.string().optional(),

    // Content
    subject: z.string().max(255).optional(),
    templateId: UUID.optional(),
    templateName: z.string().optional(),
    content: z.string().optional().describe('Truncated content preview'),

    // Tracking
    messageId: z.string().optional().describe('External message ID'),
    conversationId: z.string().optional().describe('Thread/conversation ID'),
    referenceId: z.string().optional().describe('Related entity ID'),
    referenceType: z.string().optional().describe('Related entity type'),

    // Status timestamps
    sentAt: DateTime.optional(),
    deliveredAt: DateTime.optional(),
    openedAt: DateTime.optional(),
    clickedAt: DateTime.optional(),
    failedAt: DateTime.optional(),

    // Error information
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    bounceType: BounceType.optional(),

    // Metrics
    openCount: z.number().int().nonnegative().default(0),
    clickCount: z.number().int().nonnegative().default(0),

    // Provider information
    provider: z.string().optional().describe('Email/SMS provider'),
    cost: z.number().nonnegative().optional().describe('Cost in cents'),

    // Additional data
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).default([]),
  }),
  {
    description: 'Communication log entry',
  },
)

export type CommunicationLog = z.infer<typeof CommunicationLog>

/**
 * Single communication log response
 */
export const CommunicationLogResponse = CommunicationLog

export type CommunicationLogResponse = z.infer<typeof CommunicationLogResponse>

// ============= Log Entry Creation =============

/**
 * Create communication log entry
 */
export const CreateCommunicationLogRequest = openapi(
  z.object({
    channel: CommunicationChannel,
    direction: CommunicationDirection.default('outbound'),
    status: CommunicationStatus.default('pending'),
    userId: UserId.optional(),
    recipient: z.string().optional(),
    sender: z.string().optional(),
    subject: z.string().max(255).optional(),
    templateId: UUID.optional(),
    templateName: z.string().optional(),
    content: z.string().optional(),
    messageId: z.string().optional(),
    conversationId: z.string().optional(),
    referenceId: z.string().optional(),
    referenceType: z.string().optional(),
    provider: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional(),
  }),
  {
    description: 'Log a communication event',
  },
)

export type CreateCommunicationLogRequest = z.infer<
  typeof CreateCommunicationLogRequest
>

// ============= Status Updates =============

/**
 * Update communication status
 */
export const UpdateCommunicationStatusRequest = openapi(
  z.object({
    status: CommunicationStatus,
    deliveredAt: DateTime.optional(),
    openedAt: DateTime.optional(),
    clickedAt: DateTime.optional(),
    failedAt: DateTime.optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    bounceType: BounceType.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Update communication status',
  },
)

export type UpdateCommunicationStatusRequest = z.infer<
  typeof UpdateCommunicationStatusRequest
>

// ============= Event Tracking =============

/**
 * Track communication event
 */
export const TrackCommunicationEventRequest = openapi(
  z.object({
    messageId: z.string(),
    event: EmailEvent,
    timestamp: DateTime,

    // Event details
    url: z.string().url().optional().describe('For click events'),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),

    // Error details
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    bounceType: BounceType.optional(),
  }),
  {
    description: 'Track a communication event',
  },
)

export type TrackCommunicationEventRequest = z.infer<
  typeof TrackCommunicationEventRequest
>

// ============= Search and Analytics =============

/**
 * Communication log search parameters
 */
export const CommunicationLogSearchParams = SearchParams.merge(
  DateRangeParams,
).extend({
  channel: CommunicationChannel.optional(),
  direction: CommunicationDirection.optional(),
  status: CommunicationStatus.optional(),
  userId: UserId.optional(),
  recipient: z.string().optional(),
  templateId: UUID.optional(),
  conversationId: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  provider: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasOpened: z.boolean().optional(),
  hasClicked: z.boolean().optional(),
  hasFailed: z.boolean().optional(),
  sortBy: CommunicationLogSortBy.default('createdAt'),
})

export type CommunicationLogSearchParams = z.infer<
  typeof CommunicationLogSearchParams
>

/**
 * Communication log list response
 */
export const CommunicationLogListResponse = paginatedResponse(CommunicationLog)

export type CommunicationLogListResponse = z.infer<
  typeof CommunicationLogListResponse
>

// ============= Analytics =============

/**
 * Communication analytics request
 */
export const CommunicationAnalyticsRequest = z.object({
  channel: CommunicationChannel.optional(),
  fromDate: DateTime,
  toDate: DateTime,
  groupBy: CommunicationGroupBy.default('day'),
  userId: UserId.optional(),
  templateId: UUID.optional(),
  provider: z.string().optional(),
})

export type CommunicationAnalyticsRequest = z.infer<
  typeof CommunicationAnalyticsRequest
>

/**
 * Communication analytics response
 */
export const CommunicationAnalyticsResponse = openapi(
  z.object({
    summary: z.object({
      totalSent: z.number().int().nonnegative(),
      totalDelivered: z.number().int().nonnegative(),
      totalOpened: z.number().int().nonnegative(),
      totalClicked: z.number().int().nonnegative(),
      totalFailed: z.number().int().nonnegative(),
      totalBounced: z.number().int().nonnegative(),
      deliveryRate: z.number().min(0).max(100),
      openRate: z.number().min(0).max(100),
      clickRate: z.number().min(0).max(100),
      bounceRate: z.number().min(0).max(100),
    }),

    byChannel: z.array(
      z.object({
        channel: CommunicationChannel,
        sent: z.number().int().nonnegative(),
        delivered: z.number().int().nonnegative(),
        opened: z.number().int().nonnegative(),
        clicked: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
      }),
    ),

    timeline: z.array(
      z.object({
        date: z.string(),
        sent: z.number().int().nonnegative(),
        delivered: z.number().int().nonnegative(),
        opened: z.number().int().nonnegative(),
        clicked: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
      }),
    ),

    topTemplates: z
      .array(
        z.object({
          templateId: UUID,
          templateName: z.string(),
          sent: z.number().int().nonnegative(),
          openRate: z.number().min(0).max(100),
          clickRate: z.number().min(0).max(100),
        }),
      )
      .optional(),

    costs: z
      .object({
        total: z.number().nonnegative(),
        byChannel: z.record(z.string(), z.number().nonnegative()),
      })
      .optional(),
  }),
  {
    description: 'Communication analytics data',
  },
)

export type CommunicationAnalyticsResponse = z.infer<
  typeof CommunicationAnalyticsResponse
>

// ============= Bulk Operations =============

/**
 * Bulk log creation
 */
export const BulkCreateCommunicationLogsRequest = openapi(
  z.object({
    logs: z.array(CreateCommunicationLogRequest).min(1).max(1000),
  }),
  {
    description: 'Create multiple communication logs',
  },
)

export type BulkCreateCommunicationLogsRequest = z.infer<
  typeof BulkCreateCommunicationLogsRequest
>

/**
 * Bulk log response
 */
export const BulkCommunicationLogResponse = z.object({
  created: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        index: z.number().int().nonnegative(),
        error: z.string(),
      }),
    )
    .optional(),
})

export type BulkCommunicationLogResponse = z.infer<
  typeof BulkCommunicationLogResponse
>
