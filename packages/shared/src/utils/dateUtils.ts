/**
 * Date utility functions
 */

/**
 * Formats a date to ISO string with proper null/undefined handling
 * @param date - Date object, string, null or undefined
 * @returns ISO string representation or current date ISO string if invalid
 */
export function formatDateToISO(
  date: Date | string | undefined | null,
): string {
  if (!date) return new Date().toISOString()
  if (typeof date === 'string') return date
  if (date instanceof Date) return date.toISOString()

  return new Date().toISOString()
}

/**
 * Formats a date to ISO string with undefined fallback
 * @param date - Date object, string, null or undefined
 * @returns ISO string representation or undefined if no date
 */
export function formatDateToISOOrUndefined(
  date: Date | string | undefined | null,
): string | undefined {
  if (!date) return undefined
  if (typeof date === 'string') return date
  if (date instanceof Date) return date.toISOString()

  return undefined
}

/**
 * Formats a date to ISO string with null fallback
 * @param date - Date object, string, null or undefined
 * @returns ISO string representation or null if no date
 */
export function formatDateToISOOrNull(
  date: Date | string | undefined | null,
): string | null {
  if (!date) return null
  if (typeof date === 'string') return date
  if (date instanceof Date) return date.toISOString()

  return null
}
