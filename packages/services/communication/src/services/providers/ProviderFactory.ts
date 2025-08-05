import {
  EMAIL_PROVIDER_FALLBACK,
  EMAIL_PROVIDER_PRIMARY,
  IS_VERCEL,
  LOCALSTACK_ENDPOINT,
  NODE_ENV,
  RESEND_API_KEY,
  SMS_PROVIDER_PRIMARY,
  USE_LOCALSTACK,
} from '@pika/environment'
import { logger } from '@pika/shared'

import { AwsSesProvider } from './AwsSesProvider.js'
import { AwsSnsProvider } from './AwsSnsProvider.js'
import { ConsoleProvider } from './ConsoleProvider.js'
import { ConsoleSmsProvider } from './ConsoleSmsProvider.js'
import type { EmailProvider } from './EmailProvider.js'
import { MailHogProvider } from './MailHogProvider.js'
import { ResendProvider } from './ResendProvider.js'
import type { SmsProvider } from './SmsProvider.js'

export interface ProviderConfig {
  environment: 'development' | 'staging' | 'production' | 'test'
  email?: {
    primary?: 'aws-ses' | 'resend' | 'console' | 'mailhog'
    fallback?: 'aws-ses' | 'resend' | 'console' | 'mailhog'
    aws?: {
      region?: string
      accessKeyId?: string
      secretAccessKey?: string
      endpoint?: string // LocalStack endpoint
    }
    resend?: {
      apiKey?: string
    }
  }
  sms?: {
    primary?: 'aws-sns' | 'twilio' | 'console'
    aws?: {
      region?: string
      accessKeyId?: string
      secretAccessKey?: string
      endpoint?: string
      defaultSenderId?: string
    }
  }
}

export class ProviderFactory {
  private emailProviders: Map<string, EmailProvider> = new Map()
  private smsProviders: Map<string, SmsProvider> = new Map()
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize email providers based on environment
    if (NODE_ENV === 'development' || NODE_ENV === 'test') {
      // In development/test, use console provider and MailHog
      this.emailProviders.set('console', new ConsoleProvider())
      this.emailProviders.set('mailhog', new MailHogProvider())

      // But also initialize real providers if configured (for testing)
      if (USE_LOCALSTACK) {
        // LocalStack configuration
        this.emailProviders.set(
          'aws-ses',
          new AwsSesProvider({
            ...this.config.email?.aws,
            endpoint: LOCALSTACK_ENDPOINT,
          }),
        )
      }
    } else {
      // Production/Staging providers
      if (this.config.email?.aws) {
        this.emailProviders.set(
          'aws-ses',
          new AwsSesProvider(this.config.email.aws),
        )
      }

      if (RESEND_API_KEY) {
        this.emailProviders.set('resend', new ResendProvider(RESEND_API_KEY))
      }

      // Always have console as ultimate fallback
      this.emailProviders.set('console', new ConsoleProvider())
    }

    // Initialize SMS providers
    if (NODE_ENV === 'development' || NODE_ENV === 'test') {
      this.smsProviders.set('console-sms', new ConsoleSmsProvider())

      if (USE_LOCALSTACK) {
        // LocalStack configuration for SMS
        this.smsProviders.set(
          'aws-sns',
          new AwsSnsProvider({
            ...this.config.sms?.aws,
            endpoint: LOCALSTACK_ENDPOINT,
          }),
        )
      }
    } else {
      if (this.config.sms?.aws) {
        this.smsProviders.set(
          'aws-sns',
          new AwsSnsProvider(this.config.sms.aws),
        )
      }

      // Console SMS as fallback
      this.smsProviders.set('console-sms', new ConsoleSmsProvider())
    }
  }

  async getEmailProvider(): Promise<EmailProvider> {
    // Use environment constants for provider selection
    const primaryName = EMAIL_PROVIDER_PRIMARY
    const fallbackName = EMAIL_PROVIDER_FALLBACK

    // Try primary provider
    const primary = this.emailProviders.get(primaryName)

    if (primary && (await primary.isAvailable())) {
      logger.info('Using primary email provider', { provider: primaryName })

      return primary
    }

    // Try fallback provider
    const fallback = this.emailProviders.get(fallbackName)

    if (fallback && (await fallback.isAvailable())) {
      logger.warn('Primary email provider unavailable, using fallback', {
        primary: primaryName,
        fallback: fallbackName,
      })

      return fallback
    }

    // Ultimate fallback - console provider
    const console = this.emailProviders.get('console')

    if (console) {
      logger.warn('All email providers unavailable, using console', {
        attempted: [primaryName, fallbackName],
      })

      return console
    }

    throw new Error('No email providers available')
  }

  async getSmsProvider(): Promise<SmsProvider> {
    const primaryName = SMS_PROVIDER_PRIMARY

    // Try primary provider
    const primary = this.smsProviders.get(primaryName)

    if (primary && (await primary.isAvailable())) {
      logger.info('Using primary SMS provider', { provider: primaryName })

      return primary
    }

    // Fallback to console
    const console = this.smsProviders.get('console-sms')

    if (console) {
      logger.warn('Primary SMS provider unavailable, using console', {
        primary: primaryName,
      })

      return console
    }

    throw new Error('No SMS providers available')
  }

  private getDefaultEmailProvider(): string {
    switch (NODE_ENV) {
      case 'development':
      case 'test':
        return 'mailhog'
      case 'staging':
        // Prefer Resend for Vercel staging
        return IS_VERCEL ? 'resend' : 'aws-ses'
      case 'production':
        return 'aws-ses'
      default:
        return 'console'
    }
  }

  private getDefaultSmsProvider(): string {
    switch (NODE_ENV) {
      case 'development':
      case 'test':
        return 'console-sms'
      case 'staging':
      case 'production':
        return 'aws-sns'
      default:
        return 'console-sms'
    }
  }

  // Test helper methods
  async testEmailProvider(providerName: string): Promise<boolean> {
    const provider = this.emailProviders.get(providerName)

    if (!provider) {
      return false
    }

    return provider.isAvailable()
  }

  async testSmsProvider(providerName: string): Promise<boolean> {
    const provider = this.smsProviders.get(providerName)

    if (!provider) {
      return false
    }

    return provider.isAvailable()
  }

  getAvailableProviders(): {
    email: string[]
    sms: string[]
  } {
    return {
      email: Array.from(this.emailProviders.keys()),
      sms: Array.from(this.smsProviders.keys()),
    }
  }
}
