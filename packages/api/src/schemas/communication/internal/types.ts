import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email as EmailAddress, UserId } from '../../shared/branded.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { EmailStatus } from '../common/enums.js'

/**
 * Internal-only types for communication service
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
