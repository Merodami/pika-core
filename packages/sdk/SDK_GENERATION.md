# SDK Generation Guide

## Overview

The Pika SDK provides a type-safe TypeScript client for frontend developers, automatically generated from our OpenAPI specifications.

## Architecture

### 1. Source of Truth

- **Zod Schemas**: Defined in `packages/api` using `@asteasolutions/zod-to-openapi`
- **Location**: `packages/api/src/{public,admin,internal}/schemas/`
- **Purpose**: Single source of truth for API contracts

### 2. Generation Pipeline

```
Zod Schemas → OpenAPI Spec → TypeScript SDK
```

- **Tool**: `openapi-typescript-codegen` (v0.29.0)
- **Output**: `packages/sdk/src/openapi/`

## How to Generate SDK

### Step 1: Generate OpenAPI Specification

```bash
yarn generate:api
```

This creates: `packages/api/generated/openapi/all-apis.json`

### Step 2: Generate TypeScript SDK

```bash
yarn generate:sdk
```

This command:

- Waits for the OpenAPI spec to be available
- Generates TypeScript client code
- Formats code with Prettier
- Fixes ESM import paths

### One Command for Everything

```bash
yarn generate:api && yarn generate:sdk
```

## Generated SDK Structure

```
packages/sdk/src/openapi/
├── API.ts                 # Main client class
├── core/                  # HTTP client utilities
│   ├── ApiError.ts
│   ├── BaseHttpRequest.ts
│   └── ...
├── models/                # TypeScript interfaces
│   ├── LoginRequest.ts
│   ├── UserProfile.ts
│   └── ...
└── services/              # API service classes
    ├── AuthenticationService.ts
    ├── UsersService.ts
    └── ...
```

## Usage Guide for Frontend Developers

### Basic Setup

```typescript
import { API } from '@pika/sdk/openapi'

// Initialize the API client
const api = new API({
  BASE: 'https://api.pika.com/v1',
  TOKEN: 'your-jwt-token',
})
```

### Authentication Example

```typescript
// Login
const { accessToken, user } = await api.authentication.postAuthLogin({
  requestBody: {
    email: 'user@example.com',
    password: 'password123',
  },
})

// Use the token for subsequent requests
api.request.config.TOKEN = accessToken
```

### User Profile Example

```typescript
// Get current user profile
const profile = await api.users.getUsersProfile()

// Update profile
const updatedProfile = await api.users.patchUsersProfile({
  requestBody: {
    firstName: 'John',
    lastName: 'Doe',
  },
})
```

### Session Booking Example

```typescript
// Search for sessions
const sessions = await api.sessions.getSessionsBook({
  page: 1,
  limit: 10,
  gymId: 'gym-uuid',
})

// Book a session
const booking = await api.sessions.postSessionsBook({
  requestBody: {
    sessionId: 'session-uuid',
    participants: 2,
  },
})
```

### Error Handling

```typescript
import { ApiError } from '@pikapi'

try {
  const result = await api.users.getUsersProfile()
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.body)
  }
}
```

## Features

### Type Safety

- ✅ Full TypeScript support
- ✅ Auto-completion in IDEs
- ✅ Type-safe request parameters
- ✅ Type-safe response types

### Developer Experience

- ✅ Intuitive method naming
- ✅ Organized by service domain
- ✅ Built-in error handling
- ✅ Request/response interceptors

### API Coverage

- ✅ Public API endpoints
- ✅ Admin API endpoints
- ✅ Internal service endpoints
- ✅ Webhook handlers

## Best Practices

1. **Always regenerate SDK after API changes**

   ```bash
   yarn generate:api && yarn generate:sdk
   ```

2. **Use environment variables for configuration**

   ```typescript
   const api = new API({
     BASE: process.env.REACT_APP_API_URL,
     TOKEN: localStorage.getItem('token'),
   })
   ```

3. **Create a singleton instance**

   ```typescript
   // api-client.ts
   export const apiClient = new API({
     BASE: process.env.REACT_APP_API_URL,
   })
   ```

4. **Handle token refresh**
   ```typescript
   apiClient.request.config.TOKEN = newAccessToken
   ```

## Troubleshooting

### SDK not reflecting latest changes?

1. Ensure you've run `yarn generate:api` first
2. Check that `packages/api/generated/openapi/all-apis.json` exists
3. Run `yarn generate:sdk` again

### Import errors?

- The SDK uses ESM imports (`.js` extensions)
- Ensure your bundler supports ESM modules

### Type errors?

- Check that you're using the latest TypeScript version
- Ensure `@pikaroperly linked in your project

## Maintenance

The SDK is automatically kept in sync with backend APIs through our generation pipeline. No manual modifications should be made to files in `packages/sdk/src/openapi/` as they will be overwritten on the next generation.
