import { ErrorFactory } from '@shared/errors/index.js'
import { get } from 'lodash-es'
import * as path from 'path'

import type { FileUpload } from '../FileStorage.js'

/**
 * Base class for file storage implementations
 * Provides common validation methods to reduce duplication
 */
export abstract class BaseFileStorage {
  protected readonly validCombinations: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg', '.jpe'],
    'image/png': ['.png'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      '.xlsx',
    ],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
  }

  /**
   * Validate file before saving
   */
  protected validateFile(
    file: FileUpload,
    allowedTypes?: string[],
    maxSize?: number,
  ): void {
    if (!file) {
      throw ErrorFactory.validationError(
        { file: ['No file provided'] },
        { source: 'BaseFileStorage.validateFile' },
      )
    }

    if (!file.filename) {
      throw ErrorFactory.validationError(
        { file: ['Missing filename'] },
        { source: 'BaseFileStorage.validateFile' },
      )
    }

    // Validate extension matches MIME type
    const ext = path.extname(file.filename).toLowerCase()

    this.validateFileExtension(ext, file.mimetype)

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      throw ErrorFactory.validationError(
        {
          file: [
            `Unsupported file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`,
          ],
        },
        { source: 'BaseFileStorage.validateFile' },
      )
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))

      throw ErrorFactory.validationError(
        {
          file: [`File too large. Maximum size is ${maxSizeMB}MB`],
        },
        { source: 'BaseFileStorage.validateFile' },
      )
    }
  }

  /**
   * Validate file extension matches MIME type
   */
  protected validateFileExtension(ext: string, mimeType: string): void {
    // If we have a mapping for this MIME type, check the extension
    const validExtensions = get(this.validCombinations, mimeType)

    if (validExtensions && !validExtensions.includes(ext)) {
      throw ErrorFactory.validationError(
        {
          file: [
            `File extension "${ext}" doesn't match declared type "${mimeType}"`,
          ],
        },
        {
          source: 'BaseFileStorage.validateFileExtension',
          suggestion: `Use a file with a valid extension for type ${mimeType} (${validExtensions.join(', ')})`,
        },
      )
    }
  }

  /**
   * Check if the file is an image based on MIME type
   */
  protected isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * Get thumbnail filename
   */
  protected getThumbnailFilename(filename: string): string {
    const fileNameParts = path.parse(filename)

    return `${fileNameParts.name}_thumb${fileNameParts.ext}`
  }

  /**
   * Guess MIME type from path
   */
  protected getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()

    // Map extensions back to MIME types
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.jpe': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }

    return get(mimeMap, ext) || 'application/octet-stream'
  }

  /**
   * Sanitize filename to prevent issues
   */
  protected sanitizeFilename(filename: string): string {
    // Remove any path components
    const basename = path.basename(filename)
    // Remove special characters
    const sanitized = basename.replace(/[^a-zA-Z0-9_.-]/g, '_')

    // Ensure filename is not too long
    return sanitized.substring(0, 255)
  }
}
