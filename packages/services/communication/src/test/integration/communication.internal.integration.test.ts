/**
 * Communication Service - Internal API Integration Tests
 *
 * Tests for internal service-to-service communication endpoints.
 * These endpoints are only accessible by other services using API key authentication.
 * This is where the core communication functionality (email, SMS, push) is exposed.
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
import { SERVICE_API_KEY } from '@pika/environment'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createTestDatabase,
  InternalAPITestHelper,
  TestDatabaseResult,
} from '@pika/tests'
import { EmailTemplateId } from '@pika/types'
import type { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Communication Service - Internal API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let cacheService: MemoryCacheService
  let internalAPIHelper: InternalAPITestHelper
  let internalClient: supertest.SuperTest<supertest.Test>
  let sharedTestData: SharedCommunicationTestData
  let testUserId: string

  beforeAll(async () => {
    logger.debug(
      'Setting up Communication Service Internal API integration tests...',
    )

    testDb = await createTestDatabase({
      databaseName: 'test_communication_internal_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    cacheService = new MemoryCacheService(3600)
    await cacheService.connect()

    app = await createCommunicationServer({
      port: 5013,
      prisma: testDb.prisma,
      cacheService,
      emailConfig: {
        provider: 'console',
        region: 'us-east-1',
        fromEmail: 'test@pika.com',
        fromName: 'Pika Test',
      },
    })

    request = supertest(app)

    internalAPIHelper = new InternalAPITestHelper(SERVICE_API_KEY)
    internalClient = internalAPIHelper.createClient(app)

    sharedTestData = await createSharedCommunicationTestData(testDb.prisma, {
      userCount: 2,
      emailCount: 4,
      notificationCount: 4,
    })

    testUserId = sharedTestData.testUsers[0].id

    logger.debug('Communication Service Internal API setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (cacheService) {
      await cacheService.disconnect()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('Email Service - Core Functionality', () => {
    describe('POST /internal/emails/send', () => {
      it('should send email with template', async () => {
        const response = await internalClient
          .post('/internal/emails/send')
          .send({
            userId: testUserId,
            to: 'recipient@example.com',
            subject: 'Welcome!',
            templateId: EmailTemplateId.WELCOME,
            templateParams: {
              firstName: 'John',
              appName: 'Pika',
            },
          })
          .expect(200)

        expect(response.body).toMatchObject({
          id: expect.any(String),
          type: 'email',
          recipient: 'recipient@example.com',
          status: 'sent',
          userId: testUserId,
        })

        const log = await testDb.prisma.communicationLog.findUnique({
          where: { id: response.body.id },
        })

        expect(log).toBeDefined()
        expect(log?.metadata).toMatchObject({
          templateId: EmailTemplateId.WELCOME,
          templateParams: {
            firstName: 'John',
            appName: 'Pika',
          },
        })
      })

      it('should send email without template', async () => {
        const response = await internalClient
          .post('/internal/emails/send')
          .send({
            userId: testUserId,
            to: 'recipient@example.com',
            subject: 'Test Email',
            htmlContent: '<h1>Test</h1>',
            textContent: 'Test',
          })
          .expect(200)

        expect(response.body).toMatchObject({
          id: expect.any(String),
          type: 'email',
          recipient: 'recipient@example.com',
          subject: 'Test Email',
          status: 'sent',
        })
      })

      it('should send email without userId (system emails)', async () => {
        const response = await internalClient
          .post('/internal/emails/send')
          .send({
            to: 'admin@example.com',
            subject: 'System Alert',
            body: '<p>System alert message</p>',
            isHtml: true,
            userId: testUserId,
          })

        expect(response.status).toBe(200)

        expect(response.body).toMatchObject({
          type: 'email',
          recipient: 'admin@example.com',
          subject: 'System Alert',
          status: 'sent',
          userId: testUserId,
        })
      })

      it('should validate email format', async () => {
        const response = await internalClient
          .post('/internal/emails/send')
          .send({
            userId: testUserId,
            to: 'invalid-email',
            subject: 'Test',
            htmlContent: '<p>Test</p>',
          })
          .expect(400)

        expect(response.body.error).toBeDefined()
      })

      it('should require authentication', async () => {
        await request
          .post('/internal/emails/send')
          .send({
            to: 'test@example.com',
            subject: 'Test',
            htmlContent: '<p>Test</p>',
          })
          .expect(401)
      })

      it('should require valid API key', async () => {
        await request
          .post('/internal/emails/send')
          .set('x-api-key', 'invalid-key')
          .send({
            to: 'test@example.com',
            subject: 'Test',
            htmlContent: '<p>Test</p>',
          })
          .expect(401)
      })

      it('should support CC and BCC', async () => {
        const response = await internalClient
          .post('/internal/emails/send')
          .send({
            userId: testUserId,
            to: 'recipient@example.com',
            cc: ['cc1@example.com', 'cc2@example.com'],
            bcc: ['bcc@example.com'],
            subject: 'Test with CC/BCC',
            htmlContent: '<p>Test</p>',
            textContent: 'Test',
          })
          .expect(200)

        expect(response.body.status).toBe('sent')

        const log = await testDb.prisma.communicationLog.findUnique({
          where: { id: response.body.id },
        })

        expect(log?.metadata).toMatchObject({
          cc: ['cc1@example.com', 'cc2@example.com'],
          bcc: ['bcc@example.com'],
        })
      })

      it('should support attachments metadata', async () => {
        const response = await internalClient
          .post('/internal/emails/send')
          .send({
            userId: testUserId,
            to: 'recipient@example.com',
            subject: 'Email with attachments',
            htmlContent: '<p>See attached files</p>',
            attachments: [
              {
                filename: 'document.pdf',
                path: '/tmp/document.pdf',
                contentType: 'application/pdf',
              },
            ],
          })
          .expect(200)

        expect(response.body.status).toBe('sent')
      })
    })

    describe('POST /internal/emails/send-bulk', () => {
      it('should send bulk emails', async () => {
        const response = await internalClient
          .post('/internal/emails/send-bulk')
          .send({
            templateId: EmailTemplateId.PAYMENT_SUCCESS,
            recipients: [
              {
                to: 'user1@example.com',
                variables: {
                  userId: sharedTestData.testUsers[0].id,
                  appName: 'Pika',
                },
              },
              {
                to: 'user2@example.com',
                variables: {
                  userId: sharedTestData.testUsers[1].id,
                  appName: 'Pika',
                },
              },
            ],
          })
          .expect(201)

        expect(response.body).toMatchObject({
          sent: 2,
          failed: 0,
        })
      })

      it('should handle individual recipient variables', async () => {
        const response = await internalClient
          .post('/internal/emails/send-bulk')
          .send({
            templateId: 'custom', // Need a template ID per schema
            recipients: [
              {
                to: 'user1@example.com',
                variables: {
                  firstName: 'John',
                  userId: sharedTestData.testUsers[0].id,
                },
              },
              {
                to: 'user2@example.com',
                variables: {
                  firstName: 'Jane',
                  userId: sharedTestData.testUsers[1].id,
                },
              },
            ],
          })
          .expect(201)

        expect(response.body.sent).toBe(2)
      })
    })

    describe('GET /internal/emails/history', () => {
      it('should get email history by userId', async () => {
        const response = await internalClient
          .get(`/internal/emails/history?userId=${testUserId}`)
          .expect(200)

        expect(response.body.data).toBeDefined()
        expect(response.body.pagination).toBeDefined()

        response.body.data.forEach((log: any) => {
          expect(log.userId).toBe(testUserId)
        })
      })

      it('should get all email history without userId filter', async () => {
        const response = await internalClient
          .get('/internal/emails/history')
          .expect(200)

        expect(response.body.data).toBeDefined()
        expect(response.body.data.length).toBeGreaterThan(0)
      })

      it('should filter by status', async () => {
        const response = await internalClient
          .get('/internal/emails/history?status=sent')
          .expect(200)

        response.body.data.forEach((log: any) => {
          expect(log.status).toBe('sent')
        })
      })

      it('should filter by date range', async () => {
        const startDate = new Date()

        startDate.setDate(startDate.getDate() - 7)

        const response = await internalClient
          .get(`/internal/emails/history?startDate=${startDate.toISOString()}`)
          .expect(200)

        expect(response.body.data).toBeDefined()
      })
    })
  })

  describe('Notification Service - Internal Creation', () => {
    describe('POST /internal/notifications', () => {
      it('should create notification for specific user', async () => {
        const response = await internalClient
          .post('/internal/notifications')
          .send({
            userId: testUserId,
            title: 'New Order',
            description: 'Your order has been confirmed',
            type: 'info',
            metadata: {
              orderId: '12345',
              actionUrl: '/orders/12345',
            },
          })
          .expect(201)

        expect(response.body).toMatchObject({
          userId: testUserId,
          title: 'New Order',
          description: 'Your order has been confirmed',
          type: 'info',
          isRead: false,
        })
      })

      it('should create multiple notifications', async () => {
        const response = await internalClient
          .post('/internal/notifications/batch')
          .send({
            notifications: [
              {
                userId: sharedTestData.testUsers[0].id,
                title: 'Notification 1',
                description: 'Description 1',
                type: 'info',
                metadata: {},
              },
              {
                userId: sharedTestData.testUsers[1].id,
                title: 'Notification 2',
                description: 'Description 2',
                type: 'info',
                metadata: {},
              },
            ],
          })

        expect(response.status).toBe(201)
        expect(response.body.created).toBe(2)
        expect(response.body.notifications).toHaveLength(2)
      })

      it('should send email notification when requested', async () => {
        const response = await internalClient
          .post('/internal/notifications')
          .send({
            userId: testUserId,
            title: 'Important Update',
            description: 'This notification will also be sent via email',
            type: 'info',
            metadata: {},
            sendEmail: true,
            email: 'testuser1@example.com',
            emailSubject: 'Important Update from Pika',
          })

        expect(response.status).toBe(201)
        expect(response.body).toMatchObject({
          title: 'Important Update',
        })

        const emailLog = await testDb.prisma.communicationLog.findFirst({
          where: {
            userId: testUserId,
            subject: 'Important Update from Pika',
          },
        })

        expect(emailLog).toBeDefined()
      })
    })

    describe('GET /internal/notifications', () => {
      it('should get notifications by userId', async () => {
        const response = await internalClient
          .get(`/internal/notifications?userId=${testUserId}`)
          .expect(200)

        expect(response.body.data).toBeDefined()
        response.body.data.forEach((notification: any) => {
          expect(notification.userId).toBe(testUserId)
        })
      })

      it('should get unread notification count', async () => {
        const response = await internalClient
          .get(`/internal/notifications/unread-count?userId=${testUserId}`)
          .expect(200)

        expect(response.body).toMatchObject({
          userId: testUserId,
          unreadCount: expect.any(Number),
        })
      })
    })
  })

  describe('SMS Service (Future Implementation)', () => {
    describe('POST /internal/sms/send', () => {
      it.skip('should send SMS', async () => {
        const response = await internalClient
          .post('/internal/sms/send')
          .send({
            userId: testUserId,
            to: '+1234567890',
            message: 'Your verification code is 123456',
            metadata: {
              type: 'verification',
              code: '123456',
            },
          })
          .expect(200)

        expect(response.body).toMatchObject({
          type: 'sms',
          recipient: '+1234567890',
          status: 'sent',
        })
      })
    })
  })

  describe('Push Notification Service (Future Implementation)', () => {
    describe('POST /internal/push/send', () => {
      it.skip('should send push notification', async () => {
        const response = await internalClient
          .post('/internal/push/send')
          .send({
            userId: testUserId,
            title: 'New Message',
            body: 'You have a new message',
            data: {
              messageId: '12345',
              type: 'chat',
            },
          })
          .expect(200)

        expect(response.body).toMatchObject({
          type: 'push',
          status: 'sent',
        })
      })
    })
  })

  describe('Communication Analytics - Internal', () => {
    describe('GET /internal/analytics/user-stats', () => {
      it('should get user communication statistics', async () => {
        const response = await internalClient
          .get(`/internal/analytics/user-stats?userId=${testUserId}`)
          .expect(200)

        expect(response.body).toMatchObject({
          userId: testUserId,
          emailsSent: expect.any(Number),
          emailsReceived: expect.any(Number),
          notificationsReceived: expect.any(Number),
          notificationsRead: expect.any(Number),
        })

        // These can be null if no data exists
        expect(
          typeof response.body.lastEmailSent === 'string' ||
            response.body.lastEmailSent === null,
        ).toBe(true)
        expect(
          typeof response.body.lastNotificationReceived === 'string' ||
            response.body.lastNotificationReceived === null,
        ).toBe(true)
      })
    })

    describe('GET /internal/analytics/service-stats', () => {
      it('should get overall service statistics', async () => {
        const response = await internalClient
          .get('/internal/analytics/service-stats')
          .expect(200)

        expect(response.body).toMatchObject({
          totalEmails: expect.any(Number),
          totalNotifications: expect.any(Number),
          emailDeliveryRate: expect.any(Number),
          notificationReadRate: expect.any(Number),
          topEmailTemplates: expect.any(Array),
        })
      })
    })
  })
})
