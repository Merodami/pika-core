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
  PrismaClient,
  ProblemPriority,
  ProblemStatus,
  ProblemType,
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
import request from 'supertest'
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

// ProblemPriority, ProblemStatus, ProblemType are imported from @prisma/client above
import { createSupportServer } from '../../../server.js'

// Test data seeding function for support tickets
async function seedTestData(
  prismaClient: PrismaClient,
): Promise<{ testUser: any; adminUser: any; tickets: any[] }> {
  logger.debug('Seeding test data for admin support tests...')

  // Get test users created by auth helper
  const testUser = await prismaClient.user.findFirst({
    where: { email: 'user@e2etest.com' },
  })

  const adminUser = await prismaClient.user.findFirst({
    where: { email: 'admin@e2etest.com' },
  })

  if (!testUser || !adminUser) {
    throw new Error('Test users not found')
  }

  // Create test tickets
  const tickets = await Promise.all([
    prismaClient.problem.create({
      data: {
        userId: testUser.id,
        title: 'Technical Issue - Login Problem',
        description: 'Cannot login to the application',
        status: ProblemStatus.open,
        priority: ProblemPriority.high,
        type: ProblemType.technical,
        ticketNumber: 'TKT-001',
        files: ['screenshot1.png', 'error-log.txt'],
      },
      include: {
        user: true,
        assignedUser: true,
      },
    }),
    prismaClient.problem.create({
      data: {
        userId: testUser.id,
        title: 'Billing Question',
        description: 'Charged twice for the same session',
        status: ProblemStatus.in_progress,
        priority: ProblemPriority.medium,
        type: ProblemType.billing,
        ticketNumber: 'TKT-002',
        assignedTo: adminUser.id,
      },
      include: {
        user: true,
        assignedUser: true,
      },
    }),
    prismaClient.problem.create({
      data: {
        userId: testUser.id,
        title: 'Feature Request',
        description: 'Add dark mode to the app',
        status: ProblemStatus.closed,
        priority: ProblemPriority.low,
        type: ProblemType.feature_request,
        ticketNumber: 'TKT-003',
        resolvedAt: new Date(),
      },
      include: {
        user: true,
        assignedUser: true,
      },
    }),
  ])

  logger.debug(`Created ${tickets.length} test tickets`)

  return { testUser, adminUser, tickets }
}

describe('Admin Support API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let userClient: AuthenticatedRequestClient
  let professionalClient: AuthenticatedRequestClient
  let testData: Awaited<ReturnType<typeof seedTestData>>

  const mockCacheService = new MemoryCacheService(3600)

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    await mockCacheService.connect()

    const server = await createSupportServer({
      port: 0,
      prisma: testDb.prisma,
      cacheService: mockCacheService,
    })

    app = server.app

    logger.debug('Express server ready for admin support testing.')

    // Initialize E2E Authentication Helper using the Express app
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)
    professionalClient = await authHelper.getProfessionalClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    // Use unified database cleanup
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }

    // Re-create test users after cleanup
    await authHelper.createAllTestUsers(testDb.prisma)

    // Re-authenticate users
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)
    professionalClient = await authHelper.getProfessionalClient(testDb.prisma)

    // Seed test data for each test
    testData = await seedTestData(testDb.prisma)
  })

  afterAll(async () => {
    logger.debug('Cleaning up admin support test resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    // Use unified cleanup
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Admin support test resources cleaned up.')
  })

  describe('GET /admin/support/tickets', () => {
    it('should return all tickets for admin users', async () => {
      const response = await adminClient.get('/admin/support/tickets')

      if (response.status !== 200) {
        console.error('Error response:', response.status, response.body)
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data).toHaveLength(3)

      // Verify ticket structure
      const ticket = response.body.data[0]

      expect(ticket).toHaveProperty('id')
      expect(ticket).toHaveProperty('ticketNumber')
      expect(ticket).toHaveProperty('userId')
      expect(ticket).toHaveProperty('userName')
      expect(ticket).toHaveProperty('userEmail')
      expect(ticket).toHaveProperty('title')
      expect(ticket).toHaveProperty('description')
      expect(ticket).toHaveProperty('type')
      expect(ticket).toHaveProperty('status')
      expect(ticket).toHaveProperty('priority')
      expect(ticket).toHaveProperty('files')
      expect(ticket).toHaveProperty('createdAt')
      expect(ticket).toHaveProperty('updatedAt')
    })

    it('should filter tickets by status', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ status: ProblemStatus.open })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe(ProblemStatus.open)
    })

    it('should filter tickets by priority', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ priority: ProblemPriority.high })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].priority).toBe(ProblemPriority.high)
    })

    it('should filter tickets by type', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ type: ProblemType.billing })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].type).toBe(ProblemType.billing)
    })

    it('should filter tickets by assignedTo', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ assignedTo: testData.adminUser.id })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].assignedTo).toBe(testData.adminUser.id)
    })

    it('should search tickets by title or description', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ search: 'Login Problem' })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].title).toContain('Login Problem')
    })

    it('should support pagination', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ page: 1, limit: 2 })
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
      expect(response.body.pagination.total).toBe(3)
      expect(response.body.pagination.totalPages).toBe(2)
      expect(response.body.pagination.hasNext).toBe(true)
    })

    it('should sort tickets by different fields', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ sortBy: 'priority', sortOrder: 'desc' })
        .expect(200)

      expect(response.body.data[0].priority).toBe(ProblemPriority.high)
      expect(response.body.data[2].priority).toBe(ProblemPriority.low)
    })

    it('should require admin authentication', async () => {
      // Regular user should not be able to access admin endpoint
      await userClient.get('/admin/support/tickets').expect(403)

      // Professional should also not have access
      await professionalClient.get('/admin/support/tickets').expect(403)
    })

    it('should require authentication', async () => {
      // Unauthenticated request should fail
      await request(app).get('/admin/support/tickets').expect(401)
    })
  })

  describe('GET /admin/support/tickets/:id', () => {
    it('should return ticket details for admin', async () => {
      const ticket = testData.tickets[0]

      const response = await adminClient
        .get(`/admin/support/tickets/${ticket.id}`)
        .query({ include: 'user,assignedUser' })
        .expect(200)

      expect(response.body.id).toBe(ticket.id)
      expect(response.body.ticketNumber).toBe(ticket.ticketNumber)
      expect(response.body.title).toBe(ticket.title)
      expect(response.body.userName).toBeTruthy()
      expect(response.body.userEmail).toBe(ticket.user.email)
      expect(response.body.files).toHaveLength(2)
    })

    it('should return 404 for non-existent ticket', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      await adminClient.get(`/admin/support/tickets/${fakeId}`).expect(404)
    })

    it('should require admin authentication', async () => {
      const ticket = testData.tickets[0]

      await userClient.get(`/admin/support/tickets/${ticket.id}`).expect(403)
    })
  })

  describe('PUT /admin/support/tickets/:id/status', () => {
    it('should update ticket status', async () => {
      const ticket = testData.tickets[0] // OPEN ticket

      const response = await adminClient
        .put(`/admin/support/tickets/${ticket.id}/status`)
        .send({
          status: ProblemStatus.in_progress,
          note: 'Starting work on this issue',
        })
        .expect(200)

      expect(response.body.status).toBe(ProblemStatus.in_progress)

      // Verify in database
      const updated = await testDb.prisma.problem.findUnique({
        where: { id: ticket.id },
      })

      expect(updated?.status).toBe(ProblemStatus.in_progress)
    })

    it('should set resolvedAt when status is RESOLVED', async () => {
      const ticket = testData.tickets[0]

      const response = await adminClient
        .put(`/admin/support/tickets/${ticket.id}/status`)
        .send({
          status: ProblemStatus.resolved,
        })
        .expect(200)

      expect(response.body.status).toBe(ProblemStatus.resolved)
      expect(response.body.resolvedAt).toBeTruthy()

      // Verify in database
      const updated = await testDb.prisma.problem.findUnique({
        where: { id: ticket.id },
      })

      expect(updated?.resolvedAt).toBeTruthy()
    })

    it('should clear resolvedAt when status changes from RESOLVED', async () => {
      const ticket = testData.tickets[2] // CLOSED ticket with resolvedAt

      const response = await adminClient
        .put(`/admin/support/tickets/${ticket.id}/status`)
        .send({
          status: ProblemStatus.open,
        })
        .expect(200)

      expect(response.body.status).toBe(ProblemStatus.open)
      expect(response.body.resolvedAt).toBeFalsy()
    })

    it('should require admin authentication', async () => {
      const ticket = testData.tickets[0]

      await userClient
        .put(`/admin/support/tickets/${ticket.id}/status`)
        .send({ status: ProblemStatus.in_progress })
        .expect(403)
    })

    it('should validate status value', async () => {
      const ticket = testData.tickets[0]

      await adminClient
        .put(`/admin/support/tickets/${ticket.id}/status`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400)
    })
  })

  describe('POST /admin/support/tickets/:id/assign', () => {
    it('should assign ticket to admin user', async () => {
      const ticket = testData.tickets[0] // Unassigned ticket
      const assigneeId = testData.adminUser.id

      const response = await adminClient
        .post(`/admin/support/tickets/${ticket.id}/assign`)
        .send({
          assigneeId,
          note: 'Taking ownership of this issue',
        })
        .expect(200)

      expect(response.body.id).toBe(ticket.id)

      // Verify in database
      const updated = await testDb.prisma.problem.findUnique({
        where: { id: ticket.id },
        include: { assignedUser: true },
      })

      expect(updated?.assignedTo).toBe(assigneeId)
      expect(updated?.assignedUser).toBeTruthy()
    })

    it('should allow updating priority when assigning', async () => {
      const ticket = testData.tickets[0]
      const assigneeId = testData.adminUser.id

      const response = await adminClient
        .post(`/admin/support/tickets/${ticket.id}/assign`)
        .send({
          assigneeId,
          priority: ProblemPriority.critical,
        })
        .expect(200)

      expect(response.body.id).toBe(ticket.id)
      expect(response.body.priority).toBe(ProblemPriority.critical)
    })

    it('should reassign already assigned ticket', async () => {
      const ticket = testData.tickets[1] // Already assigned
      const newAdmin = await testDb.prisma.user.create({
        data: {
          email: 'admin2@test.com',
          password: 'hashed',
          firstName: 'New',
          lastName: 'Admin',
          role: UserRole.ADMIN,
          emailVerified: true,
          phoneVerified: false,
          status: UserStatus.ACTIVE,
        },
      })

      await adminClient
        .post(`/admin/support/tickets/${ticket.id}/assign`)
        .send({
          assigneeId: newAdmin.id,
        })
        .expect(200)

      // Verify assignment in database since update responses don't include related data
      const updated = await testDb.prisma.problem.findUnique({
        where: { id: ticket.id },
      })

      expect(updated?.assignedTo).toBe(newAdmin.id)
    })

    it('should require admin authentication', async () => {
      const ticket = testData.tickets[0]

      await userClient
        .post(`/admin/support/tickets/${ticket.id}/assign`)
        .send({ assigneeId: testData.adminUser.id })
        .expect(403)
    })

    it('should validate assigneeId is a valid UUID', async () => {
      const ticket = testData.tickets[0]

      await adminClient
        .post(`/admin/support/tickets/${ticket.id}/assign`)
        .send({ assigneeId: 'invalid-uuid' })
        .expect(400)
    })

    it('should return 404 for non-existent ticket', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      await adminClient
        .post(`/admin/support/tickets/${fakeId}/assign`)
        .send({ assigneeId: testData.adminUser.id })
        .expect(404)
    })
  })

  describe('Admin ticket filtering combinations', () => {
    it('should filter by multiple parameters', async () => {
      // Create more tickets for complex filtering
      await testDb.prisma.problem.create({
        data: {
          userId: testData.testUser.id,
          title: 'Another Technical Issue',
          description: 'System crash',
          status: ProblemStatus.open,
          priority: ProblemPriority.high,
          type: ProblemType.technical,
          assignedTo: testData.adminUser.id,
        },
      })

      const response = await adminClient
        .get('/admin/support/tickets')
        .query({
          status: ProblemStatus.open,
          priority: ProblemPriority.high,
          type: ProblemType.technical,
          assignedTo: testData.adminUser.id,
        })
        .expect(200)

      expect(response.body.data).toHaveLength(1)

      const ticket = response.body.data[0]

      expect(ticket.status).toBe(ProblemStatus.open)
      expect(ticket.priority).toBe(ProblemPriority.high)
      expect(ticket.type).toBe(ProblemType.technical)
      expect(ticket.assignedTo).toBe(testData.adminUser.id)
    })

    it('should filter by userId', async () => {
      // Create ticket for different user
      const anotherUser = await testDb.prisma.user.create({
        data: {
          email: 'another@test.com',
          password: 'hashed',
          firstName: 'Another',
          lastName: 'User',
          role: UserRole.USER,
        },
      })

      await testDb.prisma.problem.create({
        data: {
          userId: anotherUser.id,
          title: 'Different User Issue',
          description: 'Issue from another user',
          status: ProblemStatus.open,
          priority: ProblemPriority.medium,
          type: ProblemType.general,
        },
      })

      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ userId: testData.testUser.id })
        .expect(200)

      expect(response.body.data).toHaveLength(3) // Original 3 tickets
      response.body.data.forEach((ticket: any) => {
        expect(ticket.userId).toBe(testData.testUser.id)
      })
    })

    it('should filter by ticketNumber', async () => {
      const response = await adminClient
        .get('/admin/support/tickets')
        .query({ ticketNumber: 'TKT-002' })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].ticketNumber).toBe('TKT-002')
    })
  })

  describe('GET /admin/problems', () => {
    it('should return paginated problems for admin users', async () => {
      const response = await adminClient.get('/admin/problems').expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3) // We created 3 problems in seedTestData
      expect(response.body.data[0]).toHaveProperty('id')
      expect(response.body.data[0]).toHaveProperty('title')
      expect(response.body.data[0]).toHaveProperty('description')
      expect(response.body.data[0]).toHaveProperty('status')
      expect(response.body.data[0]).toHaveProperty('priority')
    })

    it('should deny access for non-admin users', async () => {
      await userClient.get('/admin/problems').expect(403)
    })

    it('should filter problems by status', async () => {
      const response = await adminClient
        .get('/admin/problems')
        .query({ status: ProblemStatus.open })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe(ProblemStatus.open)
    })

    it('should filter problems by priority', async () => {
      const response = await adminClient
        .get('/admin/problems')
        .query({ priority: ProblemPriority.high })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].priority).toBe(ProblemPriority.high)
    })
  })

  describe('GET /admin/problems/:id', () => {
    it('should return a specific problem for admin users', async () => {
      const problemId = testData.tickets[0].id

      const response = await adminClient
        .get(`/admin/problems/${problemId}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', problemId)
      expect(response.body).toHaveProperty(
        'title',
        'Technical Issue - Login Problem',
      )
      expect(response.body).toHaveProperty('userName')
      expect(response.body).toHaveProperty('userEmail')
    })

    it('should return 404 for non-existent problem', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await adminClient.get(`/admin/problems/${nonExistentId}`).expect(404)
    })

    it('should deny access for non-admin users', async () => {
      const problemId = testData.tickets[0].id

      await userClient.get(`/admin/problems/${problemId}`).expect(403)
    })
  })

  describe('PUT /admin/problems/:id', () => {
    it('should update a problem for admin users', async () => {
      const problemId = testData.tickets[0].id

      const updateData = {
        status: ProblemStatus.resolved,
        priority: ProblemPriority.critical,
      }

      const response = await adminClient
        .put(`/admin/problems/${problemId}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('id', problemId)
      expect(response.body).toHaveProperty('status', ProblemStatus.resolved)
      expect(response.body).toHaveProperty('priority', ProblemPriority.critical)
      expect(response.body).toHaveProperty('resolvedAt')
      expect(response.body.resolvedAt).not.toBeNull()
    })

    it('should deny access for non-admin users', async () => {
      const problemId = testData.tickets[0].id

      await userClient
        .put(`/admin/problems/${problemId}`)
        .send({ status: ProblemStatus.resolved })
        .expect(403)
    })

    it('should return 404 for non-existent problem', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await adminClient
        .put(`/admin/problems/${nonExistentId}`)
        .send({ status: ProblemStatus.resolved })
        .expect(404)
    })
  })

  describe('DELETE /admin/problems/:id', () => {
    it('should delete a problem for admin users', async () => {
      const problemId = testData.tickets[0].id

      await adminClient.delete(`/admin/problems/${problemId}`).expect(204)

      // Verify problem is deleted
      await adminClient.get(`/admin/problems/${problemId}`).expect(404)
    })

    it('should deny access for non-admin users', async () => {
      const problemId = testData.tickets[0].id

      await userClient.delete(`/admin/problems/${problemId}`).expect(403)
    })

    it('should return 404 for non-existent problem', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      await adminClient.delete(`/admin/problems/${nonExistentId}`).expect(404)
    })
  })
})
