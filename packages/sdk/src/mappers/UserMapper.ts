import type { UserStatusType } from '@pika/types'
import { mapUserRole, mapUserStatus, UserRole, UserStatus } from '@pika/types'

import type {
  AddressDomain,
  PaymentMethodDomain,
  UserDomain,
} from '../domain/user.js'
import type { AddressDTO, PaymentMethodDTO, UserDTO } from '../dto/user.dto.js'
import {
  formatDateOnlyOrUndefined,
  formatDateToISO,
  formatDateToISOOrUndefined,
} from '../utils/dateUtils.js'

/**
 * Interface representing a database User document
 * Uses camelCase for fields as they come from Prisma
 */
export interface UserDocument {
  id: string
  email: string
  emailVerified: boolean
  password?: string | null
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: string
  status: string
  lastLoginAt?: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
  // Additional fields
  dateOfBirth?: Date | null
  stripeUserId?: string | null
}

/**
 * Interface for address document
 */
export interface AddressDocument {
  id: string
  userId: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  location?: {
    latitude: number
    longitude: number
  } | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Interface for payment method document
 */
export interface PaymentMethodDocument {
  id: string
  userId: string
  paymentType: string
  cardBrand?: string | null
  lastFour?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Domain types are now imported from '../domain/user.js'

/**
 * Comprehensive User mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 */
export class UserMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: UserDocument): UserDomain {
    return {
      id: doc.id,
      email: doc.email,
      emailVerified: doc.emailVerified,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phoneNumber: doc.phoneNumber,
      phoneVerified: doc.phoneVerified,
      avatarUrl: doc.avatarUrl,
      role: mapUserRole(doc.role),
      status: mapUserStatus(doc.status),
      lastLoginAt: doc.lastLoginAt ?? null,
      createdAt:
        doc.createdAt instanceof Date
          ? doc.createdAt
          : doc.createdAt
            ? new Date(doc.createdAt)
            : new Date(),
      updatedAt:
        doc.updatedAt instanceof Date
          ? doc.updatedAt
          : doc.updatedAt
            ? new Date(doc.updatedAt)
            : new Date(),
      deletedAt: doc.deletedAt
        ? doc.deletedAt instanceof Date
          ? doc.deletedAt
          : new Date(doc.deletedAt)
        : undefined,
      // Additional fields
      dateOfBirth: doc.dateOfBirth
        ? doc.dateOfBirth instanceof Date
          ? doc.dateOfBirth
          : new Date(doc.dateOfBirth)
        : undefined,
      stripeUserId: doc.stripeUserId,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: UserDomain): UserDTO {
    return {
      id: domain.id,
      email: domain.email,
      emailVerified: domain.emailVerified,
      firstName: domain.firstName,
      lastName: domain.lastName,
      phoneNumber: domain.phoneNumber || undefined,
      phoneVerified: domain.phoneVerified,
      avatarUrl: domain.avatarUrl || undefined,
      role: UserMapper.mapRoleToDTO(domain.role),
      status: UserMapper.mapStatusToDTO(domain.status),
      lastLoginAt: formatDateToISOOrUndefined(domain.lastLoginAt),
      createdAt: formatDateToISO(domain.createdAt),
      updatedAt: formatDateToISO(domain.updatedAt),
      // Additional fields
      dateOfBirth: formatDateOnlyOrUndefined(domain.dateOfBirth),
      // Admin fields - default values when not available
      stripeUserId: domain.stripeUserId || undefined,
    }
  }

  /**
   * Maps a domain entity to an Admin API DTO
   * Admin responses include branded types and formatted date strings
   */
  static toAdminDTO(domain: UserDomain): any {
    return {
      id: domain.id, // UserId branded type
      email: domain.email, // Email branded type
      firstName: domain.firstName,
      lastName: domain.lastName,
      phoneNumber: domain.phoneNumber || undefined,
      dateOfBirth: formatDateOnlyOrUndefined(domain.dateOfBirth), // YYYY-MM-DD format
      avatarUrl: domain.avatarUrl || undefined,
      status: domain.status, // UserStatus enum value
      role: domain.role, // UserRole enum value
      emailVerified: domain.emailVerified,
      phoneVerified: domain.phoneVerified,
      lastLoginAt: formatDateToISOOrUndefined(domain.lastLoginAt), // ISO string or undefined
      createdAt: formatDateToISO(domain.createdAt), // ISO string
      updatedAt: formatDateToISO(domain.updatedAt), // ISO string
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: UserDTO): UserDomain {
    return {
      id: dto.id,
      email: dto.email,
      emailVerified: dto.emailVerified,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber || null,
      phoneVerified: dto.phoneVerified,
      avatarUrl: dto.avatarUrl || null,
      role: mapUserRole(dto.role),
      status: mapUserStatus(dto.status),
      lastLoginAt: dto.lastLoginAt ? new Date(dto.lastLoginAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      // Additional fields
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      stripeUserId: dto.stripeUserId || null,
    }
  }

  /**
   * Maps address document to domain
   */
  static mapAddressFromDocument(doc: AddressDocument): AddressDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      addressLine1: doc.addressLine1,
      addressLine2: doc.addressLine2,
      city: doc.city,
      state: doc.state,
      postalCode: doc.postalCode,
      country: doc.country,
      isDefault: doc.isDefault,
      location: doc.location,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps address domain to DTO
   */
  static mapAddressToDTO(domain: AddressDomain): AddressDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      addressLine1: domain.addressLine1,
      addressLine2: domain.addressLine2 || undefined,
      city: domain.city,
      state: domain.state,
      postalCode: domain.postalCode,
      country: domain.country,
      isDefault: domain.isDefault,
      location: domain.location
        ? {
            lat: domain.location.latitude,
            lng: domain.location.longitude,
          }
        : undefined,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps payment method document to domain
   */
  static mapPaymentMethodFromDocument(
    doc: PaymentMethodDocument,
  ): PaymentMethodDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      paymentType: UserMapper.mapPaymentType(doc.paymentType),
      cardBrand: doc.cardBrand,
      lastFour: doc.lastFour,
      expiryMonth: doc.expiryMonth,
      expiryYear: doc.expiryYear,
      isDefault: doc.isDefault,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    }
  }

  /**
   * Maps payment method domain to DTO
   */
  static mapPaymentMethodToDTO(domain: PaymentMethodDomain): PaymentMethodDTO {
    return {
      id: domain.id,
      userId: domain.userId,
      paymentType: domain.paymentType,
      cardBrand: domain.cardBrand || undefined,
      lastFour: domain.lastFour || undefined,
      expiryMonth: domain.expiryMonth || undefined,
      expiryYear: domain.expiryYear || undefined,
      isDefault: domain.isDefault,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  // Role and status mapping functions are now imported from @pika/types

  /**
   * Maps payment type string to enum
   */
  private static mapPaymentType(
    type: string,
  ): 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH' {
    switch (type) {
      case 'CREDIT_CARD':
        return 'CREDIT_CARD'
      case 'DEBIT_CARD':
        return 'DEBIT_CARD'
      case 'BANK_TRANSFER':
        return 'BANK_TRANSFER'
      case 'CASH':
        return 'CASH'
      default:
        return 'CASH'
    }
  }

  /**
   * Maps domain role to DTO role (API compatible)
   */
  private static mapRoleToDTO(role: string): any {
    switch (role) {
      case UserRole.ADMIN:
        return UserRole.ADMIN
      case UserRole.CUSTOMER:
        return UserRole.CUSTOMER
      case UserRole.BUSINESS:
        return UserRole.BUSINESS
      default:
        return UserRole.CUSTOMER
    }
  }

  /**
   * Maps domain status to DTO status (API compatible)
   * UNCONFIRMED is mapped to SUSPENDED for API compatibility
   */
  private static mapStatusToDTO(status: string): UserStatusType {
    switch (status) {
      case UserStatus.ACTIVE:
        return UserStatus.ACTIVE
      case UserStatus.SUSPENDED:
        return UserStatus.SUSPENDED
      case UserStatus.UNCONFIRMED:
        return UserStatus.UNCONFIRMED
      case UserStatus.BANNED:
        return UserStatus.BANNED
      default:
        return UserStatus.ACTIVE
    }
  }
}
