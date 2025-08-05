import { NODE_ENV } from '@pika/environment'
import logger from '@shared/infrastructure/logger/Logger.js'
import os from 'os'

/**
 * Creates a health check function for system resources
 *
 * @param memoryThreshold Percentage threshold below which memory is considered unhealthy
 * @returns A function that checks system health
 */
export function createSystemHealthCheck(memoryThreshold: number = 15) {
  return async (): Promise<boolean> => {
    // Get raw memory values
    const freeMemory = os.freemem()
    const totalMemory = os.totalmem()

    // Calculate free memory percentage
    const freeMemoryPercentage = (freeMemory / totalMemory) * 100

    // Log detailed memory info for debugging
    logger.debug(
      `Memory stats: Free=${freeMemory}B (${(freeMemory / 1024 / 1024).toFixed(2)}MB), Total=${totalMemory}B (${(totalMemory / 1024 / 1024).toFixed(2)}MB), ${freeMemoryPercentage.toFixed(2)}% free`,
    )

    // Always return true on macOS development environments
    if (process.platform === 'darwin' && NODE_ENV !== 'production') {
      logger.debug(
        'Development environment on macOS detected, bypassing memory threshold check',
      )

      return true
    }

    // Normal threshold check for other environments
    return freeMemoryPercentage > memoryThreshold
  }
}

/**
 * Gets system resource details for health reports
 * @param startTime The start time of the service for uptime calculation
 * @returns System resource details object
 */
export function getSystemDetails(startTime: number): Record<string, any> {
  const memoryUsage = process.memoryUsage()
  const freeMemory = os.freemem()
  const totalMemory = os.totalmem()
  const freeMemoryPercentage = (freeMemory / totalMemory) * 100

  return {
    memory: {
      // Ensure we round to integer but properly calculate the percentage first
      free: `${Math.round(freeMemoryPercentage)}%`,
      freeBytes: `${Math.round(freeMemory / 1024 / 1024)} MB`,
      totalBytes: `${Math.round(totalMemory / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000), // in seconds
  }
}
