import { SortOrder, TimestampSortBy } from '@pika/types'
import {
  AdminTicketSortBy,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { SortOrderSchema, TimestampSortBySchema } from '../../common/enums.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  AdminTicketSortBySchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketTypeSchema,
} from '../common/enums.js'

/**
 * Admin support ticket management schemas
 */

// ============= Constants =============

/**
 * Allowed relations for admin problem endpoints
 */
export const ADMIN_PROBLEM_RELATIONS = ['user', 'assignedUser'] as const

/**
 * Allowed relations for admin comment endpoints
 */
export const ADMIN_COMMENT_RELATIONS = ['user'] as const

// ============= Admin Ticket View =============

/**
 * Simplified ticket for admin
 */
export const AdminTicketDetailResponse = openapi(
  withTimestamps({
    id: UUID,
    ticketNumber: z.string().optional(),
    userId: UserId,
    userName: z.string(),
    userEmail: z.string().email(),

    // Ticket details
    title: z.string(),
    description: z.string(),
    type: TicketTypeSchema,
    status: TicketStatusSchema,
    priority: TicketPrioritySchema,
    resolvedAt: DateTime.optional(),

    // Essential admin fields
    assignedTo: UserId.optional(),
    assignedToName: z.string().optional(),

    // File attachments
    files: z.array(z.string()).default([]),
  }),
  {
    description: 'Support ticket for admin',
  },
)

export type AdminTicketDetailResponse = z.infer<
  typeof AdminTicketDetailResponse
>

// ============= Ticket Search =============

/**
 * Admin ticket search parameters
 */
export const AdminTicketQueryParams = z.object({
  search: z.string().optional().describe('Search in title, description'),
  ticketNumber: z.string().optional(),
  userId: UserId.optional(),
  assignedTo: UserId.optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  type: TicketTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: AdminTicketSortBySchema.default(AdminTicketSortBy.CREATED_AT),
  sortOrder: SortOrderSchema.default(SortOrder.DESC),
  ...createIncludeParam(ADMIN_PROBLEM_RELATIONS).shape,
})

export type AdminTicketQueryParams = z.infer<typeof AdminTicketQueryParams>

/**
 * Admin ticket list response
 */
export const AdminTicketListResponse = paginatedResponse(
  AdminTicketDetailResponse,
)

export type AdminTicketListResponse = z.infer<typeof AdminTicketListResponse>

// ============= Admin Problem Actions =============

/**
 * Admin update problem request
 */
export const AdminUpdateProblemRequest = openapi(
  z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    priority: TicketPrioritySchema.optional(),
    type: TicketTypeSchema.optional(),
    status: TicketStatusSchema.optional(),
    assignedTo: UserId.optional(),
    resolvedAt: DateTime.optional(),
    files: z.array(z.string()).optional(),
  }),
  {
    description: 'Admin update support problem',
  },
)
export type AdminUpdateProblemRequest = z.infer<
  typeof AdminUpdateProblemRequest
>

// ============= Ticket Actions =============

/**
 * Assign ticket request
 */
export const AssignTicketRequest = openapi(
  z.object({
    assigneeId: UserId,
    note: z.string().max(500).optional(),
    priority: TicketPrioritySchema.optional(),
  }),
  {
    description: 'Assign ticket to agent',
  },
)

export type AssignTicketRequest = z.infer<typeof AssignTicketRequest>

/**
 * Update ticket status request
 */
export const UpdateTicketStatusRequest = openapi(
  z.object({
    status: TicketStatusSchema,
    note: z.string().max(1000).optional(),
    notifyUser: z.boolean().default(true),
  }),
  {
    description: 'Update ticket status',
  },
)

export type UpdateTicketStatusRequest = z.infer<
  typeof UpdateTicketStatusRequest
>

/**
 * Escalate ticket request
 */
export const EscalateTicketRequest = openapi(
  z.object({
    reason: z.string().max(1000),
    priority: TicketPrioritySchema.optional(),
    assignToSupervisor: z.boolean().default(true),
  }),
  {
    description: 'Escalate ticket',
  },
)

export type EscalateTicketRequest = z.infer<typeof EscalateTicketRequest>

/**
 * Admin comment on ticket
 */
export const AdminTicketComment = openapi(
  z.object({
    content: z.string().max(5000),
    isInternal: z.boolean().default(false),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          url: z.string().url(),
          type: z.string(),
          size: z.number().int().positive(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Add admin comment to ticket',
  },
)

export type AdminTicketComment = z.infer<typeof AdminTicketComment>

// ============= Ticket Metrics =============

/**
 * Support metrics
 */
export const SupportMetrics = openapi(
  z.object({
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),

    // Volume
    totalTickets: z.number().int().nonnegative(),
    newTickets: z.number().int().nonnegative(),
    resolvedTickets: z.number().int().nonnegative(),

    // Performance
    averageFirstResponseTime: z
      .number()
      .describe('Average time to first response in minutes'),
    averageResolutionTime: z
      .number()
      .describe('Average resolution time in hours'),

    // Status breakdown
    ticketsByStatus: z.object({
      [TicketStatus.OPEN]: z.number().int().nonnegative().optional(),
      [TicketStatus.ASSIGNED]: z.number().int().nonnegative().optional(),
      [TicketStatus.IN_PROGRESS]: z.number().int().nonnegative().optional(),
      [TicketStatus.WAITING_CUSTOMER]: z
        .number()
        .int()
        .nonnegative()
        .optional(),
      [TicketStatus.WAITING_INTERNAL]: z
        .number()
        .int()
        .nonnegative()
        .optional(),
      [TicketStatus.RESOLVED]: z.number().int().nonnegative().optional(),
      [TicketStatus.CLOSED]: z.number().int().nonnegative().optional(),
    }),
    ticketsByPriority: z.object({
      [TicketPriority.LOW]: z.number().int().nonnegative().optional(),
      [TicketPriority.MEDIUM]: z.number().int().nonnegative().optional(),
      [TicketPriority.HIGH]: z.number().int().nonnegative().optional(),
      [TicketPriority.URGENT]: z.number().int().nonnegative().optional(),
      [TicketPriority.CRITICAL]: z.number().int().nonnegative().optional(),
    }),
    ticketsByType: z.object({
      [TicketType.BILLING]: z.number().int().nonnegative().optional(),
      [TicketType.TECHNICAL]: z.number().int().nonnegative().optional(),
      [TicketType.ACCOUNT]: z.number().int().nonnegative().optional(),
      [TicketType.GENERAL]: z.number().int().nonnegative().optional(),
      [TicketType.BUG_REPORT]: z.number().int().nonnegative().optional(),
      [TicketType.FEATURE_REQUEST]: z.number().int().nonnegative().optional(),
    }),

    // Agent performance
    agentStats: z
      .array(
        z.object({
          agentId: UserId,
          agentName: z.string(),
          ticketsHandled: z.number().int().nonnegative(),
          averageResponseTime: z.number(),
          averageResolutionTime: z.number(),
          satisfactionScore: z.number().min(0).max(5).optional(),
        }),
      )
      .optional(),

    // Satisfaction
    averageSatisfaction: z.number().min(0).max(5).optional(),
    satisfactionResponseRate: z.number().min(0).max(100).optional(),
  }),
  {
    description: 'Support ticket metrics',
  },
)

export type SupportMetrics = z.infer<typeof SupportMetrics>

// ============= Bulk Operations =============

/**
 * Bulk ticket update request
 */
export const BulkTicketUpdateRequest = openapi(
  z.object({
    ticketIds: z.array(UUID).min(1).max(100),
    updates: z.object({
      status: TicketStatusSchema.optional(),
      priority: TicketPrioritySchema.optional(),
      assignedTo: UserId.optional(),
      tags: z.array(z.string()).optional(),
    }),
    note: z.string().max(500).optional(),
  }),
  {
    description: 'Update multiple tickets',
  },
)

export type BulkTicketUpdateRequest = z.infer<typeof BulkTicketUpdateRequest>

// ============= Templates =============

/**
 * Response template
 */
export const ResponseTemplate = z.object({
  id: UUID,
  name: z.string(),
  type: TicketType,
  subject: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  usageCount: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
})

export type ResponseTemplate = z.infer<typeof ResponseTemplate>

/**
 * Template list response
 */
export const TemplateListResponse = paginatedResponse(ResponseTemplate)

export type TemplateListResponse = z.infer<typeof TemplateListResponse>

// Additional schemas for admin-api.ts
export const TicketStatsResponse = SupportMetrics
export type TicketStatsResponse = z.infer<typeof TicketStatsResponse>

export const AgentPerformanceResponse = openapi(
  z.object({
    agentId: UserId,
    agentName: z.string(),
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    ticketsHandled: z.number().int().nonnegative(),
    ticketsResolved: z.number().int().nonnegative(),
    averageResponseTime: z.number().describe('In minutes'),
    averageResolutionTime: z.number().describe('In hours'),
    satisfactionScore: z.number().min(0).max(5).optional(),
    firstContactResolutionRate: z.number().min(0).max(100),
  }),
  {
    description: 'Individual agent performance metrics',
  },
)

export type AgentPerformanceResponse = z.infer<typeof AgentPerformanceResponse>

// TicketIdParam is now imported from common/parameters.ts

// ============= Admin Comment Query Schemas =============

/**
 * Admin get all comments query parameters
 */
export const AdminGetAllCommentsQuery = openapi(
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: TimestampSortBySchema.default(TimestampSortBy.CREATED_AT),
    sortOrder: SortOrderSchema.default(SortOrder.DESC),
    search: z.string().optional(),
    problemId: z.string().optional(),
    isInternal: z.coerce.boolean().optional(),
    ...createIncludeParam(ADMIN_COMMENT_RELATIONS).shape,
  }),
  {
    description: 'Query parameters for admin comment listing',
  },
)
export type AdminGetAllCommentsQuery = z.infer<typeof AdminGetAllCommentsQuery>

/**
 * Admin get comments by problem query parameters
 */
export const AdminCommentsByProblemQuery = openapi(
  SearchParams.extend({
    ...createIncludeParam(ADMIN_COMMENT_RELATIONS).shape,
  }),
  {
    description:
      'Query parameters for getting comments by problem ID with pagination',
  },
)
export type AdminCommentsByProblemQuery = z.infer<
  typeof AdminCommentsByProblemQuery
>

/**
 * Admin get ticket by ID query parameters
 */
export const AdminTicketByIdQuery = openapi(
  z.object({
    ...createIncludeParam(ADMIN_PROBLEM_RELATIONS).shape,
  }),
  {
    description: 'Query parameters for getting a single ticket',
  },
)
export type AdminTicketByIdQuery = z.infer<typeof AdminTicketByIdQuery>
