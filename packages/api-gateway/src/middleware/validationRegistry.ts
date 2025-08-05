import { validateRequest } from '@pika/http'
import { logger } from '@pika/shared'
import { Router } from 'express'
import { z } from 'zod'

// Type for validation schemas
type ValidationSchema = {
  body?: z.ZodTypeAny
  params?: z.ZodTypeAny
  query?: z.ZodTypeAny
}

/**
 * Route validation registry for centralized management
 * This allows dynamic registration and easy maintenance
 */
export class ValidationRegistry {
  private routes: Map<string, ValidationSchema> = new Map()

  /**
   * Register a route validation
   */
  register(method: string, path: string, schema: ValidationSchema): void {
    const key = `${method.toUpperCase()}:${path}`

    this.routes.set(key, schema)
    logger.debug(`Registered validation for ${key}`)
  }

  /**
   * Register multiple routes at once
   */
  registerBulk(
    routes: Array<{
      method: string
      path: string
      schema: ValidationSchema
    }>,
  ): void {
    routes.forEach(({ method, path, schema }) => {
      this.register(method, path, schema)
    })
  }

  /**
   * Apply all registered validations to a router
   */
  applyToRouter(router: Router): void {
    let appliedCount = 0

    this.routes.forEach((schema, key) => {
      const [method, path] = key.split(':')
      const methodLower = method.toLowerCase()

      // Type-safe router method access
      let methodApplied = false

      if (methodLower === 'get' && router.get) {
        router.get(
          path,
          validateRequest(schema),
          (req: any, res: any, next: any) => next(),
        )
        methodApplied = true
      } else if (methodLower === 'post' && router.post) {
        router.post(
          path,
          validateRequest(schema),
          (req: any, res: any, next: any) => next(),
        )
        methodApplied = true
      } else if (methodLower === 'put' && router.put) {
        router.put(
          path,
          validateRequest(schema),
          (req: any, res: any, next: any) => next(),
        )
        methodApplied = true
      } else if (methodLower === 'patch' && router.patch) {
        router.patch(
          path,
          validateRequest(schema),
          (req: any, res: any, next: any) => next(),
        )
        methodApplied = true
      } else if (methodLower === 'delete' && router.delete) {
        router.delete(
          path,
          validateRequest(schema),
          (req: any, res: any, next: any) => next(),
        )
        methodApplied = true
      }

      if (methodApplied) {
        appliedCount++
      }
    })

    logger.info(`Applied ${appliedCount} validation middlewares to router`)
  }

  /**
   * Get validation schema for a route
   */
  getSchema(method: string, path: string): ValidationSchema | undefined {
    const key = `${method.toUpperCase()}:${path}`

    return this.routes.get(key)
  }

  /**
   * Check if a route has validation
   */
  hasValidation(method: string, path: string): boolean {
    const key = `${method.toUpperCase()}:${path}`

    return this.routes.has(key)
  }

  /**
   * Get all registered routes
   */
  getAllRoutes(): string[] {
    return Array.from(this.routes.keys())
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.routes.clear()
  }
}

// Global registry instance
export const validationRegistry = new ValidationRegistry()

/**
 * Helper function to register common CRUD validations
 */
export function registerCRUDValidations(
  resourceName: string,
  basePath: string,
  schemas: {
    create?: z.ZodTypeAny
    update?: z.ZodTypeAny
    list?: z.ZodTypeAny
    get?: z.ZodTypeAny
    delete?: z.ZodTypeAny
  },
): void {
  const routes: Array<{
    method: string
    path: string
    schema: ValidationSchema
  }> = []

  // GET list
  if (schemas.list) {
    routes.push({
      method: 'GET',
      path: basePath,
      schema: { query: schemas.list },
    })
  }

  // GET single
  if (schemas.get) {
    routes.push({
      method: 'GET',
      path: `${basePath}/:id`,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        query: schemas.get,
      },
    })
  }

  // POST create
  if (schemas.create) {
    routes.push({
      method: 'POST',
      path: basePath,
      schema: { body: schemas.create },
    })
  }

  // PUT update
  if (schemas.update) {
    routes.push({
      method: 'PUT',
      path: `${basePath}/:id`,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: schemas.update,
      },
    })
  }

  // DELETE
  if (schemas.delete) {
    routes.push({
      method: 'DELETE',
      path: `${basePath}/:id`,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: schemas.delete,
      },
    })
  }

  validationRegistry.registerBulk(routes)
  logger.debug(`Registered CRUD validations for ${resourceName}`)
}
