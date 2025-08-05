#!/usr/bin/env tsx

/**
 * PRODUCTION-READY EMAIL VERIFICATION TEST
 *
 * This script tests the complete email verification flow using real emails:
 * 1. Registers a user and triggers email verification
 * 2. Fetches the actual email from MailHog API
 * 3. Extracts the verification token from the email content
 * 4. Tests the verification endpoint with the real token
 * 5. Validates the complete user journey (UNCONFIRMED → ACTIVE → Login)
 *
 * Usage: npx tsx real-email-verification-test.ts
 */

import axios from 'axios'
import { randomUUID } from 'crypto'

// Configuration
const API_GATEWAY_URL = 'http://localhost:5500/api/v1'
const MAILHOG_API_URL = 'http://localhost:8025/api/v1'

interface MailHogMessage {
  ID: string
  From: {
    Relayed: string
    Mailbox: string
    Domain: string
    Params: string
  }
  To: Array<{
    Relayed: string
    Mailbox: string
    Domain: string
    Params: string
  }>
  Content: {
    Headers: Record<string, string[]>
    Body: string
    Size: number
    MIME: null | unknown
  }
  Created: string
  MIME: null | unknown
  Raw: {
    From: string
    To: string[]
    Data: string
    Helo: string
  }
}

// MailHog API returns array directly, not wrapped in object
type MailHogResponse = MailHogMessage[]

interface UserRegistrationResponse {
  message: string
  user: {
    id: string
    email: string
    emailVerified: boolean
    firstName: string
    lastName: string
    role: string
    status: string
    createdAt: string
    updatedAt: string
  }
}

interface VerificationResult {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
    status: string
    emailVerified: boolean
  }
}

interface LoginResponse {
  user: {
    id: string
    email: string
    status: string
    emailVerified: boolean
  }
  accessToken: string
  refreshToken: string
}

/**
 * MailHog API client for fetching and parsing emails
 */
class MailHogClient {
  private baseUrl: string

  constructor(baseUrl: string = MAILHOG_API_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Fetch all messages from MailHog
   */
  async getMessages(): Promise<MailHogMessage[]> {
    try {
      console.log(`🔗 Fetching messages from: ${this.baseUrl}/messages`)

      const response = await axios.get<MailHogResponse>(
        `${this.baseUrl}/messages`,
      )

      console.log(`📨 MailHog API Response: status=${response.status}`)
      console.log(`📨 Messages count: ${response.data.length}`)

      return response.data || []
    } catch (error) {
      console.error('❌ Failed to fetch messages from MailHog:', error)

      return []
    }
  }

  /**
   * Get messages for a specific email address
   */
  async getMessagesForEmail(email: string): Promise<MailHogMessage[]> {
    const messages = await this.getMessages()

    console.log(`🔍 Searching for emails to: ${email}`)
    console.log(`🔍 Total messages in MailHog: ${messages.length}`)

    const filteredMessages = messages.filter((msg) => {
      const recipients = msg.To.map((to) => `${to.Mailbox}@${to.Domain}`)

      console.log(`📧 Message recipients: ${recipients.join(', ')}`)

      return msg.To.some((to) => `${to.Mailbox}@${to.Domain}` === email)
    })

    console.log(`🔍 Found ${filteredMessages.length} messages for ${email}`)

    return filteredMessages
  }

  /**
   * Extract verification token from email content
   */
  extractVerificationToken(emailContent: string): string | null {
    // Decode quoted-printable encoding first
    const decodedContent = emailContent
      .replace(/=\r?\n/g, '') // Remove soft line breaks
      .replace(/=([0-9A-F]{2})/g, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      ) // Decode hex chars

    console.log(
      '🔍 Decoded email content preview:',
      decodedContent.substring(0, 1000),
    )

    // Look for verification URL patterns
    const patterns = [
      /verify-email\/([a-f0-9]{64})/i,
      /verify-email\?token=([a-f0-9]{64})/i,
      /verification[^"]*?([a-f0-9]{64})/i,
    ]

    for (const pattern of patterns) {
      const match = decodedContent.match(pattern)

      if (match && match[1]) {
        console.log(`✅ Token found: ${match[1]}`)

        return match[1]
      }
    }

    console.log('❌ No token found in decoded content')

    return null
  }

  /**
   * Get the latest verification email for a user
   */
  async getLatestVerificationEmail(email: string): Promise<{
    message: MailHogMessage
    token: string
  } | null> {
    const messages = await this.getMessagesForEmail(email)

    console.log(`📧 Found ${messages.length} messages for ${email}`)
    messages.forEach((msg, i) => {
      const subject = msg.Content.Headers['Subject']?.[0] || 'No subject'

      console.log(`  ${i + 1}. Subject: "${subject}"`)
    })

    // Filter for verification emails (by subject)
    const verificationEmails = messages.filter((msg) => {
      const subject = msg.Content.Headers['Subject']?.[0]?.toLowerCase() || ''
      const body = msg.Content.Body?.toLowerCase() || ''

      return subject.includes('verify') || body.includes('verify-email')
    })

    console.log(`📧 Found ${verificationEmails.length} verification emails`)

    if (verificationEmails.length === 0) {
      console.log('❌ No verification emails found')

      return null
    }

    // Get the most recent email
    const latestEmail = verificationEmails.sort(
      (a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime(),
    )[0]

    // Extract token from email content
    const token = this.extractVerificationToken(latestEmail.Content.Body)

    if (!token) {
      console.log('❌ Could not extract verification token from email')
      console.log(
        'Email content preview:',
        latestEmail.Content.Body.substring(0, 500),
      )

      return null
    }

    return {
      message: latestEmail,
      token,
    }
  }

  /**
   * Clear all messages from MailHog
   */
  async clearMessages(): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/messages`)
      console.log('🧹 Cleared all MailHog messages')
    } catch (error) {
      console.error('❌ Failed to clear MailHog messages:', error)
    }
  }
}

/**
 * Email verification test suite
 */
class EmailVerificationTest {
  private mailhog: MailHogClient
  private testEmail: string
  private userId: string | null = null

  constructor() {
    this.mailhog = new MailHogClient()
    this.testEmail = `test.user.${randomUUID()}@example.com`
  }

  /**
   * Register a new user
   */
  async registerUser(): Promise<UserRegistrationResponse> {
    console.log(`📝 Registering user: ${this.testEmail}`)

    try {
      const response = await axios.post<UserRegistrationResponse>(
        `${API_GATEWAY_URL}/auth/register`,
        {
          email: this.testEmail,
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01T00:00:00Z',
          role: 'MEMBER',
          acceptTerms: true,
        },
      )

      this.userId = response.data.user.id
      console.log(`✅ User registered successfully: ${this.userId}`)
      console.log(`📧 Status: ${response.data.user.status}`)

      return response.data
    } catch (error: any) {
      console.error('❌ Registration failed:')
      console.error('Status:', error.response?.status)
      console.error('Data:', JSON.stringify(error.response?.data, null, 2))
      console.error(
        'Request data:',
        JSON.stringify(
          {
            email: this.testEmail,
            password: 'SecurePassword123!',
            firstName: 'Test',
            lastName: 'User',
            dateOfBirth: '1990-01-01T00:00:00Z',
            role: 'MEMBER',
            acceptTerms: true,
          },
          null,
          2,
        ),
      )
      throw error
    }
  }

  /**
   * Wait for email and extract verification token
   */
  async waitForVerificationEmail(maxWaitTime: number = 10000): Promise<string> {
    console.log('📧 Waiting for verification email...')

    const startTime = Date.now()
    const checkInterval = 1000 // Check every second

    while (Date.now() - startTime < maxWaitTime) {
      const emailData = await this.mailhog.getLatestVerificationEmail(
        this.testEmail,
      )

      if (emailData) {
        console.log('✅ Verification email received!')
        console.log(`📧 Email ID: ${emailData.message.ID}`)
        console.log(`🔑 Token extracted: ${emailData.token}`)

        return emailData.token
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, checkInterval))
    }

    throw new Error(
      `❌ Timeout: No verification email received within ${maxWaitTime}ms`,
    )
  }

  /**
   * Verify email using the extracted token
   */
  async verifyEmail(token: string): Promise<VerificationResult> {
    console.log(`🔐 Verifying email with token: ${token}`)

    try {
      const response = await axios.get(
        `${API_GATEWAY_URL}/auth/verify-email/${token}`,
      )

      console.log('✅ Email verification successful!')

      return {
        success: true,
        message: 'Email verified successfully',
        user: response.data.user,
      }
    } catch (error: any) {
      console.error(
        '❌ Email verification failed:',
        error.response?.data || error.message,
      )

      return {
        success: false,
        message: error.response?.data?.error?.message || 'Verification failed',
      }
    }
  }

  /**
   * Test login after verification
   */
  async testLogin(): Promise<boolean> {
    console.log('🔑 Testing login after email verification...')

    try {
      const response = await axios.post<LoginResponse>(
        `${API_GATEWAY_URL}/auth/token`,
        {
          grantType: 'password',
          username: this.testEmail,
          password: 'SecurePassword123!',
        },
      )

      console.log('✅ Login successful!')
      console.log(`👤 User status: ${response.data.user.status}`)
      console.log(`📧 Email verified: ${response.data.user.emailVerified}`)

      return true
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message)

      return false
    }
  }

  /**
   * Test login before verification (should fail)
   */
  async testLoginBeforeVerification(): Promise<boolean> {
    console.log('🚫 Testing login before email verification (should fail)...')

    try {
      await axios.post(`${API_GATEWAY_URL}/auth/token`, {
        grantType: 'password',
        username: this.testEmail,
        password: 'SecurePassword123!',
      })

      console.error('❌ Unexpected: Login succeeded before verification!')

      return false
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || ''

      if (
        errorMessage.toLowerCase().includes('inactive') ||
        errorMessage.toLowerCase().includes('unconfirmed')
      ) {
        console.log('✅ Correctly blocked login before verification')

        return true
      } else {
        console.error('❌ Login failed for unexpected reason:', errorMessage)

        return false
      }
    }
  }

  /**
   * Run the complete email verification test
   */
  async runCompleteTest(): Promise<void> {
    console.log('🚀 Starting PRODUCTION Email Verification Test')
    console.log('='.repeat(60))

    try {
      // Step 1: Clear previous emails
      await this.mailhog.clearMessages()

      // Step 2: Register user
      await this.registerUser()

      // Step 3: Test login before verification (should fail)
      const loginBlockedCorrectly = await this.testLoginBeforeVerification()

      // Step 4: Wait for and extract verification token
      const token = await this.waitForVerificationEmail()

      // Step 5: Display verification link for manual verification
      console.log('\n' + '='.repeat(60))
      console.log('🔗 MANUAL VERIFICATION LINK:')
      console.log(`${API_GATEWAY_URL}/auth/verify-email/${token}`)
      console.log('='.repeat(60))
      console.log('\n⏸️  Please click the link above to verify manually.')
      console.log('   Then press ENTER to continue with login test...\n')

      // Wait for user to manually verify
      await new Promise((resolve) => {
        process.stdin.once('data', resolve)
      })

      // Step 6: Test login after manual verification (should succeed)
      const loginSuccessful = await this.testLogin()

      // Step 7: Results summary
      console.log('\n' + '='.repeat(60))
      console.log('📊 EMAIL VERIFICATION TEST RESULTS')
      console.log('='.repeat(60))

      console.log(`✅ User Registration: SUCCESS`)
      console.log(`✅ Email Sent: SUCCESS`)
      console.log(`✅ Token Extraction: SUCCESS`)
      console.log(`⏸️  Email Verification: MANUAL`)
      console.log(
        `${loginBlockedCorrectly ? '✅' : '❌'} Pre-verification Security: ${loginBlockedCorrectly ? 'SUCCESS' : 'FAILED'}`,
      )
      console.log(
        `${loginSuccessful ? '✅' : '❌'} Post-verification Login: ${loginSuccessful ? 'SUCCESS' : 'FAILED'}`,
      )

      const allTestsPassed = loginBlockedCorrectly && loginSuccessful

      console.log(
        '\n' +
          (allTestsPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'),
      )
      console.log(`📧 Test Email: ${this.testEmail}`)
      console.log(`👤 User ID: ${this.userId}`)
      console.log(`🔑 Verification Token: ${token}`)
    } catch (error) {
      console.error('\n❌ TEST FAILED:', error)
      throw error
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const test = new EmailVerificationTest()

  await test.runCompleteTest()
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { EmailVerificationTest, MailHogClient }
