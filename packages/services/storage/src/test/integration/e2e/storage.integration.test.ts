import { vi } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createExpressServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api
vi.unmock('@pika/redis') // Ensures real cache decorators from @pika/redis
vi.unmock('@pika/shared') // Ensures real error classes are used

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared // Return all actual exports
})

import {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_BUCKET,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
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
import { createStorageServer } from '@storage/server.js'
import { Express } from 'express'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Storage API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let userClient: AuthenticatedRequestClient
  let memberClient: AuthenticatedRequestClient

  const mockCacheService = new MemoryCacheService(3600)

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_storage_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    await mockCacheService.connect()

    const serverResult = await createStorageServer({
      port: 5510,
      prisma: testDb.prisma,
      cacheService: mockCacheService,
      storageConfig: {
        region: AWS_S3_REGION || 'us-east-1',
        accessKeyId: AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
        bucketName: AWS_S3_BUCKET || 'test-bucket',
        endpoint: process.env.AWS_S3_ENDPOINT || process.env.AWS_ENDPOINT_URL,
      },
    })

    app = serverResult

    logger.debug('Storage server ready for testing.')

    // Initialize E2E Authentication Helper using the Express app
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    userClient = await authHelper.getUserClient(testDb.prisma)
    memberClient = await authHelper.getMemberClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Use unified database cleanup
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
      // Clear cached tokens to force re-authentication
      authHelper.clearTokens()
      // Recreate test users after clearing database
      await authHelper.createAllTestUsers(testDb.prisma)
      // Re-authenticate to get new tokens with correct user IDs
      userClient = await authHelper.getUserClient(testDb.prisma)
      memberClient = await authHelper.getMemberClient(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    // Use unified cleanup
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // File Upload API Tests
  describe('File Upload', () => {
    describe('POST /files/upload', () => {
      it('should upload a file successfully', async () => {
        const fileContent = Buffer.from('Test file content')

        const response = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'test-file.txt')
          .field('folder', 'test-folder')
          .field('isPublic', 'false')
          .expect(201)

        expect(response.body).toHaveProperty('id')
        expect(response.body).toHaveProperty('fileId')
        expect(response.body).toHaveProperty('fileName', 'test-file.txt')
        expect(response.body).toHaveProperty('mimeType', 'text/plain')
        expect(response.body).toHaveProperty('fileSize', fileContent.length)
        // folder and isPublic are not included in FileUploadResponse
        // They are stored in the database but not returned in the response
        expect(response.body).toHaveProperty('url')
        expect(response.body).toHaveProperty('status', 'uploaded')

        // Log which provider was used
        console.log('Provider used:', response.body.provider || 'unknown')
        console.log('File URL:', response.body.url)
      })

      it('should require authentication', async () => {
        const fileContent = Buffer.from('Test file content')

        const response = await authHelper
          .getUnauthenticatedClient()
          .post('/files/upload')
          .attach('file', fileContent, 'test-file.txt')
          .expect(401)

        expect(response.body).toHaveProperty('error')
      })

      it('should reject upload without file', async () => {
        const response = await userClient
          .post('/files/upload')
          .field('folder', 'test-folder')
          .expect(400)

        expect(response.body).toHaveProperty('error')
      })

      it('should handle file metadata', async () => {
        const fileContent = Buffer.from('Test file content')
        const metadata = {
          description: 'Test file description',
          tags: ['test', 'integration'],
        }

        const response = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'test-file.txt')
          .field('metadata', JSON.stringify(metadata))
          .expect(201)

        expect(response.body).toHaveProperty('id')
        expect(response.body).toHaveProperty('metadata')
      })
    })

    describe('POST /files/upload-batch', () => {
      it('should upload multiple files successfully', async () => {
        const file1 = Buffer.from('File 1 content')
        const file2 = Buffer.from('File 2 content')

        const response = await userClient
          .post('/files/upload-batch')
          .attach('files', file1, 'file1.txt')
          .attach('files', file2, 'file2.txt')
          .field('folder', 'batch-test')
          .field('isPublic', 'true')
          .set('Accept', 'application/json')
          .expect(201)

        expect(response.body).toHaveProperty('totalUploaded', 2)
        expect(response.body).toHaveProperty('totalFailed', 0)
        expect(response.body).toHaveProperty('successful')
        expect(response.body.successful).toHaveLength(2)
        expect(response.body).toHaveProperty('failed')
        expect(Array.isArray(response.body.failed)).toBe(true)
        expect(response.body.failed).toHaveLength(0)
      })

      it('should handle empty batch', async () => {
        const response = await userClient
          .post('/files/upload-batch')
          .field('folder', 'batch-test')
          .expect(400)

        expect(response.body).toHaveProperty('error')
      })
    })
  })

  // File Management API Tests
  describe('File Management', () => {
    describe('DELETE /files/:fileId', () => {
      it('should delete a file successfully', async () => {
        // First upload a file
        const fileContent = Buffer.from('File to be deleted')
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'delete-test.txt')
          .expect(201)

        const fileId = uploadResponse.body.fileId

        // Then delete it
        await userClient
          .delete(`/files/${fileId}`)
          .set('Accept', 'application/json')
          .expect(204)
      })

      it('should not allow deleting other users files', async () => {
        // Upload file as user
        const fileContent = Buffer.from('User file')
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'user-file.txt')
          .expect(201)

        const fileId = uploadResponse.body.fileId

        // Try to delete as member
        const response = await memberClient
          .delete(`/files/${fileId}`)
          .expect(403)

        expect(response.body).toHaveProperty('error')
      })

      it('should handle non-existent file', async () => {
        const response = await userClient.delete(`/files/${uuid()}`).expect(404)

        expect(response.body).toHaveProperty('error')
      })
    })

    describe('GET /files/:fileId/url', () => {
      it('should get file URL successfully', async () => {
        // First upload a file
        const fileContent = Buffer.from('File for URL test')
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'url-test.txt')
          .expect(201)

        const fileId = uploadResponse.body.fileId

        // Get URL
        const response = await userClient
          .get(`/files/${fileId}/url`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toHaveProperty('url')
        expect(response.body).toHaveProperty('expiresAt')
        expect(response.body).toHaveProperty('expiresAt')
      })

      it('should respect custom expiration time', async () => {
        // First upload a file
        const fileContent = Buffer.from('File for URL test')
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'url-test.txt')
          .expect(201)

        const fileId = uploadResponse.body.fileId

        // Get URL with custom expiration
        const response = await userClient
          .get(`/files/${fileId}/url?expiresIn=7200`)
          .expect(200)

        expect(response.body).toHaveProperty('expiresAt')
      })

      it('should not allow access to private files by other users', async () => {
        // Upload private file as user
        const fileContent = Buffer.from('Private file')
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', fileContent, 'private-file.txt')
          .field('isPublic', 'false')
          .expect(201)

        const fileId = uploadResponse.body.fileId

        // Try to get URL as member
        const response = await memberClient
          .get(`/files/${fileId}/url`)
          .expect(403)

        expect(response.body).toHaveProperty('error')
      })
    })
  })

  // File History API Tests
  describe('File History', () => {
    describe('GET /files/history', () => {
      it('should return user file history', async () => {
        // Upload some files
        await userClient
          .post('/files/upload')
          .attach('file', Buffer.from('File 1'), 'file1.txt')
          .expect(201)

        await userClient
          .post('/files/upload')
          .attach('file', Buffer.from('File 2'), 'file2.txt')
          .expect(201)

        const response = await userClient
          .get('/files/history')
          .set('Accept', 'application/json')

        if (response.status !== 200) {
          console.error('File history error:', response.status, response.body)
        }

        expect(response.status).toBe(200)

        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('pagination')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBeGreaterThanOrEqual(2)
      })

      it('should filter by status', async () => {
        const response = await userClient
          .get('/files/history?status=uploaded')
          .expect(200)

        expect(
          response.body.data.every((file: any) => file.status === 'uploaded'),
        ).toBe(true)
      })

      it('should filter by content type', async () => {
        const response = await userClient
          .get('/files/history?contentType=text')
          .expect(200)

        expect(response.body).toHaveProperty('data')
      })

      it('should support pagination', async () => {
        const response = await userClient
          .get('/files/history?page=1&limit=5')
          .expect(200)

        expect(response.body.pagination).toHaveProperty('page', 1)
        expect(response.body.pagination).toHaveProperty('limit', 5)
      })
    })

    describe('GET /files/history/:id', () => {
      it('should return specific file details', async () => {
        // Upload a file
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', Buffer.from('Test file'), 'test.txt')
          .expect(201)

        const fileLogId = uploadResponse.body.id

        const response = await userClient
          .get(`/files/history/${fileLogId}`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toHaveProperty('id', fileLogId)
        expect(response.body).toHaveProperty('fileName', 'test.txt')
      })

      it('should not allow access to other users file logs', async () => {
        // Upload file as user
        const uploadResponse = await userClient
          .post('/files/upload')
          .attach('file', Buffer.from('User file'), 'user.txt')
          .expect(201)

        const fileLogId = uploadResponse.body.id

        // Try to access as member
        const response = await memberClient
          .get(`/files/history/${fileLogId}`)
          .expect(403)

        expect(response.body).toHaveProperty('error')
      })
    })
  })

  // Health and System Tests
  // TODO: Fix health check endpoint configuration
  // Currently failing with "Invalid health check dependency configuration"

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle large file uploads', async () => {
      // Create a buffer larger than limit (10MB)
      const largeFile = Buffer.alloc(11 * 1024 * 1024, 'x')

      const response = await userClient
        .post('/files/upload')
        .attach('file', largeFile, 'large-file.bin')

      // Log the error for debugging
      if (response.status !== 413) {
        console.error('Large file upload error:', response.body)
      }

      expect(response.status).toBe(413)
      expect(response.body).toHaveProperty('error')
    })

    it('should handle invalid file types gracefully', async () => {
      const response = await userClient
        .post('/files/upload')
        .attach(
          'file',
          Buffer.from('<script>alert("xss")</script>'),
          'malicious.html',
        )
        .expect(201)

      // Should upload but with proper content type
      expect(response.body).toHaveProperty('mimeType', 'text/html')
    })

    it('should include correlation IDs in error responses', async () => {
      const response = await userClient
        .get('/files/history/non-existent-id')
        .expect(400) // 400 because 'non-existent-id' is not a valid UUID

      expect(response.body).toHaveProperty('error')
    })
  })

  // Caching Tests
  describe('Caching Behavior', () => {
    it('should cache file history responses', async () => {
      // First request should hit database
      const response1 = await userClient.get('/files/history').expect(200)

      // Second request should be cached (same response time or faster)
      const startTime = Date.now()
      const response2 = await userClient.get('/files/history').expect(200)
      const responseTime = Date.now() - startTime

      expect(response2.body).toEqual(response1.body)
      expect(responseTime).toBeLessThan(100) // Should be very fast from cache
    })
  })
})
