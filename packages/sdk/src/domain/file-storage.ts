// File Storage domain types

export interface FileStorageLogDomain {
  id: string
  fileId: string
  fileName: string
  contentType: string
  size: number
  folder?: string
  isPublic: boolean
  url: string
  storageKey?: string
  status: string
  userId?: string
  metadata?: any
  provider?: string
  uploadedAt?: Date
  deletedAt?: Date
  errorMessage?: string
  processingTimeMs?: number
  createdAt: Date
  updatedAt: Date
}

export interface FileUploadDomain {
  fileId: string
  fileKey: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER'
  url?: string
  uploadedAt: Date
}
