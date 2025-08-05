import { z } from 'zod'

/**
 * Shared operation schemas used across services
 */

/**
 * Generic bulk operation response
 * Used for bulk update/delete operations across different services
 *
 * Services should extend this with specific entity ID fields in the errors array
 * Example: errors: z.array(z.object({ userId: UUID, error: z.string() }))
 */
export const BulkOperationResponseBase = z.object({
  successful: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of successful operations'),
  failed: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of failed operations'),
})

export type BulkOperationResponseBase = z.infer<
  typeof BulkOperationResponseBase
>

/**
 * Factory function to create a bulk operation response with specific entity ID
 * @param entityIdField - The field name for the entity ID (e.g., 'userId', 'voucherId')
 * @param entityIdType - The Zod schema for the entity ID type
 */
export function createBulkOperationResponse<T extends z.ZodTypeAny>(
  entityIdField: string,
  entityIdType: T,
) {
  return BulkOperationResponseBase.extend({
    errors: z
      .array(
        z.object({
          [entityIdField]: entityIdType,
          error: z.string(),
        }),
      )
      .optional()
      .describe('Details of failed operations'),
  })
}
