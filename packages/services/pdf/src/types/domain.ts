// Service operation types
export interface VoucherBookValidationOptions {
  checkStatus?: boolean
  checkContent?: boolean
  includeRelations?: boolean
}

export interface VoucherBookValidationResult {
  isValid: boolean
  reason?: string
  voucherBook?: any // VoucherBookDomain when created in SDK
}

// Analytics types
export interface VoucherBookStatistics {
  total: number
  byStatus: {
    draft: number
    readyForPrint: number
    published: number
    archived: number
  }
  byType: {
    monthly: number
    specialEdition: number
    regional: number
  }
  distributions: {
    total: number
    pending: number
    shipped: number
    delivered: number
  }
  recentActivity: Array<{
    date: Date
    action: string
    count: number
  }>
}

// Batch operation types
export interface BatchVoucherBookOperation {
  bookIds: string[]
  operation: 'publish' | 'archive' | 'generate_pdf' | 'delete'
  context?: Record<string, any>
}

export interface BatchVoucherBookResult {
  processedCount: number
  successCount: number
  failedCount: number
  results: Array<{
    bookId: string
    success: boolean
    error?: string
  }>
}

// PDF Generation types
export interface PDFGenerationOptions {
  force?: boolean
  priority?: 'low' | 'normal' | 'high'
  userId: string
}

export interface PDFGenerationResult {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  message: string
  estimatedCompletion?: Date
  pdfUrl?: string
}

// Page statistics
export interface VoucherBookPageStats {
  totalPages: number
  usedSpaces: number
  availableSpaces: number
  totalPlacements: number
  placementsByType: Record<string, number>
}
