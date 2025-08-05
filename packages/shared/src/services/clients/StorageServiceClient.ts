import { FILE_STORAGE_API_URL } from '@pika/environment'
import FormData from 'form-data'

import { ErrorFactory } from '../../errors/index.js'
import { logger } from '../../infrastructure/logger/index.js'
import type {
  FileStoragePort,
  FileStorageResult,
  FileUpload,
} from '../../infrastructure/storage/FileStorage.js'
import { BaseServiceClient } from '../BaseServiceClient.js'

/**
 * Client for interacting with the Storage Service
 * Implements FileStoragePort to be used as a drop-in replacement for local storage
 */
export class StorageServiceClient
  extends BaseServiceClient
  implements FileStoragePort
{
  constructor(serviceUrl: string = FILE_STORAGE_API_URL) {
    super({
      serviceUrl,
      serviceName: 'StorageServiceClient',
    })
  }

  /**
   * Upload a file to the storage service
   */
  async saveFile(
    file: FileUpload,
    prefix?: string,
    options?: any,
  ): Promise<FileStorageResult> {
    try {
      const formData = new FormData()

      // Add file to form data
      formData.append('file', file.file, {
        filename: file.filename,
        contentType: file.mimetype,
        knownLength: file.size,
      })

      // Add metadata
      if (prefix) {
        formData.append('folder', prefix)
      }

      // For avatars, make them public
      if (prefix?.includes('users')) {
        formData.append('isPublic', 'true')
      }

      if (options?.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata))
      }

      const response = await this.httpClient.request<any>('/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders(),
        },
        useServiceAuth: true,
        context: options?.context || {},
      })

      // Transform the response to match FileStorageResult interface
      const result = response.data

      return {
        url: result.url,
        path: result.storageKey || result.fileId,
        size: result.size,
        mimetype: result.contentType,
        originalFilename: result.fileName,
        filename: result.fileName,
      }
    } catch (error) {
      logger.error('Failed to upload file to storage service', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // For now, we'll log a warning since we don't have the fileId
      // In a proper implementation, we'd need to store the fileId mapping
      logger.warn('File deletion not implemented for storage service', {
        fileUrl,
      })

      // Alternatively, we could query the storage service to find the file by URL
      // but that would require an additional endpoint
    } catch (error) {
      logger.error('Failed to delete file from storage service', {
        error,
        fileUrl,
      })
      throw ErrorFactory.fromError(error)
    }
  }
}
