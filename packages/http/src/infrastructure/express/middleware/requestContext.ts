// Import the shared type definitions
import '../../../types/express.js'

import {
  RequestContext,
  RequestContextStore,
  RequestIdSource,
  UserContext,
} from '@pika/shared'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 * Options for the request context middleware.
 * Allows an optional function to resolve user context per request.
 */
export interface RequestContextMiddlewareOptions {
  getUserContext?: (
    request: Request,
    response: Response,
  ) => UserContext | undefined
}

/**
 * Core middleware implementation for enriching each Express request with
 * a typed RequestContext object, and storing it in AsyncLocalStorage.
 */
export function requestContextMiddleware(
  opts: RequestContextMiddlewareOptions = {},
): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    // Resolve optional authenticated user context
    const userContext = opts.getUserContext?.(request, response)

    // Determine or generate a request ID
    let requestIdSource: RequestIdSource = RequestIdSource.HEADER
    let requestId = (request.headers['x-pika-request-id'] as string) || ''

    if (!requestId) {
      requestId = uuidv4()
      requestIdSource = RequestIdSource.SELF_GENERATED
    }

    // Preserve any upstream original request ID
    const originalRequestId =
      (request.headers['x-pikariginal-request-id'] as string) || requestId

    // Optional logical source header
    const source = request.headers['x-pikaource'] as string | undefined

    // Build the RequestContext object
    const context: RequestContext = {
      ip: request.ip || request.socket?.remoteAddress || 'unknown',
      url: request.originalUrl || request.url,
      method: request.method,
      headers: Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value),
        ]),
      ),
      requestId,
      requestIdSource,
      originalRequestId,
      source,
      userContext,
    }

    // Add requestContext property to request
    // In serverless environments, request objects might be reused, so we need configurable: true
    if (!Object.prototype.hasOwnProperty.call(request, 'requestContext')) {
      Object.defineProperty(request, 'requestContext', {
        get() {
          return context
        },
        set(ctx: RequestContext) {
          Object.assign(context, ctx)
        },
        enumerable: true,
        configurable: true,
      })
    } else {
      // If property already exists, just update the context
      ;(request as any).requestContext = context
    }

    // Run under AsyncLocalStorage so that downstream code can access the context
    RequestContextStore.run(context, () => {
      next()
    })
  }
}
