import type { ParsedIncludes } from '@pika/types'
import { get, set } from 'lodash-es'

import { ErrorFactory } from '../errors/index.js'

/**
 * Parses comma-separated include parameter into structured format
 * @param include - Comma-separated string of relations to include
 * @param allowedRelations - Array of allowed relation names
 * @returns Parsed includes object
 *
 * @example
 * parseIncludeParam('stuff,hourlyPrices', ['stuff', 'hourlyPrices', 'specialPrices'])
 * // Returns: { stuff: true, hourlyPrices: true }
 */
export function parseIncludeParam(
  include?: string,
  allowedRelations?: string[],
): ParsedIncludes {
  if (!include || include.trim() === '') {
    return {}
  }

  const relations = include
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  const parsed: ParsedIncludes = {}

  for (const relation of relations) {
    // Skip empty strings
    if (!relation) continue

    // Validate against allowed relations if provided
    if (allowedRelations && !allowedRelations.includes(relation)) {
      throw ErrorFactory.badRequest(
        `Invalid include parameter: '${relation}'. Allowed relations: ${allowedRelations.join(', ')}`,
      )
    }

    // For now, we only support top-level relations (no nesting)
    // Future: support dot notation like 'sessions.attendees'
    // Use lodash set for safe property assignment
    set(parsed, relation, true)
  }

  return parsed
}

/**
 * Converts parsed includes to Prisma include format
 * @param parsedIncludes - Parsed includes object
 * @returns Prisma-compatible include object
 *
 * @example
 * toPrismaInclude({ stuff: true, hourlyPrices: true })
 * // Returns: { stuff: true, hourlyPrices: true }
 */
export function toPrismaInclude(
  parsedIncludes: ParsedIncludes,
): Record<string, boolean | object> {
  const prismaInclude: Record<string, boolean | object> = {}

  for (const [key, value] of Object.entries(parsedIncludes)) {
    if (typeof value === 'boolean') {
      // Use lodash set for safe property assignment
      set(prismaInclude, key, value)
    } else {
      // Handle nested includes in the future
      // Use lodash set for safe property assignment
      set(prismaInclude, key, toPrismaInclude(value))
    }
  }

  return prismaInclude
}

/**
 * Helper to create a relation validator for a specific resource
 * @param allowedRelations - Array of allowed relation names
 * @returns Function that validates and parses include parameter
 */
export function createRelationValidator(allowedRelations: string[]) {
  return (include?: string): ParsedIncludes => {
    return parseIncludeParam(include, allowedRelations)
  }
}

/**
 * Type guard to check if includes contain a specific relation
 * @param includes - Parsed includes object
 * @param relation - Relation name to check
 * @returns True if relation is included
 */
export function includesRelation(
  includes: ParsedIncludes,
  relation: string,
): boolean {
  // Use lodash get for safe property access
  return get(includes, relation) === true
}

/**
 * Merge multiple include objects
 * Useful when combining default includes with user-specified includes
 */
export function mergeIncludes(...includes: ParsedIncludes[]): ParsedIncludes {
  return includes.reduce((merged, current) => {
    return { ...merged, ...current }
  }, {})
}
