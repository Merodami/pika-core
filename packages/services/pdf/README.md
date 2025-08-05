# 📄 @pika/pdf-service - PDF Generation & Document Service

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Architecture](https://img.shields.io/badge/Architecture-Clean-green)
![PDF](https://img.shields.io/badge/PDF-PDFKit-orange)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The PDF Service is the **document generation engine** for the Pika platform. It specializes in creating high-quality A5 voucher books with dynamic layouts, QR code integration, and multi-language support for the Spanish market. The service handles complex page layouts with mixed content types (vouchers, advertisements, images) while maintaining print-quality standards.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Run database migrations
yarn prisma:migrate

# Start development server
yarn nx run @pika/pdf:local

# Run tests
yarn nx run @pika/pdf:test

# Build for production
yarn nx run @pika/pdf:build
```

## 📋 Overview

The PDF Service is a specialized document generation system that:

- **Generates Voucher Books**: A5 format monthly discount collections
- **Creates QR Codes**: JWT-secured redemption codes with validation
- **Manages Layouts**: Dynamic page layouts with multiple ad sizes
- **Handles Images**: Validates, fetches, and renders external images
- **Supports i18n**: Spanish-language content with date formatting
- **Optimized Output**: Professional print-ready PDF documents
- **Error Resilient**: Graceful fallbacks for missing content

### Key Features

- 📖 **A5 Voucher Books**: Professional monthly discount collections
- 📱 **QR Code Integration**: JWT-secured redemption system
- 🎨 **Dynamic Layouts**: Multiple ad sizes (single, quarter, half, full)
- 🖼️ **Image Processing**: URL validation and secure image rendering
- 🌐 **Multi-language**: Spanish market optimization
- 📏 **Print Quality**: 300 DPI output with proper margins
- 🛡️ **Secure Generation**: Input validation and error handling
- ⚡ **Performance**: Efficient PDF streaming and memory management

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/              # HTTP Request Handlers
│   └── PdfController.ts     # PDF generation endpoints
├── services/                 # Business Logic Layer
│   ├── PdfGenerationService.ts # Core PDF creation
│   ├── PageLayoutEngine.ts  # Layout calculation
│   └── QRCodeService.ts     # QR code generation
├── routes/                   # Route Definitions
│   └── pdfRoutes.ts         # PDF endpoints
├── utils/                    # Utility Functions
│   └── ImageValidator.ts    # Image URL validation
├── types/                    # Type Definitions
│   └── interfaces.ts        # PDF interfaces
├── middleware/               # Custom Middleware
│   └── validation.ts        # Request validation
├── test/                     # Test Suite
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── app.ts                   # Application setup
├── server.ts                # Server configuration
└── index.ts                 # Service entry point
```

### PDF Generation Flow

```mermaid
graph TD
    A[PDF Request] --> B[Validate Data]
    B --> C[Generate Layout]
    C --> D[Create QR Codes]
    D --> E[Fetch Images]
    E --> F[Render Pages]
    F --> G[Add Cover/Back]
    G --> H[Stream PDF]

    C --> I[Page Layout Engine]
    I --> J[Calculate Bounds]
    I --> K[Optimize Placement]

    D --> L[JWT Payload]
    L --> M[QR PNG Generation]

    E --> N[Image Validation]
    N --> O[URL Fetch]
    O --> P[Format Conversion]
```

## 📊 Page Layout System

### Advertisement Sizes

```typescript
type AdSize = 'single' | 'quarter' | 'half' | 'full'

// Layout specifications
const layoutSpecs = {
  single: { width: 180, height: 120 }, // Small voucher
  quarter: { width: 180, height: 260 }, // Medium voucher
  half: { width: 380, height: 260 }, // Large voucher
  full: { width: 380, height: 540 }, // Full page ad
}
```

### Page Layout Engine

```typescript
export class PageLayoutEngine {
  /**
   * Calculate optimal ad placement on A5 page
   */
  calculateBounds(placement: AdPlacementInfo, pageWidth: number, pageHeight: number, margin: number): { x: number; y: number; width: number; height: number } {
    const availableWidth = pageWidth - 2 * margin
    const availableHeight = pageHeight - 2 * margin

    // Calculate position based on grid system
    const gridX = Math.floor(placement.column * (availableWidth / 2))
    const gridY = Math.floor(placement.row * (availableHeight / 4))

    return {
      x: margin + gridX,
      y: margin + gridY,
      width: this.getAdWidth(placement.size, availableWidth),
      height: this.getAdHeight(placement.size, availableHeight),
    }
  }
}
```

## 🔌 API Reference

### PDF Generation Endpoints

```typescript
// Generate voucher book PDF
POST /pdf/voucher-book
Content-Type: application/json
Body: {
  bookId: string
  title: string
  month: number              // 1-12
  year: number
  pages: PageLayout[]
  vouchers: VoucherData[]
  qrPayloads: Record<string, string>
}
Response: {
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="voucher-book.pdf"
}

// Generate single voucher PDF
POST /pdf/voucher
Body: {
  voucherId: string
  voucher: VoucherData
  qrPayload: string
  size: 'single' | 'quarter' | 'half' | 'full'
}

// Health check
GET /pdf/health
Response: {
  status: "healthy"
  service: "pdf-service"
  version: "1.0.0"
}
```

### Request Types

```typescript
interface VoucherData {
  id: string
  title: string
  description: string
  discount: string // e.g., "20% OFF", "$10 descuento"
  businessName: string
  termsAndConditions?: string
  expiresAt: Date
}

interface PageLayout {
  pageNumber: number
  placements: AdPlacementInfo[]
}

interface AdPlacementInfo {
  id: string
  contentType: 'voucher' | 'image' | 'ad'
  size: 'single' | 'quarter' | 'half' | 'full'
  position: { row: number; column: number }

  // Voucher-specific
  voucherId?: string
  shortCode?: string

  // Image-specific
  imageUrl?: string
  designUrl?: string
}
```

## 🎨 QR Code Integration

### QR Code Service

```typescript
export class QRCodeService {
  /**
   * Generate QR code PNG with JWT payload
   */
  async generatePNG(jwtPayload: string, options: QRCodeOptions = {}): Promise<Buffer> {
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: 'png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: options.size || 100,
      ...options,
    }

    return QRCode.toBuffer(jwtPayload, qrOptions)
  }

  /**
   * Get optimal QR size based on ad size
   */
  getOptimalQRSize(adSize: AdSize): number {
    const sizes = {
      single: 60,
      quarter: 80,
      half: 100,
      full: 140,
    }
    return sizes[adSize]
  }
}
```

### JWT Payload Structure

```typescript
interface QRPayload {
  voucherId: string
  businessId: string
  bookId: string
  expiresAt: number // Unix timestamp
  shortCode: string
  redemptionUrl: string
  iat: number // Issued at
  exp: number // Expires at
}
```

## 🖼️ Image Processing

### Image Validation

```typescript
export class ImageValidator {
  /**
   * Validate image URL format and security
   */
  static validateImageUrl(url: string): void {
    // Check URL format
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i
    if (!urlPattern.test(url)) {
      throw new Error('Invalid image URL format')
    }

    // Security checks
    const parsedUrl = new URL(url)
    const blockedDomains = ['localhost', '127.0.0.1', '10.', '192.168.']

    if (blockedDomains.some((domain) => parsedUrl.hostname.includes(domain))) {
      throw new Error('Blocked domain detected')
    }
  }

  /**
   * Validate image response headers
   */
  static validateImageResponse(response: Response): void {
    const contentType = response.headers.get('content-type')
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    if (!contentType || !allowedTypes.includes(contentType)) {
      throw new Error('Invalid content type')
    }

    const contentLength = response.headers.get('content-length')
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error('Image too large')
    }
  }
}
```

### Image Rendering

```typescript
private async renderImageContent(
  doc: PDFKit.PDFDocument,
  placement: AdPlacementInfo,
  bounds: { x: number; y: number; width: number; height: number }
): Promise<void> {
  try {
    // Validate and fetch image
    const imageUrl = placement.imageUrl || placement.designUrl
    ImageValidator.validateImageUrl(imageUrl)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(imageUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      this.renderPlaceholderImage(doc, bounds, 'Image Not Found')
      return
    }

    ImageValidator.validateImageResponse(response)
    const imageBuffer = await response.arrayBuffer()

    // Render with proper scaling
    doc.image(Buffer.from(imageBuffer), bounds.x, bounds.y, {
      width: bounds.width,
      height: bounds.height,
      fit: [bounds.width, bounds.height],
      align: 'center',
      valign: 'center'
    })
  } catch (error) {
    logger.error('Failed to render image', { error })
    this.renderPlaceholderImage(doc, bounds, 'Image Load Error')
  }
}
```

## 📏 Typography & Styling

### Font Size System

```typescript
private getFontSize(
  adSize: 'single' | 'quarter' | 'half' | 'full',
  textType: 'title' | 'discount' | 'body' | 'code'
): number {
  const sizes = {
    single: { title: 10, discount: 14, body: 8, code: 10 },
    quarter: { title: 14, discount: 20, body: 10, code: 12 },
    half: { title: 18, discount: 28, body: 12, code: 14 },
    full: { title: 24, discount: 36, body: 14, code: 16 }
  }

  return get(get(sizes, adSize), textType)
}
```

### Spanish Localization

```typescript
private getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[month - 1] || ''
}

// Date formatting for Paraguayan locale
voucher.expiresAt.toLocaleDateString('es-PY')
```

## 📖 Voucher Book Structure

### Complete Book Layout

```typescript
async generateVoucherBookPDF(options: GeneratePDFOptions): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A5',
    layout: 'portrait',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    info: {
      Title: options.title,
      Author: 'PIKA Platform',
      Subject: `Voucher Book - ${options.month}/${options.year}`,
      CreationDate: new Date()
    }
  })

  // 1. Cover page with title and branding
  await this.renderCoverPage(doc, options)

  // 2. Content pages with vouchers and ads
  for (const pageLayout of options.pages) {
    doc.addPage()
    await this.renderPage(doc, pageLayout, options)
  }

  // 3. Back cover with instructions
  doc.addPage()
  await this.renderBackCover(doc)

  doc.end()
  return this.collectPDFBuffer(doc)
}
```

### Cover Page Design

```typescript
private async renderCoverPage(
  doc: PDFKit.PDFDocument,
  options: GeneratePDFOptions
): Promise<void> {
  // Main title
  doc.fontSize(36).font('Helvetica-Bold')
     .text(options.title, { align: 'center', lineBreak: true })

  // Month and year
  doc.moveDown(2).fontSize(24).font('Helvetica')
     .text(`${this.getMonthName(options.month)} ${options.year}`,
           { align: 'center' })

  // Branding
  doc.moveDown(4).fontSize(16)
     .text('PIKA', { align: 'center' })

  // Tagline
  doc.moveDown(1).fontSize(14).font('Helvetica-Oblique')
     .text('Tu libro de descuentos mensual', { align: 'center' })
}
```

### Back Cover Instructions

```typescript
private async renderBackCover(doc: PDFKit.PDFDocument): Promise<void> {
  doc.fontSize(18).font('Helvetica-Bold')
     .text('Cómo usar este libro', { align: 'center' })

  const instructions = [
    '1. Encuentra el descuento que deseas usar',
    '2. Muestra el código QR en el comercio',
    '3. O ingresa el código corto en la app PIKA',
    '4. ¡Disfruta tu descuento!'
  ]

  doc.moveDown(1).fontSize(12).font('Helvetica')
  instructions.forEach(instruction => {
    doc.text(instruction, { align: 'left' })
  })

  // App download info
  doc.moveDown(2).fontSize(14).font('Helvetica-Bold')
     .text('Descarga la app PIKA', { align: 'center' })
     .moveDown(0.5).fontSize(12).font('Helvetica')
     .text('Disponible en App Store y Google Play', { align: 'center' })

  // Contact info
  doc.moveDown(2).fontSize(10)
     .text('www.pika.com.py | contacto@pika.com.py', { align: 'center' })
}
```

## 🧪 Testing

### Integration Tests

```typescript
describe('PDF Generation API', () => {
  describe('POST /pdf/voucher-book', () => {
    it('should generate complete voucher book', async () => {
      const testData = {
        bookId: 'test-book-123',
        title: 'Descuentos Enero 2025',
        month: 1,
        year: 2025,
        pages: [
          {
            pageNumber: 1,
            placements: [
              {
                id: 'placement-1',
                contentType: 'voucher',
                size: 'half',
                position: { row: 0, column: 0 },
                voucherId: 'voucher-1',
                shortCode: 'ABC123',
              },
            ],
          },
        ],
        vouchers: [
          {
            id: 'voucher-1',
            title: '20% de descuento',
            description: 'En todos los productos',
            discount: '20% OFF',
            businessName: 'Restaurante La Mesa',
            expiresAt: new Date('2025-01-31'),
          },
        ],
        qrPayloads: {
          'voucher-1': 'jwt-token-here',
        },
      }

      const response = await request(app).post('/pdf/voucher-book').send(testData).expect(200).expect('Content-Type', 'application/pdf')

      expect(response.body).toBeInstanceOf(Buffer)
      expect(response.body.length).toBeGreaterThan(1000)
    })

    it('should handle image fetch failures gracefully', async () => {
      const testData = {
        // ... book data with invalid image URL
        pages: [
          {
            pageNumber: 1,
            placements: [
              {
                contentType: 'image',
                imageUrl: 'https://invalid-domain.com/image.jpg',
                size: 'quarter',
              },
            ],
          },
        ],
      }

      const response = await request(app).post('/pdf/voucher-book').send(testData).expect(200)

      // Should generate PDF with placeholder image
      expect(response.body).toBeInstanceOf(Buffer)
    })
  })
})
```

### Unit Tests

```typescript
describe('PageLayoutEngine', () => {
  describe('calculateBounds', () => {
    it('should calculate correct bounds for half-size ad', () => {
      const engine = new PageLayoutEngine()
      const placement = {
        size: 'half',
        position: { row: 0, column: 0 },
      }

      const bounds = engine.calculateBounds(placement, 420, 595, 20)

      expect(bounds).toEqual({
        x: 20,
        y: 20,
        width: 190, // Half of available width
        height: 260,
      })
    })
  })
})

describe('QRCodeService', () => {
  describe('generatePNG', () => {
    it('should generate valid QR code PNG', async () => {
      const service = new QRCodeService()
      const payload = 'test-jwt-token'

      const qrBuffer = await service.generatePNG(payload, { size: 100 })

      expect(qrBuffer).toBeInstanceOf(Buffer)
      expect(qrBuffer.length).toBeGreaterThan(100)

      // Verify PNG signature
      expect(qrBuffer.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    })
  })
})
```

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
PDF_SERVICE_PORT=5514
PDF_SERVICE_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/pika

# PDF Generation
PDF_TIMEOUT=30000              # 30 seconds
PDF_MAX_PAGES=50              # Maximum pages per book
PDF_DPI=300                   # Print quality
PDF_COMPRESSION=true          # Enable compression

# Image Processing
IMAGE_FETCH_TIMEOUT=5000      # 5 seconds
IMAGE_MAX_SIZE=5242880        # 5MB
ALLOWED_IMAGE_DOMAINS=pika.com.py,cdn.pika.com.py

# QR Code Settings
QR_ERROR_CORRECTION=M         # Medium error correction
QR_MARGIN=1                   # Quiet zone
QR_QUALITY=0.92              # PNG quality

# Security
VALIDATE_JWT_PAYLOADS=true
BLOCK_PRIVATE_IPS=true
```

## 📊 Monitoring & Analytics

### PDF Generation Metrics

```typescript
// Track PDF operations
metrics.increment('pdf.book.generated', {
  pages: book.pages.length,
  vouchers: book.vouchers.length,
})
metrics.histogram('pdf.generation.duration', duration)
metrics.gauge('pdf.memory.usage', process.memoryUsage().heapUsed)

// Image processing
metrics.increment('pdf.image.fetch.success')
metrics.increment('pdf.image.fetch.failure', { reason: 'timeout' })
metrics.histogram('pdf.image.fetch.duration', fetchTime)

// QR code generation
metrics.increment('pdf.qr.generated', { size: qrSize })
metrics.histogram('pdf.qr.generation.duration', qrTime)

// Error tracking
metrics.increment('pdf.error', {
  type: 'image_fetch_failed',
  page: pageNumber,
})
```

## 🔒 Security

### Input Validation

```typescript
const generateBookSchema = z.object({
  bookId: z.string().uuid(),
  title: z.string().min(1).max(100),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
  pages: z.array(pageLayoutSchema).max(50),
  vouchers: z.array(voucherDataSchema).max(200),
  qrPayloads: z.record(z.string().min(1)),
})

// Image URL security
const imageUrlSchema = z
  .string()
  .url()
  .refine((url) => {
    const parsed = new URL(url)
    return !['localhost', '127.0.0.1'].includes(parsed.hostname)
  }, 'Private IP addresses not allowed')
```

### Error Handling

```typescript
// Secure error responses
try {
  const pdf = await this.pdfService.generateBook(data)
  return pdf
} catch (error) {
  if (error instanceof ValidationError) {
    throw ErrorFactory.badRequest('Invalid PDF generation data')
  }

  // Don't expose internal errors
  logger.error('PDF generation failed', { error, bookId: data.bookId })
  throw ErrorFactory.internalError('PDF generation failed')
}
```

## 🎯 Best Practices

### PDF Generation

1. **Stream Processing**: Use streams for large PDFs
2. **Memory Management**: Clean up resources after generation
3. **Error Recovery**: Graceful fallbacks for missing content
4. **Validation**: Strict input validation for all data
5. **Caching**: Cache generated QR codes and processed images

### Performance Tips

1. **Batch Processing**: Generate multiple vouchers in single pass
2. **Image Optimization**: Resize images before embedding
3. **Font Loading**: Preload fonts for consistent rendering
4. **Compression**: Enable PDF compression for smaller files
5. **Timeouts**: Set reasonable timeouts for external requests

### Error Handling

1. **Placeholder Content**: Show placeholders for failed images
2. **Partial Success**: Generate PDF even with some failures
3. **Retry Logic**: Retry failed image fetches with backoff
4. **Monitoring**: Track error rates and types
5. **User Feedback**: Provide clear error messages

## 📝 Dependencies

### Core Dependencies

- **pdfkit**: PDF document generation
- **qrcode**: QR code generation
- **sharp**: Image processing and optimization
- **lodash-es**: Utility functions
- **zod**: Schema validation

### Internal Dependencies

- **@pika/shared**: Error handling and utilities
- **@pika/auth**: JWT token validation
- **@pika/environment**: Configuration management
- **@pika/http**: Express server setup

## 📝 Changelog

### Recent Updates

- Implemented A5 voucher book generation
- Added dynamic page layout engine
- Created QR code integration with JWT
- Added image validation and processing
- Implemented Spanish localization
- Added comprehensive error handling
- Created placeholder fallback system
- Added print-quality PDF output

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
