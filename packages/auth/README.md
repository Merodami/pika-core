# 🔐 @pika/auth - Authentication & Authorization Framework

![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![JWT](https://img.shields.io/badge/JWT-9.0.2-black?logo=jsonwebtokens)
![bcrypt](https://img.shields.io/badge/bcrypt-6.0.0-green)
![Status](https://img.shields.io/badge/Status-Production-success)

## 🎯 Purpose & Vision

The Auth package is the **security cornerstone** of the Pika platform, providing enterprise-grade authentication and authorization services. It implements JWT-based authentication with support for both HMAC and RSA algorithms, pluggable authentication strategies, identity provider integration, and comprehensive token lifecycle management. This ensures secure, scalable, and flexible authentication across all microservices.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Build the package
yarn nx run @pika/auth:build

# Run tests
yarn nx run @pika/auth:test

# Lint code
yarn nx run @pika/auth:lint
```

## 📋 Overview

The Auth package is a comprehensive authentication framework that:

- **Manages JWT Tokens**: Creation, validation, refresh, and revocation
- **Supports Multiple Algorithms**: HMAC (HS256) and RSA (RS256)
- **Implements Auth Strategies**: Pluggable authentication patterns
- **Integrates Identity Providers**: AWS Cognito and extensible framework
- **Secures Passwords**: bcrypt hashing with configurable policies
- **Handles Token Lifecycle**: Access/refresh tokens with Redis backing
- **Provides Use Cases**: Login, logout, register, refresh workflows
- **Enables Clean Architecture**: Separation of concerns across layers

### Key Features

- 🔐 **JWT Token Management**: Access & refresh tokens with blacklisting
- 🌐 **Multi-Algorithm Support**: HMAC for development, RSA for production
- 🔄 **Token Refresh**: Automatic token rotation with security
- 🚀 **Redis Integration**: Distributed token blacklisting & session tracking
- 🔒 **Password Security**: bcrypt with configurable complexity
- 🎯 **Strategy Pattern**: Extensible authentication methods
- 🏗️ **Clean Architecture**: Domain-driven design principles
- 🧪 **Full Testing**: Unit and integration test coverage

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── application/               # Application Layer (Use Cases)
│   └── use_cases/             # Business workflows
│       ├── LoginUseCase.ts    # User authentication flow
│       ├── LogoutUseCase.ts   # Token revocation flow
│       ├── RefreshTokenUseCase.ts # Token refresh flow
│       └── RegisterUseCase.ts # User registration flow
├── domain/                    # Domain Layer (Business Logic)
│   ├── interfaces/            # Domain contracts
│   │   └── IdentityProvider.ts # Provider interface
│   └── services/              # Domain services
│       └── TokenService.ts    # Token business logic
├── infrastructure/            # Infrastructure Layer
│   ├── IdentityProviderRegistry.ts # Provider management
│   └── providers/             # External providers
│       ├── CognitoIdentityProvider.ts # AWS Cognito
│       └── LocalIdentityProvider.ts   # Local auth
├── services/                  # Core Services
│   ├── JwtTokenService.ts     # JWT implementation
│   └── PasswordSecurityService.ts # Password operations
├── strategies/                # Authentication Strategies
│   ├── AuthStrategy.ts        # Strategy interface
│   ├── AuthStrategyFactory.ts # Strategy creation
│   ├── LocalAuthStrategy.ts   # Email/password auth
│   └── CognitoAuthStrategy.ts # Cognito auth
├── api/                       # API Layer (HTTP)
│   ├── controllers/           # Request handlers
│   │   └── AuthController.ts  # Auth endpoints
│   └── routes/                # Route definitions
│       └── authRoutes.ts      # Express routes
├── adapters/                  # External Adapters
│   └── UserServiceAdapter.ts  # User service client
├── config/                    # Configuration
│   ├── AuthServiceConfig.ts   # Service settings
│   └── identityProviderConfig.ts # Provider config
└── utils/                     # Utilities
    ├── jwtVerifier.ts         # Token verification
    └── userManagement.ts      # User operations
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant LoginUseCase
    participant AuthStrategy
    participant JwtService
    participant Redis

    Client->>AuthController: POST /auth/login
    AuthController->>LoginUseCase: execute(credentials)
    LoginUseCase->>AuthStrategy: authenticate(credentials)
    AuthStrategy->>AuthStrategy: Validate credentials
    AuthStrategy->>JwtService: generateTokens(user)
    JwtService->>Redis: Store refresh token
    JwtService-->>AuthStrategy: tokens
    AuthStrategy-->>LoginUseCase: AuthResult
    LoginUseCase-->>AuthController: AuthResult
    AuthController-->>Client: { accessToken, refreshToken }
```

## 🔐 JWT Token Service

### Advanced Token Management

```typescript
import { JwtTokenService, createJwtTokenService } from '@pika/auth'
import { createCacheService } from '@pika/redis'

// Initialize with Redis for distributed token management
const cacheService = createCacheService()
const jwtService = createJwtTokenService(cacheService)

// Generate tokens for authenticated user
const tokens = await jwtService.generateTokens({
  id: 'user-123',
  email: 'user@example.com',
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  isActive: () => true,
})
// Returns: { accessToken, refreshToken, expiresAt, refreshExpiresAt }

// Verify token with type checking
const validation = await jwtService.verifyToken(token, 'access')
if (validation.isValid) {
  const { userId, email, role } = validation.payload
}

// Refresh access token
const newToken = await jwtService.refreshAccessToken(refreshToken)

// Revoke tokens (logout)
await jwtService.revokeToken(accessToken)
await jwtService.revokeAllUserTokens(userId) // Logout all devices
```

### Token Security Features

```typescript
// RS256 Support (Production)
const rsaJwtService = new JwtTokenService(
  '', // Not used for RSA
  '15m',
  '7d',
  'pika-api',
  'pika-app',
  cacheService,
  'RS256',
  privateKeyPem, // RSA private key
  publicKeyPem, // RSA public key
)

// Token Blacklisting with Redis
// - Distributed across all services
// - Automatic expiration matching token TTL
// - Fallback to in-memory for resilience

// Token Metadata Tracking
// - Refresh token usage tracking
// - Device/session management
// - Audit trail for security
```

## 🎯 Authentication Strategies

### Strategy Pattern Implementation

```typescript
import { AuthStrategyFactory, LocalAuthStrategy } from '@pika/auth'

// Create strategy factory
const strategyFactory = new AuthStrategyFactory()

// Register strategies
strategyFactory.register(
  'local',
  new LocalAuthStrategy({
    userService,
    passwordService,
    jwtService,
  }),
)

strategyFactory.register(
  'cognito',
  new CognitoAuthStrategy({
    cognitoProvider,
    userService,
    jwtService,
  }),
)

// Use strategy
const strategy = strategyFactory.create('local')
const result = await strategy.authenticate({
  email: 'user@example.com',
  password: 'secure-password',
  rememberMe: true,
  source: 'web',
})
```

### Custom Strategy Implementation

```typescript
export class CustomAuthStrategy extends AuthStrategy {
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    // Custom authentication logic
    const user = await this.validateCustomAuth(credentials)

    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials',
      }
    }

    const tokens = await this.jwtService.generateTokens(user)

    return {
      success: true,
      user: UserMapper.toDTO(user),
      tokens,
    }
  }
}
```

## 🔒 Password Security

### Password Service

```typescript
import { PasswordSecurityService } from '@pika/auth'

const passwordService = new PasswordSecurityService({
  rounds: 12, // bcrypt rounds
  minLength: 8, // minimum length
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
})

// Hash password
const hashedPassword = await passwordService.hashPassword('UserPassword123!')

// Verify password
const isValid = await passwordService.verifyPassword('UserPassword123!', hashedPassword)

// Validate password strength
const validation = passwordService.validatePasswordStrength('weak')
// Returns: { isValid: false, errors: ['Too short', 'No uppercase'] }
```

## 🌐 Identity Provider Integration

### AWS Cognito Integration

```typescript
import { CognitoIdentityProvider, IdentityProviderRegistry } from '@pika/auth'

// Configure Cognito provider
const cognitoProvider = new CognitoIdentityProvider({
  region: 'us-east-1',
  userPoolId: 'us-east-1_XXXXXX',
  clientId: 'client-id',
  clientSecret: 'client-secret',
})

// Register provider
const registry = new IdentityProviderRegistry()
registry.register('cognito', cognitoProvider)

// Use provider
const provider = registry.get('cognito')
const result = await provider.authenticate({
  username: 'user@example.com',
  password: 'password',
})

if (result.success) {
  // Create or link local user
  const user = await createOrLinkUser(result.externalUser)
}
```

## 📝 Use Cases

### Login Use Case

```typescript
import { LoginUseCase } from '@pika/auth'

const loginUseCase = new LoginUseCase(authStrategy)

const result = await loginUseCase.execute({
  email: 'user@example.com',
  password: 'secure-password',
  rememberMe: true,
  source: 'mobile',
})

if (result.success) {
  const { accessToken, refreshToken } = result.tokens
  // Store tokens securely on client
}
```

### Registration Use Case

```typescript
import { RegisterUseCase } from '@pika/auth'

const registerUseCase = new RegisterUseCase({
  userService,
  passwordService,
  jwtService,
  emailService,
})

const result = await registerUseCase.execute({
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  acceptedTerms: true,
})

// Sends verification email automatically
```

### Token Refresh Use Case

```typescript
import { RefreshTokenUseCase } from '@pika/auth'

const refreshUseCase = new RefreshTokenUseCase(jwtService)

const result = await refreshUseCase.execute({
  refreshToken: 'current-refresh-token',
})

if (result.success) {
  const { accessToken, expiresAt } = result
  // Update stored access token
}
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration (HMAC)
JWT_SECRET=your-256-bit-secret-key-minimum-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=pika-api
JWT_AUDIENCE=pika-app

# JWT Configuration (RSA)
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."

# Password Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8

# Redis (for token management)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS Cognito (optional)
AWS_COGNITO_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_XXXXXX
AWS_COGNITO_CLIENT_ID=client-id
```

### Service Configuration

```typescript
export interface AuthServiceConfig {
  jwt: {
    algorithm: 'HS256' | 'RS256'
    secret?: string // For HMAC
    privateKey?: string // For RSA
    publicKey?: string // For RSA
    accessExpiry: string // e.g., '15m'
    refreshExpiry: string // e.g., '7d'
    issuer: string
    audience: string
  }
  password: {
    rounds: number
    minLength: number
    policies: PasswordPolicies
  }
  redis: {
    enabled: boolean
    prefix: string
  }
  providers: {
    [key: string]: ProviderConfig
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('JwtTokenService', () => {
  let jwtService: JwtTokenService
  let cacheService: ICacheService

  beforeEach(() => {
    cacheService = createMockCacheService()
    jwtService = new JwtTokenService('test-secret-key-32-chars-minimum', '15m', '7d', 'test-issuer', 'test-audience', cacheService)
  })

  describe('generateTokens', () => {
    it('should generate valid token pair', async () => {
      const user = createMockUser()
      const tokens = await jwtService.generateTokens(user)

      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.expiresAt).toBeInstanceOf(Date)
      expect(tokens.refreshExpiresAt).toBeInstanceOf(Date)
    })

    it('should store refresh token in Redis', async () => {
      const user = createMockUser()
      await jwtService.generateTokens(user)

      expect(cacheService.set).toHaveBeenCalledWith(expect.stringContaining('auth:refresh:'), expect.any(Object), expect.any(Number))
    })
  })

  describe('token blacklisting', () => {
    it('should blacklist revoked tokens', async () => {
      const token = 'valid.jwt.token'
      await jwtService.revokeToken(token)

      const result = await jwtService.verifyToken(token)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Token has been revoked')
    })
  })
})
```

### Integration Tests

```typescript
describe('Auth API Integration', () => {
  let app: Express
  let testDb: TestDatabase

  beforeAll(async () => {
    testDb = await createTestDatabase()
    app = await createAuthServer({
      prisma: testDb.prisma,
      cacheService: new MemoryCacheService(),
    })
  })

  describe('POST /auth/login', () => {
    it('should authenticate valid user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user).toHaveProperty('id')
    })
  })
})
```

## 🔒 Security Best Practices

### Token Security

1. **Short-Lived Access Tokens**: 15 minutes default
2. **Secure Refresh Tokens**: 7 days with rotation
3. **Token Blacklisting**: Immediate revocation capability
4. **JTI Tracking**: Unique token identifiers
5. **Algorithm Flexibility**: HMAC for dev, RSA for production

### Password Security

1. **bcrypt Hashing**: Industry standard with salt
2. **Configurable Rounds**: Default 12, adjustable for security/performance
3. **Password Policies**: Enforced complexity requirements
4. **Timing Attack Protection**: Constant-time comparison

### Session Management

1. **Device Tracking**: Multiple sessions per user
2. **Selective Revocation**: Logout single device or all
3. **Refresh Token Rotation**: New token on each refresh
4. **Redis Persistence**: Distributed session state

## 📊 Performance Considerations

- **Token Caching**: Validated tokens cached for performance
- **Redis Pipelining**: Batch operations for efficiency
- **Async Operations**: Non-blocking token operations
- **Connection Pooling**: Reused Redis connections
- **Memory Management**: Automatic cleanup of expired tokens

## 🚨 Error Handling

### Auth-Specific Errors

```typescript
export class AuthenticationError extends ApplicationError {
  constructor(message: string, code: AuthErrorCode) {
    super(message, {
      code,
      httpStatus: 401,
      severity: ErrorSeverity.WARNING,
    })
  }
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  USER_INACTIVE = 'USER_INACTIVE',
  PASSWORD_POLICY_VIOLATION = 'PASSWORD_POLICY_VIOLATION',
}
```

## 🔄 Migration Guide

### From Session-Based to JWT

```typescript
// Before: Session-based
req.session.userId = user.id

// After: JWT-based
const tokens = await jwtService.generateTokens(user)
res.json({ accessToken: tokens.accessToken })
```

### From HS256 to RS256

```typescript
// Development: HMAC
JWT_ALGORITHM=HS256
JWT_SECRET=dev-secret

// Production: RSA
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY=$(cat private.pem)
JWT_PUBLIC_KEY=$(cat public.pem)
```

## 📝 Changelog

### Recent Updates

- Added RS256 algorithm support for production security
- Implemented Redis-backed token blacklisting
- Created comprehensive use case layer
- Added AWS Cognito identity provider
- Implemented token refresh with rotation
- Enhanced password policies with configurable rules

---

**Package Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Maintainer**: Security Team
