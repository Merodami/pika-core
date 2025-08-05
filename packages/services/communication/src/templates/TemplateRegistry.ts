import { FRONTEND_URL } from '@pika/environment'
import { logger } from '@pika/shared'
import { EmailTemplateId, TemplateCategory } from '@pika/types'
import fs from 'fs/promises'
import Handlebars from 'handlebars'
import { get, has } from 'lodash-es'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Type alias for backward compatibility
 * @deprecated Use EmailTemplateId from @pikaypes instead
 */
export type TemplateKey = EmailTemplateId

/**
 * Template metadata
 */
export interface TemplateMetadata {
  key: EmailTemplateId
  category: TemplateCategory
  filePath: string
  subject: string
  description: string
  requiredVariables: string[]
  optionalVariables?: string[]
}

/**
 * Compiled template with content
 */
export interface CompiledTemplate {
  metadata: TemplateMetadata
  subjectTemplate: HandlebarsTemplateDelegate
  bodyTemplate: HandlebarsTemplateDelegate
}

/**
 * Template registry mapping template keys to file paths and metadata
 */
export const TEMPLATE_REGISTRY: Record<EmailTemplateId, TemplateMetadata> = {
  [EmailTemplateId.EMAIL_VERIFICATION]: {
    key: EmailTemplateId.EMAIL_VERIFICATION,
    category: TemplateCategory.AUTH,
    filePath: 'auth/email-verification.hbs',
    subject: 'Verify your email address - Pika',
    description: 'Email verification for new user registration',
    requiredVariables: ['firstName', 'verificationUrl'],
    optionalVariables: ['frontendUrl'],
  },

  [EmailTemplateId.PASSWORD_RESET]: {
    key: EmailTemplateId.PASSWORD_RESET,
    category: TemplateCategory.AUTH,
    filePath: 'auth/password-reset.hbs',
    subject: 'Reset your password - Pika',
    description: 'Password reset instructions',
    requiredVariables: ['firstName', 'resetLink', 'expirationHours'],
  },

  [EmailTemplateId.PASSWORD_RESET_CONFIRMATION]: {
    key: EmailTemplateId.PASSWORD_RESET_CONFIRMATION,
    category: TemplateCategory.AUTH,
    filePath: 'auth/password-reset-confirmation.hbs',
    subject: 'Password reset confirmed - Pika',
    description: 'Password reset confirmation',
    requiredVariables: ['firstName'],
  },

  [EmailTemplateId.WELCOME]: {
    key: EmailTemplateId.WELCOME,
    category: TemplateCategory.AUTH,
    filePath: 'auth/welcome.hbs',
    subject: 'Welcome to Pika! Your account is ready',
    description: 'Welcome message after email verification',
    requiredVariables: ['firstName'],
    optionalVariables: ['frontendUrl'],
  },

  [EmailTemplateId.BOOKING_CONFIRMATION]: {
    key: EmailTemplateId.BOOKING_CONFIRMATION,
    category: TemplateCategory.BOOKING,
    filePath: 'booking/confirmation.hbs',
    subject: 'Booking Confirmed - {{sessionType}} with {{trainerName}}',
    description: 'Booking confirmation notification',
    requiredVariables: [
      'firstName',
      'sessionType',
      'trainerName',
      'sessionDate',
      'sessionTime',
    ],
  },

  [EmailTemplateId.BOOKING_REMINDER]: {
    key: EmailTemplateId.BOOKING_REMINDER,
    category: TemplateCategory.BOOKING,
    filePath: 'booking/reminder.hbs',
    subject: 'Reminder: {{sessionType}} session tomorrow',
    description: 'Session reminder notification',
    requiredVariables: [
      'firstName',
      'sessionType',
      'trainerName',
      'sessionDate',
      'sessionTime',
    ],
  },

  [EmailTemplateId.BOOKING_CANCELLED]: {
    key: EmailTemplateId.BOOKING_CANCELLED,
    category: TemplateCategory.BOOKING,
    filePath: 'booking/cancelled.hbs',
    subject: 'Session Cancelled - {{sessionType}} with {{trainerName}}',
    description: 'Session cancellation notification',
    requiredVariables: [
      'firstName',
      'sessionType',
      'trainerName',
      'sessionDate',
      'cancellationReason',
    ],
  },

  [EmailTemplateId.PAYMENT_SUCCESS]: {
    key: EmailTemplateId.PAYMENT_SUCCESS,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/success.hbs',
    subject: 'Payment Confirmed - Pika',
    description: 'Payment success confirmation',
    requiredVariables: ['firstName', 'amount', 'transactionId'],
  },

  [EmailTemplateId.PAYMENT_FAILED]: {
    key: EmailTemplateId.PAYMENT_FAILED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/failed.hbs',
    subject: 'Payment Failed - Pika',
    description: 'Payment failure notification',
    requiredVariables: ['firstName', 'amount', 'failureReason'],
  },

  [EmailTemplateId.SUBSCRIPTION_ACTIVATED]: {
    key: EmailTemplateId.SUBSCRIPTION_ACTIVATED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-activated.hbs',
    subject: 'Subscription Activated - Welcome to Pika Pro!',
    description: 'Subscription activation confirmation',
    requiredVariables: ['firstName', 'planName', 'nextBillingDate'],
  },

  [EmailTemplateId.SUBSCRIPTION_EXPIRING]: {
    key: EmailTemplateId.SUBSCRIPTION_EXPIRING,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-expiring.hbs',
    subject: 'Your Pika subscription expires soon',
    description: 'Subscription expiration warning',
    requiredVariables: ['firstName', 'planName', 'expirationDate'],
  },

  [EmailTemplateId.SUBSCRIPTION_EXPIRED]: {
    key: EmailTemplateId.SUBSCRIPTION_EXPIRED,
    category: TemplateCategory.PAYMENT,
    filePath: 'payment/subscription-expired.hbs',
    subject: 'Your Pika subscription has expired',
    description: 'Subscription expired notification',
    requiredVariables: ['firstName', 'planName', 'renewalUrl'],
  },

  [EmailTemplateId.ACCOUNT_BANNED]: {
    key: EmailTemplateId.ACCOUNT_BANNED,
    category: TemplateCategory.SYSTEM,
    filePath: 'system/account-banned.hbs',
    subject: 'Account Suspended',
    description: 'Account suspension notification',
    requiredVariables: ['reason'],
    optionalVariables: ['duration'],
  },

  [EmailTemplateId.ACCOUNT_UNBANNED]: {
    key: EmailTemplateId.ACCOUNT_UNBANNED,
    category: TemplateCategory.SYSTEM,
    filePath: 'system/account-unbanned.hbs',
    subject: 'Account Reinstated',
    description: 'Account reinstatement notification',
    requiredVariables: ['reason'],
  },
}

/**
 * File-based template service
 * Loads and compiles Handlebars templates from the file system
 */
export class TemplateService {
  private readonly templatesPath: string
  private readonly templateCache = new Map<EmailTemplateId, CompiledTemplate>()
  private layoutTemplate: HandlebarsTemplateDelegate | null = null

  constructor() {
    this.templatesPath = path.join(__dirname)
    this.registerHelpers()
  }

  /**
   * Register Handlebars helpers for common formatting
   */
  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return ''

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date))
    })

    // Currency formatting helper
    Handlebars.registerHelper(
      'formatCurrency',
      (amount: number, currency = 'USD') => {
        if (typeof amount !== 'number') return ''

        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount / 100) // Assuming amount is in cents
      },
    )

    // Capitalize helper
    Handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return ''

      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    })

    // Current year helper
    Handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear()
    })
  }

  /**
   * Load and compile a template by key
   */
  async getTemplate(templateKey: EmailTemplateId): Promise<CompiledTemplate> {
    // Check cache first
    if (this.templateCache.has(templateKey)) {
      return this.templateCache.get(templateKey)!
    }

    const metadata = has(TEMPLATE_REGISTRY, templateKey)
      ? get(TEMPLATE_REGISTRY, templateKey)
      : undefined

    if (!metadata) {
      throw new Error(`Template not found: ${templateKey}`)
    }

    try {
      // Load template content - validate path is within templates directory
      const templatePath = path.resolve(this.templatesPath, metadata.filePath)
      const normalizedTemplatesPath = path.resolve(this.templatesPath)

      if (!templatePath.startsWith(normalizedTemplatesPath)) {
        throw new Error(`Invalid template path: ${metadata.filePath}`)
      }

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const templateContent = await fs.readFile(templatePath, 'utf-8')

      // Load layout template if not already loaded
      if (!this.layoutTemplate) {
        const layoutPath = path.resolve(this.templatesPath, 'shared/layout.hbs')
        const normalizedLayoutTemplatesPath = path.resolve(this.templatesPath)

        if (!layoutPath.startsWith(normalizedLayoutTemplatesPath)) {
          throw new Error('Invalid layout template path')
        }

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const layoutContent = await fs.readFile(layoutPath, 'utf-8')

        this.layoutTemplate = Handlebars.compile(layoutContent)
      }

      // Compile templates
      const subjectTemplate = Handlebars.compile(metadata.subject)
      const bodyContentTemplate = Handlebars.compile(templateContent)

      // Create wrapper template that combines content with layout
      const bodyTemplate = (variables: any) => {
        const bodyContent = bodyContentTemplate(variables)

        return this.layoutTemplate!({
          ...variables,
          body: bodyContent,
          subject: metadata.subject,
          recipientEmail: variables.recipientEmail || variables.to,
          frontendUrl: variables.frontendUrl || FRONTEND_URL,
          unsubscribeUrl:
            variables.unsubscribeUrl || `${FRONTEND_URL}/unsubscribe`,
          currentYear: new Date().getFullYear(),
        })
      }

      const compiledTemplate: CompiledTemplate = {
        metadata,
        subjectTemplate,
        bodyTemplate,
      }

      // Cache the compiled template
      this.templateCache.set(templateKey, compiledTemplate)

      logger.info('Template compiled and cached', {
        templateKey,
        filePath: metadata.filePath,
      })

      return compiledTemplate
    } catch (error) {
      logger.error('Failed to load template', error, {
        templateKey,
        filePath: metadata.filePath,
      })
      throw new Error(
        `Failed to load template ${templateKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(
    templateKey: EmailTemplateId,
    variables: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplate(templateKey)

    // Validate required variables
    const missingVariables = template.metadata.requiredVariables.filter(
      (variable) =>
        !has(variables, variable) ||
        get(variables, variable) === undefined ||
        get(variables, variable) === null,
    )

    if (missingVariables.length > 0) {
      throw new Error(
        `Missing required variables for template ${templateKey}: ${missingVariables.join(', ')}`,
      )
    }

    try {
      const subject = template.subjectTemplate(variables)
      const body = template.bodyTemplate(variables)

      return { subject, body }
    } catch (error) {
      logger.error('Failed to render template', error, {
        templateKey,
        variables: Object.keys(variables),
      })
      throw new Error(
        `Failed to render template ${templateKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): TemplateMetadata[] {
    return Object.values(TEMPLATE_REGISTRY)
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): TemplateMetadata[] {
    return Object.values(TEMPLATE_REGISTRY).filter(
      (template) => template.category === category,
    )
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.templateCache.clear()
    this.layoutTemplate = null
    logger.info('Template cache cleared')
  }

  /**
   * Validate template variables without rendering
   */
  validateTemplateVariables(
    templateKey: EmailTemplateId,
    variables: Record<string, unknown>,
  ): { valid: boolean; missingVariables: string[] } {
    const metadata = has(TEMPLATE_REGISTRY, templateKey)
      ? get(TEMPLATE_REGISTRY, templateKey)
      : undefined

    if (!metadata) {
      throw new Error(`Template not found: ${templateKey}`)
    }

    const missingVariables = metadata.requiredVariables.filter(
      (variable) =>
        !has(variables, variable) ||
        get(variables, variable) === undefined ||
        get(variables, variable) === null,
    )

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    }
  }
}
