/**
 * Communication Service - Admin API Integration Tests
 *
 * Tests for admin-only communication endpoints that require admin privileges.
 * These endpoints are used for global notifications and communication management.
 *
 * CURRENTLY EXCLUDED: Admin endpoints are not implemented yet, keeping tests for future implementation.
 */

import { vi } from 'vitest'

vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

vi.mock('../../services/providers/ProviderFactory.js', async () => {
  const { MockEmailProvider, MockSmsProvider } = await import(
    '../helpers/communicationTestHelpers.js'
  )

  class MockProviderFactory {
    async getEmailProvider() {
      return new MockEmailProvider()
    }

    async getSmsProvider() {
      return new MockSmsProvider()
    }
  }

  return {
    ProviderFactory: MockProviderFactory,
  }
})

import { createCommunicationServer } from '@communication/server.js'
import {
  createSharedCommunicationTestData,
  type SharedCommunicationTestData,
} from '@communication/test/helpers/communicationTestHelpers.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  TestDatabaseResult,
} from '@pika/tests'
import { EmailTemplateId } from '@pika/types'
import type { Express } from 'express'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe.skip('Communication Service - Admin API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let sharedTestData: SharedCommunicationTestData

  beforeAll(async () => {
    logger.info(
      'Setting up Communication Service Admin API integration tests...',
    )

    testDb = await createTestDatabase({
      databaseName: 'test_communication_admin_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    cacheService = new MemoryCacheService(3600)
    await cacheService.connect()

    app = await createCommunicationServer({
      port: 5012,
      prisma: testDb.prisma,
      cacheService,
      emailConfig: {
        provider: 'console',
        region: 'us-east-1',
        fromEmail: 'test@pika.com',
        fromName: 'Pika Test',
      },
    })

    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)

    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getUserClient(testDb.prisma)

    sharedTestData = await createSharedCommunicationTestData(testDb.prisma, {
      userCount: 3,
      emailCount: 6,
      notificationCount: 6,
    })

    logger.debug('Communication Service Admin API setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (authHelper) {
      authHelper.clearTokens()
    }

    if (cacheService) {
      await cacheService.disconnect()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('Global Notifications', () => {
    describe('POST /notifications/global', () => {
      it.skip('should create global notification (admin only)', async () => {
        const response = await adminClient
          .post('/notifications/global')
          .send({
            title: 'System Maintenance',
            description: 'System will be down for maintenance',
            type: 'inApp',
          })
          .expect(201)

        expect(response.body.count).toBeGreaterThan(0)

        const notifications = await testDb.prisma.notification.findMany({
          where: { title: 'System Maintenance' },
        })

        expect(notifications).toHaveLength(response.body.count)

        notifications.forEach((notification) => {
          expect(notification.title).toBe('System Maintenance')
          expect(notification.description).toBe(
            'System will be down for maintenance',
          )
          expect(notification.type).toBe('inApp')
          expect(notification.isRead).toBe(false)
        })
      })

      it('should require admin role', async () => {
        await customerClient
          .post('/notifications/global')
          .send({
            title: 'Test',
            description: 'Test',
            type: 'inApp',
          })
          .expect(403)
      })

      it.skip('should validate notification data', async () => {
        const response = await adminClient
          .post('/notifications/global')
          .send({
            title: '',
            description: 'Invalid notification',
          })
          .expect(400)

        expect(response.body.error).toBeDefined()
      })

      it.skip('should support metadata in global notifications', async () => {
        await adminClient
          .post('/notifications/global')
          .send({
            title: 'New Feature Released',
            description: 'Check out our new feature',
            type: 'inApp',
            metadata: {
              actionUrl: '/features/new',
              category: 'announcement',
              priority: 'high',
            },
          })
          .expect(201)

        const notification = await testDb.prisma.notification.findFirst({
          where: { title: 'New Feature Released' },
        })

        expect(notification?.metadata).toMatchObject({
          actionUrl: '/features/new',
          category: 'announcement',
          priority: 'high',
        })
      })
    })
  })

  describe('Bulk Email Operations', () => {
    describe('POST /emails/send-bulk', () => {
      it('should send bulk emails (admin only)', async () => {
        const response = await adminClient
          .post('/emails/send-bulk')
          .send({
            recipients: [
              { email: 'user1@example.com' },
              { email: 'user2@example.com' },
              { email: 'user3@example.com' },
            ],
            subject: 'Important Announcement',
            templateId: EmailTemplateId.WELCOME,
            globalVariables: {
              firstName: 'User',
              appName: 'Pika',
            },
          })
          .expect(201)

        expect(response.body).toMatchObject({
          sent: 3,
          failed: 0,
          total: 3,
          logs: expect.any(Array),
        })

        expect(response.body.logs).toHaveLength(3)
        response.body.logs.forEach((log: any) => {
          expect(log.status).toBe('sent')
          expect(log.type).toBe('email')
        })
      })

      it('should require admin role', async () => {
        await customerClient
          .post('/emails/send-bulk')
          .send({
            recipients: [{ email: 'user@example.com' }],
            subject: 'Bulk Test',
            templateId: EmailTemplateId.WELCOME,
            globalVariables: {},
          })
          .expect(403)
      })

      it('should handle partial failures in bulk send', async () => {
        const response = await adminClient
          .post('/emails/send-bulk')
          .send({
            recipients: [
              { email: 'valid@example.com' },
              { email: 'invalid-email' },
              { email: 'another@example.com' },
            ],
            subject: 'Bulk Test',
            htmlContent: '<p>Test</p>',
            textContent: 'Test',
          })
          .expect(201)

        expect(response.body.sent).toBe(2)
        expect(response.body.failed).toBe(1)
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0]).toMatchObject({
          email: 'invalid-email',
          error: expect.stringContaining('failed'),
        })
      })

      it('should support custom content per recipient', async () => {
        const response = await adminClient
          .post('/emails/send-bulk')
          .send({
            recipients: [
              {
                email: 'user1@example.com',
                variables: {
                  firstName: 'John',
                  customField: 'Value1',
                },
              },
              {
                email: 'user2@example.com',
                variables: {
                  firstName: 'Jane',
                  customField: 'Value2',
                },
              },
            ],
            subject: 'Personalized Email',
            htmlContent:
              '<p>Hello {{firstName}}, your custom field is {{customField}}</p>',
            textContent:
              'Hello {{firstName}}, your custom field is {{customField}}',
          })
          .expect(201)

        expect(response.body.sent).toBe(2)
        expect(response.body.failed).toBe(0)
      })
    })
  })

  describe('Communication Analytics', () => {
    describe('GET /emails/analytics', () => {
      it('should get email analytics (admin only)', async () => {
        const response = await adminClient.get('/emails/analytics').expect(200)

        expect(response.body).toMatchObject({
          total: expect.any(Number),
          sent: expect.any(Number),
          failed: expect.any(Number),
          delivered: expect.any(Number),
          bounced: expect.any(Number),
        })
      })

      it('should require admin role', async () => {
        await customerClient.get('/emails/analytics').expect(403)
      })

      it('should support date range filtering', async () => {
        const startDate = new Date()

        startDate.setDate(startDate.getDate() - 7)

        const response = await adminClient
          .get(
            `/emails/analytics?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`,
          )
          .expect(200)

        expect(response.body).toHaveProperty('total')
        expect(response.body).toHaveProperty('dateRange')
      })
    })

    describe('GET /notifications/analytics', () => {
      it('should get notification analytics (admin only)', async () => {
        const response = await adminClient
          .get('/notifications/analytics')
          .expect(200)

        expect(response.body).toMatchObject({
          total: expect.any(Number),
          read: expect.any(Number),
          unread: expect.any(Number),
          readRate: expect.any(Number),
        })
      })

      it('should require admin role', async () => {
        await customerClient.get('/notifications/analytics').expect(403)
      })
    })
  })

  describe('Communication Logs Management', () => {
    describe('GET /communications/logs', () => {
      it('should get all communication logs (admin only)', async () => {
        const response = await adminClient
          .get('/communications/logs')
          .expect(200)

        expect(response.body.data).toBeDefined()
        expect(response.body.pagination).toBeDefined()

        expect(response.body.data.length).toBeGreaterThan(0)
      })

      it('should require admin role', async () => {
        await customerClient.get('/communications/logs').expect(403)
      })

      it('should filter by type', async () => {
        const response = await adminClient
          .get('/communications/logs?type=email')
          .expect(200)

        response.body.data.forEach((log: any) => {
          expect(log.type).toBe('email')
        })
      })

      it('should filter by status', async () => {
        const response = await adminClient
          .get('/communications/logs?status=sent')
          .expect(200)

        response.body.data.forEach((log: any) => {
          expect(log.status).toBe('sent')
        })
      })

      it('should filter by user', async () => {
        const userId = sharedTestData.testUsers[0].id

        const response = await adminClient
          .get(`/communications/logs?userId=${userId}`)
          .expect(200)

        response.body.data.forEach((log: any) => {
          expect(log.userId).toBe(userId)
        })
      })

      it('should support pagination', async () => {
        const response = await adminClient
          .get('/communications/logs?page=1&limit=5')
          .expect(200)

        expect(response.body.data).toHaveLength(5)
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 5,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        })
      })
    })
  })
})
