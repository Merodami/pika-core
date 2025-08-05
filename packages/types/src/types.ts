import { DaysOfWeek, SupportedLanguage } from './const.js'
import { UserRole, UserStatus } from './enum.js'

/**
 * Metadata for paginated API responses.
 */
export type PaginationMetadata = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Generic type for wrapping paginated data with metadata.
 */
export type PaginatedResult<T> = {
  data: T[]
  pagination: PaginationMetadata
}

/**
 * Standard parameters for paginated API requests.
 */
export type PaginatedQuery = {
  page?: number
  limit?: number
}

/**
 * Options for the saveEventsWithRetry method
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in ms between retries (default: 100) */
  initialDelayMs?: number
  /** Maximum delay in ms between retries (default: 1000) */
  maxDelayMs?: number
  /** Multiplier for backoff (default: 2) */
  backoffMultiplier?: number
  /** Enable jitter to prevent retry storms (default: true) */
  jitter?: boolean
}

export type DayOfWeek = (typeof DaysOfWeek)[keyof typeof DaysOfWeek]

/**
 * Supported language code for internationalization
 * Based on ISO 639-1 language codes
 */
export type LanguageCode =
  (typeof SupportedLanguage)[keyof typeof SupportedLanguage]

/**
 * Basic user interface
 * This matches the User model in Prisma schema
 */
export interface User {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber?: string | null
  phoneVerified: boolean
  avatarUrl?: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt?: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt?: Date | null
}

/**
 * User summary for inclusion in other entities
 * Contains only essential, non-sensitive user information
 */
export interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  role: UserRole
  status: UserStatus
  avatarUrl?: string | null
}

/**
 * JWT Token payload structure
 * Standardized across @pika/auth and @pika/http
 */
export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  status: UserStatus
  type: 'access' | 'refresh'
  permissions?: string[]
  sessionId?: string
  iat?: number
  exp?: number
  iss?: string
  aud?: string
}

/**
 * Service context for inter-service communication
 * Used to propagate request context between services
 */
export interface ServiceContext {
  userId?: string
  userEmail?: string
  userRole?: string
  correlationId?: string
  serviceName?: string
  serviceId?: string
  useServiceAuth?: boolean
}

/**
 * Standard parameters for including relations in API responses
 * Following industry standards like JSON:API and GraphQL
 */
export interface IncludeRelations {
  /**
   * Comma-separated list of relations to include
   * Example: "stuff,hourlyPrices,specialPrices"
   */
  include?: string
}

/**
 * Parsed include relations structure
 * Used internally after parsing the include parameter
 */
export interface ParsedIncludes {
  [key: string]: boolean | ParsedIncludes
}

/**
 * Combined query parameters for paginated requests with relations
 */
export interface PaginatedQueryWithIncludes
  extends PaginatedQuery,
    IncludeRelations {}

/**
 * Standard search parameters with relation support
 */
export interface SearchParams extends PaginatedQuery {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search parameters with relation support
 */
export interface SearchParamsWithIncludes
  extends SearchParams,
    IncludeRelations {}
