import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

/**
 * Validation utilities for Express middleware
 * Provides request validation with Zod schemas
 */

// ============= Validation Middleware =============

/**
 * Validate request data against a Zod schema
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the data
      const data = await schema.parseAsync(req[source])

      // Replace request data with validated/transformed data
      req[source] = data

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Create error message from issues
        const baseErrorMessage = `Validation failed: ${error.issues
          .slice(0, 3)
          .map((issue) => {
            const path =
              issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''

            return `${path}${issue.message}`
          })
          .join('; ')}`

        const additionalErrors =
          error.issues.length > 3
            ? `; and ${error.issues.length - 3} more errors`
            : ''

        const errorMessage = baseErrorMessage + additionalErrors

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
            details: error.issues.map((err) => ({
              path: err.path,
              message: err.message,
              code: err.code,
              ...('expected' in err && { expected: err.expected }),
              ...('received' in err && { received: err.received }),
            })),
            correlationId: (req as any).id || `req_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        })
      } else {
        next(error)
      }
    }
  }
}

/**
 * Validate multiple sources at once
 */
export function validateAll(validators: {
  body?: z.ZodTypeAny
  query?: z.ZodTypeAny
  params?: z.ZodTypeAny
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await Promise.all([
        validators.body
          ? validators.body.parseAsync(req.body)
          : Promise.resolve(req.body),
        validators.query
          ? validators.query.parseAsync(req.query)
          : Promise.resolve(req.query),
        validators.params
          ? validators.params.parseAsync(req.params)
          : Promise.resolve(req.params),
      ])

      if (validators.body) req.body = results[0]
      if (validators.query) req.query = results[1] as Request['query']
      if (validators.params) req.params = results[2] as Request['params']

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Create error message from issues
        const errorMessage = `Validation failed: ${error.issues
          .map((issue) => {
            const path =
              issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''

            return `${path}${issue.message}`
          })
          .join('; ')}`

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
            details: error.issues,
            correlationId: (req as any).id || `req_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        })
      } else {
        next(error)
      }
    }
  }
}

// ============= Async Validation Helpers =============

/**
 * Validate with async refinements
 */
export function validateAsync<T extends z.ZodTypeAny>(
  schema: T,
  asyncValidation: (
    data: z.infer<T>,
    req: Request,
  ) => Promise<boolean | string>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First, do synchronous validation
      const data = await schema.parseAsync(req.body)

      // Then, do async validation
      const result = await asyncValidation(data, req)

      if (result === true) {
        req.body = data
        next()
      } else {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: typeof result === 'string' ? result : 'Validation failed',
            correlationId: (req as any).id || `req_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Create error message from issues
        const errorMessage = error.issues
          .map((issue) => {
            const path =
              issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''

            return `${path}${issue.message}`
          })
          .join('; ')

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessage,
            details: error.issues,
            correlationId: (req as any).id || `req_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        })
      } else {
        next(error)
      }
    }
  }
}

// ============= Safe Parsing Utilities =============

/**
 * Safely parse data without throwing
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): {
  success: boolean
  data?: z.infer<T>
  error?: string
  details?: z.ZodError['issues']
} {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  } else {
    // Create error message from issues
    const errorMessage = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''

        return `${path}${issue.message}`
      })
      .join('; ')

    return {
      success: false,
      error: errorMessage,
      details: result.error.issues,
    }
  }
}

/**
 * Parse with default value on failure
 */
export function parseWithDefault<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  defaultValue: z.infer<T>,
): z.infer<T> {
  const result = schema.safeParse(data)

  return result.success ? result.data : defaultValue
}

// ============= Conditional Validation =============

/**
 * Validate conditionally based on request
 */
export function validateIf<T extends z.ZodTypeAny>(
  condition: (req: Request) => boolean,
  schema: T,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      validate(schema, source)(req, res, next)
    } else {
      next()
    }
  }
}

// ============= Validation Combinators =============

/**
 * Combine multiple validators
 */
export function composeValidators(
  ...validators: Array<
    (req: Request, res: Response, next: NextFunction) => void
  >
) {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = 0

    const runNext = (err?: any) => {
      if (err) return next(err)
      if (index >= validators.length) return next()

      const validator = validators[index++]

      validator(req, res, runNext)
    }

    runNext()
  }
}

// ============= Type Guards =============

/**
 * Create a type guard from a Zod schema
 */
export function createTypeGuard<T extends z.ZodTypeAny>(
  schema: T,
): (value: unknown) => value is z.infer<T> {
  return (value: unknown): value is z.infer<T> => {
    return schema.safeParse(value).success
  }
}

// ============= Error Formatting =============

/**
 * Format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): {
  code: string
  message: string
  details: Array<{
    path: (string | number)[]
    message: string
    code: string
  }>
} {
  // Create error message from issues
  const message = `Validation failed: ${error.issues
    .map((issue) => issue.message)
    .join(', ')}`

  return {
    code: 'VALIDATION_ERROR',
    message,
    details: error.issues.map((err) => ({
      path: err.path as (string | number)[],
      message: err.message,
      code: err.code as string,
    })),
  }
}

// ============= Custom Transformations =============

/**
 * Creates an optional boolean schema that properly handles string query parameters
 * - "true" -> true
 * - "false" -> false
 * - undefined -> undefined
 * - boolean values pass through unchanged
 */
export const optionalBoolean = () =>
  z.preprocess((val) => {
    if (val === 'true') return true
    if (val === 'false') return false

    return val
  }, z.boolean().optional())

// ============= Schema Helpers =============

/**
 * Make all properties of a schema optional
 */
export function partial<T extends z.ZodObject<any>>(schema: T) {
  return schema.partial()
}

/**
 * Pick specific properties from a schema
 */
export function pick<T extends z.ZodObject<any>>(
  schema: T,
  keys: (keyof T['shape'])[],
): z.ZodObject<any> {
  const pickMask: any = {}

  keys.forEach((key) => {
    pickMask[key as string] = true
  })

  return schema.pick(pickMask)
}

/**
 * Omit specific properties from a schema
 */
export function omit<T extends z.ZodObject<any>>(
  schema: T,
  keys: (keyof T['shape'])[],
): z.ZodObject<any> {
  const omitMask: any = {}

  keys.forEach((key) => {
    omitMask[key as string] = true
  })

  return schema.omit(omitMask)
}
