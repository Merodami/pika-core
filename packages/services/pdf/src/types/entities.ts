/**
 * PDF Service Domain Entities
 *
 * These are the PDF service's internal representations of business entities.
 * They are NOT shared with other services. Other services should communicate
 * with this service using DTOs defined in api-contracts.ts
 */

import type {
  AdSize,
  ContentType,
  PageLayoutType,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'

// ============= Core Entities =============

/**
 * VoucherBook entity - PDF service's internal representation
 * This is how the PDF service understands a voucher book
 */
export interface VoucherBook {
  id: string
  title: string
  edition: string | null
  bookType: VoucherBookType
  month: number | null
  year: number
  status: VoucherBookStatus
  totalPages: number
  publishedAt: Date | null
  coverImageUrl: string | null
  backImageUrl: string | null
  pdfUrl: string | null
  pdfGeneratedAt: Date | null
  metadata: Record<string, any> | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null

  // Relations (optional, loaded when needed)
  pages?: VoucherBookPage[]
  distributions?: BookDistribution[]
  createdByUser?: UserReference
  updatedByUser?: UserReference | null
}

/**
 * VoucherBookPage entity
 */
export interface VoucherBookPage {
  id: string
  bookId: string
  pageNumber: number
  layoutType: PageLayoutType
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date

  // Relations
  book?: VoucherBook
  adPlacements?: AdPlacement[]
}

/**
 * AdPlacement entity
 */
export interface AdPlacement {
  id: string
  pageId: string
  contentType: ContentType
  position: number
  size: AdSize
  spacesUsed: number
  imageUrl: string | null
  qrCodePayload: string | null
  shortCode: string | null
  title: string | null
  description: string | null
  metadata: Record<string, any> | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date

  // Relations
  page?: VoucherBookPage
  createdByUser?: UserReference
  updatedByUser?: UserReference | null
}

/**
 * BookDistribution entity
 */
export interface BookDistribution {
  id: string
  bookId: string
  businessId: string
  businessName: string
  locationId: string | null
  locationName: string | null
  quantity: number
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  deliveryAddress: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
  trackingNumber: string | null
  shippingCarrier: string | null
  notes: string | null
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string | null

  // Relations
  book?: VoucherBook
  createdByUser?: UserReference
  updatedByUser?: UserReference | null
}

// ============= Value Objects =============

/**
 * UserReference - Minimal user info needed by PDF service
 * We don't need the full User entity, just what's relevant for display
 */
export interface UserReference {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
}

/**
 * VoucherReference - Minimal voucher info needed for PDF generation
 * When PDF service needs voucher data, it only needs these fields
 */
export interface VoucherReference {
  id: string
  title: string
  description?: string
  price: number
  discountPercentage?: number
  imageUrl?: string
  shortCode?: string
  qrPayload?: string
}

/**
 * BusinessReference - Minimal business info for distributions
 */
export interface BusinessReference {
  id: string
  name: string
  logoUrl?: string
  address?: string
}

// ============= Computed Types =============

/**
 * EnrichedVoucherBook - VoucherBook with computed properties
 */
export interface EnrichedVoucherBook extends VoucherBook {
  computed: {
    displayName: string
    displayPeriod: string
    ageInDays: number
    isRecent: boolean
    canBeEdited: boolean
    canBePublished: boolean
    hasPDF: boolean
    completionPercentage?: number
  }
}
