import {
  CommunicationServiceClient,
  PaymentServiceClient,
  SubscriptionServiceClient,
  UserServiceClient,
} from '@pika/shared'

import type { DeploymentAdapter, ServiceClients } from '../types/index.js'

/**
 * Creates service clients for internal communication.
 * In Vercel monolith mode, these clients will use local URLs.
 * In distributed mode, they'll use external service URLs.
 */
export function createServiceClients(
  adapter: DeploymentAdapter,
): ServiceClients {
  const createClient = <T>(
    ServiceClass: new (config: any) => T,
    serviceName: string,
  ): T => {
    const baseURL = adapter.getServiceUrl(serviceName)

    return new ServiceClass(baseURL)
  }

  return {
    user: createClient<UserServiceClient>(UserServiceClient, 'user'),
    payment: createClient<PaymentServiceClient>(
      PaymentServiceClient,
      'payment',
    ),
    subscription: createClient<SubscriptionServiceClient>(
      SubscriptionServiceClient,
      'subscription',
    ),
    communication: createClient<CommunicationServiceClient>(
      CommunicationServiceClient,
      'communication',
    ),
  }
}
