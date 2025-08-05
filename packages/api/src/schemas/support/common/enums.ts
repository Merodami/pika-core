import {
  AdminTicketSortBy,
  CommentSortBy,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '@pika/types'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Support service enum schemas
 *
 * Naming convention:
 * - TypeScript enums from @pika/types: Original name (e.g., TicketStatus)
 * - Zod schemas: Add 'Schema' suffix (e.g., TicketStatusSchema)
 */

// ============= Support Service Enum Schemas =============

/**
 * Admin ticket sorting fields schema
 */
export const AdminTicketSortBySchema = openapi(
  createZodEnum(AdminTicketSortBy),
  {
    description: 'Field to sort admin tickets by',
    example: AdminTicketSortBy.CREATED_AT,
  },
)

/**
 * Ticket status schema
 */
export const TicketStatusSchema = openapi(createZodEnum(TicketStatus), {
  description: 'Support ticket status',
  example: TicketStatus.OPEN,
})

/**
 * Ticket priority schema
 */
export const TicketPrioritySchema = openapi(createZodEnum(TicketPriority), {
  description: 'Support ticket priority level',
  example: TicketPriority.MEDIUM,
})

/**
 * Ticket type schema
 */
export const TicketTypeSchema = openapi(createZodEnum(TicketType), {
  description: 'Support ticket category/type',
  example: TicketType.TECHNICAL,
})

/**
 * Comment sorting fields schema
 */
export const CommentSortBySchema = openapi(createZodEnum(CommentSortBy), {
  description: 'Field to sort comments by',
  example: CommentSortBy.CREATED_AT,
})
