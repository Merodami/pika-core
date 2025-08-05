/* eslint-disable security/detect-non-literal-fs-filename */
import dotenv from 'dotenv'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// 1. load .env
dotenv.config()

// 2. pick up PG_SCHEMA (default to "public")
const schema = process.env.PG_SCHEMA || 'public'

// 3. rewrite DATABASE_URL so Prisma picks up ?schema=<…>
if (process.env.DATABASE_URL) {
  const [base] = process.env.DATABASE_URL.split('?')

  process.env.DATABASE_URL = `${base}?schema=${schema}`
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRISMA_DIR = __dirname
const MODELS_DIR = join(PRISMA_DIR, 'models')
const BASE_FILE = join(PRISMA_DIR, 'base.prisma')
const ENUMS_FILE = join(PRISMA_DIR, 'enums.prisma')
const SCHEMA_FILE = join(PRISMA_DIR, 'schema.prisma')

const modelFiles = existsSync(MODELS_DIR)
  ? readdirSync(MODELS_DIR).filter((f) => f.endsWith('.prisma'))
  : []

const parts = [
  BASE_FILE,
  ENUMS_FILE,
  ...modelFiles.map((f) => join(MODELS_DIR, f)),
]
const content = parts.map((p) => readFileSync(p, 'utf8')).join('\n\n')

writeFileSync(SCHEMA_FILE, content)

console.log(`🔧 schema.prisma generated (schema=${schema}).`)
/* eslint-enable security/detect-non-literal-fs-filename */
