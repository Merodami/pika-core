import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import {
  AdSizeSchema,
  ContentTypeSchema,
  PageLayoutTypeSchema,
  VoucherBookStatusSchema,
  VoucherBookTypeSchema,
} from '../common/enums.js'

/**
 * Internal PDF service schemas - service-to-service communication
 * Based on original Pika implementation
 */

// ============= Internal Voucher Book Response =============

/**
 * Internal voucher book response - full data for service communication
 */
export const InternalVoucherBookResponse = openapi(
  withTimestamps({
    id: UUID,
    title: z.string().max(255).describe('Voucher book title'),
    edition: z.string().max(100).optional().describe('Book edition'),
    bookType: VoucherBookTypeSchema,
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Month for monthly books'),
    year: z.number().int().min(2020).max(2100).describe('Year of publication'),
    status: VoucherBookStatusSchema,
    totalPages: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe('Total number of pages'),
    publishedAt: z
      .string()
      .datetime()
      .optional()
      .describe('Publication timestamp'),
    coverImageUrl: z.string().url().optional().describe('Cover image URL'),
    backImageUrl: z.string().url().optional().describe('Back cover image URL'),
    pdfUrl: z.string().url().optional().describe('Generated PDF URL'),
    pdfGeneratedAt: z
      .string()
      .datetime()
      .optional()
      .describe('PDF generation timestamp'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Book metadata'),
    createdBy: UserId.describe('Creator user ID'),
    updatedBy: UserId.optional().describe('Last updater user ID'),
    // Internal processing fields
    isProcessing: z
      .boolean()
      .default(false)
      .describe('Whether book is currently being processed'),
    processingJobId: z
      .string()
      .optional()
      .describe('Current processing job ID'),
    errorMessage: z.string().optional().describe('Last error message if any'),
    retryCount: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Number of generation retries'),
  }),
  {
    description: 'Internal voucher book data for service communication',
  },
)

export type InternalVoucherBookResponse = z.infer<
  typeof InternalVoucherBookResponse
>

// ============= Internal PDF Generation =============

/**
 * Internal PDF generation job request - matches original Pika implementation
 */
export const InternalGeneratePdfJobRequest = openapi(
  z.object({
    bookId: UUID.describe('Voucher book ID'),
    force: z.boolean().default(false).describe('Force regeneration'),
    userId: UserId.describe('User requesting generation'),
    options: z
      .object({
        includePages: z
          .boolean()
          .default(true)
          .describe('Include content pages'),
        includeCover: z.boolean().default(true).describe('Include cover page'),
        includeBackCover: z
          .boolean()
          .default(true)
          .describe('Include back cover'),
        quality: z
          .enum(['low', 'medium', 'high'])
          .default('medium')
          .describe('PDF quality'),
        format: z.enum(['A5', 'A4']).default('A5').describe('PDF format'),
        language: z
          .enum(['es', 'en'])
          .default('es')
          .describe('Content language'),
      })
      .optional()
      .describe('Generation options'),
  }),
  {
    description: 'Internal PDF generation job request',
  },
)

export type InternalGeneratePdfJobRequest = z.infer<
  typeof InternalGeneratePdfJobRequest
>

/**
 * Internal PDF generation job response - matches original implementation
 */
export const InternalGeneratePdfJobResponse = openapi(
  z.object({
    jobId: z.string().describe('Unique job identifier'),
    bookId: UUID.describe('Voucher book ID'),
    status: z
      .enum(['queued', 'processing', 'completed', 'failed'])
      .describe('Job status'),
    progress: z.number().min(0).max(100).describe('Job progress percentage'),
    message: z.string().describe('Current status message'),
    pdfUrl: z.string().url().optional().describe('Generated PDF URL'),
    fileSize: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('File size in bytes'),
    pageCount: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Number of pages generated'),
    error: z.string().optional().describe('Error message if failed'),
    createdAt: z.string().datetime().describe('Job creation timestamp'),
    completedAt: z
      .string()
      .datetime()
      .optional()
      .describe('Job completion timestamp'),
  }),
  {
    description: 'Internal PDF generation job status',
  },
)

export type InternalGeneratePdfJobResponse = z.infer<
  typeof InternalGeneratePdfJobResponse
>

// ============= Internal Book with Relations =============

/**
 * Internal book data with all relations - for PDF generation
 */
export const InternalBookWithRelationsResponse = openapi(
  z.object({
    book: InternalVoucherBookResponse,
    pages: z
      .array(
        z.object({
          id: UUID,
          pageNumber: z.number().int().min(1).describe('Page number'),
          layoutType: PageLayoutTypeSchema,
          metadata: z
            .record(z.string(), z.any())
            .optional()
            .describe('Page metadata'),
          placements: z
            .array(
              z.object({
                id: UUID,
                contentType: ContentTypeSchema,
                position: z
                  .number()
                  .int()
                  .min(1)
                  .max(8)
                  .describe('Position (1-8)'),
                size: AdSizeSchema,
                spacesUsed: z
                  .number()
                  .int()
                  .min(1)
                  .max(8)
                  .describe('Spaces used'),
                imageUrl: z.string().url().optional().describe('Image URL'),
                qrCodePayload: z
                  .string()
                  .optional()
                  .describe('QR code payload'),
                shortCode: z.string().max(20).optional().describe('Short code'),
                title: z.string().max(255).optional().describe('Title'),
                description: z.string().optional().describe('Description'),
                metadata: z
                  .record(z.string(), z.any())
                  .optional()
                  .describe('Placement metadata'),
                createdBy: UserId.describe('Creator user ID'),
                updatedBy: UserId.optional().describe('Last updater user ID'),
                createdAt: z.string().datetime().describe('Creation timestamp'),
                updatedAt: z
                  .string()
                  .datetime()
                  .describe('Last update timestamp'),
              }),
            )
            .describe('Page placements'),
          createdAt: z.string().datetime().describe('Creation timestamp'),
          updatedAt: z.string().datetime().describe('Last update timestamp'),
        }),
      )
      .describe('Book pages with placements'),
  }),
  {
    description: 'Complete book data with all relations for PDF generation',
  },
)

export type InternalBookWithRelationsResponse = z.infer<
  typeof InternalBookWithRelationsResponse
>

// ============= Rate Limiting =============

/**
 * Rate limit status response - matches original implementation
 */
export const InternalRateLimitStatusResponse = openapi(
  z.object({
    userId: UserId.describe('User ID'),
    remainingRequests: z
      .number()
      .int()
      .nonnegative()
      .describe('Remaining requests'),
    resetTime: z.string().datetime().describe('When limit resets'),
    totalLimit: z.number().int().positive().describe('Total requests allowed'),
    windowSize: z.number().int().positive().describe('Window size in seconds'),
    isBlocked: z.boolean().describe('Whether user is currently blocked'),
  }),
  {
    description: 'Rate limit status for PDF generation',
  },
)

export type InternalRateLimitStatusResponse = z.infer<
  typeof InternalRateLimitStatusResponse
>
