/**
 * Interface representing a file upload, framework-agnostic
 */
export interface FileUpload {
  /**
   * Stream containing the file contents
   */
  file: NodeJS.ReadableStream

  /**
   * Original filename provided by the user
   */
  filename: string

  /**
   * MIME type of the file
   */
  mimetype: string

  /**
   * Size of the file in bytes
   */
  size: number

  /**
   * Field name used in the form upload
   */
  fieldname?: string

  /**
   * Encoding of the file
   */
  encoding?: string
}

/**
 * Interface for file storage operations
 * Provides a common contract for different storage implementations
 */
export interface FileStoragePort {
  /**
   * Save a file to storage
   * @param file - The file to save
   * @param prefix - Optional prefix for the file path (default: 'uploads')
   * @param options - Optional configuration for this specific file
   * @returns The URL to access the saved file
   */
  saveFile(
    file: FileUpload,
    prefix?: string,
    options?: FileStorageOptions,
  ): Promise<FileStorageResult>

  /**
   * Delete a file from storage
   * @param fileUrl - The URL of the file to delete
   */
  deleteFile(fileUrl: string): Promise<void>
}

/**
 * Common configuration for file storage
 */
export interface FileStorageConfig {
  /**
   * Allowed file types (MIME types)
   */
  allowedTypes?: string[]

  /**
   * Maximum file size in bytes (default: 5MB)
   */
  maxSize?: number

  /**
   * Whether to generate thumbnails for image files (default: false)
   */
  generateThumbnails?: boolean

  /**
   * Size for generated thumbnails (only if generateThumbnails is true)
   */
  thumbnailSize?: {
    width: number
    height: number
  }

  /**
   * Optional validation function for custom file validation logic
   */
  customValidator?: (file: FileUpload) => Promise<void>
}

/**
 * Options for specific file operations
 */
export interface FileStorageOptions {
  /**
   * Custom filename to use (instead of auto-generated)
   */
  filename?: string

  /**
   * Whether to preserve the original filename (default: false)
   */
  preserveFilename?: boolean

  /**
   * Whether to overwrite existing files with the same name (default: false)
   */
  overwrite?: boolean

  /**
   * Additional metadata to store with the file
   */
  metadata?: Record<string, string>

  /**
   * Any additional context or parameters needed by the storage implementation
   */
  [key: string]: any
}

/**
 * Result of a file storage operation
 */
export interface FileStorageResult {
  /**
   * Public URL to access the file
   */
  url: string

  /**
   * Thumbnail URL (if thumbnails are enabled)
   */
  thumbnailUrl?: string

  /**
   * Size of the saved file in bytes
   */
  size: number

  /**
   * MIME type of the saved file
   */
  mimetype: string

  /**
   * Original filename
   */
  originalFilename: string

  /**
   * Filename in storage
   */
  filename: string

  /**
   * Path relative to storage root
   */
  path: string
}
