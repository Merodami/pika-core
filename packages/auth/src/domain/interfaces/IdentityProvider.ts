/**
 * Represents the payload from a verified JWT token
 */
export interface TokenPayload {
  /** The subject (user ID) from the token */
  sub: string
  /** The client that issued the token */
  client_id?: string
  /** The token expiration time */
  exp?: number
  /** The token issue time */
  iat?: number
  /** The token issuer */
  iss?: string
  /** The user's email if included in the token */
  email?: string | null
  /** Whether the user's email has been verified */
  email_verified?: boolean
  /** Additional data that may be included in the token */
  [key: string]: any
}

/**
 * Represents configuration options for identity providers
 */
export interface IdentityProviderOptions {
  /** The Identity Provider type (e.g., 'cognito', 'auth0', etc.) */
  type: string
  /** Whether this provider is enabled */
  enabled: boolean
  /** Provider-specific configuration options */
  [key: string]: any
}

/**
 * Interface for identity provider implementations
 *
 * This abstracts the authentication logic and allows different identity providers
 * to be used interchangeably.
 */
export interface IdentityProvider {
  /**
   * Get the identity provider type
   */
  getType(): string

  /**
   * Initialize the identity provider
   */
  initialize(): Promise<void>

  /**
   * Verify a JWT token
   *
   * @param token The JWT token to verify
   * @returns The decoded token payload
   * @throws Error if the token is invalid or verification fails
   */
  verifyToken(token: string): Promise<TokenPayload>

  /**
   * Check if a token is valid
   *
   * @param token The JWT token to check
   * @returns True if the token is valid, false otherwise
   */
  isTokenValid(token: string): Promise<boolean>

  /**
   * Get the user profile from the identity provider
   *
   * @param userId The user ID (sub) in the identity provider
   * @returns User profile data if available
   */
  getUserProfile?(userId: string): Promise<any>
}

/**
 * Factory interface for creating identity providers
 */
export interface IdentityProviderFactory {
  /**
   * Create an identity provider instance
   *
   * @param options The configuration options for the identity provider
   * @returns An initialized identity provider instance
   */
  createProvider(options: IdentityProviderOptions): Promise<IdentityProvider>
}
