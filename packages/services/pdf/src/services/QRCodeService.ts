import { ErrorFactory, logger } from '@pika/shared'
import QRCode from 'qrcode'

export interface QRCodeOptions {
  size: number
  margin: number
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  color?: {
    dark?: string
    light?: string
  }
}

export class QRCodeService {
  private readonly defaultOptions: QRCodeOptions = {
    size: 300,
    margin: 2,
    errorCorrectionLevel: 'M', // Medium - good for print
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  }

  /**
   * Generate QR code as SVG string
   */
  async generateSVG(
    data: string,
    options?: Partial<QRCodeOptions>,
  ): Promise<string> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options }

      const svgString = await QRCode.toString(data, {
        type: 'svg',
        width: mergedOptions.size,
        margin: mergedOptions.margin,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        color: mergedOptions.color,
      })

      logger.debug('Generated QR code SVG', { dataLength: data.length })

      return svgString
    } catch (error) {
      throw ErrorFactory.fromError('Failed to generate QR code SVG', error, {
        source: 'QRCodeService.generateSVG',
      })
    }
  }

  /**
   * Generate QR code as PNG buffer
   */
  async generatePNG(
    data: string,
    options?: Partial<QRCodeOptions>,
  ): Promise<Buffer> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options }

      const buffer = await QRCode.toBuffer(data, {
        type: 'png',
        width: mergedOptions.size,
        margin: mergedOptions.margin,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        color: mergedOptions.color,
      })

      logger.debug('Generated QR code PNG', {
        dataLength: data.length,
        bufferSize: buffer.length,
      })

      return buffer
    } catch (error) {
      throw ErrorFactory.fromError('Failed to generate QR code PNG', error, {
        source: 'QRCodeService.generatePNG',
      })
    }
  }

  /**
   * Generate QR code as base64 data URL
   */
  async generateDataURL(
    data: string,
    options?: Partial<QRCodeOptions>,
  ): Promise<string> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options }

      const dataUrl = await QRCode.toDataURL(data, {
        type: 'image/png',
        width: mergedOptions.size,
        margin: mergedOptions.margin,
        errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        color: mergedOptions.color,
      })

      logger.debug('Generated QR code data URL', { dataLength: data.length })

      return dataUrl
    } catch (error) {
      throw ErrorFactory.fromError(
        'Failed to generate QR code data URL',
        error,
        { source: 'QRCodeService.generateDataURL' },
      )
    }
  }

  /**
   * Get optimal QR size based on ad placement size
   */
  getOptimalQRSize(adSize: 'single' | 'quarter' | 'half' | 'full'): number {
    switch (adSize) {
      case 'single':
        return 150 // Small QR for single space
      case 'quarter':
        return 200 // Medium QR for quarter page
      case 'half':
        return 250 // Larger QR for half page
      case 'full':
        return 300 // Large QR for full page
      default:
        return 200
    }
  }
}
