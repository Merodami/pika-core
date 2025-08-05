import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime } from '../../shared/primitives.js'
import {
  CommunicationLogSortBy,
  EmailStatus,
  NotificationSortBy,
} from '../common/enums.js'

/**
 * Internal-only query parameters for communication service
 */

// ============= Email History Queries =============

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

// ============= Notification Queries =============

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
