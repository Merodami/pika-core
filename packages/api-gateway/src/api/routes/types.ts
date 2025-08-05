/**
 * Configuration for a service route in the API Gateway
 */
export interface ServiceConfig {
  /**
   * Service name (used for logging and identification)
   */
  name: string

  /**
   * URL prefix for incoming requests
   */
  prefix: string

  /**
   * Upstream service URL to proxy requests to
   */
  upstream: string
}
