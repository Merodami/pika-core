#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

/**
 * Generate Swagger UI HTML documentation from OpenAPI JSON
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths
const TEMPLATE_PATH = join(__dirname, '../../docs-template.html')
const OUTPUT_DIR = join(__dirname, '../../../dist')
const OPENAPI_JSON_PATH = join(
  __dirname,
  '../../generated/openapi/test-public-api.json',
)
const OUTPUT_HTML_PATH = join(OUTPUT_DIR, 'openapi-zod.html')

async function generateSwaggerDocs() {
  try {
    console.log('🔧 Generating Swagger documentation for Zod OpenAPI spec...')

    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true })

    // Read the generated OpenAPI JSON
    console.log('📖 Reading OpenAPI spec from:', OPENAPI_JSON_PATH)

    const openApiSpec = JSON.parse(readFileSync(OPENAPI_JSON_PATH, 'utf8'))

    // Read the template
    console.log('📖 Reading template from:', TEMPLATE_PATH)

    const template = readFileSync(TEMPLATE_PATH, 'utf8')

    // Replace placeholders in the template
    const htmlOutput = template
      .replace('{{SPEC}}', JSON.stringify(openApiSpec))
      .replace('{{TITLE}}', openApiSpec.info.title)

    // Write the HTML file
    console.log('📝 Writing Swagger UI to:', OUTPUT_HTML_PATH)
    writeFileSync(OUTPUT_HTML_PATH, htmlOutput)

    console.log('✅ Swagger documentation generated successfully!')
    console.log('\n📚 To view the documentation:')
    console.log('   1. Run: yarn open:docs:zod')
    console.log('   2. Or open:', OUTPUT_HTML_PATH)
  } catch (error) {
    console.error('❌ Error generating Swagger documentation:', error)
    process.exit(1)
  }
}

// Run the generation
generateSwaggerDocs()
