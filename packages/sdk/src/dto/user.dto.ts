/**
 * User DTOs (Data Transfer Objects)
 * These represent the API contract for user-related endpoints
 */

// ============= Address DTO =============

export interface AddressDTO {
  id: string
  userId: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  location?: {
    lat: number
    lng: number
  }
  createdAt: string
  updatedAt: string
}

// ============= Payment Method DTO =============

export interface PaymentMethodDTO {
  id: string
  userId: string
  paymentType: string
  cardBrand?: string
  lastFour?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// ============= User DTO =============

export interface UserDTO {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber?: string
  phoneVerified: boolean
  avatarUrl?: string
  role: string
  status: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  // Additional fields
  dateOfBirth?: string
  stripeUserId?: string
}

// ============= Create/Update DTOs =============

export interface CreateUserDTO {
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
}

export interface UpdateUserDTO {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  avatarUrl?: string
  dateOfBirth?: string
}

export interface CreateAddressDTO {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault?: boolean
}

export interface UpdateAddressDTO {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  isDefault?: boolean
}
