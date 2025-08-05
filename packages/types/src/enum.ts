/**
 * Common enums for the application
 */

/**
 * User roles in the system
 * Must match Prisma schema definitions
 */
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  BUSINESS = 'business',
}

/**
 * Type definition for user roles - use this for type annotations
 */
export type UserRoleType = `${UserRole}`

/**
 * User status in the system
 * Must match Prisma schema definitions
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  UNCONFIRMED = 'unconfirmed',
}

/**
 * Type definition for user status - use this for type annotations
 */
export type UserStatusType = `${UserStatus}`

/**
 * Communication channels for notifications and messages
 * Used for multi-channel communication delivery
 */
export enum CommunicationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

/**
 * Type definition for communication channels - use this for type annotations
 */
export type CommunicationChannelType = `${CommunicationChannel}`

/**
 * User verification types for unified verification system
 * Used for email, phone, and account confirmation verification
 */
export enum VerificationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  ACCOUNT_CONFIRMATION = 'ACCOUNT_CONFIRMATION',
}

/**
 * Type definition for verification type - use this for type annotations
 */
export type VerificationTypeType = `${VerificationType}`

/**
 * User verification status tracking
 * Used to track the status of verification processes
 */
export enum VerificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Type definition for verification status - use this for type annotations
 */
export type VerificationStatusType = `${VerificationStatus}`

/**
 * Business sort fields
 * Used for sorting business listings and admin panels
 */
export enum BusinessSortBy {
  BUSINESS_NAME = 'businessName',
  AVG_RATING = 'avgRating',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for business sort by - use this for type annotations
 */
export type BusinessSortByType = `${BusinessSortBy}`

/**
 * Admin business sort fields (includes additional admin-only fields)
 * Used for admin panel business management
 */
export enum AdminBusinessSortBy {
  BUSINESS_NAME = 'businessName',
  AVG_RATING = 'avgRating',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  USER_ID = 'userId',
  CATEGORY_ID = 'categoryId',
}

/**
 * Type definition for admin business sort by - use this for type annotations
 */
export type AdminBusinessSortByType = `${AdminBusinessSortBy}`

/**
 * Business status filters
 * Used for filtering business listings by status
 */
export enum BusinessStatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}

/**
 * Type definition for business status filter - use this for type annotations
 */
export type BusinessStatusFilterType = `${BusinessStatusFilter}`

/**
 * User sort fields
 * Used for sorting user listings and admin panels
 */
export enum UserSortBy {
  NAME = 'name',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLogin',
}

/**
 * Type definition for user sort by - use this for type annotations
 */
export type UserSortByType = `${UserSortBy}`

/**
 * Admin user sort fields
 * Used for admin panel user management
 */
export enum AdminUserSortBy {
  CREATED_AT = 'createdAt',
  LAST_LOGIN_AT = 'lastLoginAt',
  EMAIL = 'email',
}

/**
 * Type definition for admin user sort by - use this for type annotations
 */
export type AdminUserSortByType = `${AdminUserSortBy}`

/**
 * Admin note categories
 * Used for categorizing admin notes on user accounts
 */
export enum AdminNoteCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  SUPPORT = 'support',
  BILLING = 'billing',
}

/**
 * Type definition for admin note category - use this for type annotations
 */
export type AdminNoteCategoryType = `${AdminNoteCategory}`

/**
 * User activity categories
 * Used for tracking and categorizing user activities
 */
export enum UserActivityCategory {
  AUTH = 'auth',
  PROFILE = 'profile',
  PAYMENT = 'payment',
  OTHER = 'other',
}

/**
 * Type definition for user activity category - use this for type annotations
 */
export type UserActivityCategoryType = `${UserActivityCategory}`

/**
 * Image formats supported by the system
 * Used for profile pictures and image uploads
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
}

/**
 * Type definition for image format - use this for type annotations
 */
export type ImageFormatType = `${ImageFormat}`

/**
 * UI theme options
 * Used for user interface theme preferences
 */
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Type definition for theme - use this for type annotations
 */
export type ThemeType = `${Theme}`

/**
 * Profile visibility options
 * Used for user profile privacy settings
 */
export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/**
 * Type definition for profile visibility - use this for type annotations
 */
export type ProfileVisibilityType = `${ProfileVisibility}`

/**
 * Verification levels for user accounts
 * Used to track the level of account verification
 */
export enum VerificationLevel {
  NONE = 'none',
  EMAIL = 'email',
  PHONE = 'phone',
  FULL = 'full',
}

/**
 * Type definition for verification level - use this for type annotations
 */
export type VerificationLevelType = `${VerificationLevel}`

/**
 * Credit operations for user accounts
 * Used for credit balance adjustments
 */
export enum CreditOperation {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
}

/**
 * Type definition for credit operation - use this for type annotations
 */
export type CreditOperationType = `${CreditOperation}`

/**
 * Permission actions for access control
 * Used for role-based access control systems
 */
export enum PermissionAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Type definition for permission action - use this for type annotations
 */
export type PermissionActionType = `${PermissionAction}`

/**
 * Account flags for user accounts
 * Used for marking special account states or properties
 */
export enum AccountFlag {
  VERIFIED = 'verified',
  PREMIUM = 'premium',
  SUSPICIOUS = 'suspicious',
  REPORTED = 'reported',
  VIP = 'vip',
}

/**
 * Type definition for account flag - use this for type annotations
 */
export type AccountFlagType = `${AccountFlag}`

/**
 * Category sort fields
 * Used for sorting category listings and admin panels
 */
export enum CategorySortBy {
  NAME = 'name',
  SORT_ORDER = 'sortOrder',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for category sort by - use this for type annotations
 */
export type CategorySortByType = `${CategorySortBy}`
