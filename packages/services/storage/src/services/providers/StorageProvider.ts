export interface StorageProvider {
  uploadFile(params: FileUploadParams): Promise<FileUploadResult>
  deleteFile(params: FileDeleteParams): Promise<FileDeleteResult>
  getFileUrl(params: FileUrlParams): Promise<FileUrlResult>
  getProviderName(): string
  isAvailable(): Promise<boolean>
}

export interface FileUploadParams {
  fileId: string
  fileName: string
  fileBuffer: Buffer
  contentType: string
  metadata?: Record<string, any>
  folder?: string
  isPublic?: boolean
}

export interface FileDeleteParams {
  fileId: string
  storageKey?: string
  folder?: string
}

export interface FileUrlParams {
  fileId: string
  storageKey?: string
  folder?: string
  expiresIn?: number // seconds
}

export interface FileUploadResult {
  success: boolean
  fileId: string
  url: string
  storageKey: string
  provider: string
  size: number
  contentType: string
  metadata?: any
  error?: string
}

export interface FileDeleteResult {
  success: boolean
  fileId: string
  provider: string
  error?: string
}

export interface FileUrlResult {
  success: boolean
  url: string
  expiresAt?: Date
  provider: string
  error?: string
}
