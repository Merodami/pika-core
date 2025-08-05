import { z } from 'zod'

import { GymId, UserId } from './branded.js'
import { DateTime, DateTimeString } from './primitives.js'

/**
 * Common metadata schemas with Zod
 * Reusable schema mixins for consistent data structures
 */

// ============= Timestamp Schemas =============

/**
 * Creation timestamp
 */
export const createdAt = z.object({
  createdAt: DateTime.describe('When the record was created'),
})

/**
 * Update timestamp
 */
export const updatedAt = z.object({
  updatedAt: DateTime.describe('When the record was last updated'),
})

/**
 * Both timestamps - Using Date objects (for internal use)
 */
export const timestamps = z.object({
  createdAt: DateTime.describe('When the record was created'),
  updatedAt: DateTime.describe('When the record was last updated'),
})

/**
 * Both timestamps - Using strings (for API responses)
 */
export const timestampsString = z.object({
  createdAt: DateTimeString.describe('When the record was created'),
  updatedAt: DateTimeString.describe('When the record was last updated'),
})

export type Timestamps = z.infer<typeof timestamps>

// ============= Audit Fields =============

/**
 * Full audit trail
 */
export const auditFields = z.object({
  createdAt: DateTime.describe('When the record was created'),
  updatedAt: DateTime.describe('When the record was last updated'),
  createdBy: UserId.optional().describe('User who created the record'),
  updatedBy: UserId.optional().describe('User who last updated the record'),
})

export type AuditFields = z.infer<typeof auditFields>

/**
 * Soft delete fields
 */
export const softDelete = z.object({
  deletedAt: DateTime.optional().describe('When the record was soft deleted'),
  deletedBy: UserId.optional().describe('User who deleted the record'),
})

export type SoftDelete = z.infer<typeof softDelete>

// ============= Mixin Functions =============

/**
 * Add timestamps to any schema (Date objects for internal use)
 */
export function withTimestamps<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).merge(timestamps)
}

/**
 * Add timestamps to any schema (strings for API responses)
 */
export function withTimestampsString<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).merge(timestampsString)
}

/**
 * Add audit fields to any schema
 */
export function withAudit<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).merge(auditFields)
}

/**
 * Add soft delete to any schema
 */
export function withSoftDelete<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).merge(softDelete)
}

/**
 * Add all metadata fields
 */
export function withFullMetadata<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).merge(auditFields).merge(softDelete)
}

// ============= Common Metadata Patterns =============

/**
 * Gym ownership metadata
 */
export const gymOwnership = z.object({
  gymId: GymId.describe('Gym that owns this record'),
})

/**
 * User ownership metadata
 */
export const userOwnership = z.object({
  userId: UserId.describe('User that owns this record'),
})

/**
 * Multi-tenancy metadata
 */
export const multiTenancy = z.object({
  gymId: GymId.describe('Gym context for this record'),
  userId: UserId.describe('User context for this record'),
})

// ============= Status Patterns =============

/**
 * Active/Inactive status
 */
export const activeStatus = z.object({
  isActive: z.boolean().default(true).describe('Whether the record is active'),
})

/**
 * Publication status
 */
export const publicationStatus = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: DateTime.optional().describe('When the record was published'),
})

/**
 * Approval workflow
 */
export const approvalStatus = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  approvedAt: DateTime.optional(),
  approvedBy: UserId.optional(),
  rejectedAt: DateTime.optional(),
  rejectedBy: UserId.optional(),
  rejectionReason: z.string().optional(),
})

// ============= Ordering & Priority =============

/**
 * Sort order field
 */
export const sortOrder = z.object({
  sortOrder: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .describe('Display order'),
})

/**
 * Priority field
 */
export const priority = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

// ============= Tagging & Categorization =============

/**
 * Tags metadata
 */
export const taggable = z.object({
  tags: z
    .array(z.string().min(1).max(50))
    .default([])
    .describe('Associated tags'),
})

/**
 * Category reference
 */
export const categorized = z.object({
  categoryId: z.string().uuid().optional().describe('Associated category'),
})

// ============= Versioning =============

/**
 * Version tracking
 */
export const versioned = z.object({
  version: z
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Record version number'),
  previousVersionId: z
    .string()
    .uuid()
    .optional()
    .describe('Previous version reference'),
})

// ============= Utility Functions =============

/**
 * Create a metadata preset
 */
export function createMetadataPreset(mixins: Array<z.ZodObject<any>>) {
  return mixins.reduce((acc, mixin) => acc.merge(mixin), z.object({}))
}

/**
 * Standard entity metadata (most common combination)
 */
export const entityMetadata = createMetadataPreset([timestamps, activeStatus])

/**
 * Full entity metadata (for important entities)
 */
export const fullEntityMetadata = createMetadataPreset([
  auditFields,
  softDelete,
  activeStatus,
])

/**
 * Content metadata (for CMS-like entities)
 */
export const contentMetadata = createMetadataPreset([
  auditFields,
  publicationStatus,
  taggable,
  categorized,
])

// ============= Type Exports =============

export type GymOwnership = z.infer<typeof gymOwnership>
export type UserOwnership = z.infer<typeof userOwnership>
export type MultiTenancy = z.infer<typeof multiTenancy>
export type ActiveStatus = z.infer<typeof activeStatus>
export type PublicationStatus = z.infer<typeof publicationStatus>
export type ApprovalStatus = z.infer<typeof approvalStatus>
export type SortOrderMeta = z.infer<typeof sortOrder>
export type Priority = z.infer<typeof priority>
export type Taggable = z.infer<typeof taggable>
export type Categorized = z.infer<typeof categorized>
export type Versioned = z.infer<typeof versioned>
