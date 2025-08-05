import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { Address as AddressBase, GeoPoint } from '../../shared/geo.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'

/**
 * User address management schemas
 */

// ============= Address Types =============

export const AddressType = z.enum([
  'HOME',
  'WORK',
  'BILLING',
  'SHIPPING',
  'OTHER',
])
export type AddressType = z.infer<typeof AddressType>

// ============= User Address =============

/**
 * User address with metadata
 */
export const UserAddress = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,

    // Address details (extending base address)
    ...AddressBase.shape,

    // Address metadata
    type: AddressType,
    label: z.string().max(100).optional().describe('Custom label'),
    isDefault: z.boolean().default(false),
    isPrimary: z.boolean().default(false),

    // Verification
    isVerified: z.boolean().default(false),
    verifiedAt: z.string().datetime().optional(),

    // Additional info
    instructions: z
      .string()
      .max(500)
      .optional()
      .describe('Delivery instructions'),
    accessCode: z.string().max(50).optional(),
  }),
  {
    description: 'User address with metadata',
  },
)

export type UserAddress = z.infer<typeof UserAddress>

// ============= Create Address =============

/**
 * Create address request
 */
export const CreateAddressRequest = openapi(
  z.object({
    street: z.string().min(1).max(255),
    street2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2).describe('ISO 3166-1 alpha-2 country code'),

    type: AddressType,
    label: z.string().max(100).optional(),
    isDefault: z.boolean().optional(),

    instructions: z.string().max(500).optional(),
    accessCode: z.string().max(50).optional(),

    // Optional coordinates
    coordinates: GeoPoint.optional(),
  }),
  {
    description: 'Create a new address',
  },
)

export type CreateAddressRequest = z.infer<typeof CreateAddressRequest>

// ============= Update Address =============

/**
 * Update address request
 */
export const UpdateAddressRequest = openapi(
  CreateAddressRequest.partial().extend({
    isVerified: z.boolean().optional(),
  }),
  {
    description: 'Update an existing address',
  },
)

export type UpdateAddressRequest = z.infer<typeof UpdateAddressRequest>

// ============= Address Validation =============

/**
 * Validate address request
 */
export const ValidateAddressRequest = openapi(
  z.object({
    street: z.string().min(1).max(255),
    street2: z.string().max(255).optional(),
    city: z.string().min(1).max(100),
    state: z.string().min(1).max(100),
    postalCode: z.string().min(1).max(20),
    country: z.string().length(2),
  }),
  {
    description: 'Validate an address',
  },
)

export type ValidateAddressRequest = z.infer<typeof ValidateAddressRequest>

/**
 * Address validation response
 */
export const AddressValidationResponse = openapi(
  z.object({
    isValid: z.boolean(),

    // Standardized address
    standardized: AddressBase.optional(),

    // Validation details
    confidence: z.number().min(0).max(1).optional(),
    corrections: z
      .array(
        z.object({
          field: z.string(),
          original: z.string(),
          suggested: z.string(),
        }),
      )
      .optional(),

    // Geocoding result
    coordinates: GeoPoint.optional(),

    // Warnings
    warnings: z.array(z.string()).optional(),
  }),
  {
    description: 'Address validation result',
  },
)

export type AddressValidationResponse = z.infer<
  typeof AddressValidationResponse
>

// ============= Address List =============

/**
 * User addresses response
 */
export const UserAddressesResponse = openapi(
  z.object({
    addresses: z.array(UserAddress),
    defaultAddressId: UUID.optional(),
    primaryAddressId: UUID.optional(),
  }),
  {
    description: 'User addresses list',
  },
)

export type UserAddressesResponse = z.infer<typeof UserAddressesResponse>

// ============= Set Default Address =============

/**
 * Set default address request
 */
export const SetDefaultAddressRequest = openapi(
  z.object({
    addressId: UUID,
    type: AddressType.optional().describe('Set as default for specific type'),
  }),
  {
    description: 'Set default address',
  },
)

export type SetDefaultAddressRequest = z.infer<typeof SetDefaultAddressRequest>

// ============= Missing Response Schemas =============

/**
 * Single address response
 */
export const AddressResponse = openapi(UserAddress, {
  description: 'Single address details',
})

export type AddressResponse = z.infer<typeof AddressResponse>

/**
 * Address list response (paginated)
 */
export const AddressListResponse = openapi(
  z.object({
    data: z.array(UserAddress),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    hasMore: z.boolean(),
  }),
  {
    description: 'Paginated list of addresses',
  },
)

export type AddressListResponse = z.infer<typeof AddressListResponse>
