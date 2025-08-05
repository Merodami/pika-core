// packages/tests/src/utils/testcontainers.ts

import { PrismaClient } from '@prisma/client'
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql' // Ensure StartedPostgreSqlContainer is imported if you type the container instance
import path from 'path'

/**
 * PostgreSQL test container manager
 * Provides methods to start and stop a PostgreSQL container for testing
 */
export class PostgresTestContainer {
  private container: StartedPostgreSqlContainer | null = null // Typed for clarity
  private prisma: PrismaClient | null = null
  private originalDatabaseUrl: string | undefined

  /**
   * Starts a PostgreSQL container, initializes it with an init.sql script,
   * and returns a connected Prisma client.
   * @returns A configured Prisma client connected to the container.
   */
  async start(): Promise<PrismaClient> {
    // Save original DATABASE_URL
    this.originalDatabaseUrl = process.env.DATABASE_URL

    const initSqlPath = path.resolve(__dirname, './dump/init.sql')

    try {
      const imageName = 'postgis/postgis:17-3.5'

      console.log(`ℹ️ [PostgresTestContainer] Using Docker image: ${imageName}`)

      // Start container
      // Using standard PostgreSQL container
      this.container = await new PostgreSqlContainer(imageName)
        .withDatabase('test_db') // Consistent with your docker-compose example, but can be anything for tests
        .withUsername('test_user') // Can be anything for tests
        .withPassword('test_password') // Can be anything for tests
        .withCopyFilesToContainer([
          {
            source: initSqlPath,
            target: '/docker-entrypoint-initdb.d/init.sql',
          },
        ])
        .withStartupTimeout(120000)
        .start()

      // Create connection URL
      const connectionUrl = this.container.getConnectionUri()

      // Set environment variable for Prisma
      process.env.DATABASE_URL = connectionUrl

      // Create Prisma client
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: connectionUrl,
          },
        },
      })

      // It's good practice to explicitly connect, though Prisma often does this lazily.
      // Since the container startup and init script execution can take a moment,
      // ensuring connection here can catch issues earlier.
      await this.prisma.$connect()

      return this.prisma
    } catch (error) {
      console.error(
        '🔴 [PostgresTestContainer] Failed to start or connect:',
        error,
      ) // More specific prefix

      if (this.container) {
        console.log(
          'ℹ️ [PostgresTestContainer] Container object exists. Attempting to retrieve logs...',
        )
        try {
          // Attempt to get logs even if the container is stopped/stopping
          const logStream = await this.container.logs()

          console.log(
            'ℹ️ [PostgresTestContainer] Log stream obtained. Waiting for log data...',
          )

          const logsCollected: string[] = []
          const logProcessingPromise = new Promise<void>((resolve, reject) => {
            logStream
              .on('data', (line) => {
                const logLine = `[DB LOGS]: ${line.toString().trim()}`

                console.log(logLine)
                logsCollected.push(logLine)
              })
              .on('err', (line) => {
                // Also capture stderr from the stream
                const errLine = `[DB ERROR LOGS]: ${line.toString().trim()}`

                console.error(errLine)
                logsCollected.push(errLine)
              })
              .on('end', () => {
                console.log('ℹ️ [PostgresTestContainer] DB Log stream ended.')
                resolve()
              })
              .on('error', (streamError) => {
                // Catch errors on the stream itself
                console.error(
                  '🔴 [PostgresTestContainer] DB Log stream error:',
                  streamError,
                )
                reject(streamError)
              })
          })

          // Wait for log processing to complete, with a timeout
          // This gives time for async log events to fire
          await Promise.race([
            logProcessingPromise,
            new Promise((resolve) => setTimeout(resolve, 5000)), // 5-second timeout for logs
          ])

          if (logsCollected.length === 0) {
            console.warn(
              '⚠️ [PostgresTestContainer] No logs were collected from the container. It might have stopped too quickly or produced no output before stopping.',
            )
          }
        } catch (logError) {
          console.error(
            '🔴 [PostgresTestContainer] Failed to retrieve container logs:',
            logError,
          )
          console.log(
            'ℹ️ [PostgresTestContainer] This might happen if the container never started correctly or was removed too fast.',
          )
        }
      } else {
        console.warn(
          '⚠️ [PostgresTestContainer] Container object is null, cannot retrieve logs.',
        )
      }

      // Attempt to stop the container if it exists and has a stop method
      if (this.container && typeof this.container.stop === 'function') {
        console.log(
          'ℹ️ [PostgresTestContainer] Attempting to stop potentially failed container...',
        )
        try {
          await this.container.stop({ timeout: 5000 }) // Add a small timeout
        } catch (stopError) {
          console.warn(
            '⚠️ [PostgresTestContainer] Error while trying to stop the failed container:',
            stopError,
          )
        }
      }
      this.container = null // Ensure it's reset
      throw error // Re-throw to fail the test
    }
  }

  /**
   * Stops the PostgreSQL container, disconnects Prisma client, and restores the original DATABASE_URL
   */
  async stop(): Promise<void> {
    // Clean up
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
    }

    if (this.container) {
      await this.container.stop()
      this.container = null
    }

    // Restore original DATABASE_URL
    if (this.originalDatabaseUrl) {
      process.env.DATABASE_URL = this.originalDatabaseUrl
    } else {
      delete process.env.DATABASE_URL
    }
  }

  /**
   * Returns the current Prisma client
   * @returns The Prisma client or null if not started
   */
  getPrisma(): PrismaClient | null {
    return this.prisma
  }

  /**
   * Returns the connection URL for the container
   * @returns The connection URL or null if container is not running
   */
  getConnectionUrl(): string | null {
    if (!this.container) return null

    return this.container.getConnectionUri()
  }
}

/**
 * Creates a PostgreSQL test container for integration tests.
 * The container will be initialized with the schema defined in
 * 'packages/database/src/infrastructure/persistence/postgres/init.sql'.
 * * @example
 * ```typescript
 * const dbContainer = createPostgresContainer();
 * let prisma: PrismaClient;
 * * beforeAll(async () => {
 * // The start method now handles schema initialization via init.sql
 * prisma = await dbContainer.start();
 * }, 60000); // Increased timeout for container startup and script execution
 * * beforeEach(async () => {
 * // Still recommended to clean data between tests
 * await prisma.$executeRawUnsafe(`TRUNCATE TABLE your_table_name CASCADE;`);
 * // Add more tables as needed or use a more generic cleaning script
 * });
 * * afterAll(async () => {
 * await dbContainer.stop();
 * });
 * ```
 */
export const createPostgresContainer = (): PostgresTestContainer => {
  return new PostgresTestContainer()
}
