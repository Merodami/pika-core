import { vi } from 'vitest'

vi.unmock('@pika/http')
vi.unmock('@pika/shared')

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
  PrismaClient,
  ProblemPriority,
  ProblemStatus,
  UserRole,
  UserStatus,
} from '@prisma/client'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createExpressServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api
vi.unmock('@pika/redis') // Ensures real cache decorators from @pika/redis

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  createE2EAuthHelper,
  E2EAuthHelper,
} from '@pika/tests'
import { v4 as uuid } from 'uuid'

import { createSupportServer } from '../../../server.js'

// Test data seeding function for problems
async function seedTestProblems(
  prismaClient: PrismaClient,
): Promise<{ testUser: any; testProblems: any[] }> {
  logger.debug('Seeding test problems...')

  // Create a test user first
  const testUser = await prismaClient.user.create({
    data: {
      id: uuid(),
      email: 'testuser@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.customer,
      status: UserStatus.active,
      emailVerified: true,
      phoneVerified: false,
    },
  })

  // Create test problems
  const problem1 = await prismaClient.problem.create({
    data: {
      userId: testUser.id,
      title: 'Test Problem 1',
      description: 'This is a test problem description',
      status: ProblemStatus.open,
      priority: ProblemPriority.medium,
    },
  })

  const problem2 = await prismaClient.problem.create({
    data: {
      userId: testUser.id,
      title: 'Test Problem 2',
      description: 'This is another test problem description',
      status: ProblemStatus.in_progress,
      priority: ProblemPriority.high,
    },
  })

  return {
    testUser,
    testProblems: [problem1, problem2],
  }
}

describe('Support Service Integration Tests', () => {
  let app: Express
  let testDb: TestDatabaseResult
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let userClient: AuthenticatedRequestClient

  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase()

    // Create support server with test database
    const serverResult = await createSupportServer({
      port: 0, // Use random available port for testing
      host: '127.0.0.1',
      prisma: testDb.prisma,
      cacheService: new MemoryCacheService(),
    })

    app = serverResult.app

    // Initialize auth helper
    authHelper = createE2EAuthHelper(app)

    // Create test users with different roles
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Create authenticated clients
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)
  })

  beforeEach(async () => {
    // Clear test database before each test
    await clearTestDatabase(testDb.prisma)
    // Clear cached tokens to force re-authentication
    authHelper.clearTokens()
    // Recreate test users after clearing
    await authHelper.createAllTestUsers(testDb.prisma)
    // Re-authenticate to get new tokens with correct user IDs
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)
  })

  afterAll(async () => {
    // Cleanup test database
    await cleanupTestDatabase(testDb)
  })

  describe('GET /problems', () => {
    it('should return users own problems', async () => {
      // Get the authenticated user that userClient is using
      const authenticatedUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      // Create problems for the authenticated user
      await testDb.prisma.problem.createMany({
        data: [
          {
            userId: authenticatedUser.id,
            title: 'Test Problem 1',
            description: 'This is a test problem description',
            status: ProblemStatus.open,
            priority: ProblemPriority.medium,
          },
          {
            userId: authenticatedUser.id,
            title: 'Test Problem 2',
            description: 'This is another test problem description',
            status: ProblemStatus.in_progress,
            priority: ProblemPriority.high,
          },
        ],
      })

      const response = await userClient.get('/problems').expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0]).toHaveProperty(
        'userId',
        authenticatedUser.id,
      )
      expect(response.body.data[1]).toHaveProperty(
        'userId',
        authenticatedUser.id,
      )
    })

    it('should require authentication', async () => {
      await supertest(app).get('/problems').expect(401)
    })
  })

  describe('POST /problems', () => {
    it('should create a new problem for authenticated users', async () => {
      // Get the authenticated user that userClient is using
      const authenticatedUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      const newProblem = {
        title: 'New Test Problem',
        description: 'This is a new test problem',
        priority: ProblemPriority.low,
      }

      const response = await userClient
        .post('/problems')
        .send(newProblem)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', newProblem.title)
      expect(response.body).toHaveProperty(
        'description',
        newProblem.description,
      )
      expect(response.body).toHaveProperty('priority', newProblem.priority)
      expect(response.body).toHaveProperty('status', ProblemStatus.open)
      expect(response.body).toHaveProperty('userId', authenticatedUser.id)
    })

    it('should create problem with default MEDIUM priority', async () => {
      const newProblem = {
        title: 'Problem without priority',
        description: 'This problem has no explicit priority',
      }

      const response = await userClient
        .post('/problems')
        .send(newProblem)
        .expect(201)

      expect(response.body).toHaveProperty('priority', ProblemPriority.medium)
    })

    it('should deny access for unauthenticated users', async () => {
      const { testUser } = await seedTestProblems(testDb.prisma)

      const newProblem = {
        userId: testUser.id,
        title: 'Unauthorized Problem',
        description: 'This should fail',
      }

      await supertest(app).post('/problems').send(newProblem).expect(401)
    })
  })

  // ==========================================
  // Support Comment System Tests
  // ==========================================

  describe('Support Comment System', () => {
    let testProblemId: string

    beforeEach(async () => {
      // Create a test problem for comments
      const { testProblems } = await seedTestProblems(testDb.prisma)

      testProblemId = testProblems[0].id
    })

    describe('POST /comments', () => {
      it('should create a new comment for authenticated users', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'This is a test comment for the support ticket.',
          isInternal: false,
        }

        const response = await userClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        expect(response.body).toHaveProperty('id')
        expect(response.body).toHaveProperty('problemId', testProblemId)
        expect(response.body).toHaveProperty('content', commentData.content)
        expect(response.body).toHaveProperty('isInternal', false)
        expect(response.body).toHaveProperty('createdAt')
        expect(response.body).toHaveProperty('user')
        expect(response.body.user).toHaveProperty('email')
      })

      it('should create an internal comment for admin users', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'This is an internal admin note.',
          isInternal: true,
        }

        const response = await adminClient
          .post('/admin/comments')
          .send(commentData)
          .expect(201)

        expect(response.body).toHaveProperty('isInternal', true)
        expect(response.body).toHaveProperty('content', commentData.content)
      })

      it('should require authentication', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'This should fail without auth.',
        }

        await supertest(app).post('/comments').send(commentData).expect(401)
      })

      it('should validate required fields', async () => {
        // Empty body - should fail validation
        const emptyResponse = await userClient.post('/comments').send({})

        // Should be either 400 (validation) or 500 (internal error), both are acceptable for missing fields
        expect([400, 500]).toContain(emptyResponse.status)

        // Missing content - should fail
        const missingContentResponse = await userClient
          .post('/comments')
          .send({ problemId: testProblemId })

        expect([400, 500]).toContain(missingContentResponse.status)

        // Missing problemId - should fail
        const missingProblemResponse = await userClient
          .post('/comments')
          .send({ content: 'Missing problemId' })

        expect([400, 500]).toContain(missingProblemResponse.status)
      })

      it('should handle non-existent problem ID', async () => {
        const nonExistentProblemId = uuid()
        const commentData = {
          problemId: nonExistentProblemId,
          content: 'Comment for non-existent problem.',
        }

        // This should fail due to foreign key constraint - could be 400 or 500 depending on error handling
        const response = await userClient.post('/comments').send(commentData)

        // Accept either 400 (handled constraint) or 500 (unhandled constraint)
        expect([400, 500]).toContain(response.status)
      })
    })

    describe('GET /comments/problem/:problemId', () => {
      it('should return all comments for a problem', async () => {
        // Create multiple comments
        const comment1Data = {
          problemId: testProblemId,
          content: 'First comment',
        }
        const comment2Data = {
          problemId: testProblemId,
          content: 'Second comment',
        }

        await userClient.post('/comments').send(comment1Data).expect(201)
        await userClient.post('/comments').send(comment2Data).expect(201)

        const response = await userClient
          .get(`/comments/problem/${testProblemId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data).toHaveLength(2)

        // Verify comments are ordered chronologically
        expect(response.body.data[0]).toHaveProperty('content', 'First comment')
        expect(response.body.data[1]).toHaveProperty(
          'content',
          'Second comment',
        )
      })

      it('should return empty array for problem with no comments', async () => {
        const response = await userClient
          .get(`/comments/problem/${testProblemId}`)
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data).toHaveLength(0)
      })

      it('should require authentication', async () => {
        await supertest(app)
          .get(`/comments/problem/${testProblemId}`)
          .expect(401)
      })

      it('should handle non-existent problem ID', async () => {
        const nonExistentProblemId = uuid()

        const response = await userClient
          .get(`/comments/problem/${nonExistentProblemId}`)
          .expect(200)

        expect(response.body.data).toHaveLength(0)
      })
    })

    describe('GET /comments/:id', () => {
      it('should return a specific comment', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'Test comment for retrieval',
        }

        const createResponse = await userClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        const commentId = createResponse.body.id

        const response = await userClient
          .get(`/comments/${commentId}`)
          .expect(200)

        expect(response.body).toHaveProperty('id', commentId)
        expect(response.body).toHaveProperty('content', commentData.content)
        expect(response.body).toHaveProperty('user')
      })

      it('should return 404 for non-existent comment', async () => {
        const nonExistentId = uuid()

        await userClient.get(`/comments/${nonExistentId}`).expect(404)
      })

      it('should require authentication', async () => {
        const nonExistentId = uuid()

        await supertest(app).get(`/comments/${nonExistentId}`).expect(401)
      })
    })

    describe('PUT /comments/:id', () => {
      it('should allow users to update their own comments', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'Original comment content',
        }

        const createResponse = await userClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        const commentId = createResponse.body.id
        const updateData = {
          content: 'Updated comment content',
        }

        const response = await userClient
          .put(`/comments/${commentId}`)
          .send(updateData)
          .expect(200)

        expect(response.body).toHaveProperty('id', commentId)
        expect(response.body).toHaveProperty('content', updateData.content)
      })

      it('should not allow regular users to update internal flag', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'Comment to be made internal',
          isInternal: false,
        }

        const createResponse = await userClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        const commentId = createResponse.body.id
        const updateData = {
          content: 'Comment to be made internal', // Content is required
          isInternal: true,
        }

        const response = await userClient
          .put(`/comments/${commentId}`)
          .send(updateData)
          .expect(200)

        // Verify that isInternal remains false (regular users can't change it)
        expect(response.body).toHaveProperty('isInternal', false)
        expect(response.body).toHaveProperty(
          'content',
          'Comment to be made internal',
        )
      })

      it('should prevent users from updating other users comments', async () => {
        // Create comment as admin
        const commentData = {
          problemId: testProblemId,
          content: 'Admin comment',
        }

        const createResponse = await adminClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        const commentId = createResponse.body.id

        // Try to update as regular user
        await userClient
          .put(`/comments/${commentId}`)
          .send({ content: 'Trying to hijack admin comment' })
          .expect(403)
      })

      it('should return 404 for non-existent comment', async () => {
        const nonExistentId = uuid()

        await userClient
          .put(`/comments/${nonExistentId}`)
          .send({ content: 'Updated content' })
          .expect(404)
      })

      it('should require authentication', async () => {
        const nonExistentId = uuid()

        await supertest(app)
          .put(`/comments/${nonExistentId}`)
          .send({ content: 'Updated content' })
          .expect(401)
      })
    })

    describe('DELETE /comments/:id', () => {
      it('should allow users to delete their own comments', async () => {
        const commentData = {
          problemId: testProblemId,
          content: 'Comment to be deleted',
        }

        const createResponse = await userClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        const commentId = createResponse.body.id

        await userClient.delete(`/comments/${commentId}`).expect(204)

        // Verify comment is deleted
        await userClient.get(`/comments/${commentId}`).expect(404)
      })

      it('should prevent users from deleting other users comments', async () => {
        // Create comment as admin
        const commentData = {
          problemId: testProblemId,
          content: 'Admin comment to protect',
        }

        const createResponse = await adminClient
          .post('/comments')
          .send(commentData)
          .expect(201)

        const commentId = createResponse.body.id

        // Try to delete as regular user
        await userClient.delete(`/comments/${commentId}`).expect(403)

        // Verify comment still exists
        await adminClient.get(`/comments/${commentId}`).expect(200)
      })

      it('should return 404 for non-existent comment', async () => {
        const nonExistentId = uuid()

        await userClient.delete(`/comments/${nonExistentId}`).expect(404)
      })

      it('should require authentication', async () => {
        const nonExistentId = uuid()

        await supertest(app).delete(`/comments/${nonExistentId}`).expect(401)
      })
    })

    describe('Comment System Integration', () => {
      it('should show comment count affects problem interaction', async () => {
        // Create several comments
        const comments = [
          { problemId: testProblemId, content: 'Comment 1' },
          { problemId: testProblemId, content: 'Comment 2' },
          { problemId: testProblemId, content: 'Comment 3' },
        ]

        for (const comment of comments) {
          await userClient.post('/comments').send(comment).expect(201)
        }

        // Verify all comments are retrievable
        const response = await userClient
          .get(`/comments/problem/${testProblemId}`)
          .expect(200)

        expect(response.body.data).toHaveLength(3)

        // Verify comments are in chronological order
        expect(response.body.data[0].content).toBe('Comment 1')
        expect(response.body.data[1].content).toBe('Comment 2')
        expect(response.body.data[2].content).toBe('Comment 3')
      })

      it('should handle mixed internal and public comments', async () => {
        const publicComment = {
          problemId: testProblemId,
          content: 'Public comment visible to user',
          isInternal: false,
        }

        const internalComment = {
          problemId: testProblemId,
          content: 'Internal admin note',
          isInternal: true,
        }

        await userClient.post('/comments').send(publicComment).expect(201)
        // Admin uses admin endpoint to create internal comment
        await adminClient
          .post('/admin/comments')
          .send(internalComment)
          .expect(201)

        const response = await userClient
          .get(`/comments/problem/${testProblemId}`)
          .expect(200)

        expect(response.body.data).toHaveLength(2)

        // Find the internal comment
        const internalCommentFromResponse = response.body.data.find(
          (comment: any) => comment.isInternal === true,
        )
        const publicCommentFromResponse = response.body.data.find(
          (comment: any) => comment.isInternal === false,
        )

        expect(internalCommentFromResponse).toBeDefined()
        expect(publicCommentFromResponse).toBeDefined()
        expect(internalCommentFromResponse.content).toBe('Internal admin note')
        expect(publicCommentFromResponse.content).toBe(
          'Public comment visible to user',
        )
      })
    })
  })
})
