import { ErrorFactory } from '@pika/shared'

export class ImageValidator {
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:']
  private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]

  /**
   * Validate image URL is safe to fetch
   */
  static validateImageUrl(url: string): void {
    try {
      const parsed = new URL(url)

      if (!this.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        throw ErrorFactory.validationError(
          {
            imageUrl: [
              `Invalid protocol: ${parsed.protocol}. Only HTTP(S) allowed.`,
            ],
          },
          { source: 'ImageValidator.validateImageUrl' },
        )
      }

      // Additional security checks
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        throw ErrorFactory.validationError(
          { imageUrl: ['Cannot fetch images from localhost'] },
          { source: 'ImageValidator.validateImageUrl' },
        )
      }
    } catch (error) {
      if (error.name === 'TypeError') {
        throw ErrorFactory.validationError(
          { imageUrl: ['Invalid URL format'] },
          { source: 'ImageValidator.validateImageUrl' },
        )
      }
      throw error
    }
  }

  /**
   * Validate image response headers
   */
  static validateImageResponse(response: Response): void {
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')

    if (
      !contentType ||
      !this.ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase())
    ) {
      throw ErrorFactory.validationError(
        {
          contentType: [
            `Invalid image type: ${contentType}. Only JPEG, PNG, GIF, and WebP allowed.`,
          ],
        },
        { source: 'ImageValidator.validateImageResponse' },
      )
    }

    if (contentLength && parseInt(contentLength) > this.MAX_IMAGE_SIZE) {
      throw ErrorFactory.validationError(
        {
          size: [
            `Image too large: ${parseInt(contentLength)} bytes. Maximum ${this.MAX_IMAGE_SIZE} bytes allowed.`,
          ],
        },
        { source: 'ImageValidator.validateImageResponse' },
      )
    }
  }
}
