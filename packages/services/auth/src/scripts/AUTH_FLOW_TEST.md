# Authentication Flow Test

This script (`test-auth-flow.ts`) performs a comprehensive end-to-end test of the authentication system through the API Gateway.

## Prerequisites

1. Ensure all services are running:

   ```bash
   yarn local
   ```

2. Verify API Gateway is accessible at `http://localhost:5500`

## Test Flow

The script performs the following steps:

### 1. User Registration

- Creates a new user with random email
- Tests the `/api/v1/auth/register` endpoint
- Validates successful registration or handles existing user

### 2. User Login

- Authenticates with email/password
- Tests the `/api/v1/auth/login` endpoint
- Stores access and refresh tokens

### 3. Protected Endpoint Access

- Uses access token to call `/api/v1/users/me`
- Validates token authentication works

### 4. Unauthorized Access Test

- Attempts to access protected endpoint without token
- Verifies 401 error is returned

### 5. Token Refresh

- Uses refresh token to get new access token
- Tests the `/api/v1/auth/refresh` endpoint
- Validates new tokens are different from old ones

### 6. New Token Verification

- Uses newly refreshed access token
- Confirms continued access to protected resources

### 7. Logout

- Tests the `/api/v1/auth/logout` endpoint
- Invalidates the current session

### 8. Post-Logout Access Test

- Attempts to use token after logout
- Verifies token is properly invalidated

## Running the Test

```bash
# From the auth service directory
cd packages/services/auth
tsx src/scripts/test-auth-flow.ts

# Or from project root
yarn tsx packages/services/auth/src/scripts/test-auth-flow.ts
```

## Expected Output

Each step will show:

- Step name and number
- Success (✅) or Failure (❌) status
- Response data or error details

## Test Data

- Creates unique user email for each run using UUID
- Default password: `SecurePassword123!`
- Test user role: `admin`

## Error Handling

The script handles common scenarios:

- User already exists (409 conflict)
- Authentication failures (401 unauthorized)
- Network errors
- Invalid tokens

## Industry Standards Tested

1. **JWT Token Flow**: Access and refresh token pattern
2. **Bearer Authentication**: Standard Authorization header
3. **Token Rotation**: New tokens on refresh
4. **Session Invalidation**: Proper logout handling
5. **Error Responses**: Consistent error format
6. **Protected Resources**: Proper authentication gates
