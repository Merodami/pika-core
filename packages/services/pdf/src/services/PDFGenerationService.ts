import { ErrorFactory, logger } from '@pika/shared'
import { get } from 'lodash-es'
import PDFDocument from 'pdfkit'

import { ImageValidator } from '../utils/ImageValidator.js'
import {
  AdPlacementInfo,
  PageLayout,
  PageLayoutEngine,
} from './PageLayoutEngine.js'
import { QRCodeService } from './QRCodeService.js'

export interface VoucherData {
  id: string
  title: string
  description: string
  discount: string
  businessName: string
  termsAndConditions?: string
  expiresAt: Date
}

export interface GeneratePDFOptions {
  bookId: string
  title: string
  month: number
  year: number
  pages: PageLayout[]
  vouchers: Map<string, VoucherData>
  qrPayloads: Map<string, string> // voucherId -> JWT payload
}

export class PDFGenerationService {
  private readonly pageLayoutEngine: PageLayoutEngine
  private readonly qrCodeService: QRCodeService

  // A5 dimensions in points (1 point = 1/72 inch)
  private readonly PAGE_WIDTH = 420 // 148mm
  private readonly PAGE_HEIGHT = 595 // 210mm
  private readonly MARGIN = 20

  constructor() {
    this.pageLayoutEngine = new PageLayoutEngine()
    this.qrCodeService = new QRCodeService()
  }

  /**
   * Generate a complete voucher book PDF
   */
  async generateVoucherBookPDF(options: GeneratePDFOptions): Promise<Buffer> {
    logger.info('Starting PDF generation', {
      bookId: options.bookId,
      pageCount: options.pages.length,
    })

    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A5',
        layout: 'portrait',
        margins: {
          top: this.MARGIN,
          bottom: this.MARGIN,
          left: this.MARGIN,
          right: this.MARGIN,
        },
        info: {
          Title: options.title,
          Author: 'PIKA Platform',
          Subject: `Voucher Book - ${options.month}/${options.year}`,
          CreationDate: new Date(),
        },
      })

      // Collect PDF chunks
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))

      // Render cover page
      await this.renderCoverPage(doc, options)

      // Render each page with ad placements
      for (const pageLayout of options.pages) {
        doc.addPage()
        await this.renderPage(doc, pageLayout, options)
      }

      // Render back cover
      doc.addPage()
      await this.renderBackCover(doc)

      // Finalize PDF
      doc.end()

      // Wait for PDF generation to complete
      await new Promise<void>((resolve) => {
        doc.on('end', resolve)
      })

      const pdfBuffer = Buffer.concat(chunks)

      logger.info('PDF generation completed', {
        bookId: options.bookId,
        bufferSize: pdfBuffer.length,
      })

      return pdfBuffer
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to generate PDF', {
        source: 'PDFGenerationService.generateVoucherBookPDF',
        metadata: { bookId: options.bookId },
      })
    }
  }

  /**
   * Render the cover page
   */
  private async renderCoverPage(
    doc: PDFKit.PDFDocument,
    options: GeneratePDFOptions,
  ): Promise<void> {
    // Title
    doc.fontSize(36).font('Helvetica-Bold').text(options.title, {
      align: 'center',
      lineBreak: true,
    })

    // Month and Year
    doc
      .moveDown(2)
      .fontSize(24)
      .font('Helvetica')
      .text(`${this.getMonthName(options.month)} ${options.year}`, {
        align: 'center',
      })

    // Logo placeholder
    doc.moveDown(4).fontSize(16).text('PIKA', {
      align: 'center',
    })

    // Tagline
    doc
      .moveDown(1)
      .fontSize(14)
      .font('Helvetica-Oblique')
      .text('Tu libro de descuentos mensual', {
        align: 'center',
      })
  }

  /**
   * Render a page with ad placements
   */
  private async renderPage(
    doc: PDFKit.PDFDocument,
    pageLayout: PageLayout,
    options: GeneratePDFOptions,
  ): Promise<void> {
    // Add page number
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Página ${pageLayout.pageNumber}`,
        this.MARGIN,
        this.PAGE_HEIGHT - this.MARGIN - 20,
        { align: 'center' },
      )

    // Render each ad placement
    for (const placement of pageLayout.placements) {
      await this.renderAdPlacement(doc, placement, options)
    }
  }

  /**
   * Render a single ad placement
   */
  private async renderAdPlacement(
    doc: PDFKit.PDFDocument,
    placement: AdPlacementInfo,
    options: GeneratePDFOptions,
  ): Promise<void> {
    const bounds = this.pageLayoutEngine.calculateBounds(
      placement,
      this.PAGE_WIDTH,
      this.PAGE_HEIGHT,
      this.MARGIN,
    )

    // Draw border for placement (for debugging, remove in production)
    doc.rect(bounds.x, bounds.y, bounds.width, bounds.height).stroke('#CCCCCC')

    if (placement.contentType === 'voucher' && placement.voucherId) {
      await this.renderVoucherContent(doc, placement, bounds, options)
    } else if (placement.contentType === 'image' && placement.designUrl) {
      await this.renderImageContent(doc, placement, bounds)
    } else {
      // Placeholder for other content types
      this.renderPlaceholder(doc, placement, bounds)
    }
  }

  /**
   * Render voucher content with QR code
   */
  private async renderVoucherContent(
    doc: PDFKit.PDFDocument,
    placement: AdPlacementInfo,
    bounds: { x: number; y: number; width: number; height: number },
    options: GeneratePDFOptions,
  ): Promise<void> {
    const voucher = options.vouchers.get(placement.voucherId!)
    const qrPayload = options.qrPayloads.get(placement.voucherId!)

    if (!voucher || !qrPayload) {
      this.renderPlaceholder(doc, placement, bounds)

      return
    }

    // Calculate layout based on ad size
    const padding = 10
    const contentX = bounds.x + padding
    const contentY = bounds.y + padding
    const contentWidth = bounds.width - 2 * padding
    const contentHeight = bounds.height - 2 * padding

    // Business name
    doc
      .fontSize(this.getFontSize(placement.size, 'title'))
      .font('Helvetica-Bold')
      .text(voucher.businessName, contentX, contentY, {
        width: contentWidth,
        align: 'center',
      })

    // Discount
    doc
      .moveDown(0.5)
      .fontSize(this.getFontSize(placement.size, 'discount'))
      .fillColor('#FF0000')
      .text(voucher.discount, {
        width: contentWidth,
        align: 'center',
      })
      .fillColor('#000000')

    // Title
    doc
      .moveDown(0.5)
      .fontSize(this.getFontSize(placement.size, 'body'))
      .font('Helvetica')
      .text(voucher.title, {
        width: contentWidth,
        align: 'center',
      })

    // Generate and add QR code
    const qrSize = this.qrCodeService.getOptimalQRSize(placement.size)
    const qrPNG = await this.qrCodeService.generatePNG(qrPayload, {
      size: qrSize,
    })

    // Calculate QR position
    const qrX = contentX + (contentWidth - qrSize) / 2
    const qrY = contentY + contentHeight - qrSize - 30 // Leave space for short code

    doc.image(qrPNG, qrX, qrY, {
      width: qrSize,
      height: qrSize,
    })

    // Short code
    if (placement.shortCode) {
      doc
        .fontSize(this.getFontSize(placement.size, 'code'))
        .font('Helvetica-Bold')
        .text(placement.shortCode, contentX, qrY + qrSize + 5, {
          width: contentWidth,
          align: 'center',
        })
    }

    // Expiration date (if space allows)
    if (placement.size !== 'single') {
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Válido hasta: ${voucher.expiresAt.toLocaleDateString('es-PY')}`,
          contentX,
          bounds.y + bounds.height - padding - 10,
          {
            width: contentWidth,
            align: 'center',
          },
        )
    }
  }

  /**
   * Render image content
   */
  private async renderImageContent(
    doc: PDFKit.PDFDocument,
    placement: AdPlacementInfo,
    bounds: { x: number; y: number; width: number; height: number },
  ): Promise<void> {
    try {
      const imageUrl = placement.imageUrl || placement.designUrl

      if (!imageUrl) {
        this.renderPlaceholderImage(doc, bounds, 'No Image URL')

        return
      }

      // Validate URL before fetching
      ImageValidator.validateImageUrl(imageUrl)

      // Fetch the image with timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(imageUrl, {
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        logger.warn('Failed to fetch image', {
          url: imageUrl,
          status: response.status,
        })
        this.renderPlaceholderImage(doc, bounds, 'Image Not Found')

        return
      }

      // Validate response headers
      ImageValidator.validateImageResponse(response)

      // Get image data
      const imageBuffer = await response.arrayBuffer()

      // Render the image
      doc.image(Buffer.from(imageBuffer), bounds.x, bounds.y, {
        width: bounds.width,
        height: bounds.height,
        fit: [bounds.width, bounds.height],
        align: 'center',
        valign: 'center',
      })
    } catch (error) {
      logger.error('Failed to render image', {
        imageUrl: placement.imageUrl || placement.designUrl,
        error,
      })
      this.renderPlaceholderImage(doc, bounds, 'Image Load Error')
    }
  }

  /**
   * Render a placeholder image with text
   */
  private renderPlaceholderImage(
    doc: PDFKit.PDFDocument,
    bounds: { x: number; y: number; width: number; height: number },
    text: string,
  ): void {
    // Draw a light gray background
    doc
      .rect(bounds.x, bounds.y, bounds.width, bounds.height)
      .fillAndStroke('#F5F5F5', '#CCCCCC')

    // Add placeholder text
    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#999999')
      .text(text, bounds.x, bounds.y + bounds.height / 2 - 10, {
        width: bounds.width,
        align: 'center',
      })
      .fillColor('#000000')
  }

  /**
   * Render placeholder content
   */
  private renderPlaceholder(
    doc: PDFKit.PDFDocument,
    placement: AdPlacementInfo,
    bounds: { x: number; y: number; width: number; height: number },
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#CCCCCC')
      .text(
        `${placement.contentType}\n${placement.size}`,
        bounds.x,
        bounds.y + bounds.height / 2 - 20,
        {
          width: bounds.width,
          align: 'center',
        },
      )
      .fillColor('#000000')
  }

  /**
   * Render the back cover
   */
  private async renderBackCover(doc: PDFKit.PDFDocument): Promise<void> {
    // Instructions
    doc.fontSize(18).font('Helvetica-Bold').text('Cómo usar este libro', {
      align: 'center',
    })

    doc
      .moveDown(1)
      .fontSize(12)
      .font('Helvetica')
      .text('1. Encuentra el descuento que deseas usar', {
        align: 'left',
      })
      .text('2. Muestra el código QR en el comercio', {
        align: 'left',
      })
      .text('3. O ingresa el código corto en la app PIKA', {
        align: 'left',
      })
      .text('4. ¡Disfruta tu descuento!', {
        align: 'left',
      })

    // App download info
    doc
      .moveDown(2)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Descarga la app PIKA', {
        align: 'center',
      })

    doc
      .moveDown(0.5)
      .fontSize(12)
      .font('Helvetica')
      .text('Disponible en App Store y Google Play', {
        align: 'center',
      })

    // Contact info
    doc
      .moveDown(2)
      .fontSize(10)
      .text('www.pika.com.py | contacto@pika.com.py', {
        align: 'center',
      })
  }

  /**
   * Get appropriate font size based on ad size and text type
   */
  private getFontSize(
    adSize: 'single' | 'quarter' | 'half' | 'full',
    textType: 'title' | 'discount' | 'body' | 'code',
  ): number {
    const sizes = {
      single: { title: 10, discount: 14, body: 8, code: 10 },
      quarter: { title: 14, discount: 20, body: 10, code: 12 },
      half: { title: 18, discount: 28, body: 12, code: 14 },
      full: { title: 24, discount: 36, body: 14, code: 16 },
    }

    return get(get(sizes, adSize), textType)
  }

  /**
   * Get month name in Spanish
   */
  private getMonthName(month: number): string {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]

    return months[month - 1] || ''
  }
}
