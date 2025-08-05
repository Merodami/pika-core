/**
 * Date utility functions for SDK
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
 * Formats a date to YYYY-MM-DD string with undefined fallback
 * @param date - Date object, string, null or undefined
 * @returns Date string in YYYY-MM-DD format or undefined if no date
 */
export function formatDateOnlyOrUndefined(
  date: Date | string | undefined | null,
): string | undefined {
  if (!date) return undefined

  let dateObj: Date

  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    dateObj = new Date(date)
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    return undefined
  }

  // Format as YYYY-MM-DD
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
