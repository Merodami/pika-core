/**
 * Voucher Book Domain Models
 * These represent the core business entities used internally
 */

import type { UserDomain } from './user.js'

// ============= Voucher Book Domain =============

export interface VoucherBookDomain {
  id: string
  title: string
  edition: string | null
  bookType: string
  month: number | null
  year: number
  status: string
  totalPages: number
  publishedAt?: Date | null
  coverImageUrl?: string | null
  backImageUrl?: string | null
  pdfUrl?: string | null
  pdfGeneratedAt?: Date | null
  metadata: Record<string, any> | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  // Optional relations
  createdByUser?: UserDomain
  updatedByUser?: UserDomain | null
  pages?: VoucherBookPageDomain[]
  distributions?: BookDistributionDomain[]
}

// ============= Voucher Book Page Domain =============

export interface VoucherBookPageDomain {
  id: string
  bookId: string
  pageNumber: number
  layoutType: string
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  // Optional relations
  book?: VoucherBookDomain
  adPlacements?: AdPlacementDomain[]
}

// ============= Ad Placement Domain =============

export interface AdPlacementDomain {
  id: string
  pageId: string
  contentType: string
  position: number
  size: string
  spacesUsed: number
  imageUrl?: string | null
  qrCodePayload?: string | null
  shortCode?: string | null
  title?: string | null
  description?: string | null
  metadata: Record<string, any> | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  // Optional relations
  page?: VoucherBookPageDomain
  createdByUser?: UserDomain
  updatedByUser?: UserDomain | null
}

// ============= Book Distribution Domain =============

export interface BookDistributionDomain {
  id: string
  bookId: string
  businessId: string
  businessName: string
  locationId?: string | null
  locationName?: string | null
  quantity: number
  distributionType: string
  contactName: string
  contactEmail?: string | null
  contactPhone?: string | null
  deliveryAddress?: string | null
  status: string
  shippedAt?: Date | null
  deliveredAt?: Date | null
  trackingNumber?: string | null
  shippingCarrier?: string | null
  notes?: string | null
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string | null
  // Optional relations
  book?: VoucherBookDomain
  createdByUser?: UserDomain
  updatedByUser?: UserDomain | null
}

// ============= Voucher Book Operation Results =============

export interface VoucherBookCreationResult {
  success: boolean
  voucherBook?: VoucherBookDomain
  error?: string
}

export interface VoucherBookUpdateResult {
  success: boolean
  voucherBook?: VoucherBookDomain
  error?: string
}

export interface VoucherBookDeletionResult {
  success: boolean
  deletedId?: string
  error?: string
}

// ============= PDF Generation Results =============

export interface PDFGenerationResult {
  success: boolean
  pdfUrl?: string
  generatedAt?: Date
  error?: string
  jobId?: string
}

export interface BulkPDFGenerationResult {
  processedCount: number
  successCount: number
  failedCount: number
  results: Array<{
    bookId: string
    success: boolean
    pdfUrl?: string
    error?: string
  }>
}
