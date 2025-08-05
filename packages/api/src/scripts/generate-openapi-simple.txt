#!/usr/bin/env tsx

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { API_GATEWAY_BASE_URL } from '@pika/environment'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

import { createSimpleRegistry } from '../common/registry/simple.js'
// Import schemas
import * as oauthSchemas from '../public/schemas/auth/oauth.js'

/**
 * Simple OpenAPI generation script for testing
 */

// Extend Zod with OpenAPI
extendZodWithOpenApi(z)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Output directory
const OUTPUT_DIR = join(__dirname, '../../generated/openapi')

// Create Public API registry
const publicRegistry = createSimpleRegistry({
  title: 'Pika Public API',
  version: '1.0.0',
  description: 'Public API for Pika applications',
  servers: [{ url: `${API_GATEWAY_BASE_URL}/v1`, description: 'API Gateway' }],
})

// Register schemas
publicRegistry.registerSchema('TokenRequest', oauthSchemas.TokenRequest)
publicRegistry.registerSchema('TokenResponse', oauthSchemas.TokenResponse)

// Register a simple test route
publicRegistry.registerRoute({
  method: 'post',
  path: '/auth/token',
  summary: 'OAuth 2.0 Token Endpoint',
  request: {
    body: {
      content: {
        'application/json': {
          schema: oauthSchemas.TokenRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: oauthSchemas.TokenResponse,
        },
      },
    },
  },
})

// Generate the document
try {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const document = publicRegistry.generateDocument()

  writeFileSync(
    join(OUTPUT_DIR, 'test-public-api.json'),
    JSON.stringify(document, null, 2),
  )

  console.log('✅ Generated test-public-api.json')
  console.log('📁 Output:', OUTPUT_DIR)
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}
