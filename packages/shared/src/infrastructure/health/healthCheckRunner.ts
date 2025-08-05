import { ErrorCode, getDefaultMessageForError } from '@pika/types'

import { ErrorFactory } from '../../errors/index.js'
import { logger } from '../logger/index.js'
import { getSystemDetails } from './systemCheck.js'
import {
  HealthCheckDependency,
  HealthStatus,
  ServiceHealth,
  SystemHealth,
} from './types.js'

/**
 * Executes health checks for all dependencies
 * @param dependencies List of health check dependencies to check
 * @param startTime Service start time for uptime calculation
 * @returns Array of service health results
 */
export async function executeHealthChecks(
  dependencies: HealthCheckDependency[],
  startTime: number,
): Promise<ServiceHealth[]> {
  if (!dependencies || !Array.isArray(dependencies)) {
    throw ErrorFactory.fromError(
      new Error(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES),
      ),
      getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES),
      { code: ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES },
    )
  }

  const services: ServiceHealth[] = []

  for (const dependency of dependencies) {
    if (
      !dependency ||
      !dependency.name ||
      typeof dependency.check !== 'function'
    ) {
      logger.error('Invalid health check dependency:', {
        dependency,
        hasName: !!dependency?.name,
        checkType: typeof dependency?.check,
        dependencyType: typeof dependency,
      })
      throw ErrorFactory.fromError(
        new Error(
          getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCY),
        ),
        `Invalid health check dependency: ${dependency?.name || 'unknown'}`,
        { code: ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCY },
      )
    }

    try {
      // Execute the health check
      const isHealthy = await dependency.check()

      let details = { ...dependency.details }

      // Add additional system details for system checks
      if (dependency.name === 'system') {
        details = {
          ...details,
          ...getSystemDetails(startTime),
        }
      }

      // Add the result
      services.push({
        name: dependency.name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        details,
      })
    } catch (error) {
      // Handle execution errors
      logger.debug(`Health check for ${dependency.name} failed:`, error)

      services.push({
        name: dependency.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return services
}

/**
 * Determines overall system health status based on service health results
 * @param services Array of service health results
 * @returns The overall health status
 */
export function determineOverallStatus(
  services: ServiceHealth[],
): HealthStatus {
  if (!services || !Array.isArray(services)) {
    throw ErrorFactory.fromError(
      new Error(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_SERVICES),
      ),
      getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_SERVICES),
      { code: ErrorCode.HEALTH_CHECK_INVALID_SERVICES },
    )
  }

  if (services.length === 0) {
    return 'healthy' // Default when no services are checked
  }

  if (services.every((service) => service.status === 'unhealthy')) {
    return 'unhealthy'
  }

  if (services.some((service) => service.status === 'unhealthy')) {
    return 'degraded'
  }

  return 'healthy'
}

/**
 * Builds a complete health report
 * @param services Array of service health results
 * @param startTime Service start time for uptime calculation
 * @param version Service version
 * @returns Complete system health report
 */
export function buildHealthReport(
  services: ServiceHealth[],
  startTime: number,
  version: string,
): SystemHealth {
  if (!services || !Array.isArray(services)) {
    throw ErrorFactory.fromError(
      new Error(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_SERVICES),
      ),
      getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_SERVICES),
      { code: ErrorCode.HEALTH_CHECK_INVALID_SERVICES },
    )
  }

  if (typeof startTime !== 'number' || startTime <= 0) {
    throw ErrorFactory.fromError(
      new Error(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_STARTTIME),
      ),
      getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_STARTTIME),
      { code: ErrorCode.HEALTH_CHECK_INVALID_STARTTIME },
    )
  }

  if (!version) {
    throw ErrorFactory.fromError(
      new Error(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_VERSION),
      ),
      getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_VERSION),
      { code: ErrorCode.HEALTH_CHECK_INVALID_VERSION },
    )
  }

  const overallStatus = determineOverallStatus(services)

  return {
    status: overallStatus,
    services,
    timestamp: new Date().toISOString(),
    version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  }
}

/**
 * Filters dependencies to only critical ones
 * @param dependencies List of all dependencies
 * @returns List of critical dependencies
 */
export function getCriticalDependencies(
  dependencies: HealthCheckDependency[],
): HealthCheckDependency[] {
  if (!dependencies || !Array.isArray(dependencies)) {
    throw ErrorFactory.fromError(
      new Error(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES),
      ),
      getDefaultMessageForError(ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES),
      { code: ErrorCode.HEALTH_CHECK_INVALID_DEPENDENCIES },
    )
  }

  const criticalDeps = dependencies.filter(
    (d) => d.name === 'database' || d.details?.essential === true,
  )

  return criticalDeps.length > 0 ? criticalDeps : dependencies
}
