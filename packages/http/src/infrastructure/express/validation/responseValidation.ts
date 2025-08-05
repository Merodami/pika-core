import { NODE_ENV, VALIDATE_RESPONSES } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'
import { z } from 'zod'

/**
 * Helper to properly display validation errors in tests (fixes [Array] display)
 */
function logValidationErrorsForTest(
  validationErrors: Record<string, string[]>,
  context?: string,
): void {
  if (NODE_ENV.includes('test')) {
    console.log(`\n🔍 VALIDATION ERRORS (${context || 'Unknown'}):`)
    console.log(JSON.stringify(validationErrors, null, 2))
  }
}

/**
 * Validates response data against a Zod schema in non-production environments.
 * In production, returns data without validation for performance.
 *
 * This function helps catch response schema mismatches during development
 * and testing while avoiding performance overhead in production.
 *
 * @example
 * ```typescript
 * // Instead of:
 * const validatedResponse = schema.parse(response)
 *
 * // Use:
 * const validatedResponse = validateResponse(
 *   schema,
 *   response,
 *   'UserController.getProfile'
 * )
 * ```
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param context - Optional context string for better error logging (e.g., 'ControllerName.methodName')
 * @returns The data cast to the schema type (validated in dev/test, passed through in prod)
 */
export function validateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  context?: string,
): z.infer<T> {
  // Skip validation in production unless explicitly enabled
  if (!VALIDATE_RESPONSES) {
    return data as z.infer<T>
  }

  const result = schema.safeParse(data)

  if (!result.success) {
    // Log error with context for debugging
    logger.error('Response validation failed', {
      context: context || 'Unknown',
      errors: result.error.format(),
      issues: result.error.issues,
      environment: NODE_ENV,
      // Only log actual data in development to avoid exposing sensitive info
      data: NODE_ENV === 'development' ? data : undefined,
    })

    // In non-production environments, throw validation error
    if (NODE_ENV !== 'production') {
      const validationErrors: Record<string, string[]> = {}

      // Create a simple, flat structure that avoids prototype pollution
      const errors: string[] = []

      result.error.issues.forEach((issue) => {
        const pathStr = issue.path.length > 0 ? issue.path.join('.') : 'root'

        errors.push(`${pathStr}: ${issue.message}`)
      })

      // Use a single 'errors' key to avoid any path injection issues
      validationErrors['validation_errors'] = errors

      // Log detailed errors for test debugging (fixes [Array] display)
      logValidationErrorsForTest(validationErrors, context)

      throw ErrorFactory.validationError(validationErrors, {
        source: context || 'response validation',
      })
    }
  }

  // Always return the original data
  // In dev/test: logged if invalid
  // In prod: passed through without validation
  return data as z.infer<T>
}
