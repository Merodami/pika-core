import { DEFAULT_LANGUAGE } from '@pika/environment'
import type { LanguageCode } from '@pika/types'
import type { Request } from 'express'
import { z } from 'zod'

/**
 * Helper functions for handling validated request data after Zod middleware transformation
 *
 * These helpers provide type-safe access to validated query, params, and body data
 * after Zod middleware has transformed the values at runtime.
 *
 * This solves the Express + Zod + TypeScript integration issue where:
 * - Express provides query as ParsedQs (strings)
 * - Zod transforms to proper types (numbers, dates, etc.)
 * - TypeScript doesn't track runtime transformations
 *
 * Industry standard approach used by Total TypeScript, tRPC, and production codebases.
 */

/**
 * Get validated query parameters with proper typing
 *
 * @example
 * ```typescript
 * // Instead of:
 * const { page, limit } = request.query // TS Error: string vs number
 *
 * // Use:
 * const query = getValidatedQuery<SessionHistoryQuery>(request)
 * const { page, limit } = query // page and limit are numbers
 * ```
 */
export function getValidatedQuery<T>(request: Request): T {
  // The validation middleware has already transformed request.query
  // This helper just provides the correct typing
  return request.query as T
}

/**
 * Get validated params with proper typing
 *
 * @example
 * ```typescript
 * const params = getValidatedParams<SessionIdParam>(request)
 * const { id } = params // id is properly typed
 * ```
 */
export function getValidatedParams<T>(request: Request): T {
  return request.params as T
}

/**
 * Get validated body with proper typing
 *
 * @example
 * ```typescript
 * const body = getValidatedBody<CreateSessionRequest>(request)
 * // body is fully typed according to schema
 * ```
 */
export function getValidatedBody<T>(request: Request): T {
  return request.body as T
}

/**
 * Alternative: Destructure validated data in one call
 *
 * @example
 * ```typescript
 * const { query, params, body } = getValidatedData<
 *   SessionHistoryQuery,
 *   SessionIdParam,
 *   UpdateSessionRequest
 * >(request)
 * ```
 */
export function getValidatedData<TQuery = any, TParams = any, TBody = any>(
  request: Request,
): {
  query: TQuery
  params: TParams
  body: TBody
} {
  return {
    query: request.query as TQuery,
    params: request.params as TParams,
    body: request.body as TBody,
  }
}

/**
 * Get request language with proper fallback
 *
 * This helper provides standardized language extraction from requests,
 * following the industry standard language detection pattern:
 * 1. Language middleware sets req.language based on headers/query params
 * 2. Falls back to DEFAULT_LANGUAGE if not set
 *
 * @example
 * ```typescript
 * // Instead of:
 * const language = req.language || DEFAULT_LANGUAGE
 *
 * // Use:
 * const language = getRequestLanguage(req)
 * ```
 */
export function getRequestLanguage(request: Request): LanguageCode {
  return (request.language || DEFAULT_LANGUAGE) as LanguageCode
}

/**
 * Safely validate response data against a Zod schema
 *
 * This helper properly transforms ZodErrors into the expected validation error format
 * that the error middleware can handle, preventing 500 errors.
 *
 * @example
 * ```typescript
 * // Instead of:
 * const validatedResponse = schema.parse(response) // Throws ZodError -> 500
 *
 * // Use:
 * const validatedResponse = safeValidateResponse(schema, response)
 * ```
 */
export function safeValidateResponse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Create a validation error in the expected format
      const validationError = new Error('Response validation failed') as any

      validationError.code = 'VALIDATION_ERROR'
      validationError.httpPart = 'response'
      validationError.validation = error.issues.map((issue) => ({
        instancePath: `/response/${issue.path.join('/')}`,
        schemaPath: '',
        keyword: issue.code,
        params: {},
        message: issue.message,
        data: undefined,
      }))

      throw validationError
    }

    throw error
  }
}
