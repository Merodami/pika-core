import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  RouteConfig,
} from '@asteasolutions/zod-to-openapi'
import type { SecuritySchemeObject } from 'openapi3-ts/oas31'
import { z } from 'zod'

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z)

/**
 * Base registry for managing Zod schemas and OpenAPI documentation
 * Provides schema registration, composition, and OpenAPI generation
 */

export interface RegistryOptions {
  title: string
  version: string
  description?: string
  servers?: Array<{ url: string; description?: string }>
  tags?: Array<{ name: string; description?: string }>
  security?: Array<{ [key: string]: string[] }>
}

export class ZodRegistry {
  private registry: OpenAPIRegistry
  private schemas: Map<string, z.ZodTypeAny>
  private options: RegistryOptions

  constructor(options: RegistryOptions) {
    this.registry = new OpenAPIRegistry()
    this.schemas = new Map()
    this.options = options
  }

  /**
   * Register a schema with a unique name
   */
  registerSchema<T extends z.ZodTypeAny>(
    name: string,
    schema: T,
    options?: {
      description?: string
      deprecated?: boolean
      example?: z.infer<T>
    },
  ): T {
    // Store schema for later retrieval
    this.schemas.set(name, schema)

    // Register with OpenAPI
    const schemaWithMetadata = schema.openapi({
      ...options,
    })

    this.registry.register(name, schemaWithMetadata)

    return schema
  }

  /**
   * Register a component schema (for $ref usage)
   */
  registerComponent<T extends z.ZodTypeAny>(
    name: string,
    type: 'schemas',
    schema: T,
  ): T {
    // For schemas, we use the register method
    this.registry.register(name, schema)
    this.schemas.set(`${type}.${name}`, schema)

    return schema
  }

  /**
   * Register an API route
   */
  registerRoute(config: RouteConfig): void {
    // Debug logging
    if ((config as any).request?.body?.content) {
      const content = (config as any).request.body.content

      for (const [contentType, contentConfig] of Object.entries(content)) {
        if (!contentConfig || !(contentConfig as any).schema) {
          console.error(
            `ERROR: Route ${config.method} ${config.path} has undefined schema for ${contentType} request body`,
          )
          console.error('Content config:', contentConfig)
        }
      }
    }
    this.registry.registerPath(config)
  }

  /**
   * Get a registered schema by name
   */
  getSchema<T extends z.ZodTypeAny>(name: string): T | undefined {
    return this.schemas.get(name) as T
  }

  /**
   * Check if a schema exists
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name)
  }

  /**
   * Get all registered schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys())
  }

  /**
   * Extend an existing schema
   */
  extend<T extends z.ZodObject<any>>(
    name: string,
    extensions: z.ZodRawShape,
  ): z.ZodObject<T['shape'] & typeof extensions> {
    const base = this.getSchema<T>(name)

    if (!base || !('extend' in base)) {
      throw new Error(
        `Cannot extend schema '${name}' - not found or not an object schema`,
      )
    }

    return base.extend(extensions) as z.ZodObject<
      T['shape'] & typeof extensions
    >
  }

  /**
   * Merge two schemas
   */
  merge<T extends z.ZodObject<any>, U extends z.ZodObject<any>>(
    name1: string,
    name2: string,
  ): z.ZodObject<T['shape'] & U['shape']> {
    const schema1 = this.getSchema<T>(name1)
    const schema2 = this.getSchema<U>(name2)

    if (!schema1 || !schema2) {
      throw new Error(`Cannot merge schemas - one or both not found`)
    }

    if (!('merge' in schema1)) {
      throw new Error(`Schema '${name1}' is not an object schema`)
    }

    return schema1.merge(schema2)
  }

  /**
   * Pick fields from a schema
   */
  pick<T extends z.ZodObject<any>>(
    name: string,
    keys: (keyof T['shape'])[],
  ): z.ZodObject<any> {
    const schema = this.getSchema<T>(name)

    if (!schema || !('pick' in schema)) {
      throw new Error(
        `Cannot pick from schema '${name}' - not found or not an object schema`,
      )
    }

    const pickMask: any = {}

    keys.forEach((key) => {
      pickMask[key as string] = true
    })

    return schema.pick(pickMask)
  }

  /**
   * Omit fields from a schema
   */
  omit<T extends z.ZodObject<any>>(
    name: string,
    keys: (keyof T['shape'])[],
  ): z.ZodObject<any> {
    const schema = this.getSchema<T>(name)

    if (!schema || !('omit' in schema)) {
      throw new Error(
        `Cannot omit from schema '${name}' - not found or not an object schema`,
      )
    }

    const omitMask: any = {}

    keys.forEach((key) => {
      omitMask[key as string] = true
    })

    return schema.omit(omitMask)
  }

  /**
   * Make schema partial
   */
  partial<T extends z.ZodObject<any>>(name: string): z.ZodObject<any> {
    const schema = this.getSchema<T>(name)

    if (!schema || !('partial' in schema)) {
      throw new Error(
        `Cannot make schema '${name}' partial - not found or not an object schema`,
      )
    }

    return schema.partial()
  }

  /**
   * Create a reference to a registered schema
   */
  ref(name: string): z.ZodTypeAny {
    const schema = this.getSchema(name)

    if (!schema) {
      throw new Error(`Cannot create reference to schema '${name}' - not found`)
    }

    // Return the schema directly - it should already be registered with OpenAPI
    return schema
  }

  /**
   * Generate OpenAPI document
   */
  generateDocument(): any {
    const generator = new OpenApiGeneratorV31(this.registry.definitions)

    return generator.generateDocument({
      openapi: '3.1.0',
      info: {
        title: this.options.title,
        version: this.options.version,
        description: this.options.description,
      },
      servers: this.options.servers,
      tags: this.options.tags,
      security: this.options.security,
    })
  }

  /**
   * Register security schemes
   */
  registerSecurityScheme(name: string, scheme: SecuritySchemeObject): void {
    this.registry.registerComponent('securitySchemes', name, scheme)
  }

  /**
   * Register common parameters
   */
  registerParameter(name: string, parameter: z.ZodTypeAny): void {
    this.registry.registerParameter(name, parameter)
  }

  /**
   * Batch register multiple schemas
   */
  registerMany(
    schemas: Record<
      string,
      {
        schema: z.ZodTypeAny
        description?: string
        deprecated?: boolean
      }
    >,
  ): void {
    Object.entries(schemas).forEach(([name, config]) => {
      this.registerSchema(name, config.schema, {
        description: config.description,
        deprecated: config.deprecated,
      })
    })
  }

  /**
   * Create a scoped registry
   */
  scope(prefix: string): ScopedRegistry {
    return new ScopedRegistry(this, prefix)
  }

  /**
   * Clear all registered schemas
   */
  clear(): void {
    this.schemas.clear()
    this.registry = new OpenAPIRegistry()
  }
}

/**
 * Scoped registry for organizing schemas by prefix
 */
export class ScopedRegistry {
  constructor(
    private parent: ZodRegistry,
    private prefix: string,
  ) {}

  /**
   * Register a schema with scoped name
   */
  register<T extends z.ZodTypeAny>(
    name: string,
    schema: T,
    options?: {
      description?: string
      deprecated?: boolean
      example?: z.infer<T>
    },
  ): T {
    return this.parent.registerSchema(`${this.prefix}.${name}`, schema, options)
  }

  /**
   * Get a schema with scoped name
   */
  getSchema<T extends z.ZodTypeAny>(name: string): T | undefined {
    return this.parent.getSchema(`${this.prefix}.${name}`)
  }

  /**
   * Create a reference with scoped name
   */
  ref(name: string): z.ZodTypeAny {
    return this.parent.ref(`${this.prefix}.${name}`)
  }
}

/**
 * Create a new registry instance
 */
export function createRegistry(options: RegistryOptions): ZodRegistry {
  return new ZodRegistry(options)
}
