import { SERVICE_API_KEY } from '@pika/environment'
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

import { ErrorFactory } from '../errors/index.js'
import { logger } from '../infrastructure/logger/index.js'

export interface HttpClientConfig {
  baseUrl: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  useServiceAuth?: boolean
  context?: {
    userId?: string
    userEmail?: string
    userRole?: string
    correlationId?: string
    serviceName?: string
    serviceId?: string
  }
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Record<string, string>
}

/**
 * Base HTTP client for service-to-service communication
 * Provides consistent error handling, logging, and context propagation
 * Uses axios for industry standard HTTP handling
 */
export class HttpClient {
  private readonly axiosInstance: AxiosInstance
  private readonly retries: number
  private readonly retryDelay: number

  constructor(config: HttpClientConfig) {
    this.retries = config.retries || 3
    this.retryDelay = config.retryDelay || 1000

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      },
    })

    // Add request interceptor for service authentication
    this.axiosInstance.interceptors.request.use((axiosConfig: any) => {
      const requestConfig = axiosConfig.metadata?.requestConfig as RequestConfig

      if (requestConfig?.useServiceAuth) {
        axiosConfig.headers['x-api-key'] = SERVICE_API_KEY
        axiosConfig.headers['x-service-name'] =
          axiosConfig.headers['x-service-name'] ||
          requestConfig.context?.serviceName ||
          'service-client'
        axiosConfig.headers['x-service-id'] =
          axiosConfig.headers['x-service-id'] ||
          requestConfig.context?.serviceId ||
          `${axiosConfig.headers['x-service-name']}-${Date.now()}`
      }

      // Add context headers if provided
      if (requestConfig?.context) {
        if (requestConfig.context.userId)
          axiosConfig.headers['x-user-id'] = requestConfig.context.userId
        if (requestConfig.context.userEmail)
          axiosConfig.headers['x-user-email'] = requestConfig.context.userEmail
        if (requestConfig.context.userRole)
          axiosConfig.headers['x-user-role'] = requestConfig.context.userRole
        if (requestConfig.context.correlationId)
          axiosConfig.headers['x-correlation-id'] =
            requestConfig.context.correlationId
        if (requestConfig.context.serviceName)
          axiosConfig.headers['x-service-name'] =
            requestConfig.context.serviceName
        if (requestConfig.context.serviceId)
          axiosConfig.headers['x-service-id'] = requestConfig.context.serviceId
      }

      return axiosConfig
    })

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        const axiosError = error

        if (axiosError.response) {
          throw this.createHttpError(
            axiosError.response.status,
            axiosError.response.data,
            axiosError.config?.url || '',
            axiosError.config?.method || 'GET',
          )
        }
        throw error
      },
    )
  }

  /**
   * Make an HTTP request with automatic retries and error handling using axios
   */
  async request<T = unknown>(
    path: string,
    config: RequestConfig = {},
  ): Promise<HttpResponse<T>> {
    let lastError: Error | null = null

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const axiosConfig: AxiosRequestConfig & {
          metadata?: { requestConfig: RequestConfig }
        } = {
          url: path,
          method: config.method || 'GET',
          data: config.body,
          timeout: config.timeout,
          headers: config.headers,
          metadata: { requestConfig: config }, // Pass config to interceptor
        }

        const response: AxiosResponse<T> =
          await this.axiosInstance.request(axiosConfig)

        // Success - log and return
        logger.debug('HTTP request successful', {
          url: `${this.axiosInstance.defaults.baseURL}${path}`,
          method: config.method || 'GET',
          status: response.status,
          attempt: attempt + 1,
        })

        return {
          data: response.data,
          status: response.status,
          headers: response.headers as Record<string, string>,
        }
      } catch (error: any) {
        lastError = error

        const url = `${this.axiosInstance.defaults.baseURL}${path}`

        // Log the error
        logger.error('HTTP request error', error, {
          url,
          method: config.method || 'GET',
          attempt: attempt + 1,
          maxRetries: this.retries,
        })

        // Don't retry client errors (4xx) or if this is the last attempt
        if (
          (error.response?.status >= 400 && error.response?.status < 500) ||
          attempt >= this.retries
        ) {
          throw error
        }

        // Exponential backoff before retry
        await this.delay(this.retryDelay * Math.pow(2, attempt))
      }
    }

    // All retries failed
    throw ErrorFactory.fromError(
      lastError!,
      `Failed to communicate with service at ${this.axiosInstance.defaults.baseURL}${path}`,
      {
        source: 'HttpClient.request',
        metadata: {
          url: `${this.axiosInstance.defaults.baseURL}${path}`,
          method: config.method || 'GET',
        },
      },
    )
  }

  /**
   * Convenience methods
   */
  async get<T = unknown>(
    path: string,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<T> {
    const response = await this.request<T>(path, { ...config, method: 'GET' })

    return response.data
  }

  async post<T = unknown>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<T> {
    const response = await this.request<T>(path, {
      ...config,
      method: 'POST',
      body,
    })

    return response.data
  }

  async put<T = unknown>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<T> {
    const response = await this.request<T>(path, {
      ...config,
      method: 'PUT',
      body,
    })

    return response.data
  }

  async delete<T = unknown>(
    path: string,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<T> {
    const response = await this.request<T>(path, {
      ...config,
      method: 'DELETE',
    })

    return response.data
  }

  async head(
    path: string,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<boolean> {
    try {
      const response = await this.request(path, { ...config, method: 'HEAD' })

      return response.status === 200
    } catch {
      return false
    }
  }

  /**
   * Create an HTTP error with proper context
   */
  private createHttpError(
    status: number,
    data: unknown,
    url: string,
    method: string,
  ): Error {
    const errorData = data as any
    const message =
      errorData?.error?.message || errorData?.message || `HTTP ${status} error`

    switch (status) {
      case 400:
        return ErrorFactory.validationError(
          errorData?.error?.validationErrors || { _: [message] },
          { source: 'HttpClient', metadata: { url, method, status } },
        )
      case 401:
        return ErrorFactory.unauthorized(message, {
          source: 'HttpClient',
          metadata: { url, method, status },
        })
      case 403:
        return ErrorFactory.businessRuleViolation('Access forbidden', message, {
          source: 'HttpClient',
          metadata: { url, method, status },
        })
      case 404:
        return ErrorFactory.resourceNotFound('Resource', url, {
          source: 'HttpClient',
          metadata: { method, status },
        })
      case 409:
        return ErrorFactory.resourceConflict('Resource', message, {
          source: 'HttpClient',
          metadata: { url, method, status },
        })
      default:
        return ErrorFactory.externalServiceError(
          'External Service',
          message,
          undefined,
          { source: 'HttpClient', metadata: { url, method, status } },
        )
    }
  }

  /**
   * Check if error is a client error (4xx)
   */
  private isClientError(error: Error): boolean {
    const metadata = (error as any).context?.metadata

    return metadata?.status >= 400 && metadata?.status < 500
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
