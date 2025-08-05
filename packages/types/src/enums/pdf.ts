/**
 * PDF service-related enums
 */

/**
 * Page layout type - matches database PageLayoutType enum exactly
 */
export enum PageLayoutType {
  STANDARD = 'standard',
  MIXED = 'mixed',
  FULL_PAGE = 'full_page',
  CUSTOM = 'custom',
}

/**
 * Type definition for page layout type - use this for type annotations
 */
export type PageLayoutTypeType = `${PageLayoutType}`

/**
 * Ad size - matches database AdSize enum exactly
 */
export enum AdSize {
  SINGLE = 'single',
  QUARTER = 'quarter',
  HALF = 'half',
  FULL = 'full',
}

/**
 * Type definition for ad size - use this for type annotations
 */
export type AdSizeType = `${AdSize}`

/**
 * Content type - matches database ContentType enum exactly
 */
export enum ContentType {
  VOUCHER = 'voucher',
  IMAGE = 'image',
  AD = 'ad',
  SPONSORED = 'sponsored',
}

/**
 * Type definition for content type - use this for type annotations
 */
export type ContentTypeType = `${ContentType}`

/**
 * Voucher book sorting fields
 */
export enum VoucherBookSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  YEAR = 'year',
  MONTH = 'month',
  STATUS = 'status',
  PUBLISHED_AT = 'publishedAt',
}

/**
 * PDF generation priority levels
 */
export enum PDFGenerationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * PDF generation status
 */
export enum PDFGenerationStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Bulk voucher book operations
 */
export enum BulkVoucherBookOperation {
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  GENERATE_PDF = 'generate_pdf',
  DELETE = 'delete',
}
