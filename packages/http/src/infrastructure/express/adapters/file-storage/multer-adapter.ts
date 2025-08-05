import { FileUpload } from '@pika/shared'
import multer from 'multer'
import { Readable } from 'stream'

/**
 * Adapter to convert Express/Multer file to our framework-agnostic FileUpload
 */
export function adaptMulterFile(file: Express.Multer.File): FileUpload {
  // Convert buffer to stream
  const stream = new Readable()

  stream.push(file.buffer)
  stream.push(null)

  return {
    file: stream,
    filename: file.originalname || 'unknown',
    mimetype: file.mimetype,
    size: file.size,
    fieldname: file.fieldname,
    encoding: file.encoding,
  }
}

/**
 * Create multer middleware with default settings
 */
export function createMulterMiddleware(options?: multer.Options) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB default
    },
    ...options,
  })
}
