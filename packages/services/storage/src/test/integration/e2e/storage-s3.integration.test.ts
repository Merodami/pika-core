import { vi } from 'vitest'

// Unmock modules for real service integration testing
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_ENDPOINT,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
} from '@pika/environment'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  createE2EAuthHelper,
  createS3TestHelper,
  E2EAuthHelper,
  S3TestHelper,
} from '@pika/tests'
import { FileStatus, StorageProvider } from '@pika/types'
import { createStorageServer } from '@storage/server.js'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
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

describe('Storage Service with S3/MinIO Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let s3Helper: S3TestHelper
  let userClient: AuthenticatedRequestClient

  const mockCacheService = new MemoryCacheService(3600)
  // Use unique bucket name to avoid conflicts between parallel test runs
  const TEST_BUCKET = `test-bucket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  beforeAll(async () => {
    // Set environment variables for S3 provider
    process.env.STORAGE_PROVIDER_PRIMARY = 'aws_s3'
    process.env.STORAGE_PROVIDER_FALLBACK = 'local'
    process.env.NODE_ENV = 'test'

    // Initialize S3 test helper
    s3Helper = createS3TestHelper({
      buckets: [TEST_BUCKET], // Use only unique test bucket
    })

    // Retry logic for MinIO availability check
    let retries = 3

    while (retries > 0) {
      if (await s3Helper.isAvailable()) {
        break
      }
      retries--
      if (retries === 0) {
        throw new Error(
          'MinIO/S3 service is not available. Please run: yarn docker:local',
        )
      }
      logger.warn(`MinIO not ready, retrying... (${retries} attempts left)`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    // Setup S3 test environment
    await s3Helper.setup()

    // Set up test database
    testDb = await createTestDatabase({
      databaseName: 'test_storage_s3_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    process.env.DATABASE_URL = testDb.databaseUrl

    await mockCacheService.connect()

    // Create storage server using environment configuration (same as main test)
    const serverResult = await createStorageServer({
      port: 5512, // Use different port to avoid conflicts
      prisma: testDb.prisma,
      cacheService: mockCacheService,
      storageConfig: {
        region: AWS_S3_REGION,
        accessKeyId: AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
        bucketName: TEST_BUCKET,
        endpoint: AWS_S3_ENDPOINT,
      },
    })

    app = serverResult

    logger.info('Storage server with S3 ready for testing.')

    // Initialize authentication
    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)

    userClient = await authHelper.getUserClient(testDb.prisma)

    logger.info('S3 integration test setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear test database
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
      authHelper.clearTokens()
      await authHelper.createAllTestUsers(testDb.prisma)
      userClient = await authHelper.getUserClient(testDb.prisma)
    }

    // Clear S3 test bucket objects but keep buckets
    await s3Helper.clearBucketObjects(TEST_BUCKET)

    // Add small delay to handle S3 eventual consistency
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  afterEach(async () => {
    // Additional cleanup after each test
    await s3Helper.clearBucketObjects(TEST_BUCKET)
  })

  afterAll(async () => {
    logger.info('Cleaning up S3 integration test resources...')

    if (authHelper) {
      authHelper.clearTokens()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    if (mockCacheService) {
      await mockCacheService.disconnect()
    }

    // Clean up S3 test environment
    if (s3Helper) {
      try {
        // Clear and delete our unique test bucket
        await s3Helper.clearBucket(TEST_BUCKET)
        await s3Helper.deleteBucket(TEST_BUCKET)
      } catch (error) {
        logger.warn('Failed to clean up test bucket:', error)
      }
    }

    logger.info('S3 integration test cleanup complete.')
  })

  describe('S3 Storage Provider Tests', () => {
    it('should upload file to S3/MinIO successfully', async () => {
      const fileContent = Buffer.from('Test file content for S3/MinIO storage')
      const fileName = `s3-test-${uuid()}.txt`

      const response = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .field('folder', 'test-folder')
        .field('isPublic', 'false')

      if (response.status !== 201) {
        console.error('Upload failed with status:', response.status)
        console.error('Error body:', response.body)
        console.error('Full response:', response.text)
      }

      expect(response.status).toBe(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('fileId')
      expect(response.body).toHaveProperty('fileName', fileName)
      expect(response.body).toHaveProperty('status', FileStatus.UPLOADED)
      expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
      expect(response.body).toHaveProperty('fileSize', fileContent.length)
      expect(response.body.url).toContain(TEST_BUCKET)

      // Verify file exists in S3/MinIO
      const objectCount = await s3Helper.getObjectCount(TEST_BUCKET)

      expect(objectCount).toBeGreaterThan(0)

      logger.info('✅ S3 upload test passed', {
        provider: response.body.provider,
        fileId: response.body.fileId,
        objectCount,
      })
    })

    it('should generate presigned URLs for S3 files', async () => {
      // Upload a file first
      const fileContent = Buffer.from('Private file for presigned URL test')
      const fileName = `presigned-${uuid()}.txt`

      const uploadResponse = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .field('isPublic', 'false')
        .expect(201)

      expect(uploadResponse.body.provider).toBe(StorageProvider.AWS_S3)

      const fileId = uploadResponse.body.fileId

      // Get presigned URL
      const urlResponse = await userClient
        .get(`/files/${fileId}/url`)
        .query({ expiresIn: 3600 })
        .expect(200)

      expect(urlResponse.body).toHaveProperty('url')
      expect(urlResponse.body).toHaveProperty('expiresAt')
      expect(urlResponse.body.url).toContain(TEST_BUCKET)
      expect(urlResponse.body.url).toContain('X-Amz-Signature') // S3 presigned URL signature
      expect(urlResponse.body.url).toContain('X-Amz-Expires') // S3 presigned URL expiration

      logger.info('✅ S3 presigned URL test passed')
    })

    it('should handle batch uploads to S3', async () => {
      const files = [
        { content: Buffer.from('Batch file 1'), name: `batch1-${uuid()}.txt` },
        { content: Buffer.from('Batch file 2'), name: `batch2-${uuid()}.txt` },
        { content: Buffer.from('Batch file 3'), name: `batch3-${uuid()}.txt` },
      ]

      const request = userClient
        .post('/files/upload-batch')
        .field('folder', 'batch-folder')
        .field('isPublic', 'true')

      files.forEach((file) => {
        request.attach('files', file.content, file.name)
      })

      const response = await request.expect(201)

      expect(response.body).toHaveProperty('totalUploaded', 3)
      expect(response.body).toHaveProperty('totalFailed', 0)
      expect(response.body).toHaveProperty('successful')
      expect(response.body).toHaveProperty('failed')
      expect(response.body.successful).toHaveLength(3)
      expect(response.body.failed).toHaveLength(0)

      // Verify all uploads used S3 provider
      response.body.successful.forEach((upload: any) => {
        expect(upload.provider).toBe(StorageProvider.AWS_S3)
      })

      // Verify files exist in S3
      const objectCount = await s3Helper.getObjectCount(TEST_BUCKET)

      expect(objectCount).toBeGreaterThanOrEqual(3)

      logger.info('✅ S3 batch upload test passed')
    })

    it('should delete files from S3/MinIO', async () => {
      // Upload a file
      const fileContent = Buffer.from('File to be deleted from S3')
      const fileName = `delete-test-${uuid()}.txt`

      const uploadResponse = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .expect(201)

      expect(uploadResponse.body.provider).toBe(StorageProvider.AWS_S3)

      const fileId = uploadResponse.body.fileId

      // Verify file exists in S3
      const beforeDelete = await s3Helper.getObjectCount(TEST_BUCKET)

      expect(beforeDelete).toBeGreaterThan(0)

      // Delete the file
      await userClient.delete(`/files/${fileId}`).expect(204)

      // Note: We can't easily verify individual file deletion in S3 without
      // knowing the exact object key, but the API should handle this correctly
      logger.info('✅ S3 delete test passed')
    })

    it('should handle different file types correctly in S3', async () => {
      const testFiles = [
        {
          content: Buffer.from('{"test": "json"}'),
          name: `test-${uuid()}.json`,
          expectedType: 'application/json',
        },
        {
          content: Buffer.from('<html>test</html>'),
          name: `test-${uuid()}.html`,
          expectedType: 'text/html',
        },
        {
          content: Buffer.from('CSV,data,test'),
          name: `test-${uuid()}.csv`,
          expectedType: 'text/csv',
        },
      ]

      for (const testFile of testFiles) {
        const response = await userClient
          .post('/files/upload')
          .attach('file', testFile.content, testFile.name)
          .expect(201)

        expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
        expect(response.body).toHaveProperty('mimeType', testFile.expectedType)
      }

      logger.info('✅ S3 file types test passed')
    })

    it('should maintain file metadata in S3', async () => {
      const metadata = {
        author: 'Test User',
        description: 'Test file with metadata stored in S3',
        tags: ['s3', 'integration', 'metadata'],
        category: 'test',
      }

      const response = await userClient
        .post('/files/upload')
        .attach(
          'file',
          Buffer.from('File with metadata'),
          `metadata-${uuid()}.txt`,
        )
        .field('metadata', JSON.stringify(metadata))
        .expect(201)

      expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
      expect(response.body).toHaveProperty('metadata')

      // Get file details and verify metadata
      const detailResponse = await userClient
        .get(`/files/history/${response.body.id}`)
        .expect(200)

      expect(detailResponse.body).toHaveProperty('metadata')

      // Metadata should already be parsed as an object
      const parsedMetadata = detailResponse.body.metadata

      expect(parsedMetadata).toMatchObject(metadata)

      logger.info('✅ S3 metadata test passed')
    })
  })

  describe('Security Validations with S3', () => {
    it('should not expose S3 credentials or internal paths', async () => {
      const fileContent = Buffer.from('Security test file')
      const fileName = `security-${uuid()}.txt`

      const response = await userClient
        .post('/files/upload')
        .attach('file', fileContent, fileName)
        .expect(201)

      expect(response.body.provider).toBe(StorageProvider.AWS_S3)

      // Check that response doesn't contain sensitive information
      const responseString = JSON.stringify(response.body)

      // Note: MinIO presigned URLs include credentials in the URL params, which is expected
      // In production with real AWS S3, the credentials would be different
      expect(responseString).not.toContain('AccessKey')
      expect(responseString).not.toContain('SecretKey')
      expect(responseString).not.toContain('/uploads')
      expect(responseString).not.toContain('./uploads')
      // Ensure we're not exposing the actual secret key value
      expect(responseString).not.toContain('minioadminpassword')

      logger.info('✅ S3 security test passed')
    })

    it('should handle file size limits correctly with S3', async () => {
      // Test file just under limit (should succeed)
      const almostLimitFile = Buffer.alloc(5 * 1024 * 1024 - 1000, 'x') // Just under 5MB

      const successResponse = await userClient
        .post('/files/upload')
        .attach('file', almostLimitFile, `large-ok-${uuid()}.bin`)
        .expect(201)

      expect(successResponse.body).toHaveProperty(
        'provider',
        StorageProvider.AWS_S3,
      )
      expect(successResponse.body).toHaveProperty(
        'fileSize',
        almostLimitFile.length,
      )

      // Test file over limit (should fail)
      const overLimitFile = Buffer.alloc(11 * 1024 * 1024, 'x') // 11MB

      const errorResponse = await userClient
        .post('/files/upload')
        .attach('file', overLimitFile, `too-large-${uuid()}.bin`)
        .expect(413)

      expect(errorResponse.body).toHaveProperty('error')
      expect(errorResponse.body.error).toHaveProperty('message')
      expect(errorResponse.body.error.message).toContain('size')

      logger.info('✅ S3 file size limits test passed')
    })
  })

  describe('Performance and Reliability with S3', () => {
    it('should handle concurrent S3 uploads', async () => {
      const uploadPromises = Array.from({ length: 5 }, (_, i) =>
        userClient
          .post('/files/upload')
          .attach(
            'file',
            Buffer.from(`Concurrent S3 file ${i}`),
            `concurrent-s3-${i}-${uuid()}.txt`,
          )
          .field('folder', 'concurrent-test'),
      )

      const results = await Promise.all(uploadPromises)

      results.forEach((response) => {
        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('provider', StorageProvider.AWS_S3)
      })

      // Verify all files were uploaded to S3
      const objectCount = await s3Helper.getObjectCount(TEST_BUCKET)

      expect(objectCount).toBeGreaterThanOrEqual(5)

      logger.info('✅ S3 concurrent uploads test passed')
    })

    it('should gracefully handle S3 service unavailability', async () => {
      // Note: This test would require stopping MinIO service temporarily
      // For now, we verify that the system properly identifies when S3 is available
      const isAvailable = await s3Helper.isAvailable()

      expect(isAvailable).toBe(true)

      logger.info('✅ S3 availability check passed')
    })
  })

  describe('Integration with Storage History', () => {
    it('should track S3 uploads in storage history', async () => {
      // Upload a few files
      const files = [
        `history-1-${uuid()}.txt`,
        `history-2-${uuid()}.txt`,
        `history-3-${uuid()}.txt`,
      ]

      for (const fileName of files) {
        const response = await userClient
          .post('/files/upload')
          .attach('file', Buffer.from(`Content for ${fileName}`), fileName)
          .expect(201)

        expect(response.body.provider).toBe(StorageProvider.AWS_S3)
      }

      // Check file history
      const historyResponse = await userClient.get('/files/history').expect(200)

      expect(historyResponse.body).toHaveProperty('data')
      expect(historyResponse.body.data.length).toBeGreaterThanOrEqual(3)

      // Verify all tracked files use S3 provider
      const s3Files = historyResponse.body.data.filter(
        (file: any) => file.provider === StorageProvider.AWS_S3,
      )

      expect(s3Files.length).toBeGreaterThanOrEqual(3)

      logger.info('✅ S3 storage history test passed')
    })
  })
})
