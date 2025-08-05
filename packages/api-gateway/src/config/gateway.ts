import {
  ENABLE_COMPRESSION,
  ENABLE_CORS,
  ENABLE_HELMET,
  HEALTH_CHECK_INTERVAL,
  HEALTH_CHECK_PATH,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from '@pika/environment'

import { ApiGatewayConfig } from '../types/gateway.js'

export function loadConfig(
  overrides?: Partial<ApiGatewayConfig>,
): ApiGatewayConfig {
  const config: ApiGatewayConfig = {
    rateLimit: {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    },
    security: {
      enableHelmet: ENABLE_HELMET,
      enableCors: ENABLE_CORS,
      enableCompression: ENABLE_COMPRESSION,
    },
    healthCheck: {
      path: HEALTH_CHECK_PATH,
      interval: HEALTH_CHECK_INTERVAL,
    },
  }

  return { ...config, ...overrides }
}
