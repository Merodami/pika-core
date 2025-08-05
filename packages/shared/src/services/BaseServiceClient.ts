import type { ServiceContext } from '@pika/types'

import { HttpClient, type RequestConfig } from './HttpClient.js'

export interface ServiceClientConfig {
  serviceUrl: string
  serviceName: string
  timeout?: number
  retries?: number
}

/**
 * Base class for service clients
 * Provides common functionality for service-to-service communication
 */
export abstract class BaseServiceClient {
  protected readonly httpClient: HttpClient
  protected readonly serviceName: string

  constructor(config: ServiceClientConfig) {
    this.serviceName = config.serviceName
    this.httpClient = new HttpClient({
      baseUrl: config.serviceUrl,
      timeout: config.timeout,
      retries: config.retries,
      headers: {
        'x-service-name': this.serviceName,
      },
    })
  }

  /**
   * Make a request with context propagation
   */
  protected async request<T = unknown>(
    path: string,
    config: RequestConfig = {},
    context?: ServiceContext,
  ): Promise<T> {
    const mergedContext = { ...context, ...config.context }
    const mergedConfig = {
      ...config,
      context: mergedContext,
      useServiceAuth: context?.useServiceAuth ?? config.useServiceAuth,
    }
    const response = await this.httpClient.request<T>(path, mergedConfig)

    return response.data
  }

  /**
   * Convenience methods with context
   */
  protected async get<T = unknown>(
    path: string,
    config?: { useServiceAuth?: boolean; context?: ServiceContext },
  ): Promise<T> {
    return this.request<T>(path, { method: 'GET', ...config })
  }

  protected async post<T = unknown>(
    path: string,
    body: unknown,
    context?: ServiceContext,
  ): Promise<T> {
    return this.httpClient.post<T>(path, body, context || {})
  }

  protected async put<T = unknown>(
    path: string,
    body: unknown,
    context?: ServiceContext,
  ): Promise<T> {
    return this.httpClient.put<T>(path, body, context || {})
  }

  protected async delete<T = unknown>(
    path: string,
    context?: ServiceContext,
  ): Promise<T> {
    return this.httpClient.delete<T>(path, context || {})
  }

  protected async exists(
    path: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    return this.httpClient.head(path, context || {})
  }

  /**
   * Health check for the service
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.httpClient.get('/health')

      return true
    } catch {
      return false
    }
  }
}
