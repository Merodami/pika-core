import {
  AdSize,
  BulkVoucherBookOperation,
  ContentType,
  PageLayoutType,
  PDFGenerationPriority,
  PDFGenerationStatus,
  VoucherBookSortBy,
  VoucherBookStatus,
  VoucherBookType,
} from '@pika/types'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * PDF service specific enums
 *
 * Naming convention:
 * - TypeScript enums from @pika/types: Original name (e.g., VoucherBookStatus)
 * - Zod schemas: Add 'Schema' suffix (e.g., VoucherBookStatusSchema)
 */

// ============= @pika/types Enum Schemas =============

/**
 * Voucher book status schema
 */
export const VoucherBookStatusSchema = openapi(
  createZodEnum(VoucherBookStatus),
  {
    description: 'Voucher book status',
    example: VoucherBookStatus.DRAFT,
  },
)

/**
 * Voucher book type schema
 */
export const VoucherBookTypeSchema = openapi(createZodEnum(VoucherBookType), {
  description: 'Voucher book type',
  example: VoucherBookType.MONTHLY,
})

/**
 * Page layout type schema
 */
export const PageLayoutTypeSchema = openapi(createZodEnum(PageLayoutType), {
  description: 'Page layout type',
  example: PageLayoutType.STANDARD,
})

/**
 * Ad size schema
 */
export const AdSizeSchema = openapi(createZodEnum(AdSize), {
  description: 'Ad placement size',
  example: AdSize.HALF,
})

/**
 * Content type schema
 */
export const ContentTypeSchema = openapi(createZodEnum(ContentType), {
  description: 'Content type for placements',
  example: ContentType.VOUCHER,
})

// ============= Voucher Book Enums =============

/**
 * Voucher book specific sort fields
 */
export const VoucherBookSortBySchema = openapi(
  createZodEnum(VoucherBookSortBy),
  {
    description: 'Field to sort voucher books by',
    example: VoucherBookSortBy.CREATED_AT,
  },
)

// ============= PDF Generation Enums =============

/**
 * PDF generation priority levels
 */
export const PDFGenerationPrioritySchema = openapi(
  createZodEnum(PDFGenerationPriority),
  {
    description: 'PDF generation priority level',
    example: PDFGenerationPriority.NORMAL,
  },
)

/**
 * PDF generation status
 */
export const PDFGenerationStatusSchema = openapi(
  createZodEnum(PDFGenerationStatus),
  {
    description: 'PDF generation status',
    example: PDFGenerationStatus.QUEUED,
  },
)

// ============= Bulk Operation Enums =============

/**
 * Bulk voucher book operations
 */
export const BulkVoucherBookOperationSchema = openapi(
  createZodEnum(BulkVoucherBookOperation),
  {
    description: 'Bulk operation for voucher books',
    example: BulkVoucherBookOperation.PUBLISH,
  },
)
