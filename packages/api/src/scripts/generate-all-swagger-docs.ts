#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

/**
 * Generate Swagger UI HTML for all APIs
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const TEMPLATE_PATH = join(__dirname, '../../docs-template.html')
const OUTPUT_DIR = join(__dirname, '../../../dist')
const OPENAPI_DIR = join(__dirname, '../../generated/openapi')

async function generateAllSwaggerDocs() {
  try {
    console.log('🔧 Generating Swagger documentation for all APIs...')

    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })

    // Read the template
    const template = readFileSync(TEMPLATE_PATH, 'utf8')

    // Generate docs for each API
    const apis = [
      {
        file: 'public-api.json',
        output: 'public-api-docs.html',
        title: 'Pika Public API',
      },
      {
        file: 'admin-api.json',
        output: 'admin-api-docs.html',
        title: 'Pika Admin API',
      },
      {
        file: 'internal-api.json',
        output: 'internal-api-docs.html',
        title: 'Pika Internal API',
      },
      {
        file: 'all-apis.json',
        output: 'all-apis-docs.html',
        title: 'Pika All APIs',
      },
    ]

    for (const api of apis) {
      const specPath = join(OPENAPI_DIR, api.file)
      const outputPath = join(OUTPUT_DIR, api.output)

      console.log(`📖 Processing ${api.file}...`)

      const spec = JSON.parse(readFileSync(specPath, 'utf8'))

      const htmlOutput = template
        .replace('{{SPEC}}', JSON.stringify(spec))
        .replace('{{TITLE}}', api.title)

      writeFileSync(outputPath, htmlOutput)
      console.log(`✅ Generated ${api.output}`)
    }

    // Create an index page to navigate between APIs
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pika API Documentation - Zod</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 40px;
        }
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .api-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            transition: transform 0.2s;
        }
        .api-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .api-card h2 {
            margin-top: 0;
            color: #007bff;
        }
        .api-card p {
            color: #666;
            margin: 10px 0;
        }
        .api-card a {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 16px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .api-card a:hover {
            background-color: #0056b3;
        }
        .all-apis {
            margin-top: 40px;
            text-align: center;
        }
        .all-apis a {
            display: inline-block;
            padding: 12px 24px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 18px;
        }
        .all-apis a:hover {
            background-color: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Pika API Documentation (Zod)</h1>
        
        <div class="api-grid">
            <div class="api-card">
                <h2>Public API</h2>
                <p>For mobile and web applications</p>
                <p><strong>Auth:</strong> JWT Bearer Token</p>
                <p><strong>Endpoints:</strong> Login, Profile, Sessions</p>
                <a href="public">View Documentation</a>
            </div>
            
            <div class="api-card">
                <h2>Admin API</h2>
                <p>For administrative dashboard</p>
                <p><strong>Auth:</strong> JWT Bearer Token (Admin)</p>
                <p><strong>Endpoints:</strong> Dashboard Stats</p>
                <a href="admin">View Documentation</a>
            </div>
            
            <div class="api-card">
                <h2>Internal API</h2>
                <p>For service-to-service communication</p>
                <p><strong>Auth:</strong> API Key</p>
                <p><strong>Endpoints:</strong> Health Checks</p>
                <a href="internal">View Documentation</a>
            </div>
        </div>
        
        <div class="all-apis">
            <a href="all">View All APIs Combined</a>
        </div>
    </div>
</body>
</html>
    `

    writeFileSync(join(OUTPUT_DIR, 'api-docs-index.html'), indexHtml)
    console.log('✅ Generated api-docs-index.html')

    console.log('\n📚 All documentation generated successfully!')
    console.log('\nView options:')
    console.log('  - All APIs Index: yarn open:docs:all')
    console.log('  - Public API: open dist/public-api-docs.html')
    console.log('  - Admin API: open dist/admin-api-docs.html')
    console.log('  - Internal API: open dist/internal-api-docs.html')
    console.log('  - Combined: open dist/all-apis-docs.html')
  } catch (error) {
    console.error('❌ Error generating documentation:', error)
    process.exit(1)
  }
}

// Run generation
generateAllSwaggerDocs()
