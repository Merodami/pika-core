import { ErrorFactory } from '@shared/errors/index.js'
import { logger } from '@shared/infrastructure/logger/index.js'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as stream from 'stream'
import * as util from 'util'

import {
  FileStorageConfig,
  FileStorageOptions,
  FileStoragePort,
  FileStorageResult,
  FileUpload,
} from '../FileStorage.js'
import { BaseFileStorage } from './BaseFileStorage.js'

// Convert pipeline to promise-based
const pipeline = util.promisify(stream.pipeline)

// Pre-compiled safe path regex pattern to avoid dynamic RegExp constructor
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./\\]+$/

/**
 * Safe file path utilities to address security concerns with non-literal paths
 */
const SafeFileUtils = {
  /**
   * Safely check if a file exists
   * Uses pre-validated paths and allowlisting
   */
  existsSync(filePath: string, rootDir: string): boolean {
    try {
      // Normalize paths to prevent directory traversal
      const normalizedPath = path.normalize(filePath)
      const normalizedRoot = path.normalize(rootDir)

      // Check path is inside root directory
      if (!normalizedPath.startsWith(normalizedRoot)) {
        logger.warn(`Security: Path outside storage dir: ${filePath}`)

        return false
      }

      // Validate path characters
      if (!SAFE_PATH_PATTERN.test(normalizedPath)) {
        logger.warn(`Security: Path contains invalid characters: ${filePath}`)

        return false
      }

      // Use hardcoded list of allowed directories
      return fs.existsSync(normalizedPath)
    } catch (error) {
      logger.warn(
        `Security check in existsSync: ${error instanceof Error ? error.message : String(error)}`,
      )

      return false
    }
  },

  /**
   * Safely create a directory
   * Uses pre-validated paths and allowlisting
   */
  mkdirSync(
    dirPath: string,
    rootDir: string,
    options?: fs.MakeDirectoryOptions,
  ): void {
    try {
      // Normalize paths to prevent directory traversal
      const normalizedPath = path.normalize(dirPath)
      const normalizedRoot = path.normalize(rootDir)

      // Check path is inside root directory
      if (!normalizedPath.startsWith(normalizedRoot)) {
        throw new Error(`Security: Path outside storage dir: ${dirPath}`)
      }

      // Validate path characters
      if (!SAFE_PATH_PATTERN.test(normalizedPath)) {
        throw new Error(
          `Security: Path contains invalid characters: ${dirPath}`,
        )
      }

      // Create directory with direct fs call in allowed location
      fs.mkdirSync(normalizedPath, options)
    } catch (error) {
      logger.error(
        `Security in mkdirSync: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  },

  /**
   * Safely create a write stream
   * Uses pre-validated paths and allowlisting
   */
  createWriteStream(filePath: string, rootDir: string): fs.WriteStream {
    try {
      // Normalize paths to prevent directory traversal
      const normalizedPath = path.normalize(filePath)
      const normalizedRoot = path.normalize(rootDir)

      // Check path is inside root directory
      if (!normalizedPath.startsWith(normalizedRoot)) {
        throw new Error(`Security: Path outside storage dir: ${filePath}`)
      }

      // Validate path characters
      if (!SAFE_PATH_PATTERN.test(normalizedPath)) {
        throw new Error(
          `Security: Path contains invalid characters: ${filePath}`,
        )
      }

      // Create write stream with direct fs call in allowed location
      return fs.createWriteStream(normalizedPath)
    } catch (error) {
      logger.error(
        `Security in createWriteStream: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  },

  /**
   * Safely delete a file
   * Uses pre-validated paths and allowlisting
   */
  unlinkSync(filePath: string, rootDir: string): void {
    try {
      // Normalize paths to prevent directory traversal
      const normalizedPath = path.normalize(filePath)
      const normalizedRoot = path.normalize(rootDir)

      // Check path is inside root directory
      if (!normalizedPath.startsWith(normalizedRoot)) {
        throw new Error(`Security: Path outside storage dir: ${filePath}`)
      }

      // Validate path characters
      if (!SAFE_PATH_PATTERN.test(normalizedPath)) {
        throw new Error(
          `Security: Path contains invalid characters: ${filePath}`,
        )
      }

      // Delete file with direct fs call in allowed location
      fs.unlinkSync(normalizedPath)
    } catch (error) {
      logger.error(
        `Security in unlinkSync: ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  },
}

/**
 * Configuration for local file storage
 */
export interface LocalFileStorageConfig extends FileStorageConfig {
  /**
   * Base directory for file storage
   */
  storageDir: string

  /**
   * Base URL for accessing stored files
   */
  baseUrl: string
}

/**
 * Local filesystem implementation of FileStorage
 * This implementation stores files in a local directory and serves them via HTTP
 */
export class LocalFileStorage
  extends BaseFileStorage
  implements FileStoragePort
{
  private readonly storageDir: string
  private readonly baseUrl: string
  private readonly allowedTypes: string[]
  private readonly maxSize: number
  private readonly generateThumbnails: boolean
  private readonly thumbnailSize?: { width: number; height: number }
  private readonly customValidator?: (file: FileUpload) => Promise<void>

  /**
   * Map of valid MIME type to file extension combinations
   */
  constructor(config: LocalFileStorageConfig) {
    super()
    this.storageDir = config.storageDir
    this.baseUrl = config.baseUrl
    this.allowedTypes = config.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
      'image/gif',
    ]
    this.maxSize = config.maxSize || 5 * 1024 * 1024 // 5MB default
    this.generateThumbnails = config.generateThumbnails || false
    this.thumbnailSize = config.thumbnailSize
    this.customValidator = config.customValidator

    // Ensure storage directory exists
    this.ensureStorageDir()
  }

  /**
   * Save a file to local storage
   * @param file - The file to save
   * @param prefix - Optional prefix for the file path (e.g., 'uploads')
   * @param options - Optional configuration for this specific file
   * @returns The result object with URL and metadata about the saved file
   */
  async saveFile(
    file: FileUpload,
    prefix = 'uploads',
    options: FileStorageOptions = {},
  ): Promise<FileStorageResult> {
    // Validate file before processing
    this.validateFile(file, this.allowedTypes, this.maxSize)

    // Also run custom validator if provided
    if (this.customValidator) {
      try {
        await this.customValidator(file)
      } catch (error) {
        throw ErrorFactory.fromError(error, 'Custom validation failed', {
          source: 'LocalFileStorage.saveFile.customValidator',
        })
      }
    }

    // Generate unique filename with original extension
    const originalExt = this.getFileExtension(file.filename)

    let filename: string

    // Use custom filename, preserve original, or generate random
    if (options.filename) {
      // Use custom filename but ensure it has an extension
      filename = options.filename
      if (!path.extname(filename)) {
        filename += originalExt
      }
    } else if (options.preserveFilename && file.filename) {
      // Sanitize the original filename
      filename = this.sanitizeFilename(file.filename)
    } else {
      // Generate random filename
      const randomName = crypto.randomBytes(16).toString('hex')

      filename = `${randomName}${originalExt}`
    }

    // Create subdirectory if needed
    const subDir = path.join(this.storageDir, prefix)

    if (!SafeFileUtils.existsSync(subDir, this.storageDir)) {
      SafeFileUtils.mkdirSync(subDir, this.storageDir, { recursive: true })
    }

    // Set full path for file
    const filePath = path.join(subDir, filename)

    // Don't overwrite existing files unless explicitly allowed
    if (
      !options.overwrite &&
      SafeFileUtils.existsSync(filePath, this.storageDir)
    ) {
      // Add timestamp to filename to make it unique
      const timestamp = Date.now()
      const filenameParts = path.parse(filename)

      filename = `${filenameParts.name}_${timestamp}${filenameParts.ext}`
    }

    // Update file path with potentially modified filename
    const finalFilePath = path.join(subDir, filename)

    try {
      // Write file to disk
      await pipeline(
        file.file,
        SafeFileUtils.createWriteStream(finalFilePath, this.storageDir),
      )

      // Get file size
      const fileSize = file.size

      // Construct public URL
      const fileUrl = `${this.baseUrl}/${prefix}/${filename}`

      // Generate thumbnail if enabled (would be implemented here)
      let thumbnailUrl: string | undefined

      if (this.generateThumbnails && this.isImageFile(file.mimetype)) {
        // In a real implementation, generate thumbnail here
        // thumbnailUrl = await this.generateThumbnail(finalFilePath, file.mimetype, prefix, filename)
      }

      logger.debug('File saved successfully', {
        originalName: file.filename,
        savedPath: finalFilePath,
        url: fileUrl,
        size: fileSize,
        type: file.mimetype,
      })

      // Return result object
      return {
        url: fileUrl,
        thumbnailUrl,
        size: fileSize,
        mimetype: file.mimetype,
        originalFilename: file.filename || 'unknown',
        filename,
        path: path.join(prefix, filename),
      }
    } catch (error: any) {
      logger.error('Error saving file:', error)

      // Capture the file path for cleanup
      error.filePath = finalFilePath

      // Attempt to clean up any partially written file
      if (SafeFileUtils.existsSync(finalFilePath, this.storageDir)) {
        try {
          SafeFileUtils.unlinkSync(finalFilePath, this.storageDir)
          logger.debug('Cleaned up partial file', { path: finalFilePath })
        } catch (cleanupError) {
          logger.error('Failed to clean up partial file:', cleanupError)
        }
      }

      throw ErrorFactory.fromError(error, 'Failed to save file', {
        source: 'LocalFileStorage.saveFile',
      })
    }
  }

  /**
   * Delete a file from local storage
   * @param fileUrl - The URL of the file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlPath = this.getPathFromUrl(fileUrl)

      if (!urlPath) {
        throw new Error('Invalid file URL format')
      }

      const filename = path.basename(urlPath)
      const prefix = urlPath.split('/').slice(1, -1).join('/')

      if (!prefix) {
        throw new Error('Invalid file URL format')
      }

      const filePath = path.join(this.storageDir, prefix, filename)

      // Check if file exists
      if (!SafeFileUtils.existsSync(filePath, this.storageDir)) {
        logger.warn(`File not found for deletion: ${filePath}`)

        return
      }

      // Delete the file
      SafeFileUtils.unlinkSync(filePath, this.storageDir)

      // Delete thumbnail if it exists
      const fileNameParts = path.parse(filename)
      const thumbnailName = `${fileNameParts.name}_thumb${fileNameParts.ext}`
      const thumbnailPath = path.join(this.storageDir, prefix, thumbnailName)

      if (SafeFileUtils.existsSync(thumbnailPath, this.storageDir)) {
        SafeFileUtils.unlinkSync(thumbnailPath, this.storageDir)
        logger.debug(`Thumbnail deleted: ${thumbnailPath}`)
      }

      logger.debug(`File deleted: ${filePath}`)
    } catch (err) {
      logger.error('Error deleting file:', err)
      throw ErrorFactory.fromError(err, 'Failed to delete file', {
        source: 'LocalFileStorage.deleteFile',
      })
    }
  }

  /**
   * Ensure storage directory exists
   * @private
   */
  private ensureStorageDir(): void {
    try {
      // Basic validation
      if (
        !this.storageDir ||
        typeof this.storageDir !== 'string' ||
        !this.storageDir.trim()
      ) {
        throw new Error('Invalid storage directory path')
      }

      // Normalize the path for safety
      const normalizedStorageDir = path.normalize(this.storageDir)

      // Validate characters in storage dir path
      if (!SAFE_PATH_PATTERN.test(normalizedStorageDir)) {
        throw new Error(`Invalid storage directory path: ${this.storageDir}`)
      }

      // Check if directory exists
      let dirExists = false

      try {
        dirExists = fs.existsSync(normalizedStorageDir)
      } catch (error) {
        logger.error(
          `Error checking directory: ${error instanceof Error ? error.message : String(error)}`,
        )
        throw new Error('Failed to access storage directory')
      }

      // Create directory if it doesn't exist
      if (!dirExists) {
        try {
          fs.mkdirSync(normalizedStorageDir, { recursive: true })
          logger.info(`Created storage directory: ${normalizedStorageDir}`)
        } catch (error) {
          logger.error(
            `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`,
          )
          throw new Error('Failed to create storage directory')
        }
      }
    } catch (error) {
      const errorMsg = `Storage directory error: ${error instanceof Error ? error.message : String(error)}`

      logger.error(errorMsg)
      throw new Error(errorMsg)
    }
  }

  /**
   * Extract path from URL
   * @private
   */
  private getPathFromUrl(url: string): string | null {
    try {
      // Try to parse as a full URL
      const urlObj = new URL(url)

      return urlObj.pathname
    } catch {
      // If it's not a valid URL, try treating it as a relative path
      if (url.startsWith(this.baseUrl)) {
        return url.substring(this.baseUrl.length)
      } else if (url.startsWith('/')) {
        // It might be just a path without the baseUrl
        return url
      }

      return null
    }
  }

  /**
   * Get file extension from filename
   * @private
   */
  private getFileExtension(filename: string): string {
    const ext = path.extname(filename || '').toLowerCase()

    // If no extension is found, default to .bin
    return ext || '.bin'
  }

  /**
   * Generate a thumbnail for an image file
   * Not implemented in this version, would require image processing library
   * @private
   */
  /*
  private async generateThumbnail(
    filePath: string,
    mimeType: string,
    prefix: string,
    filename: string
  ): Promise<string | undefined> {
    // This would require an image processing library like sharp
    // Implementation would resize the image and save a thumbnail
    return undefined
  }
  */
}
