import { logger } from '@pika/shared'

import type {
  FileDeleteParams,
  FileDeleteResult,
  FileUploadParams,
  FileUploadResult,
  FileUrlParams,
  FileUrlResult,
  StorageProvider,
} from './StorageProvider.js'

/**
 * Console Storage Provider for local development
 * Logs storage operations to console instead of actually storing files
 */
export class ConsoleStorageProvider implements StorageProvider {
  getProviderName(): string {
    return 'local'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async uploadFile(params: FileUploadParams): Promise<FileUploadResult> {
    const storageKey = params.folder
      ? `${params.folder}/${params.fileId}/${params.fileName}`
      : `${params.fileId}/${params.fileName}`
    const mockUrl = `console://localhost/files/${storageKey}`

    logger.info('📁 FILE UPLOAD (Console Provider)', {
      fileId: params.fileId,
      fileName: params.fileName,
      contentType: params.contentType,
      size: params.fileBuffer.length,
      folder: params.folder,
      isPublic: params.isPublic,
      metadata: params.metadata,
      mockUrl,
    })

    // In development, also log detailed file information
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80))
      console.log('FILE UPLOAD DETAILS:')
      console.log('='.repeat(80))
      console.log(`File ID: ${params.fileId}`)
      console.log(`File Name: ${params.fileName}`)
      console.log(`Content Type: ${params.contentType}`)
      console.log(`Size: ${params.fileBuffer.length} bytes`)
      console.log(`Folder: ${params.folder || 'default'}`)
      console.log(`Public: ${params.isPublic ? 'Yes' : 'No'}`)
      if (params.metadata) {
        console.log('Metadata:')
        console.log(JSON.stringify(params.metadata, null, 2))
      }
      console.log(`Mock URL: ${mockUrl}`)
      console.log('-'.repeat(80))
      console.log(
        `Buffer Preview: ${params.fileBuffer.toString('hex').substring(0, 100)}...`,
      )
      console.log('='.repeat(80) + '\n')
    }

    return {
      success: true,
      fileId: params.fileId,
      url: mockUrl,
      storageKey,
      provider: this.getProviderName(),
      size: params.fileBuffer.length,
      contentType: params.contentType,
      metadata: {
        loggedAt: new Date().toISOString(),
        simulatedUpload: true,
      },
    }
  }

  async deleteFile(params: FileDeleteParams): Promise<FileDeleteResult> {
    logger.info('🗑️ FILE DELETE (Console Provider)', {
      fileId: params.fileId,
      folder: params.folder,
    })

    // In development, also log detailed deletion information
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80))
      console.log('FILE DELETE DETAILS:')
      console.log('='.repeat(80))
      console.log(`File ID: ${params.fileId}`)
      console.log(`Folder: ${params.folder || 'default'}`)
      console.log('='.repeat(80) + '\n')
    }

    return {
      success: true,
      fileId: params.fileId,
      provider: this.getProviderName(),
    }
  }

  async getFileUrl(params: FileUrlParams): Promise<FileUrlResult> {
    const mockUrl = `console://localhost/files/${params.folder || 'default'}/${params.fileId}`
    const expiresAt = params.expiresIn
      ? new Date(Date.now() + params.expiresIn * 1000)
      : new Date(Date.now() + 3600 * 1000) // 1 hour default

    logger.info('🔗 FILE URL (Console Provider)', {
      fileId: params.fileId,
      folder: params.folder,
      expiresIn: params.expiresIn,
      mockUrl,
      expiresAt,
    })

    // In development, also log detailed URL information
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80))
      console.log('FILE URL GENERATION:')
      console.log('='.repeat(80))
      console.log(`File ID: ${params.fileId}`)
      console.log(`Folder: ${params.folder || 'default'}`)
      console.log(`Expires In: ${params.expiresIn || 3600} seconds`)
      console.log(`Mock URL: ${mockUrl}`)
      console.log(`Expires At: ${expiresAt.toISOString()}`)
      console.log('='.repeat(80) + '\n')
    }

    return {
      success: true,
      url: mockUrl,
      expiresAt,
      provider: this.getProviderName(),
    }
  }

  // Utility methods for testing and debugging
  async testOperation(operation: string, params: any): Promise<any> {
    logger.info('🧪 STORAGE TEST (Console Provider)', {
      operation,
      params,
    })

    console.log('\n' + '='.repeat(80))
    console.log(`STORAGE TEST: ${operation.toUpperCase()}`)
    console.log('='.repeat(80))
    console.log('Parameters:')
    console.log(JSON.stringify(params, null, 2))
    console.log('='.repeat(80) + '\n')

    return {
      success: true,
      operation,
      params,
      provider: this.getProviderName(),
      testedAt: new Date().toISOString(),
    }
  }
}
