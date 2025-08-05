import { CommunicationServiceClient } from '@pika/shared'
import { vi } from 'vitest'

/**
 * Shared mock for CommunicationServiceClient used across integration tests
 */
export class CommunicationServiceClientMock
  implements Partial<CommunicationServiceClient>
{
  // Mock methods
  sendEmail = vi.fn()
  sendTransactionalEmail = vi.fn()
  sendSms = vi.fn()
  sendPushNotification = vi.fn()
  sendBulkEmail = vi.fn()

  /**
   * Configure mock for successful email sending
   */
  setupEmailSuccess() {
    this.sendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })
    this.sendTransactionalEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    })

    return this
  }

  /**
   * Configure mock for email failure
   */
  setupEmailFailure() {
    this.sendEmail.mockRejectedValue(new Error('Email service unavailable'))
    this.sendTransactionalEmail.mockRejectedValue(
      new Error('Email service unavailable'),
    )

    return this
  }

  /**
   * Reset all mocks
   */
  reset() {
    vi.clearAllMocks()

    return this
  }
}
