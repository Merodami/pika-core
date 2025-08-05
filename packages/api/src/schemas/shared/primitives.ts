import { z } from 'zod'

/**
 * Common primitive schemas with Zod
 * Includes transforms, refinements, and custom error messages
 */

// ============= Basic Types =============

/**
 * UUID v4 - Generic UUID without branding
 */
export const UUID = z
  .string()
  .uuid({ message: 'Must be a valid UUID' })
  .describe('Universally Unique Identifier')

/**
 * DateTime - ISO 8601 string that can be parsed to Date
 * Used for request inputs where we want Date objects
 */
export const DateTime = z
  .string()
  .datetime({ offset: true, message: 'Must be a valid ISO 8601 datetime' })
  .transform((str) => new Date(str))
  .describe('ISO 8601 datetime with timezone')

/**
 * DateTimeString - ISO 8601 string without transformation
 * Used for API responses to maintain string format
 */
export const DateTimeString = z
  .string()
  .datetime({ offset: true, message: 'Must be a valid ISO 8601 datetime' })
  .describe('ISO 8601 datetime string with timezone')

/**
 * DateOnly - Date in YYYY-MM-DD format
 */
export const DateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be in YYYY-MM-DD format' })
  .refine(
    (date) => {
      const parsed = new Date(date)

      return !isNaN(parsed.getTime())
    },
    { message: 'Must be a valid date' },
  )
  .transform((str) => new Date(str))
  .describe('Date in YYYY-MM-DD format')

/**
 * DateOnlyString - Date in YYYY-MM-DD format (no transformation)
 */
export const DateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be in YYYY-MM-DD format' })
  .refine(
    (date) => {
      const parsed = new Date(date)

      return !isNaN(parsed.getTime())
    },
    { message: 'Must be a valid date' },
  )
  .describe('Date string in YYYY-MM-DD format')

/**
 * TimeOnly - Time in HH:MM or HH:MM:SS format
 */
export const TimeOnly = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'Must be in HH:MM or HH:MM:SS format',
  })
  .describe('Time in 24-hour format')

/**
 * Email - Basic email validation (use branded Email for domain objects)
 */
export const EmailString = z
  .string()
  .min(1, 'Email is required')
  .email({ message: 'Must be a valid email address' })
  .transform((email) => email.toLowerCase().trim())
  .describe('Email address')

/**
 * Phone Number - E.164 format with optional extension
 */
export const PhoneNumber = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, {
    message: 'Must be in E.164 format (e.g., +1234567890)',
  })
  .describe('Phone number in E.164 format')

/**
 * Password - Basic validation for general users
 * Based on NIST 800-63B: favor length over complexity
 */
export const Password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine((password) => {
    // Prevent the most common weak passwords
    const commonWeakPasswords = [
      'password',
      'password1',
      'password123',
      '12345678',
      'qwerty123',
      'admin123',
      'letmein',
      'welcome123',
    ]

    return !commonWeakPasswords.includes(password.toLowerCase())
  }, 'This password is too common. Please choose a more unique password')
  .refine(
    (password) =>
      password.length >= 12 || /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
    'Passwords under 12 characters must contain lowercase, uppercase, and numbers',
  )
  .describe('Password with modern security requirements - longer is better')

/**
 * SecurePassword - Enhanced validation for admin/business users
 * Requires stronger complexity for sensitive accounts
 */
export const SecurePassword = z
  .string()
  .min(
    12,
    'Password must be at least 12 characters for admin/business accounts',
  )
  .max(128, 'Password must not exceed 128 characters')
  .refine((password) => {
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      return false
    }
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false
    }
    // Check for number
    if (!/\d/.test(password)) {
      return false
    }
    // Check for special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return false
    }

    return true
  }, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  .refine((password) => {
    // Prevent the most common weak passwords (extended list)
    const commonWeakPasswords = [
      'password',
      'password1',
      'password123',
      '12345678',
      'qwerty123',
      'admin123',
      'letmein',
      'welcome123',
      'administrator',
      'business123',
      'admin@123',
      'business@123',
      'pika1234',
      'pika@123',
    ]

    // Check against common patterns
    const lowerPassword = password.toLowerCase()

    return !commonWeakPasswords.some((weak) => lowerPassword.includes(weak))
  }, 'This password contains common patterns. Please choose a more unique password')
  .refine((password) => {
    // Check for sequential characters (123, abc, etc.)
    const hasSequential = /(.)\1{2,}/.test(password) // same character 3+ times
    const hasKeyboardPattern = /(qwerty|asdfgh|zxcvbn)/i.test(password)

    return !hasSequential && !hasKeyboardPattern
  }, 'Password should not contain repeated characters or keyboard patterns')
  .describe('High-security password for admin and business accounts')

// ============= Numeric Types =============

/**
 * Positive Integer
 */
export const PositiveInt = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive')

/**
 * Non-negative Integer
 */
export const NonNegativeInt = z
  .number()
  .int('Must be an integer')
  .nonnegative('Cannot be negative')

/**
 * Port Number
 */
export const Port = z
  .number()
  .int()
  .min(1, 'Port must be between 1 and 65535')
  .max(65535, 'Port must be between 1 and 65535')

/**
 * Percentage - Decimal between 0 and 1
 */
export const PercentageDecimal = z
  .number()
  .min(0, 'Percentage must be between 0 and 1')
  .max(1, 'Percentage must be between 0 and 1')
  .transform((val) => Math.round(val * 10000) / 10000) // Round to 4 decimal places

/**
 * Decimal - Precise decimal number with 2 decimal places
 */
export const Decimal = z
  .number()
  .transform((val) => Math.round(val * 100) / 100) // Round to 2 decimal places
  .describe('Decimal number with 2 decimal places')

// ============= String Types =============

/**
 * Slug - URL-friendly string
 */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Must contain only lowercase letters, numbers, and hyphens',
  })
  .min(1)
  .max(255)

/**
 * Username
 */
export const Username = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, and hyphens',
  })
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')

/**
 * Hex Color
 */
export const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: 'Must be a valid hex color (e.g., #FF0000)',
})

/**
 * Language Code - ISO 639-1
 */
export const LanguageCode = z
  .string()
  .length(2, 'Language code must be 2 characters')
  .regex(/^[a-z]{2}$/, 'Must be lowercase ISO 639-1 code')

/**
 * Country Code - ISO 3166-1 alpha-2
 */
export const CountryCode = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .regex(/^[A-Z]{2}$/, 'Must be uppercase ISO 3166-1 alpha-2 code')

/**
 * Currency Code - ISO 4217
 */
export const CurrencyCode = z
  .string()
  .length(3, 'Currency code must be 3 characters')
  .regex(/^[A-Z]{3}$/, 'Must be uppercase ISO 4217 code')

// ============= Complex Types =============

/**
 * Cron Expression
 */
export const CronExpression = z.string().refine((cron) => {
  const parts = cron.split(' ')

  return parts.length >= 5 && parts.length <= 7
}, 'Invalid cron expression format')

/**
 * JSON String - Validates that string contains valid JSON
 */
export const JSONString = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str)
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid JSON string',
    })

    return z.NEVER
  }
})

/**
 * Base64 String
 */
export const Base64 = z
  .string()
  .regex(/^[A-Za-z0-9+/]*={0,2}$/, 'Invalid base64 format')
  .refine((str) => str.length % 4 === 0, 'Invalid base64 padding')

/**
 * Semantic Version
 */
export const SemVer = z
  .string()
  .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/, {
    message: 'Must be valid semantic version (e.g., 1.2.3)',
  })

// ============= Pagination Types =============

/**
 * Page Number - 1-indexed
 */
export const PageNumber = z
  .number()
  .int()
  .min(1, 'Page number must be at least 1')
  .default(1)
  .describe('Page number (1-indexed)')

/**
 * Page Size
 */
export const PageSize = z
  .number()
  .int()
  .min(1, 'Page size must be at least 1')
  .max(100, 'Page size cannot exceed 100')
  .default(20)
  .describe('Number of items per page')

// SortOrder moved to shared/enums.ts to avoid duplicates

// ============= File Types =============

/**
 * MIME Type
 */
export const MimeType = z
  .string()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_+-]*(\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_+-]*)+$/,
    {
      message: 'Invalid MIME type format',
    },
  )

/**
 * File Size in bytes with max limit
 */
export const FileSize = z
  .number()
  .int()
  .positive()
  .max(10 * 1024 * 1024, 'File size cannot exceed 10MB')

// ============= Utility Functions =============

/**
 * Create optional with null coercion
 */
export function nullable<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullable().optional()
}

/**
 * Create a string enum with better error messages
 */
export function stringEnum<T extends readonly [string, ...string[]]>(
  values: T,
  options?: {
    message?: string
    description?: string
  },
) {
  const enumSchema = z.enum(values)

  if (options?.message) {
    return enumSchema
      .refine((val) => values.includes(val as T[number]), {
        message: options.message,
      })
      .describe(options?.description || '')
  }

  return enumSchema.describe(options?.description || '')
}

/**
 * Trimmed string with length constraints
 */
export function trimmedString(options?: {
  minLength?: number
  maxLength?: number
  pattern?: RegExp
}) {
  let schema: any = z.string().transform((str) => str.trim())

  if (options?.minLength) {
    schema = schema.pipe(z.string().min(options.minLength))
  }
  if (options?.maxLength) {
    schema = schema.pipe(z.string().max(options.maxLength))
  }
  if (options?.pattern) {
    schema = schema.pipe(z.string().regex(options.pattern))
  }

  return schema
}
