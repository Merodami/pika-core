import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Communication service parameters
 */

// ============= Email Parameters =============

export const EmailIdParam = openapi(
  z.object({
    id: UUID.describe('Email ID'),
  }),
  {
    description: 'Email ID parameter',
  },
)

export type EmailIdParam = z.infer<typeof EmailIdParam>

// ============= Notification Parameters =============

export const NotificationIdParam = openapi(
  z.object({
    id: UUID.describe('Notification ID'),
  }),
  {
    description: 'Notification ID parameter',
  },
)

export type NotificationIdParam = z.infer<typeof NotificationIdParam>

// ============= Template Parameters =============

export const TemplateIdParam = openapi(
  z.object({
    id: UUID.describe('Template ID'),
  }),
  {
    description: 'Template ID parameter',
  },
)

export type TemplateIdParam = z.infer<typeof TemplateIdParam>

export const TemplateKeyParam = openapi(
  z.object({
    key: z.string().describe('Template key'),
  }),
  {
    description: 'Template key parameter',
  },
)

export type TemplateKeyParam = z.infer<typeof TemplateKeyParam>

// ============= Communication Log Parameters =============

export const CommunicationLogIdParam = openapi(
  z.object({
    id: UUID.describe('Communication log ID'),
  }),
  {
    description: 'Communication log ID parameter',
  },
)

export type CommunicationLogIdParam = z.infer<typeof CommunicationLogIdParam>
