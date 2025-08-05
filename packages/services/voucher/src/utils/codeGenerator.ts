import {
  VOUCHER_CODE_ALPHABET,
  VOUCHER_JWT_ALGORITHM,
  VOUCHER_JWT_PRIVATE_KEY,
  VOUCHER_SHORT_CODE_LENGTH,
} from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { nth, range } from 'lodash-es'

export interface CodeConfig {
  generateQR?: boolean
  generateShortCode?: boolean
  generateStaticCode?: boolean
  staticCode?: string
  // Also accept the snake_case version from API
  generate_qr?: boolean
  generate_short_code?: boolean
  generate_static_code?: boolean
}

export interface VoucherCode {
  code: string
  type: 'QR' | 'SHORT' | 'STATIC'
  metadata?: Record<string, any>
}

// Character sets for different code types (copied from pika-old)
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No ambiguous chars
const _NUMERIC_CHARS = '0123456789'
const _ALPHA_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Generates a cryptographically secure random short code
 * Uses configurable alphabet for human-friendly codes
 */
function generateShortCode(): string {
  const length = VOUCHER_SHORT_CODE_LENGTH
  const alphabet = VOUCHER_CODE_ALPHABET
  const bytes = randomBytes(length)

  let code = ''

  for (const i of range(length)) {
    const byteValue = nth(Array.from(bytes), i) || 0
    const index = byteValue % alphabet.length
    const char = nth(alphabet, index)

    if (char) {
      code += char
    }
  }

  return code
}

/**
 * Generates a JWT token for QR codes
 * Uses configurable algorithm (HS256 for dev, ES256 for production)
 */
function generateQRToken(voucherId: string): string {
  const payload = {
    type: 'voucher',
    vid: voucherId, // Short property names for smaller QR codes
    iat: Math.floor(Date.now() / 1000),
  }

  try {
    return jwt.sign(payload, VOUCHER_JWT_PRIVATE_KEY, {
      algorithm: VOUCHER_JWT_ALGORITHM as jwt.Algorithm,
      expiresIn: '365d', // Vouchers have their own expiration logic
    })
  } catch (error) {
    throw ErrorFactory.fromError(error, 'Failed to generate QR token', {
      source: 'generateQRToken',
    })
  }
}

/**
 * Generate human-readable short code for vouchers
 * Format: XXXX-XXXX (8 characters with dash separator)
 */
export async function generateSecureShortCode(options?: {
  length?: number
  includeDash?: boolean
  prefix?: string
}): Promise<string> {
  const length = options?.length || 8
  const includeDash = options?.includeDash !== false
  const prefix = options?.prefix || ''

  if (length < 4 || length > 16) {
    throw ErrorFactory.badRequest(
      'Short code length must be between 4 and 16 characters',
    )
  }

  // Generate random code using safe character set
  const bytes = randomBytes(length)
  const byteArray = Array.from(bytes)

  let code = ''

  for (let i = 0; i < length; i++) {
    const byteValue = byteArray.at(i) || 0
    const index = byteValue % SAFE_CHARS.length

    code += SAFE_CHARS.charAt(index)
  }

  // Add dash separator for readability (if length >= 6)
  if (includeDash && length >= 6) {
    const midPoint = Math.floor(length / 2)

    code = code.substring(0, midPoint) + '-' + code.substring(midPoint)
  }

  return prefix + code
}

/**
 * Generate batch code for print voucher campaigns
 * Format: PIKA-YYYY-MM-XXX (e.g., PIKA-2025-01-A5K)
 */
export async function generateBatchCode(options?: {
  prefix?: string
  year?: number
  month?: number
  sequenceLength?: number
}): Promise<string> {
  const prefix = options?.prefix || 'PIKA'
  const year = options?.year || new Date().getFullYear()
  const month = options?.month || new Date().getMonth() + 1
  const sequenceLength = options?.sequenceLength || 3

  // Generate random sequence
  const bytes = randomBytes(sequenceLength)
  const byteArray = Array.from(bytes)

  let sequence = ''

  for (let i = 0; i < sequenceLength; i++) {
    const byteValue = byteArray.at(i) || 0
    const index = byteValue % SAFE_CHARS.length

    sequence += SAFE_CHARS.charAt(index)
  }

  return `${prefix}-${year}-${month.toString().padStart(2, '0')}-${sequence}`
}

/**
 * Generates voucher codes based on configuration
 */
export async function generateVoucherCodes(
  config?: CodeConfig,
  voucherId?: string,
): Promise<VoucherCode[]> {
  const codes: VoucherCode[] = []

  // Default to generating both QR and short codes if no config provided
  const defaultConfig: CodeConfig = {
    generateQR: true,
    generateShortCode: true,
    generateStaticCode: false,
  }

  const finalConfig = {
    ...defaultConfig,
    ...config,
    // Map snake_case to camelCase for compatibility
    generateQR:
      config?.generateQR ?? config?.generate_qr ?? defaultConfig.generateQR,
    generateShortCode:
      config?.generateShortCode ??
      config?.generate_short_code ??
      defaultConfig.generateShortCode,
    generateStaticCode:
      config?.generateStaticCode ??
      config?.generate_static_code ??
      defaultConfig.generateStaticCode,
  }

  try {
    // Generate QR code (JWT token)
    if (finalConfig.generateQR && voucherId) {
      const qrToken = generateQRToken(voucherId)

      codes.push({
        code: qrToken,
        type: 'QR',
        metadata: {
          algorithm: VOUCHER_JWT_ALGORITHM,
          generatedAt: new Date().toISOString(),
        },
      })
      logger.debug('Generated QR code for voucher', {
        voucherId,
        tokenLength: qrToken.length,
      })
    }

    // Generate short code
    if (finalConfig.generateShortCode) {
      const shortCode = generateShortCode()

      codes.push({
        code: shortCode,
        type: 'SHORT',
        metadata: {
          length: shortCode.length,
          generatedAt: new Date().toISOString(),
        },
      })
      logger.debug('Generated short code', { code: shortCode })
    }

    // Add static code if provided
    if (finalConfig.generateStaticCode && finalConfig.staticCode) {
      // Validate static code format
      if (!/^[A-Z0-9]{4,20}$/.test(finalConfig.staticCode)) {
        throw ErrorFactory.validationError(
          {
            staticCode: [
              'Static code must be 4-20 characters, uppercase letters and numbers only',
            ],
          },
          { source: 'generateVoucherCodes' },
        )
      }

      codes.push({
        code: finalConfig.staticCode,
        type: 'STATIC',
        metadata: {
          userProvided: true,
          generatedAt: new Date().toISOString(),
        },
      })
      logger.debug('Added static code', { code: finalConfig.staticCode })
    }

    return codes
  } catch (error) {
    logger.error('Error generating voucher codes', error)
    throw ErrorFactory.fromError(error, 'Failed to generate voucher codes')
  }
}

/**
 * Validates a voucher code format
 */
export function validateVoucherCode(
  code: string,
  type: VoucherCode['type'],
): boolean {
  switch (type) {
    case 'QR':
      // Validate JWT format
      try {
        const parts = code.split('.')

        return parts.length === 3 // Basic JWT validation
      } catch {
        return false
      }

    case 'SHORT': {
      // Validate short code format
      // Check length first
      if (code.length !== VOUCHER_SHORT_CODE_LENGTH) {
        return false
      }

      // Check each character is in the allowed alphabet
      for (const char of code) {
        if (!VOUCHER_CODE_ALPHABET.includes(char)) {
          return false
        }
      }

      return true
    }

    case 'STATIC':
      // Validate static code format
      return /^[A-Z0-9]{4,20}$/.test(code)

    default:
      return false
  }
}

/**
 * Decodes a QR token to extract voucher information
 */
export function decodeQRToken(token: string): { voucherId: string } | null {
  try {
    const decoded = jwt.verify(token, VOUCHER_JWT_PRIVATE_KEY, {
      algorithms: [VOUCHER_JWT_ALGORITHM as jwt.Algorithm],
    }) as any

    if (decoded.type !== 'voucher' || !decoded.vid) {
      return null
    }

    return { voucherId: decoded.vid }
  } catch (error) {
    logger.debug('Failed to decode QR token', { error: error.message })

    return null
  }
}

/**
 * Generate QR code friendly string (high density, no ambiguous chars)
 */
export async function generateQRFriendlyCode(
  length: number = 12,
): Promise<string> {
  if (length < 8 || length > 32) {
    throw ErrorFactory.badRequest(
      'QR friendly code length must be between 8 and 32 characters',
    )
  }

  const bytes = randomBytes(length)
  const byteArray = Array.from(bytes)

  let code = ''

  for (let i = 0; i < length; i++) {
    const byteValue = byteArray.at(i) || 0
    const index = byteValue % SAFE_CHARS.length

    code += SAFE_CHARS.charAt(index)
  }

  return code
}

/**
 * Calculate check digit using Luhn algorithm (for validation)
 */
export function calculateCheckDigit(code: string): string {
  // Convert letters to numbers (A=10, B=11, etc.)
  const digits = code.split('').map((char) => {
    if (/[0-9]/.test(char)) {
      return parseInt(char, 10)
    } else {
      return char.charCodeAt(0) - 65 + 10 // A=10, B=11, etc.
    }
  })

  // Apply Luhn algorithm
  let sum = 0
  let isEven = false

  const digitsArray = [...digits] // Create a copy to avoid mutation

  for (let i = digitsArray.length - 1; i >= 0; i--) {
    let digit = digitsArray.at(i) || 0

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10)
      }
    }

    sum += digit
    isEven = !isEven
  }

  const checkDigit = (10 - (sum % 10)) % 10

  return checkDigit.toString()
}

/**
 * Generate code with check digit
 */
export async function generateCodeWithCheckDigit(
  baseLength: number = 7,
): Promise<string> {
  const baseCode = await generateQRFriendlyCode(baseLength)
  const checkDigit = calculateCheckDigit(baseCode)

  return baseCode + checkDigit
}

/**
 * Validate code with check digit
 */
export function validateCodeWithCheckDigit(code: string): boolean {
  if (code.length < 5) return false

  const baseCode = code.slice(0, -1)
  const providedCheckDigit = code.slice(-1)
  const calculatedCheckDigit = calculateCheckDigit(baseCode)

  return providedCheckDigit === calculatedCheckDigit
}

/**
 * Format code for display (add separators for readability)
 */
export function formatCodeForDisplay(
  code: string,
  groupSize: number = 4,
): string {
  const cleanCode = code.replace(/[-\s]/g, '')
  const groups = []

  for (let i = 0; i < cleanCode.length; i += groupSize) {
    groups.push(cleanCode.substring(i, i + groupSize))
  }

  return groups.join('-')
}

/**
 * Validate batch code format
 */
export function validateBatchCode(code: string): boolean {
  // Format: PREFIX-YYYY-MM-XXX
  const pattern =
    /^[A-Z]{2,10}-\d{4}-\d{2}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2,8}$/

  return pattern.test(code)
}

/**
 * Parse batch code to extract components
 */
export function parseBatchCode(code: string): {
  prefix: string
  year: number
  month: number
  sequence: string
} | null {
  if (!validateBatchCode(code)) {
    return null
  }

  const parts = code.split('-')

  if (parts.length !== 4) {
    return null
  }

  return {
    prefix: parts[0],
    year: parseInt(parts[1], 10),
    month: parseInt(parts[2], 10),
    sequence: parts[3],
  }
}
