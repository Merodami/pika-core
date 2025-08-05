/**
 * Unified PostgreSQL Test Container Helper
 *
 * Provides a consistent way to set up PostgreSQL test containers across all services.
 * This ensures all tests use the same database setup and initialization.
 */
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface TestDatabaseConfig {
  /**
   * Name of the test database (defaults to 'test_db')
   */
  databaseName?: string

  /**
   * Database username (defaults to 'test_user')
   */
  username?: string

  /**
   * Database password (defaults to 'test_password')
   */
  password?: string

  /**
   * Whether to use init.sql for schema initialization (defaults to true)
   */
  useInitSql?: boolean

  /**
   * Timeout for container startup in milliseconds (defaults to 120000)
   */
  startupTimeout?: number
}

export interface TestDatabaseResult {
  container: StartedPostgreSqlContainer
  prisma: PrismaClient
  databaseUrl: string
}

/**
 * Creates and starts a PostgreSQL test container with consistent configuration
 */
export async function createTestDatabase(
  config: TestDatabaseConfig = {},
): Promise<TestDatabaseResult> {
  const {
    databaseName = 'test_db',
    username = 'test_user',
    password = 'test_password',
    useInitSql = true,
    startupTimeout = 120000,
  } = config

  logger.debug('Starting PostgreSQL test container...')

  // Create container with PostGIS (matches docker-compose.local.yml and testcontainers.ts)
  let container = new PostgreSqlContainer('postgis/postgis:17-3.5')
    .withDatabase(databaseName)
    .withUsername(username)
    .withPassword(password)
    .withStartupTimeout(startupTimeout)

  // Add init.sql if requested and file exists
  if (useInitSql) {
    // Look for init.sql in the source directory instead of dist
    const sourceDir = path.resolve(__dirname, '../../src/utils')
    const initSqlPath = path.resolve(sourceDir, './dump/init.sql')

    logger.debug(`Looking for init.sql at: ${initSqlPath}`)

    if (fs.existsSync(initSqlPath)) {
      logger.debug('Found init.sql, adding to container initialization')
      container = container.withCopyFilesToContainer([
        {
          source: initSqlPath,
          target: '/docker-entrypoint-initdb.d/init.sql',
        },
      ])
    } else {
      logger.warn('init.sql not found, starting with empty database')
      logger.warn('Run "yarn db:generate-test-dump" to create it')
    }
  }

  // Start the container
  const startedContainer = await container.start()

  logger.debug('PostgreSQL container started successfully')

  // Wait a bit for init.sql to be processed (if present)
  if (useInitSql) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    logger.debug('Waited for database initialization')
  }

  // Get connection URL
  const databaseUrl = startedContainer.getConnectionUri()

  logger.debug(`Database URL: ${databaseUrl}`)

  // Create and connect Prisma client
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
    log:
      process.env.DEBUG === 'true' && process.env.TEST_VERBOSE === 'true'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  })

  await prisma.$connect()
  logger.debug('Prisma client connected to test database')

  // Verify database is working
  try {
    await prisma.$queryRaw`SELECT 1 as test`
    logger.debug('Database connection verified')

    // List available schemas and tables if in debug mode
    if (process.env.DEBUG) {
      const schemas = await prisma.$queryRaw`
        SELECT DISTINCT table_schema 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema
      `

      logger.debug('Available schemas:', schemas)

      const tables = await prisma.$queryRaw`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('users', 'auth', 'payments', 'audit', 'gyms', 'support')
        ORDER BY table_schema, table_name
      `

      logger.debug('Available tables:', tables)
    }
  } catch (error) {
    console.error('❌ Database verification failed:', error)
    throw error
  }

  return {
    container: startedContainer,
    prisma,
    databaseUrl,
  }
}

/**
 * Cleans up test database resources
 */
export async function cleanupTestDatabase(
  result: TestDatabaseResult | undefined,
): Promise<void> {
  logger.debug('Cleaning up test database resources...')

  if (!result) {
    logger.debug('No test database result to cleanup')

    return
  }

  const { prisma, container } = result

  try {
    // Disconnect Prisma
    if (prisma) {
      await prisma.$disconnect()
      logger.debug('Prisma client disconnected')
    }
  } catch (error) {
    logger.warn('Error disconnecting Prisma:', error)
  }

  try {
    // Stop container
    if (container) {
      await container.stop()
      logger.debug('PostgreSQL container stopped')
    }
  } catch (error) {
    logger.warn('Error stopping container:', error)
  }

  logger.debug('Cleanup complete')
}

/**
 * Clears all data from the test database (useful for beforeEach hooks)
 * Uses TRUNCATE CASCADE for complete cleanup
 */
export async function clearTestDatabase(prisma: PrismaClient): Promise<void> {
  try {
    // Get all tables in the relevant schemas
    const tables = await prisma.$queryRaw<
      Array<{ table_schema: string; table_name: string }>
    >`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('users', 'auth', 'payments', 'audit', 'gyms', 'support')
      AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `

    if (tables.length > 0) {
      // Build TRUNCATE statement for all tables
      const truncateStatements = tables
        .map((t: any) => `"${t.table_schema}"."${t.table_name}"`)
        .join(', ')

      // Execute TRUNCATE CASCADE on all tables at once
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE ${truncateStatements} CASCADE`,
      )
      logger.debug(`Cleared ${tables.length} tables`)
    }
  } catch (error) {
    logger.warn('Error clearing database:', error)
    // Don't throw - tests should continue even if cleanup fails
  }
}
