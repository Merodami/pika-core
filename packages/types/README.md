# 📝 @pika/types - Centralized Type System

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![Architecture](https://img.shields.io/badge/Architecture-Clean-green)
![Types](https://img.shields.io/badge/Types-Shared-purple)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Types package is the **foundational type system** for the Pika platform. It provides centralized TypeScript definitions, shared enumerations, and standardized interfaces that ensure type consistency across all microservices. The package serves as the single source of truth for domain types, error codes, and business logic enumerations.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/types:build

# Test types
yarn nx run @pikat
```

## 📋 Overview

The Types package provides shared TypeScript definitions used across the Pika platform:

- **Core Types**: Fundamental type definitions and interfaces
- **Enum Definitions**: Shared enumerations for consistent values
- **Error Codes**: Standardized error code definitions
- **Geolocation Types**: Location and mapping type definitions
- **Crypto Types**: Cryptographic and security-related types
- **Platform Constants**: Application-wide constant definitions
- **Business Logic Types**: Domain-specific enumerations and interfaces
- **Security Types**: Authentication and authorization type definitions

### Key Features

- 🎯 **Single Source of Truth**: Centralized type definitions for all services
- 🔒 **Type Safety**: Strict TypeScript enforcement across the platform
- 📊 **Standardized Enums**: Consistent business logic enumerations
- 🚨 **Error Code System**: Hierarchical error classification and handling
- 🌍 **Geolocation Support**: Comprehensive location and mapping types
- 🔐 **Security Types**: Authentication, authorization, and cryptographic types
- 🧪 **Testing Support**: Type guards and validation utilities
- 🔄 **Cross-Service Consistency**: Shared types prevent integration issues

## 🏗️ Architecture

```
src/
├── const.ts              # Platform constants
├── crypto.ts             # Cryptographic types
├── enum.ts               # Shared enumerations
├── errorCodes.ts         # Error code definitions
├── geolocation/          # Location-related types
│   ├── constants.ts      # Geolocation constants
│   ├── index.ts          # Geo exports
│   └── types.ts          # Geo type definitions
├── types.ts              # Core type definitions
└── index.ts              # Main exports
```

### Key Components

- **Shared Enums**: User roles, statuses, and business logic enums
- **Interface Definitions**: Common data structures and contracts
- **Error Codes**: Standardized error classification
- **Geographic Types**: Coordinate systems and location data
- **Security Types**: Authentication and authorization types

## 🔧 Usage

### Core Enumerations

```typescript
import { UserRole, UserStatus, SessionStatus, PaymentStatus, GymAmenity } from '@pika

// User role validation
function validateUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}

// Session status management
function updateSessionStatus(sessionId: string, status: SessionStatus) {
  // Type-safe status updates
  if (status === SessionStatus.CANCELLED) {
    // Handle cancellation logic
  }
}

// Payment processing
function processPayment(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.PENDING:
      // Handle pending payment
      break
    case PaymentStatus.COMPLETED:
      // Handle successful payment
      break
    case PaymentStatus.FAILED:
      // Handle failed payment
      break
  }
}
```

### Error Code System

```typescript
import { ErrorCode, ErrorCategory } from '@pika

// Standardized error handling
function createError(code: ErrorCode, message: string) {
  return {
    code,
    message,
    category: getErrorCategory(code),
    timestamp: new Date().toISOString(),
  }
}

// Error categorization
function getErrorCategory(code: ErrorCode): ErrorCategory {
  if (code.startsWith('AUTH')) return ErrorCategory.AUTHENTICATION
  if (code.startsWith('VAL')) return ErrorCategory.VALIDATION
  if (code.startsWith('SYS')) return ErrorCategory.SYSTEM
  return ErrorCategory.UNKNOWN
}
```

### Geolocation Types

```typescript
import { Coordinates, Address, DistanceUnit, BoundingBox } from '@pika

// Location-based operations
function calculateDistance(from: Coordinates, to: Coordinates, unit: DistanceUnit = DistanceUnit.KILOMETERS): number {
  // Distance calculation implementation
}

// Address standardization
function formatAddress(address: Address): string {
  return [address.street, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ')
}

// Geographic boundaries
function isWithinBounds(coordinate: Coordinates, bounds: BoundingBox): boolean {
  return coordinate.latitude >= bounds.southwest.latitude && coordinate.latitude <= bounds.northeast.latitude && coordinate.longitude >= bounds.southwest.longitude && coordinate.longitude <= bounds.northeast.longitude
}
```

### Cryptographic Types

```typescript
import { HashAlgorithm, EncryptionAlgorithm, TokenType, JwtClaims } from '@pika

// Token management
function createJwtClaims(userId: string, role: UserRole): JwtClaims {
  return {
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iss: 'pika-platform',
    aud: 'pikasers',
  }
}

// Hashing operations
function getHashConfig(algorithm: HashAlgorithm) {
  switch (algorithm) {
    case HashAlgorithm.BCRYPT:
      return { rounds: 12 }
    case HashAlgorithm.ARGON2:
      return { memory: 4096, iterations: 3, parallelism: 1 }
    default:
      throw new Error(`Unsupported hash algorithm: ${algorithm}`)
  }
}
```

## 📊 Core Type Definitions

### User Types

```typescript
export enum UserRole {
  USER = 'USER',
  TRAINER = 'TRAINER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserBase {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}
```

### Session Types

```typescript
export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SessionType {
  GROUP_CLASS = 'GROUP_CLASS',
  PERSONAL_TRAINING = 'PERSONAL_TRAINING',
  OPEN_GYM = 'OPEN_GYM',
  SPECIALTY_CLASS = 'SPECIALTY_CLASS',
}

export interface SessionBase {
  id: string
  title: string
  type: SessionType
  status: SessionStatus
  startTime: Date
  endTime: Date
  capacity: number
  creditCost: number
}
```

### Payment Types

```typescript
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export interface PaymentBase {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  processedAt?: Date
}
```

## 🧪 Testing

```bash
# Run type tests
yarn nx run @pikat

# Test type compilation
yarn tsc --noEmit

# Test enum values
yarn test --grep "enum"

# Test type guards
yarn test --grep "type-guard"
```

### Type Testing Examples

```typescript
import { UserRole, SessionStatus, PaymentStatus } from '@pika

describe('Type Definitions', () => {
  describe('UserRole enum', () => {
    it('should contain all expected roles', () => {
      expect(Object.values(UserRole)).toEqual(['USER', 'TRAINER', 'ADMIN', 'STAFF'])
    })

    it('should be used for type checking', () => {
      const role: UserRole = UserRole.ADMIN
      expect(role).toBe('ADMIN')
    })
  })

  describe('Type guards', () => {
    it('should validate user roles', () => {
      expect(isValidUserRole('ADMIN')).toBe(true)
      expect(isValidUserRole('INVALID')).toBe(false)
    })
  })
})
```

## 🔍 Error Code System

### Error Code Categories

```typescript
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorCode {
  // Authentication errors (AUTH_xxx)
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',

  // Validation errors (VAL_xxx)
  VAL_REQUIRED_FIELD = 'VAL_REQUIRED_FIELD',
  VAL_INVALID_FORMAT = 'VAL_INVALID_FORMAT',
  VAL_OUT_OF_RANGE = 'VAL_OUT_OF_RANGE',

  // Business logic errors (BL_xxx)
  BL_SESSION_FULL = 'BL_SESSION_FULL',
  BL_INSUFFICIENT_CREDITS = 'BL_INSUFFICIENT_CREDITS',
  BL_GYM_CLOSED = 'BL_GYM_CLOSED',

  // System errors (SYS_xxx)
  SYS_DATABASE_ERROR = 'SYS_DATABASE_ERROR',
  SYS_CACHE_ERROR = 'SYS_CACHE_ERROR',
  SYS_EXTERNAL_SERVICE_ERROR = 'SYS_EXTERNAL_SERVICE_ERROR',
}
```

## 🌍 Geolocation System

### Geographic Types

```typescript
export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  coordinates?: Coordinates
}

export interface BoundingBox {
  northeast: Coordinates
  southwest: Coordinates
}

export enum DistanceUnit {
  METERS = 'METERS',
  KILOMETERS = 'KILOMETERS',
  FEET = 'FEET',
  MILES = 'MILES',
}
```

### Distance Calculations

```typescript
// Geographic constants
export const GEO_CONSTANTS = {
  EARTH_RADIUS_KM: 6371,
  EARTH_RADIUS_MILES: 3959,
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
}

// Distance calculation utilities
export function degreesToRadians(degrees: number): number {
  return degrees * GEO_CONSTANTS.DEGREES_TO_RADIANS
}

export function radiansToDegrees(radians: number): number {
  return radians * GEO_CONSTANTS.RADIANS_TO_DEGREES
}
```

## 🔒 Security Types

### Authentication & Authorization

```typescript
export interface JwtClaims {
  sub: string // Subject (user ID)
  iss: string // Issuer
  aud: string // Audience
  exp: number // Expiration time
  iat: number // Issued at
  role: UserRole
  permissions?: string[]
}

export enum TokenType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  API_KEY = 'API_KEY',
  RESET_TOKEN = 'RESET_TOKEN',
}

export enum HashAlgorithm {
  BCRYPT = 'BCRYPT',
  ARGON2 = 'ARGON2',
  SCRYPT = 'SCRYPT',
}
```

## 🎯 Best Practices

### Type Design

1. **Descriptive Names**: Use clear, unambiguous names for types and enums
2. **Consistent Patterns**: Follow established naming conventions
3. **Immutable Types**: Prefer readonly properties where appropriate
4. **Generic Types**: Use generics for reusable type patterns
5. **Union Types**: Leverage union types for constrained values

### Enum Usage

1. **String Enums**: Always use string enums for serialization safety
2. **Explicit Values**: Define explicit values for database storage
3. **Hierarchical Naming**: Use prefixes for error codes and categories
4. **Backwards Compatibility**: Consider migration when changing enum values
5. **Documentation**: Document enum values and their use cases

### Error Handling

1. **Categorization**: Use error categories for consistent handling
2. **Hierarchical Codes**: Follow the prefix-based error code system
3. **Context Information**: Include relevant context in error types
4. **Localization**: Support for multiple languages in error messages
5. **Type Safety**: Use discriminated unions for error types

## 📝 Dependencies

### Core Dependencies

- **typescript**: Type system and compiler

### Internal Dependencies

- None (this is a foundational package)

## 📝 Changelog

### Recent Updates

- Implemented comprehensive enum system for business logic
- Added hierarchical error code classification
- Created geolocation type system with coordinate support
- Added security and cryptographic type definitions
- Implemented type guards and validation utilities
- Created platform-wide constants and configuration types
- Added JWT claims and authentication type definitions
- Enhanced error handling with categorized error codes

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Platform Team
