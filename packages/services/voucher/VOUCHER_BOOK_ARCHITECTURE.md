# Voucher Book Architecture

## Overview

The voucher book system manages the creation, layout, and printing of physical voucher books containing business advertisements with QR codes. Each book contains 24 pages with flexible ad placement options.

## Page Layout System

### Page Structure

- **Total Pages**: 24 pages per book
- **Spaces per Page**: 8 advertisement spaces
- **Page Division**: Each physical page is divided into two sides

### Ad Size Options

```
┌─────────────────────────────────────┐
│            FULL PAGE (8 spaces)     │
│                                     │
│         Business Logo               │
│         "50% OFF"                   │
│         [QR Code]                   │
│         SHORT: PIZZA50              │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│        HALF PAGE (4 spaces)         │
│    Logo  "30% OFF"  [QR] CODE30    │
├─────────────────────────────────────┤
│        HALF PAGE (4 spaces)         │
│    Logo  "20% OFF"  [QR] SAVE20    │
└─────────────────────────────────────┘

┌──────────────────┬──────────────────┐
│ QUARTER (2 sp)   │ QUARTER (2 sp)   │
│ "25% OFF" [QR]   │ "15% OFF" [QR]   │
├──────────────────┴──────────────────┤
│        HALF PAGE (4 spaces)         │
│    Logo  "40% OFF"  [QR] DEAL40    │
└─────────────────────────────────────┘

┌────────┬────────┬────────┬─────────┐
│ SINGLE │ SINGLE │ SINGLE │ SINGLE  │
│  [QR]  │  [QR]  │  [QR]  │  [QR]   │
├────────┼────────┼────────┼─────────┤
│ SINGLE │ SINGLE │ SINGLE │ SINGLE  │
│  [QR]  │  [QR]  │  [QR]  │  [QR]   │
└────────┴────────┴────────┴─────────┘
```

## Database Schema

### VoucherBook Table

```prisma
model VoucherBook {
  id              String   @id @default(uuid())
  month           Int      // 1-12
  year            Int      // 2024, 2025, etc.
  title           String   // "January 2024 Voucher Book"
  status          String   // DRAFT, PUBLISHED, PRINTED
  printQuantity   Int      // Number of copies to print
  distributedQty  Int      @default(0)
  createdAt       DateTime @default(now())
  publishedAt     DateTime?
  printedAt       DateTime?

  pages           VoucherBookPage[]
  distributions   BookDistribution[]
}
```

### VoucherBookPage Table

```prisma
model VoucherBookPage {
  id            String   @id @default(uuid())
  bookId        String
  pageNumber    Int      // 1-24
  layoutType    String   // STANDARD, CUSTOM
  isLocked      Boolean  @default(false)

  book          VoucherBook @relation(fields: [bookId], references: [id])
  adPlacements  AdPlacement[]

  @@unique([bookId, pageNumber])
}
```

### AdPlacement Table

```prisma
model AdPlacement {
  id            String   @id @default(uuid())
  pageId        String
  voucherId     String
  businessId    String
  position      Int      // Starting position (1-8)
  size          String   // SINGLE, QUARTER, HALF, FULL
  spacesUsed    Int      // 1, 2, 4, or 8
  designUrl     String   // URL to ad design image
  qrCodeUrl     String   // Generated QR code image
  shortCode     String

  // Billing
  adPackageId   String
  pricePaid     Decimal
  currency      String   @default("PYG")

  page          VoucherBookPage @relation(fields: [pageId], references: [id])
  voucher       Voucher @relation(fields: [voucherId], references: [id])
  business      Provider @relation(fields: [businessId], references: [id])
  adPackage     AdPackage @relation(fields: [adPackageId], references: [id])

  @@unique([pageId, position])
  @@index([businessId])
  @@index([voucherId])
}
```

### AdPackage Table (Pricing)

```prisma
model AdPackage {
  id            String   @id @default(uuid())
  name          String   // "Single Space", "Quarter Page", etc.
  size          String   // SINGLE, QUARTER, HALF, FULL
  spacesUsed    Int      // 1, 2, 4, or 8
  basePrice     Decimal
  currency      String   @default("PYG")
  features      Json     // ["Color", "QR Code", "Premium Placement"]
  isActive      Boolean  @default(true)

  placements    AdPlacement[]
  purchases     AdPurchase[]
}
```

## Ad Placement Algorithm

### Space Allocation Logic

```typescript
class PageLayoutManager {
  private readonly SPACES_PER_PAGE = 8

  allocateAdSpace(page: VoucherBookPage, adSize: AdSize): AdAllocation | null {
    const occupied = this.getOccupiedSpaces(page)
    const required = this.getRequiredSpaces(adSize)

    // Find contiguous free spaces
    for (let position = 1; position <= this.SPACES_PER_PAGE; position++) {
      if (this.canPlaceAd(occupied, position, required)) {
        return {
          startPosition: position,
          endPosition: position + required - 1,
          spacesUsed: required,
        }
      }
    }

    return null // No space available
  }

  private canPlaceAd(occupied: Set<number>, start: number, size: number): boolean {
    // Check if all required positions are free
    for (let i = 0; i < size; i++) {
      if (occupied.has(start + i) || start + i > this.SPACES_PER_PAGE) {
        return false
      }
    }

    // Additional rules for half/full page ads
    if (size === 4) {
      // Half page
      return start === 1 || start === 5 // Must start at beginning of row
    }

    if (size === 8) {
      // Full page
      return start === 1 // Must be entire page
    }

    return true
  }
}
```

## PDF Generation Process

### 1. Page Assembly

```typescript
interface PageDesignData {
  pageNumber: number
  adPlacements: Array<{
    position: number
    size: AdSize
    designUrl: string
    qrCodeSvg: string
    shortCode: string
  }>
}

class VoucherBookPDFGenerator {
  async generateBook(bookId: string): Promise<Buffer> {
    const book = await this.getBookWithPages(bookId)
    const pdf = new PDFDocument({ size: 'A4' })

    for (const page of book.pages) {
      await this.renderPage(pdf, page)
    }

    return pdf.buffer
  }

  private async renderPage(pdf: PDFDocument, page: PageDesignData) {
    // Grid layout: 2x4 for single spaces
    const grid = {
      cols: 2,
      rows: 4,
      cellWidth: pdf.page.width / 2,
      cellHeight: pdf.page.height / 4,
    }

    for (const placement of page.adPlacements) {
      const bounds = this.calculateBounds(placement, grid)
      await this.renderAd(pdf, placement, bounds)
    }
  }
}
```

### 2. QR Code Integration

```typescript
class AdDesignService {
  async generateAdDesign(placement: AdPlacement): Promise<AdDesign> {
    // Load business design template
    const template = await this.loadTemplate(placement.designUrl)

    // Generate QR code
    const qrCode = await this.qrService.generateQRCode({
      voucherId: placement.voucherId,
      format: 'SVG',
      size: this.getQRSize(placement.size),
      errorCorrection: 'M', // Medium - good for print
    })

    // Composite design
    return {
      backgroundImage: template.image,
      qrCodeOverlay: {
        svg: qrCode,
        position: template.qrPosition,
        size: template.qrSize,
      },
      shortCodeText: {
        text: placement.shortCode,
        font: 'Arial Bold',
        size: this.getFontSize(placement.size),
        position: template.shortCodePosition,
      },
    }
  }
}
```

## Business Dashboard Features

### Ad Designer

```typescript
interface AdDesigner {
  // Template selection
  templates: AdTemplate[]

  // Customization options
  customize: {
    uploadLogo: (file: File) => Promise<string>
    setText: (field: TextField, value: string) => void
    setColors: (primary: string, secondary: string) => void
    setDiscount: (value: number, type: 'PERCENTAGE' | 'FIXED') => void
  }

  // Preview
  preview: {
    single: () => Promise<ImageData>
    quarter: () => Promise<ImageData>
    half: () => Promise<ImageData>
    full: () => Promise<ImageData>
  }

  // Save
  save: () => Promise<AdDesignId>
}
```

### Campaign Setup

```typescript
interface VoucherBookCampaign {
  businessId: string
  voucher: {
    title: string
    description: string
    discount: number
    discountType: 'PERCENTAGE' | 'FIXED'
    validFrom: Date
    validUntil: Date
    termsAndConditions: string
    redemptionLimit?: number
  }
  booking: {
    bookMonth: string // "2024-01"
    adSize: AdSize
    preferredPage?: number
    designId: string
  }
  pricing: {
    adPackageId: string
    basePrice: number
    addOns: Array<{
      feature: string
      price: number
    }>
    totalPrice: number
  }
}
```

## Admin Dashboard Features

### Page Layout Designer

```typescript
interface PageLayoutDesigner {
  // Drag and drop interface
  dragDrop: {
    availableAds: AdPlacement[]
    pageGrid: PageGrid
    onDrop: (ad: AdPlacement, position: GridPosition) => void
  }

  // Validation
  validate: {
    checkOverlap: () => ValidationResult
    checkSizeConstraints: () => ValidationResult
    optimizeLayout: () => SuggestedLayout
  }

  // Actions
  actions: {
    save: () => Promise<void>
    preview: () => Promise<PDFPreview>
    lock: () => Promise<void> // Prevent further changes
  }
}
```

### Book Management

```typescript
interface BookManager {
  // Creation
  createNewBook: (month: string, year: number) => Promise<VoucherBook>

  // Page management
  pages: {
    autoFill: () => Promise<void> // Auto-arrange ads
    optimizeRevenue: () => Promise<void> // Maximize revenue
    balanceCategories: () => Promise<void> // Distribute categories
  }

  // Publishing
  publish: {
    validate: () => ValidationResult[]
    generatePDF: () => Promise<PDFUrl>
    approve: () => Promise<void>
    sendToPrinter: (quantity: number) => Promise<PrintJob>
  }

  // Distribution tracking
  distribution: {
    markPrinted: (quantity: number) => Promise<void>
    trackDistribution: (locations: DistributionPoint[]) => Promise<void>
    recordDelivery: (point: DistributionPoint, quantity: number) => Promise<void>
  }
}
```

## Analytics & Reporting

### Book Performance Metrics

```typescript
interface BookAnalytics {
  bookId: string
  metrics: {
    // Physical metrics
    totalPrinted: number
    totalDistributed: number
    estimatedReach: number

    // Digital metrics
    totalScans: number
    uniqueScanners: number
    scansByPage: Record<number, number>
    scansByAdSize: Record<AdSize, number>

    // Business metrics
    totalRevenue: number
    revenueByAdSize: Record<AdSize, number>
    topPerformingAds: AdPerformance[]

    // Redemption metrics
    totalRedemptions: number
    redemptionRate: number
    averageTimeToRedeem: number
  }
}
```

### ROI Calculation

```typescript
interface BusinessROI {
  businessId: string
  campaign: {
    adCost: number
    vouchersRedeemed: number
    averageTransactionValue: number
    estimatedRevenue: number
    roi: number // (revenue - cost) / cost * 100
  }
  insights: {
    bestPerformingSize: AdSize
    optimalDiscountRate: number
    recommendedNextAction: string
  }
}
```

## Implementation Phases

### Phase 1: Manual Process (MVP)

- Simple ad upload interface
- Manual page layout in admin
- Basic PDF generation
- Core QR code generation

### Phase 2: Semi-Automated

- Template-based ad designer
- Drag-and-drop page layout
- Automated QR placement
- Basic analytics

### Phase 3: Fully Automated

- AI-powered layout optimization
- Dynamic pricing based on demand
- Automated category balancing
- Advanced ROI analytics

## Technical Considerations

### PDF Generation Performance

- Generate pages in parallel
- Cache rendered ads
- Use CDN for design assets
- Queue system for large books

### QR Code Optimization

- Use appropriate error correction for print
- Ensure sufficient contrast
- Test scanning at different sizes
- Include human-readable short code

### Storage Requirements

- Ad designs: S3 with CDN
- Generated PDFs: S3 with lifecycle rules
- QR codes: Generated on-demand
- Analytics data: Time-series database

## Conclusion

The voucher book system transforms traditional coupon books into a data-driven advertising platform, providing businesses with measurable ROI while maintaining the familiar physical format that reaches customers without smartphones.
