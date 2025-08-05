# Auth Service

Authentication service for the Pika platform, providing user authentication, JWT token management, and multi-strategy authentication support.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/auth:local

# Build
yarn nx run @pikad

# Test
yarn vitest packages/services/auth
```

## 📋 Overview

The Auth Service handles all authentication-related operations for the Pika platform:

- **User Authentication**: Login/logout functionality with secure password handling
- **JWT Management**: Access and refresh token generation and validation
- **Registration**: New user registration with validation
- **Multi-Strategy Support**: Extensible authentication strategies (Local, OAuth ready)
- **Password Security**: Bcrypt hashing with security validation rules

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/         # HTTP request handlers
│   └── AuthController   # Authentication endpoints
├── services/            # Business logic
│   ├── AuthService      # Core authentication logic
│   ├── JwtTokenService  # JWT token management
│   └── PasswordService  # Password security
├── repositories/        # Data access layer
│   └── UserRepository   # User data operations
├── strategies/          # Authentication strategies
│   ├── AuthStrategy     # Base strategy interface
│   └── LocalAuthStrategy # Username/password auth
├── routes/              # API route definitions
├── mappers/             # Data transformation
└── types/               # TypeScript definitions
```

### Key Components

- **AuthController**: Handles HTTP requests for login, logout, register, and token refresh
- **AuthService**: Core business logic for authentication operations
- **JwtTokenService**: Manages JWT token creation, validation, and refresh
- **PasswordSecurityService**: Enforces password policies and secure hashing
- **AuthStrategy**: Extensible pattern for multiple authentication methods

## 🔌 API Endpoints

| Method | Endpoint         | Description                 |
| ------ | ---------------- | --------------------------- |
| POST   | `/auth/login`    | User login with credentials |
| POST   | `/auth/register` | New user registration       |
| POST   | `/auth/logout`   | User logout                 |
| POST   | `/auth/refresh`  | Refresh access token        |
| GET    | `/auth/verify`   | Verify current token        |

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Service Configuration
AUTH_SERVICE_PORT=5502
AUTH_SERVICE_NAME=auth

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/auth

# Run with coverage
yarn vitest packages/services/auth --coverage

# Run specific test file
yarn vitest packages/services/auth/src/test/auth.test.ts
```

## 🔄 Integration

### Service Dependencies

- **User Service**: Retrieves user profile data
- **Database**: PostgreSQL via Prisma for user credentials
- **Redis**: Token blacklisting and session management

### Inter-Service Communication

```typescript
// Example: Validating user exists
const userClient = new UserServiceClient()
const user = await userClient.getUserById(userId)
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with configurable rounds
- **Token Security**: Short-lived access tokens with refresh mechanism
- **Rate Limiting**: Login attempt protection
- **Token Blacklisting**: Logout invalidation via Redis
- **CORS Protection**: Configured for API Gateway

## 📊 Token Structure

### Access Token Claims

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Refresh Token Claims

```json
{
  "sub": "user-id",
  "tokenFamily": "family-id",
  "iat": 1234567890,
  "exp": 1235172690
}
```

## 🚨 Error Handling

| Error Code | Description                   |
| ---------- | ----------------------------- |
| AUTH001    | Invalid credentials           |
| AUTH002    | Token expired                 |
| AUTH003    | Invalid token                 |
| AUTH004    | User already exists           |
| AUTH005    | Password requirements not met |

## 📈 Performance Considerations

- Token validation cached in memory
- Database queries optimized with indexes
- Password hashing performed asynchronously
- Refresh token rotation for security

## 🔄 Future Enhancements

- [ ] OAuth2 integration (Google, Facebook)
- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication support
- [ ] Password reset flow
- [ ] Account lockout policies
- [ ] Session management dashboard
