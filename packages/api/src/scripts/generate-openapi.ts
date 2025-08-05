#!/usr/bin/env tsx

// Load environment variables before importing anything else
import { config } from 'dotenv'
import { dirname as pathDirname, join as pathJoin } from 'path'
import { fileURLToPath as fileUrlToPath } from 'url'

const __currentFilename = fileUrlToPath(import.meta.url)
const __currentDirname = pathDirname(__currentFilename)

// Load environment variables from project root
config({ path: pathJoin(__currentDirname, '../../../../.env') })
config({ path: pathJoin(__currentDirname, '../../../../.env.local') })

import { API_GATEWAY_BASE_URL, SERVICE_HOST } from '@pika/environment'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { createRegistry } from '../common/registry/base.js'
import {
  apiKeyAuth,
  bearerAuth,
  documentRoute,
} from '../common/utils/openapi.js'
// Import schemas
import * as authSchemas from '../schemas/auth/public/login.js'
import * as oauthSchemas from '../schemas/auth/public/oauth.js'
import { ErrorResponse } from '../schemas/shared/errors.js'

/**
 * Generate OpenAPI specifications for all APIs
 * This script creates the OpenAPI JSON files that can be used with openapi-typescript-codegen
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Output directory for OpenAPI specs
const OUTPUT_DIR = join(__dirname, '../../generated/openapi')

// ============= Public API Registry =============

const publicRegistry = createRegistry({
  title: 'Pika Public API',
  version: '1.0.0',
  description: 'Public API for Pika mobile and web applications',
  servers: [
    {
      url: `${API_GATEWAY_BASE_URL || 'http://localhost:5500'}/api/v1`,
      description: 'Local Development',
    },
    { url: 'https://api.pika.com/v1', description: 'Production' },
    { url: 'https://staging-api.pikaom/v1', description: 'Staging' },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management',
    },
    { name: 'Users', description: 'User profile and account management' },
    { name: 'Sessions', description: 'Training sessions and bookings' },
    { name: 'Gyms', description: 'Gym discovery and information' },
    { name: 'Inductions', description: 'Gym induction requests' },
    { name: 'Payments', description: 'Payment processing and history' },
  ],
})

// Register security schemes
publicRegistry.registerSecurityScheme('bearerAuth', bearerAuth)

// Register common auth schemas
publicRegistry.registerSchema(
  'AuthTokensResponse',
  authSchemas.AuthTokensResponse,
)
publicRegistry.registerSchema('AuthUserResponse', authSchemas.AuthUserResponse)

// Register OAuth schemas
publicRegistry.registerSchema('TokenRequest', oauthSchemas.TokenRequest)
publicRegistry.registerSchema('TokenResponse', oauthSchemas.TokenResponse)
publicRegistry.registerSchema(
  'IntrospectRequest',
  oauthSchemas.IntrospectRequest,
)
publicRegistry.registerSchema(
  'IntrospectResponse',
  oauthSchemas.IntrospectResponse,
)
publicRegistry.registerSchema(
  'RevokeTokenRequest',
  oauthSchemas.RevokeTokenRequest,
)
publicRegistry.registerSchema(
  'RevokeTokenResponse',
  oauthSchemas.RevokeTokenResponse,
)
publicRegistry.registerSchema('UserInfoResponse', oauthSchemas.UserInfoResponse)

// OAuth 2.0 routes are registered below

// OAuth 2.0 endpoints
publicRegistry.registerRoute(
  documentRoute({
    method: 'post',
    path: '/auth/token',
    summary: 'OAuth 2.0 Token Endpoint',
    description:
      'Exchange credentials or refresh token for access tokens (RFC 6749)',
    tags: ['Authentication'],
    requestBody: {
      description: 'Token request',
      schema: oauthSchemas.TokenRequest,
    },
    responses: {
      200: {
        schema: oauthSchemas.TokenResponse,
        description: 'Successfully generated tokens',
      },
      400: {
        schema: ErrorResponse,
        description: 'Invalid request',
      },
      401: {
        schema: ErrorResponse,
        description: 'Invalid credentials',
      },
    },
  }),
)

publicRegistry.registerRoute(
  documentRoute({
    method: 'post',
    path: '/auth/introspect',
    summary: 'OAuth 2.0 Token Introspection',
    description: 'Check if a token is active and get its metadata (RFC 7662)',
    tags: ['Authentication'],
    requestBody: {
      description: 'Token to introspect',
      schema: oauthSchemas.IntrospectRequest,
    },
    responses: {
      200: {
        schema: oauthSchemas.IntrospectResponse,
        description: 'Token introspection result',
      },
    },
  }),
)

publicRegistry.registerRoute(
  documentRoute({
    method: 'post',
    path: '/auth/revoke',
    summary: 'OAuth 2.0 Token Revocation',
    description: 'Revoke an access or refresh token (RFC 7009)',
    tags: ['Authentication'],
    requestBody: {
      description: 'Token to revoke',
      schema: oauthSchemas.RevokeTokenRequest,
    },
    responses: {
      200: {
        schema: oauthSchemas.RevokeTokenResponse,
        description: 'Token successfully revoked',
      },
    },
  }),
)

publicRegistry.registerRoute(
  documentRoute({
    method: 'get',
    path: '/auth/userinfo',
    summary: 'OAuth 2.0 UserInfo Endpoint',
    description: 'Get information about the authenticated user',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        schema: oauthSchemas.UserInfoResponse,
        description: 'User information',
      },
      401: {
        schema: ErrorResponse,
        description: 'Not authenticated',
      },
    },
  }),
)

// ============= Admin API Registry =============

const adminRegistry = createRegistry({
  title: 'Pika Admin API',
  version: '1.0.0',
  description: 'Administrative API for Pika platform management',
  servers: [
    { url: 'https://admin-api.pikaom/v1', description: 'Production' },
    { url: 'https://staging-admin-api.pikaom/v1', description: 'Staging' },
    { url: `http://${SERVICE_HOST}:9001/v1`, description: 'Local Development' },
  ],
  tags: [
    { name: 'Dashboard', description: 'Admin dashboard and analytics' },
    { name: 'User Management', description: 'Manage platform users' },
    { name: 'Gym Management', description: 'Manage gyms and facilities' },
    {
      name: 'Stuff Management',
      description: 'Manage gym equipment and amenities',
    },
    {
      name: 'Induction Management',
      description: 'Manage gym induction requests',
    },
    {
      name: 'Transaction Management',
      description: 'Manage payments and transactions',
    },
    { name: 'Content Management', description: 'Manage platform content' },
    { name: 'Reports', description: 'Generate and view reports' },
  ],
  security: [{ bearerAuth: [] }], // All admin endpoints require auth
})

adminRegistry.registerSecurityScheme('bearerAuth', bearerAuth)

// ============= Internal API Registry =============

const internalRegistry = createRegistry({
  title: 'Pika Internal API',
  version: '1.0.0',
  description: 'Internal service-to-service API contracts',
  servers: [
    {
      url: 'http://internal-api.pikaocal',
      description: 'Internal Network',
    },
    { url: `http://${SERVICE_HOST}:9002`, description: 'Local Development' },
  ],
  tags: [
    { name: 'Events', description: 'Domain event publishing and subscription' },
    { name: 'Service Health', description: 'Service health and metrics' },
    { name: 'Data Sync', description: 'Cross-service data synchronization' },
    { name: 'Background Jobs', description: 'Async job processing' },
  ],
  security: [{ apiKeyAuth: [] }], // All internal endpoints use API key
})

internalRegistry.registerSecurityScheme('apiKeyAuth', apiKeyAuth)

// ============= Generate OpenAPI Documents =============

function generateOpenAPIFiles() {
  try {
    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })

    // Generate Public API spec
    const publicSpec = publicRegistry.generateDocument()

    writeFileSync(
      join(OUTPUT_DIR, 'public-api.json'),
      JSON.stringify(publicSpec, null, 2),
    )
    console.log('✅ Generated public-api.json')

    // Generate Admin API spec
    const adminSpec = adminRegistry.generateDocument()

    writeFileSync(
      join(OUTPUT_DIR, 'admin-api.json'),
      JSON.stringify(adminSpec, null, 2),
    )
    console.log('✅ Generated admin-api.json')

    // Generate Internal API spec
    const internalSpec = internalRegistry.generateDocument()

    writeFileSync(
      join(OUTPUT_DIR, 'internal-api.json'),
      JSON.stringify(internalSpec, null, 2),
    )
    console.log('✅ Generated internal-api.json')

    // Generate combined spec for SDK generation
    const combinedSpec = {
      openapi: '3.1.0',
      info: {
        title: 'Pika Combined API',
        version: '1.0.0',
        description: 'Combined API specification for SDK generation',
      },
      paths: {
        ...publicSpec.paths,
        // Add admin and internal paths with prefixes if needed
      },
      components: {
        schemas: {
          ...publicSpec.components?.schemas,
          ...adminSpec.components?.schemas,
          ...internalSpec.components?.schemas,
        },
        securitySchemes: {
          ...publicSpec.components?.securitySchemes,
          ...adminSpec.components?.securitySchemes,
          ...internalSpec.components?.securitySchemes,
        },
      },
    }

    writeFileSync(
      join(OUTPUT_DIR, 'combined-api.json'),
      JSON.stringify(combinedSpec, null, 2),
    )
    console.log('✅ Generated combined-api.json')

    console.log('\n📁 OpenAPI specifications generated in:', OUTPUT_DIR)
    console.log('\nNext steps:')
    console.log('1. Run "yarn generate:sdk" to generate TypeScript SDK')
    console.log('2. Use the generated specs with your API documentation tools')
    console.log('3. Import the specs into Postman or Insomnia for testing')
  } catch (error) {
    console.error('❌ Error generating OpenAPI specifications:', error)
    process.exit(1)
  }
}

// Run generation
generateOpenAPIFiles()
