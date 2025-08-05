import { z } from 'zod'

/**
 * Extracts values from a TypeScript enum as a tuple type
 * This is the industry standard solution to convert Object.values() result
 * into the tuple format that z.enum() expects
 *
 * @param enumObject - The TypeScript enum object
 * @returns Values as a tuple [string, ...string[]]
 */
function extractEnumValues<T extends Record<string, string>>(
  enumObject: T,
): [T[keyof T], ...T[keyof T][]] {
  const values = Object.values(enumObject) as T[keyof T][]

  if (values.length === 0) {
    throw new Error('Enum must have at least one value')
  }

  // TypeScript requires explicit tuple construction
  return [values[0], ...values.slice(1)] as [T[keyof T], ...T[keyof T][]]
}

/**
 * Creates a Zod enum schema from a TypeScript enum
 * This is the recommended approach to avoid deprecated z.nativeEnum()
 *
 * @param enumObject - The TypeScript enum object
 * @returns A Zod enum schema
 *
 * @example
 * ```typescript
 * import { UserStatus } from '@pika/types'
 *
 * const UserStatusSchema = createZodEnum(UserStatus)
 * // Can now use: UserStatusSchema.parse('active')
 * ```
 */
export function createZodEnum<T extends Record<string, string>>(enumObject: T) {
  const values = extractEnumValues(enumObject)

  return z.enum(values)
}

/**
 * Type helper to infer the enum values from a TypeScript enum
 *
 * @example
 * ```typescript
 * type UserStatusValues = EnumValues<typeof UserStatus>
 * // 'active' | 'suspended' | 'banned' | 'unconfirmed'
 * ```
 */
export type EnumValues<T extends Record<string, string>> = T[keyof T]
