/**
 * Frontend Authentication Schemas
 * Extending backend schemas with UI-specific concerns
 *
 * Architecture: Backend Schema → .extend() → Frontend Schema
 * Benefits: Single source of truth, automatic consistency, type safety
 */

// Export all form schemas and transforms
export * from './forms.js'

// Re-export standardized primitives for frontend use
export {
  Email,
  JWTToken,
  Money,
  Percentage,
  URL,
  UserId,
} from '../../shared/branded.js'
export {
  PaginationParams,
  SearchParams,
  SortParams,
} from '../../shared/pagination.js'
export {
  DateOnly,
  DateTime,
  PhoneNumber,
  UUID,
} from '../../shared/primitives.js'

// Re-export backend auth schemas for reference
export {
  AuthTokensResponse,
  AuthUserResponse,
  RegisterRequest,
  TokenRequest,
} from '../public/index.js'
