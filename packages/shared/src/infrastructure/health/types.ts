export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthCheckResult {
  status: HealthStatus
  details?: Record<string, any>
  message?: string
  timestamp: string
}

export interface ServiceHealth {
  name: string
  status: HealthStatus
  details?: Record<string, any>
  message?: string
}

export interface SystemHealth {
  status: HealthStatus
  services: ServiceHealth[]
  timestamp: string
  version?: string
  uptime?: number
}

export interface HealthCheckDependency {
  name: string
  check: HealthCheckFunction
  details?: Record<string, any>
}

export type HealthCheckFunction = () => Promise<boolean> | boolean

export interface HealthCheckOptions {
  /**
   * Application name to be displayed in health check
   */
  name?: string
  /**
   * Application version
   */
  version?: string
  /**
   * Path for the health check endpoint (default: "/health")
   */
  path?: string
  /**
   * Response cache time in ms (default: 5000ms)
   */
  cacheTime?: number
  /**
   * Whether to log health check results (default: false)
   */
  logResults?: boolean
}
