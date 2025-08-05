/**
 * Communication Service - Public API Integration Tests
 *
 * Tests for public-facing notification endpoints that are accessible to authenticated users.
 * These endpoints allow users to manage their own notifications only.
 */

import { vi } from 'vitest'

vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import { createCommunicationServer } from '@communication/server.js'
import { createSharedCommunicationTestData } from '@communication/test/helpers/communicationTestHelpers.js'
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
import { UserRole, UserStatus } from '@pika/types'
import type { Express } from 'express'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Communication Service - Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let customerClient: AuthenticatedRequestClient
  let regularUserId: string

  beforeAll(async () => {
    logger.info(
      'Setting up Communication Service Public API integration tests...',
    )

    testDb = await createTestDatabase({
      databaseName: 'test_communication_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    cacheService = new MemoryCacheService(3600)
    await cacheService.connect()

    app = await createCommunicationServer({
      port: 5011,
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
    customerClient = await authHelper.getUserClient(testDb.prisma)

    const regularUser = await testDb.prisma.user.findFirst({
      where: { email: 'user@e2etest.com' },
    })

    regularUserId = regularUser!.id

    await createSharedCommunicationTestData(testDb.prisma, {
      userCount: 2,
      emailCount: 4,
      notificationCount: 4,
    })

    logger.debug('Communication Service Public API setup complete')
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

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await customerClient.get('/api/v1/health').expect(200)

      expect(response.body).toHaveProperty('status')
    })
  })

  describe('Notification Management', () => {
    describe('GET /notifications', () => {
      beforeEach(async () => {
        await testDb.prisma.notification.createMany({
          data: [
            {
              userId: regularUserId,
              title: 'Notification 1',
              description: 'Message 1',
              type: 'inApp',
              isRead: false,
            },
            {
              userId: regularUserId,
              title: 'Notification 2',
              description: 'Message 2',
              type: 'inApp',
              isRead: true,
              readAt: new Date(),
            },
          ],
        })
      })

      it('should get user notifications', async () => {
        const response = await customerClient.get('/notifications').expect(200)

        expect(response.body.data).toBeDefined()
        expect(response.body.pagination).toBeDefined()

        response.body.data.forEach((notification: any) => {
          expect(notification.userId).toBe(regularUserId)
        })
      })

      it('should filter by read status', async () => {
        const response = await customerClient
          .get('/notifications?isRead=false')
          .expect(200)

        response.body.data.forEach((notification: any) => {
          expect(notification.isRead).toBe(false)
        })
      })

      it('should support pagination', async () => {
        const response = await customerClient
          .get('/notifications?page=1&limit=1')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.pagination.page).toBe(1)
        expect(response.body.pagination.limit).toBe(1)
      })

      it('should sort by creation date', async () => {
        const response = await customerClient
          .get('/notifications?sortBy=createdAt&sortOrder=desc')
          .expect(200)

        const dates = response.body.data.map((n: any) =>
          new Date(n.createdAt).getTime(),
        )

        expect(dates).toEqual([...dates].sort((a, b) => b - a))
      })
    })

    describe('GET /notifications/:id', () => {
      it('should get notification by id', async () => {
        const notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            description: 'Test message',
            type: 'inApp',
            isRead: false,
          },
        })

        const response = await customerClient
          .get(`/notifications/${notification.id}`)
          .expect(200)

        expect(response.body).toMatchObject({
          id: notification.id,
          title: 'Test Notification',
          description: 'Test message',
        })
      })

      it('should mark as read when retrieving', async () => {
        const notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Unread Notification',
            description: 'This will be marked as read',
            type: 'inApp',
            isRead: false,
          },
        })

        await customerClient
          .get(`/notifications/${notification.id}`)
          .expect(200)

        const updated = await testDb.prisma.notification.findUnique({
          where: { id: notification.id },
        })

        expect(updated?.isRead).toBe(true)
        expect(updated?.readAt).toBeDefined()
      })

      it('should return 404 for non-existent notification', async () => {
        const fakeId = uuid()

        await customerClient.get(`/notifications/${fakeId}`).expect(404)
      })

      it('should not allow access to other users notifications', async () => {
        const otherUser = await testDb.prisma.user.create({
          data: {
            email: 'other@example.com',
            firstName: 'Other',
            lastName: 'User',
            emailVerified: true,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
          },
        })

        const notification = await testDb.prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: 'Other User Notification',
            description: 'Should not be accessible',
            type: 'inApp',
            isRead: false,
          },
        })

        await customerClient
          .get(`/notifications/${notification.id}`)
          .expect(403)
      })
    })

    describe('PUT /notifications/:id', () => {
      it('should update notification read status', async () => {
        const notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            description: 'Test message',
            type: 'inApp',
            isRead: false,
          },
        })

        const response = await customerClient
          .put(`/notifications/${notification.id}`)
          .send({
            isRead: true,
          })
          .expect(200)

        expect(response.body.isRead).toBe(true)
        expect(response.body.readAt).toBeDefined()
      })

      it('should not allow updating other users notifications', async () => {
        const otherUser = await testDb.prisma.user.create({
          data: {
            email: 'other2@example.com',
            firstName: 'Other',
            lastName: 'User',
            emailVerified: true,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
          },
        })

        const notification = await testDb.prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: 'Other User Notification',
            description: 'Should not be updatable',
            type: 'inApp',
            isRead: false,
          },
        })

        await customerClient
          .put(`/notifications/${notification.id}`)
          .send({
            isRead: true,
          })
          .expect(403)
      })
    })

    describe('PUT /notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        const notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            description: 'Test message',
            type: 'inApp',
            isRead: false,
          },
        })

        const response = await customerClient
          .put(`/notifications/${notification.id}/read`)
          .expect(200)

        expect(response.body.isRead).toBe(true)
        expect(response.body.readAt).toBeDefined()
      })

      it('should be idempotent', async () => {
        const notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            description: 'Test message',
            type: 'inApp',
            isRead: false,
          },
        })

        await customerClient
          .put(`/notifications/${notification.id}/read`)
          .expect(200)

        const response = await customerClient
          .put(`/notifications/${notification.id}/read`)
          .expect(200)

        expect(response.body.isRead).toBe(true)
      })
    })

    describe('PUT /notifications/read-all', () => {
      it('should mark all unread notifications as read', async () => {
        // Clean up existing notifications for this user to ensure test isolation
        await testDb.prisma.notification.deleteMany({
          where: { userId: regularUserId },
        })

        await testDb.prisma.notification.createMany({
          data: [
            {
              userId: regularUserId,
              title: 'Notification 1',
              description: 'Message 1',
              type: 'inApp',
              isRead: false,
            },
            {
              userId: regularUserId,
              title: 'Notification 2',
              description: 'Message 2',
              type: 'inApp',
              isRead: false,
            },
            {
              userId: regularUserId,
              title: 'Notification 3',
              description: 'Message 3',
              type: 'inApp',
              isRead: true,
              readAt: new Date(),
            },
          ],
        })

        const response = await customerClient
          .put('/notifications/read-all')
          .expect(200)

        expect(response.body.updated).toBe(2)

        const unreadCount = await testDb.prisma.notification.count({
          where: {
            userId: regularUserId,
            isRead: false,
          },
        })

        expect(unreadCount).toBe(0)
      })

      it('should only affect current users notifications', async () => {
        const otherUser = await testDb.prisma.user.create({
          data: {
            email: 'other3@example.com',
            firstName: 'Other',
            lastName: 'User',
            emailVerified: true,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
          },
        })

        await testDb.prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: 'Other User Notification',
            description: 'Should remain unread',
            type: 'inApp',
            isRead: false,
          },
        })

        await customerClient.put('/notifications/read-all').expect(200)

        const otherUserUnread = await testDb.prisma.notification.count({
          where: {
            userId: otherUser.id,
            isRead: false,
          },
        })

        expect(otherUserUnread).toBe(1)
      })
    })

    describe('DELETE /notifications/:id', () => {
      it('should delete notification', async () => {
        const notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            description: 'Test message',
            type: 'inApp',
            isRead: true,
            readAt: new Date(),
          },
        })

        await customerClient
          .delete(`/notifications/${notification.id}`)
          .expect(204)

        const deleted = await testDb.prisma.notification.findUnique({
          where: { id: notification.id },
        })

        expect(deleted).toBeNull()
      })

      it('should return 404 for non-existent notification', async () => {
        const fakeId = uuid()

        await customerClient.delete(`/notifications/${fakeId}`).expect(404)
      })

      it('should not allow deleting other users notifications', async () => {
        const otherUser = await testDb.prisma.user.create({
          data: {
            email: 'other4@example.com',
            firstName: 'Other',
            lastName: 'User',
            emailVerified: true,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
          },
        })

        const notification = await testDb.prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: 'Other User Notification',
            description: 'Should not be deletable',
            type: 'inApp',
            isRead: false,
          },
        })

        await customerClient
          .delete(`/notifications/${notification.id}`)
          .expect(403)
      })
    })
  })
})
