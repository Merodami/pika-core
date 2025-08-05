import type {
  AdPlacementDomain,
  BookDistributionDomain,
  VoucherBookDomain,
  VoucherBookPageDomain,
} from '../domain/voucher-book.js'

/**
 * Interface for voucher book document from database
 */
export interface VoucherBookDocument {
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
  metadata: any | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  // Optional relations
  createdByUser?: any
  updatedByUser?: any | null
  pages?: VoucherBookPageDocument[]
  distributions?: BookDistributionDocument[]
}

/**
 * Interface for voucher book page document from database
 */
export interface VoucherBookPageDocument {
  id: string
  bookId: string
  pageNumber: number
  layoutType: string
  metadata: any | null
  createdAt: Date
  updatedAt: Date
  // Optional relations
  book?: VoucherBookDocument
  adPlacements?: AdPlacementDocument[]
}

/**
 * Interface for ad placement document from database
 */
export interface AdPlacementDocument {
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
  metadata: any | null
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  // Optional relations
  page?: VoucherBookPageDocument
  createdByUser?: any
  updatedByUser?: any | null
}

/**
 * Interface for book distribution document from database
 */
export interface BookDistributionDocument {
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
  metadata: any | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string | null
  // Optional relations
  book?: VoucherBookDocument
  createdByUser?: any
  updatedByUser?: any | null
}

/**
 * Mapper for VoucherBook entities
 */
export class VoucherBookMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: VoucherBookDocument): VoucherBookDomain {
    return {
      id: doc.id,
      title: doc.title,
      edition: doc.edition ?? null,
      bookType: doc.bookType,
      month: doc.month ?? null,
      year: doc.year,
      status: doc.status,
      totalPages: doc.totalPages,
      publishedAt: doc.publishedAt,
      coverImageUrl: doc.coverImageUrl,
      backImageUrl: doc.backImageUrl,
      pdfUrl: doc.pdfUrl,
      pdfGeneratedAt: doc.pdfGeneratedAt,
      metadata: doc.metadata ?? null,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
      // Map relations if present
      createdByUser: doc.createdByUser,
      updatedByUser: doc.updatedByUser,
      pages: doc.pages?.map(VoucherBookPageMapper.fromDocument),
      distributions: doc.distributions?.map(
        BookDistributionMapper.fromDocument,
      ),
    }
  }

  /**
   * Maps domain entity to database document format
   */
  static toDocument(domain: VoucherBookDomain): Partial<VoucherBookDocument> {
    return {
      id: domain.id,
      title: domain.title,
      edition: domain.edition,
      bookType: domain.bookType,
      month: domain.month,
      year: domain.year,
      status: domain.status,
      totalPages: domain.totalPages,
      publishedAt: domain.publishedAt,
      coverImageUrl: domain.coverImageUrl,
      backImageUrl: domain.backImageUrl,
      pdfUrl: domain.pdfUrl,
      pdfGeneratedAt: domain.pdfGeneratedAt,
      metadata: domain.metadata,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
    }
  }
}

/**
 * Mapper for VoucherBookPage entities
 */
export class VoucherBookPageMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: VoucherBookPageDocument): VoucherBookPageDomain {
    return {
      id: doc.id,
      bookId: doc.bookId,
      pageNumber: doc.pageNumber,
      layoutType: doc.layoutType,
      metadata: doc.metadata ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      // Map relations if present
      book: doc.book ? VoucherBookMapper.fromDocument(doc.book) : undefined,
      adPlacements: doc.adPlacements?.map(AdPlacementMapper.fromDocument),
    }
  }

  /**
   * Maps domain entity to database document format
   */
  static toDocument(
    domain: VoucherBookPageDomain,
  ): Partial<VoucherBookPageDocument> {
    return {
      id: domain.id,
      bookId: domain.bookId,
      pageNumber: domain.pageNumber,
      layoutType: domain.layoutType,
      metadata: domain.metadata,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}

/**
 * Mapper for AdPlacement entities
 */
export class AdPlacementMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: AdPlacementDocument): AdPlacementDomain {
    return {
      id: doc.id,
      pageId: doc.pageId,
      contentType: doc.contentType,
      position: doc.position,
      size: doc.size,
      spacesUsed: doc.spacesUsed,
      imageUrl: doc.imageUrl,
      qrCodePayload: doc.qrCodePayload,
      shortCode: doc.shortCode,
      title: doc.title,
      description: doc.description,
      metadata: doc.metadata ?? null,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      // Map relations if present
      page: doc.page ? VoucherBookPageMapper.fromDocument(doc.page) : undefined,
      createdByUser: doc.createdByUser,
      updatedByUser: doc.updatedByUser,
    }
  }

  /**
   * Maps domain entity to database document format
   */
  static toDocument(domain: AdPlacementDomain): Partial<AdPlacementDocument> {
    return {
      id: domain.id,
      pageId: domain.pageId,
      contentType: domain.contentType,
      position: domain.position,
      size: domain.size,
      spacesUsed: domain.spacesUsed,
      imageUrl: domain.imageUrl,
      qrCodePayload: domain.qrCodePayload,
      shortCode: domain.shortCode,
      title: domain.title,
      description: domain.description,
      metadata: domain.metadata,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}

/**
 * Mapper for BookDistribution entities
 */
export class BookDistributionMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: BookDistributionDocument): BookDistributionDomain {
    return {
      id: doc.id,
      bookId: doc.bookId,
      businessId: doc.businessId,
      businessName: doc.businessName,
      locationId: doc.locationId,
      locationName: doc.locationName,
      quantity: doc.quantity,
      distributionType: doc.distributionType,
      contactName: doc.contactName,
      contactEmail: doc.contactEmail,
      contactPhone: doc.contactPhone,
      deliveryAddress: doc.deliveryAddress,
      status: doc.status,
      shippedAt: doc.shippedAt,
      deliveredAt: doc.deliveredAt,
      trackingNumber: doc.trackingNumber,
      shippingCarrier: doc.shippingCarrier,
      notes: doc.notes,
      metadata: doc.metadata ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy ?? null,
      // Map relations if present
      book: doc.book ? VoucherBookMapper.fromDocument(doc.book) : undefined,
      createdByUser: doc.createdByUser,
      updatedByUser: doc.updatedByUser,
    }
  }

  /**
   * Maps domain entity to database document format
   */
  static toDocument(
    domain: BookDistributionDomain,
  ): Partial<BookDistributionDocument> {
    return {
      id: domain.id,
      bookId: domain.bookId,
      businessId: domain.businessId,
      businessName: domain.businessName,
      locationId: domain.locationId,
      locationName: domain.locationName,
      quantity: domain.quantity,
      distributionType: domain.distributionType,
      contactName: domain.contactName,
      contactEmail: domain.contactEmail,
      contactPhone: domain.contactPhone,
      deliveryAddress: domain.deliveryAddress,
      status: domain.status,
      shippedAt: domain.shippedAt,
      deliveredAt: domain.deliveredAt,
      trackingNumber: domain.trackingNumber,
      shippingCarrier: domain.shippingCarrier,
      notes: domain.notes,
      metadata: domain.metadata,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      createdBy: domain.createdBy,
      updatedBy: domain.updatedBy,
    }
  }
}
