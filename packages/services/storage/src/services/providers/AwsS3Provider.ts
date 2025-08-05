import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

export class AwsS3Provider implements StorageProvider {
  private client!: S3Client
  private isConfigured: boolean
  private bucketName: string
  private providerName: string

  /**
   * Helper to construct S3 key from params
   */
  private getS3Key(params: {
    storageKey?: string
    folder?: string
    fileId: string
  }): string {
    return (
      params.storageKey ||
      (params.folder ? `${params.folder}/${params.fileId}` : params.fileId)
    )
  }

  constructor(
    private readonly config: {
      region?: string
      accessKeyId?: string
      secretAccessKey?: string
      bucketName?: string
      endpoint?: string // For LocalStack/MinIO testing
      providerName?: string // Actual provider name (aws_s3 or minio)
    },
  ) {
    this.bucketName = config.bucketName || 'pika-uploads'
    this.providerName = config.providerName || 'aws_s3'
    this.isConfigured = !!(
      config.region &&
      config.accessKeyId &&
      config.secretAccessKey
    )

    if (this.isConfigured) {
      this.client = new S3Client({
        region: config.region || 'us-east-1',
        ...(config.endpoint && { endpoint: config.endpoint }), // LocalStack/MinIO support
        forcePathStyle: !!config.endpoint, // Required for MinIO
        credentials: {
          accessKeyId: config.accessKeyId!,
          secretAccessKey: config.secretAccessKey!,
        },
      })
    }
  }

  getProviderName(): string {
    return this.providerName
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured) {
      return false
    }

    try {
      // Try to head bucket to verify credentials
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }))

      return true
    } catch (error) {
      logger.warn('AWS S3 not available', {
        error: error.message,
        bucket: this.bucketName,
        endpoint: this.config.endpoint,
        region: this.config.region,
        hasCredentials: !!(
          this.config.accessKeyId && this.config.secretAccessKey
        ),
      })

      return false
    }
  }

  async uploadFile(params: FileUploadParams): Promise<FileUploadResult> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 not configured')
    }

    try {
      // Extract extension from filename
      const extension = params.fileName.includes('.')
        ? `.${params.fileName.split('.').pop()?.toLowerCase()}`
        : ''

      // Create storage key with extension for proper content serving
      const key = params.folder
        ? `${params.folder}/${params.fileId}${extension}`
        : `${params.fileId}${extension}`

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: params.fileBuffer,
        ContentType: params.contentType,
        Metadata: params.metadata
          ? Object.fromEntries(
              Object.entries(params.metadata).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
        ...(params.isPublic && { ACL: 'public-read' }),
      })

      const response = await this.client.send(command)

      // Generate URL for the uploaded file
      // For MinIO, always use signed URLs as public ACLs require additional bucket policy configuration
      const url = this.config.endpoint
        ? await this.getSignedDownloadUrl(key, 86400) // 24 hours for MinIO
        : params.isPublic
          ? this.getPublicUrl(key)
          : await this.getSignedDownloadUrl(key)

      return {
        success: true,
        fileId: params.fileId,
        url,
        storageKey: key,
        provider: this.getProviderName(),
        size: params.fileBuffer.length,
        contentType: params.contentType,
        metadata: {
          etag: response.ETag,
          requestId: response.$metadata.requestId,
        },
      }
    } catch (error) {
      logger.error('Failed to upload file to AWS S3', error)
      throw error
    }
  }

  async deleteFile(params: FileDeleteParams): Promise<FileDeleteResult> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 not configured')
    }

    try {
      const key = this.getS3Key(params)

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)

      return {
        success: true,
        fileId: params.fileId,
        provider: this.getProviderName(),
      }
    } catch (error) {
      logger.error('Failed to delete file from AWS S3', error)

      return {
        success: false,
        fileId: params.fileId,
        provider: this.getProviderName(),
        error: error.message,
      }
    }
  }

  async getFileUrl(params: FileUrlParams): Promise<FileUrlResult> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 not configured')
    }

    try {
      const key = this.getS3Key(params)

      const url = await this.getSignedDownloadUrl(key, params.expiresIn)
      const expiresAt = new Date(Date.now() + (params.expiresIn || 3600) * 1000)

      return {
        success: true,
        url,
        expiresAt,
        provider: this.getProviderName(),
      }
    } catch (error) {
      logger.error('Failed to generate file URL from AWS S3', error)

      return {
        success: false,
        url: '',
        provider: this.getProviderName(),
        error: error.message,
      }
    }
  }

  private async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    return getSignedUrl(this.client, command, { expiresIn })
  }

  /**
   * Generate public URL for an object
   * Handles both MinIO (custom endpoint) and AWS S3
   */
  private getPublicUrl(key: string): string {
    if (this.config.endpoint) {
      // MinIO or custom S3-compatible endpoint
      return `${this.config.endpoint}/${this.bucketName}/${key}`
    } else {
      // Standard AWS S3
      return `https://${this.bucketName}.s3.${this.config.region || 'us-east-1'}.amazonaws.com/${key}`
    }
  }

  // Utility method to check if file exists
  async fileExists(fileId: string, folder?: string): Promise<boolean> {
    try {
      const key = folder ? `${folder}/${fileId}` : fileId

      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      )

      return true
    } catch {
      return false
    }
  }
}
