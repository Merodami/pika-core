/**
 * Validates that the specified fields are neither null, undefined, nor empty strings.
 * Numbers are considered invalid if they are NaN.
 * @param fields - An object where keys are field names and values are field values.
 * @throws An error listing missing or empty field names.
 */
export function validateRequiredFields(fields: Record<string, any>): void {
  const missingFields = Object.keys(fields).filter((key) => {
    // eslint-disable-next-line security/detect-object-injection
    const value = fields[key]

    // Check for null or undefined
    if (value === null || value === undefined) return true

    // If it's a string, check that it's not empty after trimming.
    if (typeof value === 'string' && !value.trim()) return true

    // If it's a number, you might want to check if it's NaN.
    if (typeof value === 'number' && isNaN(value)) return true

    return false
  })

  if (missingFields.length > 0) {
    throw new Error(
      `${missingFields.join(', ')} are required and cannot be empty.`,
    )
  }
}
