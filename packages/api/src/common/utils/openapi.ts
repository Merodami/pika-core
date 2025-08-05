import {
  extendZodWithOpenApi,
  ResponseConfig,
  RouteConfig,
  ZodRequestBody,
} from '@asteasolutions/zod-to-openapi'
import type { HeadersObject, ParameterObject } from 'openapi3-ts/oas31'
import { z } from 'zod'

/**
 * OpenAPI utilities for Zod schemas
 * Provides helpers for generating OpenAPI documentation
 */

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

// ============= Schema Metadata Helpers =============

/**
 * Add OpenAPI metadata to a schema
 */
export function openapi<T extends z.ZodTypeAny>(
  schema: T,
  metadata: {
    description?: string
    example?: z.infer<T>
    deprecated?: boolean
    externalDocs?: { url: string; description?: string }
    default?: z.infer<T>
  },
): T {
  return schema.openapi(metadata as any)
}

/**
 * Mark a schema as deprecated
 */
export function deprecated<T extends z.ZodTypeAny>(
  schema: T,
  reason?: string,
): T {
  return schema.openapi({
    deprecated: true,
    description: reason ? `DEPRECATED: ${reason}` : undefined,
  })
}

// ============= Response Helpers =============

/**
 * Create a standard response configuration
 */
export function apiResponse<T extends z.ZodTypeAny>(
  schema: T,
  description: string,
  options?: {
    contentType?: string
    headers?: HeadersObject
  },
): ResponseConfig {
  return {
    description,
    headers: options?.headers,
    content: {
      [options?.contentType || 'application/json']: {
        schema,
      },
    },
  }
}

/**
 * Create multiple response configurations
 */
export function apiResponses(
  responses: Record<
    string | number,
    {
      schema: z.ZodTypeAny
      description: string
      contentType?: string
      headers?: HeadersObject
    }
  >,
): Record<string | number, ResponseConfig> {
  return Object.entries(responses).reduce(
    (acc, [status, config]) => ({
      ...acc,
      [status]: apiResponse(config.schema, config.description, {
        contentType: config.contentType,
        headers: config.headers,
      }),
    }),
    {},
  )
}

// ============= Parameter Helpers =============

/**
 * Create a path parameter
 */
export function pathParam(
  name: string,
  schema: z.ZodTypeAny,
  options?: {
    description?: string
    example?: any
  },
): ParameterObject {
  return {
    name,
    in: 'path',
    required: true,
    schema: schema as any,
    description: options?.description,
    example: options?.example,
  }
}

/**
 * Create a query parameter
 */
export function queryParam(
  name: string,
  schema: z.ZodTypeAny,
  options?: {
    description?: string
    example?: any
    required?: boolean
  },
): ParameterObject {
  return {
    name,
    in: 'query',
    required: options?.required || false,
    schema: schema as any,
    description: options?.description,
    example: options?.example,
  }
}

/**
 * Create a header parameter
 */
export function headerParam(
  name: string,
  schema: z.ZodTypeAny,
  options?: {
    description?: string
    example?: any
    required?: boolean
  },
): ParameterObject {
  return {
    name,
    in: 'header',
    required: options?.required || false,
    schema: schema as any,
    description: options?.description,
    example: options?.example,
  }
}

// ============= Common Parameters =============

/**
 * Standard pagination parameters
 */
export const paginationParams = [
  queryParam('page', z.coerce.number().int().positive().default(1), {
    description: 'Page number (1-indexed)',
    example: 1,
  }),
  queryParam('limit', z.coerce.number().int().positive().max(100).default(20), {
    description: 'Items per page',
    example: 20,
  }),
  queryParam('sort', z.string().optional(), {
    description: 'Sort field',
    example: 'createdAt',
  }),
  queryParam('order', z.enum(['ASC', 'DESC']).optional().default('DESC'), {
    description: 'Sort order',
    example: 'desc',
  }),
]

/**
 * Standard filter parameters
 */
export function createFilterParams(
  filters: Record<
    string,
    {
      schema: z.ZodTypeAny
      description: string
      example?: any
    }
  >,
): ParameterObject[] {
  return Object.entries(filters).map(([name, config]) =>
    queryParam(name, config.schema, {
      description: config.description,
      example: config.example,
    }),
  )
}

// ============= Security Helpers =============

/**
 * Bearer token security scheme
 */
export const bearerAuth = {
  type: 'http' as const,
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Bearer token authentication',
}

/**
 * API key security scheme
 */
export const apiKeyAuth = {
  type: 'apiKey' as const,
  in: 'header' as const,
  name: 'X-API-Key',
  description: 'API key authentication',
}

// ============= Tag Helpers =============

/**
 * Create tag metadata
 */
export function createTag(
  name: string,
  description: string,
  externalDocs?: { url: string; description?: string },
) {
  return {
    name,
    description,
    externalDocs,
  }
}

// ============= Schema Examples =============

/**
 * Add multiple examples to a schema
 */
export function withExamples<T extends z.ZodTypeAny>(
  schema: T,
  examples: Record<
    string,
    {
      summary?: string
      description?: string
      value: z.infer<T>
    }
  >,
): T {
  return schema.openapi({ examples } as any)
}

/**
 * Add a single example to a schema
 */
export function withExample<T extends z.ZodTypeAny>(
  schema: T,
  example: z.infer<T>,
): T {
  return schema.openapi({ example } as any)
}

// ============= Route Documentation Helper =============

/**
 * Document a route with all metadata - returns partial RouteConfig
 */
export function documentRoute(config: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string
  summary: string
  description?: string
  tags: string[]
  security?: Array<{ [key: string]: string[] }>
  deprecated?: boolean
  parameters?: ParameterObject[]
  requestBody?: {
    description: string
    schema: z.ZodTypeAny
    required?: boolean
    contentType?: string
  }
  responses: Record<
    string | number,
    {
      schema: z.ZodTypeAny
      description: string
      contentType?: string
      headers?: HeadersObject
    }
  >
}): RouteConfig {
  const routeConfig: RouteConfig = {
    method: config.method,
    path: config.path,
    summary: config.summary,
    description: config.description,
    tags: config.tags,
    security: config.security,
    deprecated: config.deprecated,
    parameters: config.parameters,
    responses: apiResponses(config.responses),
  }

  // Add request body if provided
  if (config.requestBody) {
    const requestBody: ZodRequestBody = {
      description: config.requestBody.description,
      required: config.requestBody.required !== false,
      content: {
        [config.requestBody.contentType || 'application/json']: {
          schema: config.requestBody.schema,
        },
      },
    }

    routeConfig.request = {
      body: requestBody,
    }
  }

  return routeConfig
}
