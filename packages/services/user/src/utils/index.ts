/**
 * Utility functions for the User service
 */

/**
 * Generate a unique username from email
 */
export function generateUsername(email: string): string {
  const [localPart] = email.split('@')
  const timestamp = Date.now().toString(36).slice(-4)

  return `${localPart}-${timestamp}`.toLowerCase()
}

/**
 * Mask sensitive user data for logging
 */
export function maskUserData(user: any): any {
  if (!user) return user

  return {
    ...user,
    email: maskEmail(user.email),
    phoneNumber: maskPhone(user.phoneNumber),
    passwordHash: user.passwordHash ? '***' : undefined,
  }
}

/**
 * Mask email address
 */
function maskEmail(email?: string | null): string | null | undefined {
  if (!email) return email

  const [localPart, domain] = email.split('@')

  if (localPart.length <= 3) {
    return `***@${domain}`
  }

  return `${localPart.slice(0, 3)}***@${domain}`
}

/**
 * Mask phone number
 */
function maskPhone(phone?: string | null): string | null | undefined {
  if (!phone) return phone

  if (phone.length <= 4) {
    return '***'
  }

  return `${phone.slice(0, 3)}***${phone.slice(-2)}`
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

  return passwordRegex.test(password)
}

/**
 * Normalize phone number format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, '')
}
