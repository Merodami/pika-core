import { CommunicationServiceClient } from '@pika/shared'

interface EmailRecord {
  to: string
  templateId: string
  templateParams: any
  sentAt: Date
}

export class CommunicationServiceClientMock extends CommunicationServiceClient {
  private sentEmails: EmailRecord[] = []

  constructor() {
    // Initialize with empty URL since we won't make HTTP calls
    super()
  }

  async sendEmail(data: {
    to: string
    templateId: string
    templateParams: any
  }): Promise<any> {
    // Record the email
    this.sentEmails.push({
      ...data,
      sentAt: new Date(),
    })

    // Return success response
    return {
      success: true,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  // Test helper methods
  getSentEmails(): EmailRecord[] {
    return [...this.sentEmails]
  }

  getEmailsSentTo(email: string): EmailRecord[] {
    return this.sentEmails.filter((record) => record.to === email)
  }

  getEmailsByTemplate(templateId: string): EmailRecord[] {
    return this.sentEmails.filter((record) => record.templateId === templateId)
  }

  clearSentEmails(): void {
    this.sentEmails = []
  }

  // Check if an email was sent
  wasEmailSent(to: string, templateId?: string): boolean {
    return this.sentEmails.some(
      (record) =>
        record.to === to && (!templateId || record.templateId === templateId),
    )
  }

  // Get the last email sent to a specific address
  getLastEmailTo(email: string): EmailRecord | undefined {
    const emails = this.getEmailsSentTo(email)

    return emails[emails.length - 1]
  }
}
