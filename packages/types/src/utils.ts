/**
 * Utility functions for type mapping and validation
 */

import { UserRole, UserStatus } from './enum.js'

/**
 * Maps any role value to UserRole enum
 * Used by all mappers to ensure consistent role mapping
 */
export function mapUserRole(role: any): UserRole {
  if (!role) return UserRole.CUSTOMER

  const roleStr = String(role).toLowerCase()

  switch (roleStr) {
    case 'admin':
      return UserRole.ADMIN
    case 'customer':
      return UserRole.CUSTOMER
    case 'business':
      return UserRole.BUSINESS
    default:
      return UserRole.CUSTOMER
  }
}

/**
 * Maps any status value to UserStatus enum
 * Used by all mappers to ensure consistent status mapping
 */
export function mapUserStatus(status: any): UserStatus {
  if (!status) return UserStatus.ACTIVE

  const statusStr = String(status).toLowerCase()

  switch (statusStr) {
    case 'active':
      return UserStatus.ACTIVE
    case 'suspended':
      return UserStatus.SUSPENDED
    case 'banned':
      return UserStatus.BANNED
    case 'unconfirmed':
      return UserStatus.UNCONFIRMED
    default:
      return UserStatus.ACTIVE
  }
}

/**
 * Maps UserRole to permissions array for RBAC
 * Used by auth middleware and controllers for consistent permissions
 *
 * Permission format: resource:action:scope
 * - resource: The resource being accessed (users, businesses, vouchers, etc.)
 * - action: The action being performed (read, write, delete, etc.)
 * - scope: Optional scope limitation (own, all, specific)
 *
 * Special permissions:
 * - resource:* - All actions on a resource
 * - resource:action:own - Action limited to owned resources
 */
export function mapRoleToPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        // User management
        'users:read',
        'users:write',
        'users:delete',
        // Business management
        'businesses:read',
        'businesses:write',
        'businesses:delete',
        'businesses:verify',
        'admin:businesses', // Admin-specific business management
        // Category management
        'categories:read',
        'categories:write',
        'categories:delete',
        'admin:categories', // Admin-specific category management
        // Voucher management
        'vouchers:read',
        'vouchers:write',
        'vouchers:delete',
        'vouchers:publish',
        'vouchers:archive',
        // Notification management
        'notifications:read',
        'notifications:write',
        'notifications:publish',
        'notifications:delete',
        // Payment management
        'payments:read',
        'payments:write',
        'payments:refund',
        // Reports and analytics
        'reports:read',
        'analytics:read',
        // Admin specific
        'admin:dashboard',
        'admin:settings',
        'admin:users',
        'admin:system',
        'admin:*', // All admin actions
        // Redemption management
        'redemptions:read',
        'redemptions:write',
        'redemptions:delete',
        // Support management
        'support:read',
        'support:write',
        'support:delete',
        'support:assign',
        // Subscription management
        'subscriptions:read',
        'subscriptions:write',
        'subscriptions:cancel',
        // PDF/Document management
        'documents:read',
        'documents:write',
        'documents:delete',
      ]
    case UserRole.BUSINESS:
      return [
        // Own business management
        'businesses:read:own',
        'businesses:write:own',
        // Vouchers for their business
        'vouchers:read:own',
        'vouchers:write:own',
        'vouchers:publish:own',
        'vouchers:update:status',
        // Category access (read-only)
        'categories:read',
        // User profile (own)
        'users:read:own',
        'users:write:own',
        // Notifications (own)
        'notifications:read:own',
        'notifications:write:own',
        // Payments (own)
        'payments:read:own',
        'payments:write:own',
        // Basic analytics for their business
        'analytics:read:own',
        'reports:read:own',
        // Redemption management (own)
        'redemptions:read:own',
        'redemptions:write:own',
        'redemptions:validate',
        // Support (own tickets)
        'support:read:own',
        'support:write:own',
        // Subscriptions (own)
        'subscriptions:read:own',
        // Documents (own)
        'documents:read:own',
        'documents:write:own',
      ]
    case UserRole.CUSTOMER:
      return [
        // Browse services and categories
        'businesses:read',
        'categories:read',
        'vouchers:read',
        // Voucher redemption
        'vouchers:redeem',
        // User profile (own)
        'users:read:own',
        'users:write:own',
        // Notifications (own)
        'notifications:read:own',
        'notifications:write:own',
        // Payments (own)
        'payments:read:own',
        'payments:write:own',
        // Redemptions (own)
        'redemptions:read:own',
        'redemptions:create',
        // Support (own tickets)
        'support:read:own',
        'support:write:own',
        // Subscriptions (own)
        'subscriptions:read:own',
        'subscriptions:purchase',
        // Documents (own)
        'documents:read:own',
      ]
    default:
      return []
  }
}
