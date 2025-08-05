import { NextFunction, Request, RequestHandler, Response } from 'express'
import { get } from 'lodash-es'
import { z } from 'zod'

/**
 * Request type that represents the state after Zod validation
 * This provides full type safety for validated requests
 */
export type ValidatedRequest<
  TParams = {},
  TQuery = {},
  TBody = {},
  TLocals extends Record<string, any> = Record<string, any>,
> = Omit<Request<any, any, any, any, TLocals>, 'params' | 'query' | 'body'> & {
  params: TParams
  query: TQuery
  body: TBody
}

/**
 * Type helper for handlers that need typed query/body/params
 * This allows proper typing while maintaining Express compatibility
 */
export type TypedRequestHandler<
  TParams = any,
  TQuery = any,
  TBody = any,
  TResBody = any,
> = (
  req: Request<TParams, TResBody, TBody, TQuery>,
  res: Response<TResBody>,
  next: NextFunction,
) => Promise<void> | void

/**
 * Creates a Zod validation middleware for Express routes.
 * This middleware validates request data against a Zod schema.
 *
 * IMPORTANT: This middleware TRANSFORMS the request data according to the schema.
 * Use schemas with z.coerce for query/params to handle string-to-type conversions.
 */
export function createZodValidatorMiddleware<T extends z.ZodTypeAny>(
  schema: T,
  httpPart: 'body' | 'params' | 'query' = 'body',
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = get(req, httpPart)

    try {
      // Parse and validate the data
      const validatedData = schema.parse(data)

      // Replace the request data with the validated and transformed data
      if (httpPart === 'query') {
        // For query parameters, we need to handle the read-only constraint
        Object.defineProperty(req, 'query', {
          value: validatedData,
          writable: false,
          enumerable: true,
          configurable: true,
        })
      } else {
        ;(req as any)[httpPart] = validatedData
      }

      return next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Create a proper validation error
        const validationError = new Error('Validation failed') as any

        validationError.code = 'VALIDATION_ERROR'
        validationError.validation = error.issues.map((err: any) => ({
          instancePath: `/${httpPart}/${err.path.join('/')}`,
          schemaPath: '',
          keyword: err.code,
          params: {},
          message: err.message,
          data: err.code === 'invalid_type' ? (err as any).received : undefined,
        }))
        validationError.validationContext = httpPart
        validationError.zodError = error

        console.log('[ZOD_VALIDATION] Creating validation error:', {
          code: validationError.code,
          httpPart,
          errors: error.issues?.length || 0,
          validationArray: validationError.validation,
        })

        return next(validationError)
      }

      // Handle unexpected errors
      return next(error)
    }
  }
}

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
): RequestHandler {
  return createZodValidatorMiddleware(schema, 'body')
}

/**
 * Validates request params against a Zod schema
 */
export function validateParams<T extends z.ZodTypeAny>(
  schema: T,
): RequestHandler {
  return createZodValidatorMiddleware(schema, 'params')
}

/**
 * Validates request query against a Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
): RequestHandler {
  return createZodValidatorMiddleware(schema, 'query')
}

/**
 * Combined validation for multiple request parts
 */
export function validateRequest<
  TBody extends z.ZodTypeAny,
  TParams extends z.ZodTypeAny,
  TQuery extends z.ZodTypeAny,
>(schemas: { body?: TBody; params?: TParams; query?: TQuery }): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate each part if schema is provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any
      }
      if (schemas.query) {
        const validatedQuery = await schemas.query.parseAsync(req.query)

        // Handle read-only query property
        Object.defineProperty(req, 'query', {
          value: validatedQuery,
          writable: false,
          enumerable: true,
          configurable: true,
        })
      }

      return next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Create a proper validation error
        const validationError = new Error('Validation failed') as any

        validationError.code = 'VALIDATION_ERROR'
        validationError.validation = error.issues.map((err: any) => ({
          instancePath: `/${err.path.join('/')}`,
          schemaPath: '',
          keyword: err.code,
          params: {},
          message: err.message,
          data: err.code === 'invalid_type' ? (err as any).received : undefined,
        }))
        validationError.zodError = error

        console.log('[ZOD_VALIDATION_ASYNC] Creating validation error:', {
          code: validationError.code,
          errors: error.issues?.length || 0,
          validationArray: validationError.validation,
        })

        return next(validationError)
      }

      return next(error)
    }
  }
}
