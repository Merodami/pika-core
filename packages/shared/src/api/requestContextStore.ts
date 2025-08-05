import { AsyncLocalStorage } from 'async_hooks'

/**
 * These types should live in shared.
 * Do NOT import from `@http/infrastructure/...` to avoid violating SoC.
 */

export enum RequestIdSource {
  HEADER = 'header',
  SELF_GENERATED = 'self-generated',
  INTERNAL_TASK = 'internal-task',
}

export interface AuthenticatedUser {
  id: string | null
  email: string | null
  fullName: string | null
  permissions: string[]
  roles: string[]
  type: string | null
}

export interface UserContext {
  authenticatedUser: AuthenticatedUser | null
}

export interface RequestContext {
  ip: string
  url: string
  method: string
  headers: Record<string, string>
  requestId: string
  requestIdSource: RequestIdSource
  originalRequestId: string
  source?: string
  userContext?: UserContext
}

/**
 * AsyncLocalStorage to persist request context across async call chains
 */
const asyncLocal = new AsyncLocalStorage<RequestContext>()

/**
 * Shared API to access request metadata and authenticated user
 */
export const RequestContextStore = {
  run<T>(context: RequestContext, callback: () => T): T {
    return asyncLocal.run(context, callback)
  },

  get(): RequestContext {
    const context = asyncLocal.getStore()

    if (!context)
      throw new Error('No request context found in AsyncLocalStorage')

    return context
  },

  getUser(): AuthenticatedUser | null {
    return RequestContextStore.get().userContext?.authenticatedUser ?? null
  },
}
