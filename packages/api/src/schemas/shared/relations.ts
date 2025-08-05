import { z } from 'zod'

/**
 * Standard include parameter schema
 * Used for endpoints that support relation inclusion
 */
export const includeParam = z
  .string()
  .optional()
  .describe('Comma-separated list of relations to include')
  .openapi({
    example: 'stuff,hourlyPrices,specialPrices',
  })

/**
 * Creates a validated include schema for specific allowed relations
 * @param allowedRelations - Array of allowed relation names
 * @returns Zod schema that validates the include parameter
 */
export function createIncludeSchema(allowedRelations: readonly string[]) {
  return z
    .string()
    .optional()
    .transform((val) => val?.trim())
    .refine(
      (val) => {
        if (!val) return true

        const relations = val.split(',').map((r) => r.trim())

        return relations.every((r) => allowedRelations.includes(r))
      },
      {
        message: `Invalid include parameter. Allowed relations: ${allowedRelations.join(', ')}`,
      },
    )
    .describe(
      `Include related data. Allowed values: ${allowedRelations.join(', ')}`,
    )
    .openapi({
      example: allowedRelations.slice(0, 2).join(','),
    })
}

/**
 * Base query parameters with include support
 */
export const withIncludeParam = <T extends z.ZodObject<any>>(
  schema: T,
  allowedRelations?: readonly string[],
) => {
  const includeSchema = allowedRelations
    ? createIncludeSchema(allowedRelations)
    : includeParam

  return schema.extend({
    include: includeSchema,
  })
}

/**
 * Helper to document include parameter in OpenAPI
 */
export function documentIncludeParam(
  allowedRelations: readonly string[],
): string {
  return `Use the 'include' parameter to include related data. Allowed relations: ${allowedRelations.join(', ')}. Example: ?include=${allowedRelations.slice(0, 2).join(',')}`
}
