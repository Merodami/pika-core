import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import {
  AdSizeSchema,
  ContentTypeSchema,
  PageLayoutTypeSchema,
} from '../common/enums.js'

/**
 * Admin page and placement management schemas
 */

// ============= Page Management =============

/**
 * Admin voucher book page response
 */
export const AdminVoucherBookPageResponse = openapi(
  withTimestamps({
    id: UUID,
    bookId: UUID.describe('Parent voucher book ID'),
    pageNumber: z.number().int().min(1).describe('Page number within the book'),
    layoutType: PageLayoutTypeSchema,
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Page-specific metadata'),
    // Admin-specific fields
    placementCount: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of placements on this page'),
    spacesUsed: z
      .number()
      .int()
      .min(0)
      .max(8)
      .describe('Number of spaces currently used'),
    spacesAvailable: z
      .number()
      .int()
      .min(0)
      .max(8)
      .describe('Number of spaces available'),
    isComplete: z.boolean().describe('Whether page layout is complete'),
  }),
  {
    description: 'Admin page information with management details',
  },
)

export type AdminVoucherBookPageResponse = z.infer<
  typeof AdminVoucherBookPageResponse
>

/**
 * Create/Update page request
 */
export const UpsertPageRequest = openapi(
  z.object({
    pageNumber: z.number().int().min(1).describe('Page number within the book'),
    layoutType: PageLayoutTypeSchema,
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Page-specific metadata'),
  }),
  {
    description: 'Create or update a page',
  },
)

export type UpsertPageRequest = z.infer<typeof UpsertPageRequest>

// ============= Ad Placement Management =============

/**
 * Admin ad placement response
 */
export const AdminAdPlacementResponse = openapi(
  withTimestamps({
    id: UUID,
    pageId: UUID.describe('Parent page ID'),
    contentType: ContentTypeSchema,
    position: z
      .number()
      .int()
      .min(1)
      .max(8)
      .describe('Position on the page (1-8)'),
    size: AdSizeSchema,
    spacesUsed: z
      .number()
      .int()
      .min(1)
      .max(8)
      .describe('Number of spaces used'),
    imageUrl: z.string().url().optional().describe('Content image URL'),
    qrCodePayload: z
      .string()
      .optional()
      .describe('QR code payload for vouchers'),
    shortCode: z.string().max(20).optional().describe('Human-readable code'),
    title: z.string().max(255).optional().describe('Content title'),
    description: z.string().optional().describe('Content description'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Placement metadata'),
    createdBy: UserId.describe('User who created the placement'),
    updatedBy: UserId.optional().describe(
      'User who last updated the placement',
    ),
    // Admin-specific fields
    isActive: z.boolean().describe('Whether placement is active'),
    revenue: z
      .number()
      .optional()
      .describe('Revenue generated from this placement'),
    impressions: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Number of impressions'),
    clicks: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Number of clicks'),
  }),
  {
    description: 'Admin ad placement information with management details',
  },
)

export type AdminAdPlacementResponse = z.infer<typeof AdminAdPlacementResponse>

/**
 * Create ad placement request
 */
export const CreateAdPlacementRequest = openapi(
  z.object({
    contentType: ContentTypeSchema,
    position: z
      .number()
      .int()
      .min(1)
      .max(8)
      .describe('Position on the page (1-8)'),
    size: AdSizeSchema,
    imageUrl: z.string().url().optional().describe('Content image URL'),
    qrCodePayload: z
      .string()
      .optional()
      .describe('QR code payload for vouchers'),
    shortCode: z.string().max(20).optional().describe('Human-readable code'),
    title: z.string().max(255).optional().describe('Content title'),
    description: z.string().optional().describe('Content description'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Placement metadata'),
  }),
  {
    description: 'Create a new ad placement',
  },
)

export type CreateAdPlacementRequest = z.infer<typeof CreateAdPlacementRequest>

/**
 * Update ad placement request
 */
export const UpdateAdPlacementRequest = openapi(
  z.object({
    contentType: ContentTypeSchema.optional(),
    position: z
      .number()
      .int()
      .min(1)
      .max(8)
      .optional()
      .describe('Position on the page (1-8)'),
    size: AdSizeSchema.optional(),
    imageUrl: z.string().url().optional().describe('Content image URL'),
    qrCodePayload: z
      .string()
      .optional()
      .describe('QR code payload for vouchers'),
    shortCode: z.string().max(20).optional().describe('Human-readable code'),
    title: z.string().max(255).optional().describe('Content title'),
    description: z.string().optional().describe('Content description'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Placement metadata'),
    isActive: z.boolean().optional().describe('Whether placement is active'),
  }),
  {
    description: 'Update an existing ad placement',
  },
)

export type UpdateAdPlacementRequest = z.infer<typeof UpdateAdPlacementRequest>

// ============= Layout Management =============

/**
 * Page layout preview request
 */
export const PageLayoutPreviewRequest = openapi(
  z.object({
    layoutType: PageLayoutTypeSchema,
    placements: z
      .array(
        z.object({
          position: z
            .number()
            .int()
            .min(1)
            .max(8)
            .describe('Position on the page'),
          size: AdSizeSchema,
          contentType: ContentTypeSchema,
          title: z.string().optional().describe('Content title for preview'),
        }),
      )
      .describe('Placements to preview'),
  }),
  {
    description: 'Generate a preview of page layout',
  },
)

export type PageLayoutPreviewRequest = z.infer<typeof PageLayoutPreviewRequest>

/**
 * Page layout preview response
 */
export const PageLayoutPreviewResponse = openapi(
  z.object({
    previewUrl: z.string().url().describe('URL of the generated preview image'),
    layout: z
      .object({
        totalSpaces: z
          .number()
          .int()
          .min(1)
          .max(8)
          .describe('Total available spaces'),
        usedSpaces: z.number().int().min(0).max(8).describe('Used spaces'),
        availableSpaces: z
          .number()
          .int()
          .min(0)
          .max(8)
          .describe('Available spaces'),
        conflicts: z.array(z.string()).describe('Layout conflicts if any'),
      })
      .describe('Layout information'),
  }),
  {
    description: 'Page layout preview information',
  },
)

export type PageLayoutPreviewResponse = z.infer<
  typeof PageLayoutPreviewResponse
>

// ============= Bulk Operations =============

/**
 * Bulk placement operation request
 */
export const BulkPlacementOperationRequest = openapi(
  z.object({
    placementIds: z
      .array(UUID)
      .min(1)
      .max(50)
      .describe('Placement IDs to operate on'),
    operation: z
      .enum(['activate', 'deactivate', 'delete', 'move'])
      .describe('Operation to perform'),
    options: z
      .record(z.string(), z.any())
      .optional()
      .describe('Operation-specific options'),
  }),
  {
    description: 'Bulk operation on multiple placements',
  },
)

export type BulkPlacementOperationRequest = z.infer<
  typeof BulkPlacementOperationRequest
>

/**
 * Bulk placement operation response
 */
export const BulkPlacementOperationResponse = openapi(
  z.object({
    successful: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of successful operations'),
    failed: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of failed operations'),
    results: z
      .array(
        z.object({
          placementId: UUID.describe('Placement ID'),
          success: z.boolean().describe('Whether operation succeeded'),
          error: z.string().optional().describe('Error message if failed'),
        }),
      )
      .describe('Detailed results for each placement'),
  }),
  {
    description: 'Bulk placement operation results',
  },
)

export type BulkPlacementOperationResponse = z.infer<
  typeof BulkPlacementOperationResponse
>
