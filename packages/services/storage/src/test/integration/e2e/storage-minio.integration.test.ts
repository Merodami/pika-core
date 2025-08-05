import { vi } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  AWS_ACCESS_KEY_ID,
  AWS_S3_ENDPOINT,
  AWS_S3_REGION,
  AWS_SECRET_ACCESS_KEY,
} from '@pika/environment'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  createE2EAuthHelper,
  E2EAuthHelper,
} from '@pika/tests'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import { FileStatus, StorageProvider } from '@pika/types'
import { createStorageServer } from '@storage/server.js'
import { Express } from 'express'
import { v4 as uuid } from 'uuid'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

describe('Storage Service with MinIO Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let userClient: AuthenticatedRequestClient
  let s3Client: S3Client

  const TEST_BUCKET = 'test-bucket'
  const mockCacheService = new MemoryCacheService(3600)

  // MinIO connection config using environment variables
  const minioConfig = {
    endpoint: AWS_S3_ENDPOINT || 'http://localhost:9000',
    region: AWS_S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: AWS_SECRET_ACCESS_KEY || 'minioadmin',
    },
    forcePathStyle: true, // Required for MinIO
  }

  beforeAll(async () => {
    // Initialize S3 client for MinIO
    s3Client = new S3Client(minioConfig)

    // Check if MinIO is available
    try {
      await s3Client.send(new ListBucketsCommand({}))
      logger.info('MinIO is available and connected')
    } catch (error) {
      logger.error('MinIO is not available:', error)
      throw new Error('MinIO is not running. Please run: yarn docker:local')
    }

    // Create test bucket
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: TEST_BUCKET }))
      logger.info(`Created test bucket: ${TEST_BUCKET}`)
    } catch (error: any) {
      if (error.name !== 'BucketAlreadyOwnedByYou') {
        throw error
      }
      logger.info(`Test bucket already exists: ${TEST_BUCKET}`)
    }

    // Set up test database
    testDb = await createTestDatabase({
      databaseName: 'test_storage_minio_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    process.env.DATABASE_URL = testDb.databaseUrl

    await mockCacheService.connect()

    // Create storage server with S3/MinIO configuration
    const serverResult = await createStorageServer({
      port: 5511,
      prisma: testDb.prisma,
      cacheService: mockCacheService,
      storageConfig: {
        region: minioConfig.region,
        accessKeyId: minioConfig.credentials.accessKeyId,
        secretAccessKey: minioConfig.credentials.secretAccessKey,
        bucketName: TEST_BUCKET,
        endpoint: minioConfig.endpoint,
      },
    })

    app = serverResult

    logger.debug('Storage server with MinIO ready for testing.')

    // Initialize authentication
    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)

    logger.debug('MinIO integration test setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
      authHelper.clearTokens()
      await authHelper.createAllTestUsers(testDb.prisma)
      userClient = await authHelper.getUserClient(testDb.prisma)
    }
  })

  afterEach(async () => {
    // Clean up any uploaded files in MinIO
    try {
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({ Bucket: TEST_BUCKET }),
      )

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        for (const object of listResponse.Contents) {
          if (object.Key) {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: TEST_BUCKET,
                Key: object.Key,
              }),
            )
          }
        }
      }
    } catch (error) {
      logger.warn('Error cleaning up MinIO objects:', error)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up MinIO integration test resources...')

    if (authHelper) {
      authHelper.clearTokens()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    // Clean up test bucket
    try {
      // First, delete all objects in the bucket
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({ Bucket: TEST_BUCKET }),
      )

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        for (const object of listResponse.Contents) {
          if (object.Key) {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: TEST_BUCKET,
                Key: object.Key,
              }),
            )
          }
        }
      }

      // Then delete the bucket
      await s3Client.send(new DeleteBucketCommand({ Bucket: TEST_BUCKET }))
      logger.info(`Deleted test bucket: ${TEST_BUCKET}`)
    } catch (error) {
      logger.warn('Error cleaning up test bucket:', error)
    }

    logger.debug('MinIO integration test cleanup complete.')
  })

  describe('MinIO S3 Storage Provider Tests', () => {
    it('should upload file to MinIO successfully', async () => {
      const fileContent = Buffer.from('Test file content for MinIO')
      const fileName = `test-${uuid()}.txt`

      const response = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .field('folder', 'test-folder')
        .field('isPublic', 'false')

      if (response.status !== 201) {
        console.error('Upload failed:', response.body)
      }

      expect(response.status).toBe(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('fileId')
      expect(response.body).toHaveProperty('fileName', fileName)
      expect(response.body).toHaveProperty('status', FileStatus.UPLOADED)
      expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
      expect(response.body.url).toContain(TEST_BUCKET)

      // Verify file exists in MinIO
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: TEST_BUCKET,
          Prefix: `test-folder/${response.body.fileId}`,
        }),
      )

      expect(listResponse.Contents).toBeDefined()
      expect(listResponse.Contents!.length).toBeGreaterThan(0)
    })

    it('should generate presigned URLs for private files', async () => {
      // Upload a private file
      const fileContent = Buffer.from('Private file content')
      const fileName = `private-${uuid()}.txt`

      const uploadResponse = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .field('isPublic', 'false')
        .expect(201)

      const fileId = uploadResponse.body.fileId

      // Get presigned URL
      const urlResponse = await userClient
        .get(`/files/${fileId}/url`)
        .query({ expiresIn: 3600 })
        .expect(200)

      expect(urlResponse.body).toHaveProperty('url')
      expect(urlResponse.body).toHaveProperty('expiresAt')
      expect(urlResponse.body.url).toContain(TEST_BUCKET)
      expect(urlResponse.body.url).toContain('X-Amz-Signature')
      expect(urlResponse.body.url).toContain('X-Amz-Expires')
    })

    it('should handle batch uploads to MinIO', async () => {
      const file1 = Buffer.from('Batch file 1 content')
      const file2 = Buffer.from('Batch file 2 content')
      const file3 = Buffer.from('Batch file 3 content')
      const testFolder = `batch-folder-${uuid()}`

      const response = await userClient
        .post('/files/upload-batch')
        .attach('files', file1, `batch1-${uuid()}.txt`)
        .attach('files', file2, `batch2-${uuid()}.txt`)
        .attach('files', file3, `batch3-${uuid()}.txt`)
        .field('folder', testFolder)
        .field('isPublic', 'true')
        .expect(201)

      // Log the response for debugging
      logger.debug(
        'Batch upload response:',
        JSON.stringify(response.body, null, 2),
      )

      expect(response.body).toHaveProperty('totalUploaded', 3)
      expect(response.body).toHaveProperty('totalFailed', 0)
      expect(response.body).toHaveProperty('successful')
      expect(response.body.successful).toHaveLength(3)
      expect(response.body.failed).toHaveLength(0)

      // Verify that all uploads used correct provider
      response.body.successful.forEach((upload: any) => {
        expect(upload.provider).toBe(StorageProvider.AWS_S3)
      })

      // Additional verification that uploads have correct properties
      response.body.successful.forEach((upload: any) => {
        expect(upload).toHaveProperty('fileId')
        expect(upload).toHaveProperty('fileName')
        expect(upload).toHaveProperty('status', FileStatus.UPLOADED)
        expect(upload).toHaveProperty('provider', StorageProvider.AWS_S3)
        expect(upload).toHaveProperty('url')
      })
    })

    it('should delete files from MinIO', async () => {
      // Upload a file
      const fileContent = Buffer.from('File to be deleted')
      const fileName = `delete-test-${uuid()}.txt`

      const uploadResponse = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .expect(201)

      // Add small delay to ensure S3 consistency
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const fileId = uploadResponse.body.fileId

      // Verify the upload was successful by checking the response
      expect(uploadResponse.body).toHaveProperty('fileId')
      expect(uploadResponse.body).toHaveProperty('status', 'uploaded')
      expect(uploadResponse.body).toHaveProperty(
        'provider',
        StorageProvider.AWS_S3,
      )

      // Delete the file via API
      await userClient.delete(`/files/${fileId}`).expect(204)

      // Wait for eventual consistency and retry a few times
      let deleteRetries = 10
      let fileStillExists = true

      while (deleteRetries > 0 && fileStillExists) {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // List all objects to see what's there
        const afterDelete = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: TEST_BUCKET,
          }),
        )

        // Check if our file still exists
        fileStillExists = false
        if (afterDelete.Contents) {
          for (const obj of afterDelete.Contents) {
            if (obj.Key && obj.Key.includes(fileId)) {
              fileStillExists = true
              console.log(
                `File still exists after retry ${10 - deleteRetries}: ${obj.Key}`,
              )
              break
            }
          }
        }

        deleteRetries--
      }

      // S3 delete is eventually consistent, but should be deleted within retries
      expect(fileStillExists).toBe(false)

      // Also check the file status in the database
      const deletedFile = await userClient
        .get(`/files/history/${uploadResponse.body.id}`)
        .expect(200)

      expect(deletedFile.body.status).toBe('deleted')
    })

    it('should handle different file types correctly', async () => {
      const testFiles = [
        {
          content: Buffer.from('{"test": "json"}'),
          name: 'test.json',
          expectedType: 'application/json',
        },
        {
          content: Buffer.from('<html>test</html>'),
          name: 'test.html',
          expectedType: 'text/html',
        },
        {
          content: Buffer.from('Test PDF content'),
          name: 'test.pdf',
          expectedType: 'application/pdf',
        },
      ]

      for (const testFile of testFiles) {
        const response = await userClient
          .post('/files/upload')
          .attach('file', testFile.content, testFile.name)
          .expect(201)

        expect(response.body).toHaveProperty('mimeType', testFile.expectedType)
        expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
      }
    })

    it('should reject files when MinIO is unavailable', async () => {
      // This test would require stopping MinIO temporarily
      // For now, we'll skip this test as it would disrupt other tests
      // In a real scenario, you might mock the S3 client to simulate failure
    })

    it('should use console provider as fallback when S3 fails', async () => {
      // This test would require modifying the storage config to use
      // an invalid S3 configuration and verify console provider is used
      // For integration tests, we'll keep MinIO running
    })
  })

  describe('Security Validations', () => {
    it('should not expose internal file paths', async () => {
      const fileContent = Buffer.from('Security test file')
      const fileName = 'security-test.txt'

      const response = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .expect(201)

      // Check that response doesn't contain file system paths
      const responseString = JSON.stringify(response.body)

      expect(responseString).not.toContain('/uploads')
      expect(responseString).not.toContain('./uploads')
      expect(responseString).not.toContain(process.cwd())
    })

    it('should sanitize file names', async () => {
      const fileContent = Buffer.from('Test file')
      const maliciousFileName = '../../../etc/passwd'

      const response = await userClient
        .post('/files/upload')
        .attach('file', fileContent, maliciousFileName)
        .expect(201)

      // The file should be uploaded but with a sanitized name
      // Multer/browser sanitizes the path to just the filename
      expect(response.body.fileName).toBe('passwd')
      expect(response.body.fileId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )

      // Verify in MinIO that the file is stored with UUID, not the malicious path
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: TEST_BUCKET,
          Prefix: response.body.fileId,
        }),
      )

      expect(listResponse.Contents).toBeDefined()

      const storedKey = listResponse.Contents![0].Key!

      expect(storedKey).not.toContain('..')
      expect(storedKey).toContain(response.body.fileId)
    })

    it('should handle file size limits correctly', async () => {
      // Create a file just under the limit (10MB)
      const almostLimitFile = Buffer.alloc(10 * 1024 * 1024 - 1, 'x')

      const successResponse = await userClient
        .post('/files/upload')
        .attach('file', almostLimitFile, 'almost-limit.bin')
        .expect(201)

      expect(successResponse.body).toHaveProperty(
        'fileSize',
        almostLimitFile.length,
      )

      // Create a file over the limit (11MB)
      const overLimitFile = Buffer.alloc(11 * 1024 * 1024, 'x')

      const errorResponse = await userClient
        .post('/files/upload')
        .attach('file', overLimitFile, 'over-limit.bin')
        .expect(413)

      expect(errorResponse.body).toHaveProperty('error')
      expect(errorResponse.body.error).toHaveProperty('message')
      expect(errorResponse.body.error.message).toContain('size')
    })
  })

  describe('Performance and Reliability', () => {
    it('should handle concurrent uploads', async () => {
      const uploadPromises = Array.from({ length: 5 }, (_, i) =>
        userClient
          .post('/files/upload')
          .attach(
            'file',
            Buffer.from(`Concurrent file ${i}`),
            `concurrent-${i}.txt`,
          )
          .field('folder', 'concurrent-test'),
      )

      const results = await Promise.all(uploadPromises)

      results.forEach((response) => {
        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
      })

      // Verify all files in MinIO
      const listResponse = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: TEST_BUCKET,
          Prefix: 'concurrent-test/',
        }),
      )

      expect(listResponse.Contents!.length).toBeGreaterThanOrEqual(5)
    })

    it('should maintain file metadata', async () => {
      const metadata = {
        author: 'Test User',
        description: 'Test file with metadata',
        tags: ['test', 'integration', 'minio'],
      }

      const response = await userClient
        .post('/files/upload')
        .attach('file', Buffer.from('File with metadata'), 'metadata-test.txt')
        .field('metadata', JSON.stringify(metadata))
        .expect(201)

      expect(response.body).toHaveProperty('metadata')

      // Get file details
      const detailResponse = await userClient
        .get(`/files/history/${response.body.id}`)
        .expect(200)

      expect(detailResponse.body).toHaveProperty('metadata')

      // Metadata should already be parsed as an object
      const parsedMetadata = detailResponse.body.metadata

      expect(parsedMetadata).toMatchObject(metadata)
    })
  })
})
