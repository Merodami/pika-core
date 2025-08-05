/**
 * Communication Service Test Helpers
 *
 * Shared test utilities and data factories for communication integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test communication logs with proper relationships
 * - Creates test notifications with various states
 * - Provides shared test data for efficient test execution
 * - Handles mock email/SMS provider setup
 */

import { EmailTemplateId, UserRole, UserStatus } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'

export interface CommunicationTestData {
  communicationLogs: any[]
  notifications: any[]
  users?: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedCommunicationTestData {
  // Users
  testUsers: any[]

  // Communication logs by type
  emailLogs: any[]
  sentEmails: any[]
  failedEmails: any[]

  // Notifications by state
  unreadNotifications: any[]
  readNotifications: any[]
  allNotifications: any[]

  // Quick access
  communicationLogById: Map<string, any>
  notificationById: Map<string, any>
}

export interface SeedCommunicationOptions {
  userCount?: number
  emailCount?: number
  notificationCount?: number
  includeFailedEmails?: boolean
  includeReadNotifications?: boolean
}

/**
 * Factory function to create test communication logs
 */
export async function seedTestCommunicationLogs(
  prismaClient: PrismaClient,
  userId: string,
  options: {
    count?: number
    includeFailures?: boolean
  } = {},
): Promise<any[]> {
  const { count = 3, includeFailures = true } = options

  const logs = []

  for (let i = 0; i < count; i++) {
    const status = includeFailures && i === count - 1 ? 'failed' : 'sent'

    const log = await prismaClient.communicationLog.create({
      data: {
        userId,
        type: 'email',
        status,
        recipient: `test${i + 1}@example.com`,
        subject: `Test Email ${i + 1}`,
        provider: 'mock',
        metadata: {
          body: `Content ${i + 1}`,
          templateId: i === 0 ? EmailTemplateId.WELCOME : undefined,
          ...(status === 'failed' ? { error: 'Failed to send' } : {}),
        },
        ...(status === 'failed' ? { errorMessage: 'Failed to send' } : {}),
        ...(status === 'sent' ? { sentAt: new Date() } : {}),
      },
    })

    logs.push(log)
  }

  return logs
}

/**
 * Factory function to create test notifications
 */
export async function seedTestNotifications(
  prismaClient: PrismaClient,
  userId: string,
  options: {
    count?: number
    includeRead?: boolean
  } = {},
): Promise<any[]> {
  const { count = 3, includeRead = true } = options

  const notifications = []

  for (let i = 0; i < count; i++) {
    const isRead = includeRead && i === count - 1

    const notification = await prismaClient.notification.create({
      data: {
        userId,
        type: 'inApp',
        title: `Notification ${i + 1}`,
        description: `Message ${i + 1}`,
        isRead,
        ...(isRead ? { readAt: new Date() } : {}),
        metadata: {
          category: i === 0 ? 'info' : 'alert',
          actionUrl: `/notifications/${i + 1}`,
        },
      },
    })

    notifications.push(notification)
  }

  return notifications
}

/**
 * Create comprehensive shared test data for all communication tests
 */
export async function createSharedCommunicationTestData(
  prismaClient: PrismaClient,
  options: SeedCommunicationOptions = {},
): Promise<SharedCommunicationTestData> {
  const {
    userCount = 2,
    emailCount = 4,
    notificationCount = 4,
    includeFailedEmails = true,
    includeReadNotifications = true,
  } = options

  // Create test users
  const testUsers: any[] = []

  for (let i = 0; i < userCount; i++) {
    const user = await prismaClient.user.create({
      data: {
        email: `testuser${i + 1}@example.com`,
        firstName: `Test${i + 1}`,
        lastName: 'User',
        emailVerified: true,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    })

    testUsers.push(user)
  }

  // Create communication logs
  const allEmailLogs: any[] = []

  for (const user of testUsers) {
    const userLogs = await seedTestCommunicationLogs(prismaClient, user.id, {
      count: Math.floor(emailCount / userCount),
      includeFailures: includeFailedEmails,
    })

    allEmailLogs.push(...userLogs)
  }

  // Create notifications
  const allNotifications: any[] = []

  for (const user of testUsers) {
    const userNotifications = await seedTestNotifications(
      prismaClient,
      user.id,
      {
        count: Math.floor(notificationCount / userCount),
        includeRead: includeReadNotifications,
      },
    )

    allNotifications.push(...userNotifications)
  }

  // Organize data for easy access
  const sentEmails = allEmailLogs.filter((log) => log.status === 'sent')
  const failedEmails = allEmailLogs.filter((log) => log.status === 'failed')
  const unreadNotifications = allNotifications.filter((n) => !n.isRead)
  const readNotifications = allNotifications.filter((n) => n.isRead)

  // Create lookup maps
  const communicationLogById = new Map(allEmailLogs.map((log) => [log.id, log]))
  const notificationById = new Map(allNotifications.map((n) => [n.id, n]))

  return {
    testUsers,
    emailLogs: allEmailLogs,
    sentEmails,
    failedEmails,
    unreadNotifications,
    readNotifications,
    allNotifications,
    communicationLogById,
    notificationById,
  }
}

/**
 * Mock Email Provider for testing
 */
export class MockEmailProvider {
  getProviderName(): string {
    return 'mock'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async sendEmail() {
    return {
      success: true,
      messageId: uuid(),
      provider: 'mock',
      timestamp: new Date(),
    }
  }

  async sendBulkEmail(data: any) {
    const results = []

    for (const recipient of data.recipients || data.to) {
      results.push({
        email: recipient.email || recipient,
        success: recipient.email?.includes('invalid') ? false : true,
        messageId: uuid(),
        provider: 'mock',
      })
    }

    return {
      results,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    }
  }
}

/**
 * Mock SMS Provider for testing
 */
export class MockSmsProvider {
  async sendSms() {
    return {
      id: uuid(),
      status: 'sent',
      provider: 'mock',
      timestamp: new Date(),
    }
  }
}
