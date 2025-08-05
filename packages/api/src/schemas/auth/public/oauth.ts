import { OAuthError, UserRole as UserRoleEnum } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, JWTToken, UserId } from '../../shared/branded.js'
import { UserRoleSchema } from '../../user/common/enums.js'
import { OAuthErrorSchema, TokenTypeSchema } from '../common/enums.js'
import { AuthUserResponse } from './login.js'

/**
 * OAuth 2.0 compatible schemas with camelCase naming
 * Following RFC 6749 patterns adapted to our conventions
 */

// ============= Grant Types =============
// Grant types are now imported from ../common/enums.js

// ============= Token Request =============

/**
 * OAuth-compatible token request with camelCase
 */
export const TokenRequest = openapi(
  z.discriminatedUnion('grantType', [
    // Password Grant
    z.object({
      grantType: z.literal('password'),
      username: Email.describe('User email address'),
      password: z.string().min(8).describe('User password'),
      scope: z.string().optional().describe('Requested permissions'),
    }),
    // Refresh Token Grant
    z.object({
      grantType: z.literal('refreshToken'),
      refreshToken: JWTToken.describe('Valid refresh token'),
      scope: z
        .string()
        .optional()
        .describe('Requested permissions (subset of original)'),
    }),
  ]),
  {
    description: 'OAuth 2.0 compatible token request',
    example: {
      grantType: 'password',
      username: 'user@example.com' as any,
      password: 'securePassword123',
      scope: 'read write',
    },
  },
)

export type TokenRequest = z.infer<typeof TokenRequest>

// ============= Token Response =============

/**
 * OAuth-compatible token response with camelCase
 */
export const TokenResponse = openapi(
  z.object({
    accessToken: JWTToken.describe('JWT access token'),
    tokenType: z.literal('Bearer').describe('Token type'),
    expiresIn: z
      .number()
      .int()
      .positive()
      .describe('Token lifetime in seconds'),
    refreshToken: JWTToken.optional().describe('JWT refresh token'),
    scope: z.string().optional().describe('Granted permissions'),
    // Include user for better DX (non-standard but useful)
    user: AuthUserResponse.optional().describe(
      'User information for password grant',
    ),
  }),
  {
    description: 'OAuth 2.0 compatible token response',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' as any,
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' as any,
      scope: 'read write',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000' as any,
        email: 'user@example.com' as any,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRoleEnum.CUSTOMER,
      },
    },
  },
)

export type TokenResponse = z.infer<typeof TokenResponse>

// ============= Token Introspection =============

/**
 * Token introspection request
 */
export const IntrospectRequest = openapi(
  z.object({
    token: JWTToken.describe('Token to validate'),
    tokenTypeHint: TokenTypeSchema.optional(),
  }),
  {
    description: 'Token introspection request',
  },
)

export type IntrospectRequest = z.infer<typeof IntrospectRequest>

/**
 * Token introspection response
 */
export const IntrospectResponse = openapi(
  z.object({
    active: z.boolean().describe('Whether token is active'),
    scope: z.string().optional().describe('Token scopes'),
    username: Email.optional().describe('User email'),
    tokenType: z.literal('Bearer').optional(),
    exp: z.number().optional().describe('Expiration time (Unix timestamp)'),
    iat: z.number().optional().describe('Issued at (Unix timestamp)'),
    sub: UserId.optional().describe('Subject (user ID)'),
    // Custom fields
    userId: UserId.optional().describe('User ID'),
    userEmail: Email.optional().describe('User email'),
    userRole: UserRoleSchema.optional(),
  }),
  {
    description: 'Token introspection response',
    example: {
      active: true,
      scope: 'read write',
      username: 'user@example.com' as any,
      tokenType: 'Bearer',
      exp: 1234567890,
      iat: 1234567800,
      sub: '123e4567-e89b-12d3-a456-426614174000' as any,
      userId: '123e4567-e89b-12d3-a456-426614174000' as any,
      userEmail: 'user@example.com' as any,
      userRole: UserRoleEnum.CUSTOMER,
    },
  },
)

export type IntrospectResponse = z.infer<typeof IntrospectResponse>

// ============= Token Revocation =============

/**
 * Token revocation request
 */
export const RevokeTokenRequest = openapi(
  z.object({
    token: JWTToken.describe('Token to revoke'),
    tokenTypeHint: TokenTypeSchema.optional(),
    allDevices: z
      .boolean()
      .optional()
      .default(false)
      .describe('Revoke all tokens for user'),
  }),
  {
    description: 'Token revocation request',
  },
)

export type RevokeTokenRequest = z.infer<typeof RevokeTokenRequest>

/**
 * Token revocation response
 */
export const RevokeTokenResponse = openapi(
  z.object({
    success: z.boolean().default(true),
    message: z.string().default('Token revoked successfully'),
    revokedCount: z.number().optional().describe('Number of tokens revoked'),
  }),
  {
    description: 'Token revocation response',
  },
)

export type RevokeTokenResponse = z.infer<typeof RevokeTokenResponse>

// ============= User Info =============

/**
 * User info response (similar to OpenID Connect UserInfo)
 */
export const UserInfoResponse = openapi(
  z.object({
    id: UserId.describe('User ID'),
    email: Email,
    emailVerified: z.boolean().optional(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string().optional().describe('Combined first and last name'),
    profilePicture: z.string().url().optional(),
    role: UserRoleSchema,
    permissions: z.array(z.string()).optional().describe('User permissions'),
    locale: z.string().optional().describe('User locale'),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),
  {
    description: 'User information from access token',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000' as any,
      email: 'user@example.com' as any,
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: UserRoleEnum.CUSTOMER,
      permissions: ['read', 'write'],
      locale: 'en-US',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
)

export type UserInfoResponse = z.infer<typeof UserInfoResponse>

// ============= OAuth Error Response =============

/**
 * OAuth-compatible error response
 */
export const OAuthErrorResponse = openapi(
  z.object({
    error: OAuthErrorSchema,
    errorDescription: z
      .string()
      .optional()
      .describe('Human-readable error description'),
    errorUri: z
      .string()
      .url()
      .optional()
      .describe('URI with error information'),
  }),
  {
    description: 'OAuth 2.0 compatible error response',
    example: {
      error: OAuthError.INVALID_GRANT,
      errorDescription: 'The provided credentials are invalid',
    },
  },
)

export type OAuthErrorResponse = z.infer<typeof OAuthErrorResponse>
