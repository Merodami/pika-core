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

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import {
  API_GATEWAY_BASE_URL,
  AUTH_SERVICE_PORT,
  COMMUNICATION_SERVICE_PORT,
  FILE_STORAGE_SERVICE_PORT,
  PAYMENT_SERVICE_PORT,
  SERVICE_HOST,
  SUBSCRIPTION_SERVICE_PORT,
  SUPPORT_SERVICE_PORT,
  USER_SERVICE_PORT,
} from '@pika/environment'
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { z } from 'zod'

import { createRegistry } from '../common/registry/base.js'
import { registerAdminAPI } from './generators/admin-api.js'
import { registerInternalAPI } from './generators/internal-api.js'
import { registerPublicAPI } from './generators/public-api.js'

/**
 * Generate OpenAPI specifications for all three APIs
 */

// Extend Zod with OpenAPI
extendZodWithOpenApi(z)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Output directory
const OUTPUT_DIR = join(__dirname, '../../generated/openapi')

// ============= Public API =============
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
    { url: 'https://api.staging.pikaom/v1', description: 'Staging' },
  ],
})

// Register all public schemas and routes
registerPublicAPI(publicRegistry)

// ============= Admin API =============
const adminRegistry = createRegistry({
  title: 'Pika Admin API',
  version: '1.0.0',
  description: 'Administrative API for Pika platform management',
  servers: [
    {
      url: `${API_GATEWAY_BASE_URL || 'http://localhost:5500'}/api/v1`,
      description: 'Local Development',
    },
    { url: 'https://api.pikaom/v1', description: 'Production' },
    { url: 'https://api.staging.pikaom/v1', description: 'Staging' },
  ],
})

// Register all admin schemas and routes
registerAdminAPI(adminRegistry)

// ============= Internal API =============
const internalRegistry = createRegistry({
  title: 'Pika Internal API',
  version: '1.0.0',
  description: 'Internal service-to-service communication API',
  servers: [
    {
      url: `http://${SERVICE_HOST}:${AUTH_SERVICE_PORT}`,
      description: 'Auth Service',
    },
    {
      url: `http://${SERVICE_HOST}:${USER_SERVICE_PORT}`,
      description: 'User Service',
    },
    {
      url: `http://${SERVICE_HOST}:${SUBSCRIPTION_SERVICE_PORT}`,
      description: 'Subscription Service',
    },
    {
      url: `http://${SERVICE_HOST}:${COMMUNICATION_SERVICE_PORT}`,
      description: 'Communication Service',
    },
    {
      url: `http://${SERVICE_HOST}:${FILE_STORAGE_SERVICE_PORT}`,
      description: 'Storage Service',
    },
    {
      url: `http://${SERVICE_HOST}:${PAYMENT_SERVICE_PORT}`,
      description: 'Payment Service',
    },
    {
      url: `http://${SERVICE_HOST}:${SUPPORT_SERVICE_PORT}`,
      description: 'Support Service',
    },
  ],
})

// Register all internal schemas and routes
registerInternalAPI(internalRegistry)

// ============= Combined API (All APIs) =============
const allApisRegistry = createRegistry({
  title: 'Pika Complete API',
  version: '1.0.0',
  description:
    'Complete API documentation including public, admin, and internal endpoints',
  servers: [
    {
      url: `${API_GATEWAY_BASE_URL || 'http://localhost:5500'}/api/v1`,
      description: 'API Gateway',
    },
    {
      url: `http://${SERVICE_HOST}:${AUTH_SERVICE_PORT}`,
      description: 'Auth Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${USER_SERVICE_PORT}`,
      description: 'User Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${SUBSCRIPTION_SERVICE_PORT}`,
      description: 'Subscription Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${COMMUNICATION_SERVICE_PORT}`,
      description: 'Communication Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${FILE_STORAGE_SERVICE_PORT}`,
      description: 'Storage Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${PAYMENT_SERVICE_PORT}`,
      description: 'Payment Service (Internal)',
    },
    {
      url: `http://${SERVICE_HOST}:${SUPPORT_SERVICE_PORT}`,
      description: 'Support Service (Internal)',
    },
  ],
})

// Register all APIs into the combined registry
registerPublicAPI(allApisRegistry)
registerAdminAPI(allApisRegistry)
registerInternalAPI(allApisRegistry)

// Generate OpenAPI documents
const publicDoc = publicRegistry.generateDocument()
const adminDoc = adminRegistry.generateDocument()
const internalDoc = internalRegistry.generateDocument()
const allApisDoc = allApisRegistry.generateDocument()

// Create output directory if it doesn't exist
mkdirSync(OUTPUT_DIR, { recursive: true })

// Write OpenAPI documents
writeFileSync(
  join(OUTPUT_DIR, 'public-api.json'),
  JSON.stringify(publicDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'admin-api.json'),
  JSON.stringify(adminDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'internal-api.json'),
  JSON.stringify(internalDoc, null, 2),
)
writeFileSync(
  join(OUTPUT_DIR, 'all-apis.json'),
  JSON.stringify(allApisDoc, null, 2),
)

console.log('✅ OpenAPI documents generated successfully:')
console.log(`   📄 ${join(OUTPUT_DIR, 'public-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'admin-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'internal-api.json')}`)
console.log(`   📄 ${join(OUTPUT_DIR, 'all-apis.json')}`)

// Also generate a simple index file for serving
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pika API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 0.5rem;
        }
        .api-list {
            list-style: none;
            padding: 0;
        }
        .api-item {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .api-item h2 {
            margin-top: 0;
            color: #007bff;
        }
        .api-item p {
            color: #666;
            margin: 0.5rem 0;
        }
        .api-links {
            margin-top: 1rem;
        }
        .api-links a {
            display: inline-block;
            margin-right: 1rem;
            padding: 0.5rem 1rem;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .api-links a:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Pika API Documentation</h1>
    
    <ul class="api-list">
        <li class="api-item">
            <h2>Public API</h2>
            <p>API endpoints for mobile and web applications</p>
            <div class="api-links">
                <a href="public-api.json">OpenAPI JSON</a>
                <a href="public">View Documentation</a>
            </div>
        </li>
        
        <li class="api-item">
            <h2>Admin API</h2>
            <p>Administrative endpoints for platform management</p>
            <div class="api-links">
                <a href="admin-api.json">OpenAPI JSON</a>
                <a href="admin">View Documentation</a>
            </div>
        </li>
        
        <li class="api-item">
            <h2>Internal API</h2>
            <p>Service-to-service communication endpoints</p>
            <div class="api-links">
                <a href="internal-api.json">OpenAPI JSON</a>
                <a href="internal">View Documentation</a>
            </div>
        </li>
        
        <li class="api-item">
            <h2>Complete API</h2>
            <p>All APIs combined in a single specification</p>
            <div class="api-links">
                <a href="all-apis.json">OpenAPI JSON</a>
                <a href="all-apis">View Documentation</a>
            </div>
        </li>
    </ul>
</body>
</html>
`

writeFileSync(join(OUTPUT_DIR, 'index.html'), indexHtml)
console.log(`   📄 ${join(OUTPUT_DIR, 'index.html')}`)
