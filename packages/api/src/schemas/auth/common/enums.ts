import {
  DeviceType,
  GrantType,
  OAuthError,
  OAuthProvider,
  TokenType,
} from '@pika/types'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Auth-specific enum schemas
 * Following the standardized pattern with Schema suffix
 */

// Token type schema
export const TokenTypeSchema = openapi(createZodEnum(TokenType), {
  description: 'Type of authentication token',
  example: TokenType.ACCESS_TOKEN,
})

// Grant type schema
export const GrantTypeSchema = openapi(createZodEnum(GrantType), {
  description: 'OAuth2 grant type',
  example: GrantType.PASSWORD,
})

// OAuth provider schema
export const OAuthProviderSchema = openapi(createZodEnum(OAuthProvider), {
  description: 'Third-party OAuth provider',
  example: OAuthProvider.GOOGLE,
})

// OAuth error schema
export const OAuthErrorSchema = openapi(createZodEnum(OAuthError), {
  description: 'OAuth2 error codes',
  example: OAuthError.INVALID_REQUEST,
})

// Device type schema
export const DeviceTypeSchema = openapi(createZodEnum(DeviceType), {
  description: 'Type of device used for authentication',
  example: DeviceType.MOBILE,
})
