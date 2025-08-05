import supertest from 'supertest'

interface JWTPayload {
  userId: string
  email: string
  role: string
  status: string
  type: string
}

/**
 * A client for making authenticated supertest requests.
 * It automatically adds an Authorization header with a Bearer token.
 */
export class AuthenticatedRequestClient {
  private agent: supertest.SuperTest<supertest.Test>
  private token?: string

  /**
   * Creates an instance of AuthenticatedRequestClient.
   * @param {supertest.SuperTest<supertest.Test>} agent The supertest agent created from an Express server instance.
   * @param {string} [authToken] Optional. The authentication token. If not provided, it will try to use process.env.INTERNAL_API_TOKEN.
   */
  constructor(agent: supertest.SuperTest<supertest.Test>, authToken?: string) {
    this.agent = agent
    this.token = authToken || process.env.INTERNAL_API_TOKEN

    if (!this.token) {
      console.warn(
        '@@@ WARNING (AuthenticatedRequestClient): No authentication token provided or found in INTERNAL_API_TOKEN. Requests will be unauthenticated.',
      )
    }
  }

  /**
   * Sets or updates the authentication token for subsequent requests.
   * @param {string} newToken The new authentication token.
   */
  public setToken(newToken: string): void {
    this.token = newToken
  }

  /**
   * Clears the authentication token. Subsequent requests will be unauthenticated
   * unless a token is set again or provided per request.
   */
  public clearToken(): void {
    this.token = undefined
  }

  /**
   * Decode JWT token to extract user information (for testing)
   */
  private decodeToken(token: string): JWTPayload | null {
    try {
      // Simple JWT decode without verification (testing only)
      const parts = token.split('.')

      if (parts.length !== 3) return null

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

      return payload as JWTPayload
    } catch {
      return null
    }
  }

  private _createRequest(
    method: 'get' | 'post' | 'patch' | 'delete' | 'put',
    url: string,
    overrideToken?: string | null, // null means explicitly no token for this request
  ): supertest.Test {
    let req: supertest.Test

    switch (method) {
      case 'get':
        req = this.agent.get(url)
        break
      case 'post':
        req = this.agent.post(url)
        break
      case 'patch':
        req = this.agent.patch(url)
        break
      case 'delete':
        req = this.agent.delete(url)
        break
      case 'put':
        req = this.agent.put(url)
        break
    }

    req.set('Accept', 'application/json')

    const tokenToUse =
      overrideToken === null ? undefined : overrideToken || this.token

    if (tokenToUse) {
      // Set Authorization header
      req.set('Authorization', `Bearer ${tokenToUse}`)

      // Simulate API Gateway auth middleware by setting user context headers
      const payload = this.decodeToken(tokenToUse)

      if (payload) {
        req.set('x-user-id', payload.userId)
        req.set('x-user-email', payload.email)
        req.set('x-user-role', payload.role)
        req.set('x-user-status', payload.status)
      }
    } else if (overrideToken !== null) {
      // only warn if not explicitly unsetting token
      console.warn(
        `@@@ WARNING (AuthenticatedRequestClient): Making ${method.toUpperCase()} request to ${url} without an Authorization token.`,
      )
    }

    return req
  }

  /**
   * Performs a GET request.
   * @param {string} url The URL to request.
   * @param {string | null} [overrideToken] Optional. A token to use for this specific request, or null to send no token.
   * @returns {supertest.Test} The supertest Test object.
   */
  public get(url: string, overrideToken?: string | null): supertest.Test {
    return this._createRequest('get', url, overrideToken)
  }

  /**
   * Performs a POST request.
   * @param {string} url The URL to request.
   * @param {object} [data] The data to send in the request body.
   * @param {string | null} [overrideToken] Optional. A token to use for this specific request, or null to send no token.
   * @returns {supertest.Test} The supertest Test object.
   */
  public post(
    url: string,
    data?: object,
    overrideToken?: string | null,
  ): supertest.Test {
    const req = this._createRequest('post', url, overrideToken)

    if (data) {
      req.send(data)
    }

    return req
  }

  /**
   * Performs a PATCH request.
   * @param {string} url The URL to request.
   * @param {object} [data] The data to send in the request body.
   * @param {string | null} [overrideToken] Optional. A token to use for this specific request, or null to send no token.
   * @returns {supertest.Test} The supertest Test object.
   */
  public patch(
    url: string,
    data?: object,
    overrideToken?: string | null,
  ): supertest.Test {
    const req = this._createRequest('patch', url, overrideToken)

    if (data) {
      req.send(data)
    }

    return req
  }

  /**
   * Performs a DELETE request.
   * @param {string} url The URL to request.
   * @param {string | null} [overrideToken] Optional. A token to use for this specific request, or null to send no token.
   * @returns {supertest.Test} The supertest Test object.
   */
  public delete(url: string, overrideToken?: string | null): supertest.Test {
    return this._createRequest('delete', url, overrideToken)
  }

  /**
   * Performs a PUT request.
   * @param {string} url The URL to request.
   * @param {object} [data] The data to send in the request body.
   * @param {string | null} [overrideToken] Optional. A token to use for this specific request, or null to send no token.
   * @returns {supertest.Test} The supertest Test object.
   */
  public put(
    url: string,
    data?: object,
    overrideToken?: string | null,
  ): supertest.Test {
    const req = this._createRequest('put', url, overrideToken)

    if (data) {
      req.send(data)
    }

    return req
  }
}
