import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'

/**
 * File upload schemas for various features
 */

// ============= File Types =============

export const AllowedImageTypes = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
export type AllowedImageTypes = z.infer<typeof AllowedImageTypes>

export const AllowedDocumentTypes = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
export type AllowedDocumentTypes = z.infer<typeof AllowedDocumentTypes>

// ============= File Upload =============

/**
 * File upload metadata
 */
export const FileUpload = openapi(
  z.object({
    fieldname: z.string(),
    originalname: z.string(),
    mimetype: z.string(),
    size: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024), // 10MB max
    buffer: z
      .instanceof(Buffer)
      .optional()
      .describe('File buffer for in-memory storage'),
    path: z.string().optional().describe('File path for disk storage'),
  }),
  {
    description: 'Uploaded file metadata',
  },
)

export type FileUpload = z.infer<typeof FileUpload>

/**
 * Avatar upload validation
 */
export const AvatarUpload = openapi(
  z.object({
    fieldname: z.literal('avatar'),
    originalname: z.string(),
    mimetype: AllowedImageTypes,
    size: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024), // 5MB max for avatars
  }),
  {
    description: 'Avatar image upload validation',
  },
)

export type AvatarUpload = z.infer<typeof AvatarUpload>

/**
 * Session review image upload
 */
export const ReviewImageUpload = openapi(
  z.object({
    fieldname: z.literal('image'),
    originalname: z.string(),
    mimetype: AllowedImageTypes,
    size: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024), // 10MB max
  }),
  {
    description: 'Review image upload validation',
  },
)

export type ReviewImageUpload = z.infer<typeof ReviewImageUpload>

/**
 * Document upload for certifications, etc.
 */
export const DocumentUpload = openapi(
  z.object({
    fieldname: z.string(),
    originalname: z.string(),
    mimetype: AllowedDocumentTypes,
    size: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024), // 10MB max
  }),
  {
    description: 'Document upload validation',
  },
)

export type DocumentUpload = z.infer<typeof DocumentUpload>

/**
 * Multi-file upload response
 */
export const FileUploadResponse = openapi(
  z.object({
    url: z.string().url().describe('Public URL of uploaded file'),
    key: z.string().describe('Storage key/identifier'),
    mimetype: z.string(),
    size: z.number().int().positive(),
    uploadedAt: z.string().datetime(),
  }),
  {
    description: 'Successful file upload response',
  },
)

export type FileUploadResponse = z.infer<typeof FileUploadResponse>

/**
 * Batch file upload response
 */
export const BatchFileUploadResponse = openapi(
  z.object({
    files: z.array(FileUploadResponse),
    totalSize: z.number().int().positive(),
    count: z.number().int().positive(),
  }),
  {
    description: 'Multiple files uploaded successfully',
  },
)

export type BatchFileUploadResponse = z.infer<typeof BatchFileUploadResponse>
