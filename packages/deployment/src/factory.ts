import { logger } from '@pika/shared'

import { VercelDeploymentAdapter } from './adapters/vercel/adapter.js'
import { getVercelConfig } from './adapters/vercel/config.js'
import type {
  DeploymentAdapter,
  DeploymentConfig,
  DeploymentPlatform,
} from './types/index.js'

export async function createDeploymentAdapter(
  platform?: DeploymentPlatform,
  config?: Partial<DeploymentConfig>,
): Promise<DeploymentAdapter> {
  const detectedPlatform = platform || detectPlatform()

  logger.info(`Creating deployment adapter for platform: ${detectedPlatform}`)

  let adapter: DeploymentAdapter

  switch (detectedPlatform) {
    case 'vercel': {
      const vercelConfig = { ...getVercelConfig(), ...config }

      adapter = new VercelDeploymentAdapter(vercelConfig)
      break
    }

    case 'aws':
      // Future implementation
      throw new Error('AWS deployment adapter not yet implemented')

    case 'kubernetes':
      // Future implementation
      throw new Error('Kubernetes deployment adapter not yet implemented')

    case 'local': {
      // For local development, use Vercel adapter in local mode
      const localConfig = {
        ...getVercelConfig(),
        platform: 'local' as const,
        environment: 'development' as const,
        ...config,
      }

      adapter = new VercelDeploymentAdapter(localConfig)
      break
    }

    default:
      throw new Error(`Unsupported platform: ${detectedPlatform}`)
  }

  await adapter.initialize()

  return adapter
}

function detectPlatform(): DeploymentPlatform {
  // Detect Vercel
  if (process.env.VERCEL) {
    return 'vercel'
  }

  // Detect AWS
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'aws'
  }

  // Detect Kubernetes
  if (process.env.KUBERNETES_SERVICE_HOST) {
    return 'kubernetes'
  }

  // Default to local
  return 'local'
}
