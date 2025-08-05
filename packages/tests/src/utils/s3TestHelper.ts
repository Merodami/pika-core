import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_ENDPOINT,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
} from '@pika/environment'
import { logger } from '@pika/shared'

export interface S3TestConfig {
  endpoint?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  buckets?: string[]
}

export class S3TestHelper {
  private client: S3Client
  private config: Required<S3TestConfig>
  private createdBuckets: Set<string> = new Set()

  constructor(config: S3TestConfig = {}) {
    this.config = {
      endpoint: config.endpoint || AWS_S3_ENDPOINT,
      region: config.region || AWS_S3_REGION || 'us-east-1',
      accessKeyId: config.accessKeyId || AWS_S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey:
        config.secretAccessKey || AWS_S3_SECRET_ACCESS_KEY || 'minioadmin',
      buckets: config.buckets || ['test-bucket', 'pika-uploads'],
    }

    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    })
  }

  /**
   * Check if MinIO/S3 service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.send(new ListBucketsCommand({}))

      return true
    } catch (error) {
      logger.warn('S3/MinIO service not available:', {
        endpoint: this.config.endpoint,
        error: error instanceof Error ? error.message : String(error),
      })

      return false
    }
  }

  /**
   * Set up test environment - create required buckets
   */
  async setup(): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error(
        `S3/MinIO not available at ${this.config.endpoint}. Please ensure MinIO is running.`,
      )
    }

    for (const bucketName of this.config.buckets) {
      await this.createBucket(bucketName)
    }

    logger.info('S3 test environment setup complete', {
      endpoint: this.config.endpoint,
      buckets: Array.from(this.createdBuckets),
    })
  }

  /**
   * Clean up test environment - remove all test data and buckets
   */
  async cleanup(): Promise<void> {
    for (const bucketName of this.createdBuckets) {
      await this.clearBucket(bucketName)
      // Only delete test buckets, not production ones
      if (bucketName.includes('test') || bucketName.includes('integration')) {
        await this.deleteBucket(bucketName)
      }
    }

    this.createdBuckets.clear()
    logger.info('S3 test environment cleanup complete')
  }

  /**
   * Create a bucket if it doesn't exist
   */
  async createBucket(bucketName: string): Promise<void> {
    try {
      // Check if bucket exists
      await this.client.send(new HeadBucketCommand({ Bucket: bucketName }))
      logger.debug(`Bucket ${bucketName} already exists`)
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        // Bucket doesn't exist, create it
        await this.client.send(new CreateBucketCommand({ Bucket: bucketName }))
        logger.debug(`Created bucket: ${bucketName}`)
      } else {
        throw error
      }
    }

    this.createdBuckets.add(bucketName)
  }

  /**
   * Delete all objects in a bucket
   */
  async clearBucket(bucketName: string): Promise<void> {
    try {
      const listResponse = await this.client.send(
        new ListObjectsV2Command({ Bucket: bucketName }),
      )

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        for (const object of listResponse.Contents) {
          if (object.Key) {
            await this.client.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: object.Key,
              }),
            )
          }
        }

        logger.debug(
          `Cleared ${listResponse.Contents.length} objects from ${bucketName}`,
        )
      }
    } catch (error: any) {
      if (error.name !== 'NoSuchBucket') {
        logger.warn(`Error clearing bucket ${bucketName}:`, error.message)
      }
    }
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(bucketName: string): Promise<void> {
    try {
      await this.client.send(new DeleteBucketCommand({ Bucket: bucketName }))
      logger.debug(`Deleted bucket: ${bucketName}`)
      this.createdBuckets.delete(bucketName)
    } catch (error: any) {
      if (error.name !== 'NoSuchBucket') {
        logger.warn(`Error deleting bucket ${bucketName}:`, error.message)
      }
    }
  }

  /**
   * Get the S3 client for direct operations
   */
  getClient(): S3Client {
    return this.client
  }

  /**
   * Get the configuration used by this helper
   */
  getConfig(): Required<S3TestConfig> {
    return { ...this.config }
  }

  /**
   * Get list of created buckets
   */
  getCreatedBuckets(): string[] {
    return Array.from(this.createdBuckets)
  }

  /**
   * Clear objects from a specific bucket without deleting the bucket
   */
  async clearBucketObjects(bucketName: string): Promise<void> {
    await this.clearBucket(bucketName)
  }

  /**
   * Check if a bucket exists
   */
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucketName }))

      return true
    } catch {
      return false
    }
  }

  /**
   * Get object count in a bucket
   */
  async getObjectCount(bucketName: string): Promise<number> {
    try {
      const listResponse = await this.client.send(
        new ListObjectsV2Command({ Bucket: bucketName }),
      )

      return listResponse.Contents?.length || 0
    } catch {
      return 0
    }
  }
}

/**
 * Create an S3TestHelper instance with default configuration
 */
export function createS3TestHelper(config?: S3TestConfig): S3TestHelper {
  return new S3TestHelper(config)
}

/**
 * Convenience function to setup S3 for tests
 */
export async function setupS3ForTests(
  buckets: string[] = ['test-bucket', 'pikaploads'],
): Promise<S3TestHelper> {
  const helper = createS3TestHelper({ buckets })

  await helper.setup()

  return helper
}
