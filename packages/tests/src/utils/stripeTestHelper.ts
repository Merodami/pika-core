import { logger } from '@pika/shared'
import { GenericContainer, type StartedTestContainer } from 'testcontainers'

export interface StripeTestConfig {
  stripeSecretKey?: string
  stripeWebhookSecret?: string
  apiVersion?: string
  containerPort?: number
}

export interface StripeTestResult {
  container: StartedTestContainer
  stripeApiUrl: string
  stripeConfig: {
    secretKey: string
    webhookSecret: string
    apiVersion: string
    host: string
    port: number
    protocol: string
  }
  stop: () => Promise<void>
}

/**
 * Creates a stripe-mock container for integration testing
 * This uses the official stripe/stripe-mock Docker image
 */
export async function createStripeTestContainer(
  config: StripeTestConfig = {},
): Promise<StripeTestResult> {
  const {
    stripeSecretKey = 'sk_test_123', // stripe-mock expects this format
    stripeWebhookSecret = 'whsec_test_123',
    apiVersion = '2024-12-18.acacia',
    containerPort = 12111,
  } = config

  logger.info('Starting stripe-mock container...')

  try {
    // Create and start the stripe-mock container
    const container = await new GenericContainer('stripe/stripe-mock:latest')
      .withExposedPorts(containerPort)
      .withEnvironment({
        // stripe-mock doesn't need env vars, but we can set them for consistency
        STRIPE_MOCK_PORT: containerPort.toString(),
      })
      .withStartupTimeout(30000)
      .start()

    const mappedPort = container.getMappedPort(containerPort)
    const host = container.getHost()

    logger.info(`stripe-mock container started on ${host}:${mappedPort}`)

    // Create the configuration object for Stripe client
    const stripeConfig = {
      secretKey: stripeSecretKey,
      webhookSecret: stripeWebhookSecret,
      apiVersion,
      host,
      port: mappedPort,
      protocol: 'http' as const,
    }

    const stripeApiUrl = `${stripeConfig.protocol}://${stripeConfig.host}:${stripeConfig.port}`

    return {
      container,
      stripeApiUrl,
      stripeConfig,
      stop: async () => {
        logger.info('Stopping stripe-mock container...')
        await container.stop()
        logger.info('stripe-mock container stopped')
      },
    }
  } catch (error) {
    logger.error('Failed to start stripe-mock container:', error)
    throw error
  }
}

/**
 * Helper to create a Stripe configuration for the test container
 * This can be passed directly to the subscription service
 */
export function createTestStripeConfig(testResult: StripeTestResult) {
  return {
    secretKey: testResult.stripeConfig.secretKey,
    webhookSecret: testResult.stripeConfig.webhookSecret,
    apiVersion: testResult.stripeConfig.apiVersion,
    // Custom configuration for stripe-node to use the mock server
    host: testResult.stripeConfig.host,
    port: testResult.stripeConfig.port,
    protocol: testResult.stripeConfig.protocol,
  }
}

/**
 * Cleanup helper for tests
 */
export async function cleanupStripeTestContainer(
  testResult: StripeTestResult | null,
): Promise<void> {
  if (testResult) {
    await testResult.stop()
  }
}
