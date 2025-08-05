#!/usr/bin/env tsx

import axios, { AxiosError } from 'axios'
import { randomUUID } from 'crypto'
import { createWriteStream } from 'fs'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'

// API Gateway URL
const API_BASE_URL = 'http://localhost:5500/api/v1'

// Test user credentials
const testUser = {
  email: `test.user.${randomUUID()}@example.com`,
  password: 'SecurePassword123!',
  firstName: 'Test',
  lastName: 'User',
  dateOfBirth: '1990-01-01T00:00:00Z',
  role: 'MEMBER',
  acceptTerms: true,
}

// Store tokens
let accessToken: string | null = null
let refreshToken: string | null = null
let userId: string | null = null

// Create log file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logFileName = `auth-test-${timestamp}.log`
const logPath = join(
  process.cwd(),
  'packages/services/auth/src/scripts/logs',
  logFileName,
)

// Ensure logs directory exists
try {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  mkdirSync(dirname(logPath), { recursive: true })
} catch (error) {
  console.error('Failed to create logs directory:', error)
}

// eslint-disable-next-line security/detect-non-literal-fs-filename
const logStream = createWriteStream(logPath, { flags: 'a' })

// Helper to log to both console and file
function log(message: string) {
  console.log(message)
  logStream.write(message + '\n')
}

// Helper function to print results
function printResult(step: string, success: boolean, data?: any, error?: any) {
  log('\n' + '='.repeat(60))
  log(`${step}: ${success ? '✅ SUCCESS' : '❌ FAILED'}`)
  if (data) {
    log('Response: ' + JSON.stringify(data, null, 2))
  }
  if (error) {
    log('Error: ' + JSON.stringify(error, null, 2))
  }
}

// Helper to extract error details
function getErrorDetails(error: any): any {
  if (error instanceof AxiosError) {
    return {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    }
  }

  return error
}

async function testAuthFlow() {
  log('Starting Authentication Flow Test')
  log('API Gateway URL: ' + API_BASE_URL)
  log('Test User Email: ' + testUser.email)
  log('Log File: ' + logPath)

  // Step 1: Register a new user
  log('\n🚀 Step 1: User Registration')
  log(
    'NOTE: New users are created with UNCONFIRMED status and require email verification',
  )
  try {
    const registerResponse = await axios.post(
      `${API_BASE_URL}/auth/register`,
      testUser,
    )

    printResult('Registration', true, registerResponse.data)

    // Extract user ID if available
    userId = registerResponse.data.user?.id || registerResponse.data.id

    log('\n⚠️  User created but needs email verification to become ACTIVE')
    log('In production, user would receive verification email')
    log(
      "For testing, we'll use the OAuth2 /token endpoint with existing credentials",
    )
  } catch (error) {
    const errorDetails = getErrorDetails(error)

    printResult('Registration', false, null, errorDetails)

    // Check for specific error cases
    if (
      errorDetails.status === 422 &&
      errorDetails.data?.error?.message?.includes('inactive user')
    ) {
      log(
        '\n⚠️  Registration created user but cannot generate tokens (user is UNCONFIRMED)',
      )
      log('This is expected behavior - new users must verify email first')
    } else if (errorDetails.status === 409) {
      log('User already exists, proceeding to login...')
    }
  }

  // Step 2: Login with credentials (using OAuth2 /token endpoint)
  log('\n🚀 Step 2: User Login (OAuth2 Token Endpoint)')

  // For testing, use the seeded superuser (should be ACTIVE)
  const activeTestUser = {
    email: 'admin@pika.com',
    password: 'Admin123!',
  }

  log('Using pre-existing active user for login test: ' + activeTestUser.email)

  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/token`, {
      grantType: 'password',
      username: activeTestUser.email,
      password: activeTestUser.password,
    })

    accessToken = loginResponse.data.accessToken
    refreshToken = loginResponse.data.refreshToken
    userId = loginResponse.data.user?.id || userId

    // Debug: Decode the token to see its contents
    if (accessToken) {
      try {
        const parts = accessToken.split('.')

        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

          log('Token payload: ' + JSON.stringify(payload, null, 2))
        }
      } catch (e) {
        log('Failed to decode token: ' + e)
      }
    }

    printResult('Login', true, {
      accessToken: accessToken
        ? 'JWT token received (hidden for security)'
        : null,
      refreshToken: refreshToken
        ? 'Refresh token received (hidden for security)'
        : null,
      user: loginResponse.data.user,
      tokenType: 'Bearer',
      expiresIn: loginResponse.data.expiresIn,
    })
  } catch (error) {
    printResult('Login', false, null, getErrorDetails(error))

    return
  }

  // Step 3: Access protected endpoint with token
  log('\n🚀 Step 3: Access Protected Endpoint')
  log(
    `Using access token: ${accessToken ? 'Token exists, length: ' + accessToken.length : 'No token'}`,
  )

  // Debug: Log first 50 chars of token to verify format
  if (accessToken) {
    log(`Token preview: ${accessToken.substring(0, 50)}...`)
    log(`Authorization header: Bearer ${accessToken.substring(0, 30)}...`)

    // Test token validation directly
    try {
      const { JwtTokenService } = await import('@pika/auth')
      const {
        JWT_SECRET,
        JWT_ACCESS_EXPIRY,
        JWT_REFRESH_EXPIRY,
        JWT_ISSUER,
        JWT_AUDIENCE,
      } = await import('@pika/environment')

      const jwtService = new JwtTokenService(
        JWT_SECRET,
        JWT_ACCESS_EXPIRY,
        JWT_REFRESH_EXPIRY,
        JWT_ISSUER,
        JWT_AUDIENCE,
      )

      const validation = await jwtService.verifyToken(accessToken, 'access')

      log('Direct token validation: ' + JSON.stringify(validation, null, 2))
    } catch (e) {
      log('Direct validation error: ' + e)
    }
  }

  // Add axios request interceptor to log headers
  axios.interceptors.request.use((config) => {
    log('Axios request headers: ' + JSON.stringify(config.headers, null, 2))

    return config
  })

  try {
    const protectedResponse = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    printResult('Protected Endpoint Access', true, protectedResponse.data)
  } catch (error) {
    printResult(
      'Protected Endpoint Access',
      false,
      null,
      getErrorDetails(error),
    )
  }

  // Step 4: Try to access without token (should fail)
  log('\n🚀 Step 4: Access Without Token (Should Fail)')
  try {
    await axios.get(`${API_BASE_URL}/users/me`)
    printResult('No Token Access', false, { message: 'Should have failed!' })
  } catch (error) {
    const errorDetails = getErrorDetails(error)
    const isExpectedError = errorDetails.status === 401

    printResult('No Token Access', isExpectedError, {
      message: 'Failed as expected',
      status: errorDetails.status,
    })
  }

  // Step 5: Refresh token
  log('\n🚀 Step 5: Refresh Token')
  try {
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token`, {
      grantType: 'refreshToken',
      refreshToken: refreshToken,
    })

    const newAccessToken = refreshResponse.data.accessToken
    const newRefreshToken = refreshResponse.data.refreshToken

    printResult('Token Refresh', true, {
      newAccessToken: newAccessToken ? 'New JWT token received' : null,
      newRefreshToken: newRefreshToken ? 'New refresh token received' : null,
      tokensChanged: {
        accessToken: newAccessToken !== accessToken,
        refreshToken: newRefreshToken !== refreshToken,
      },
    })

    // Update tokens
    accessToken = newAccessToken
    refreshToken = newRefreshToken
  } catch (error) {
    printResult('Token Refresh', false, null, getErrorDetails(error))
  }

  // Step 6: Use new access token
  log('\n🚀 Step 6: Use New Access Token')
  try {
    const verifyResponse = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    printResult('New Token Verification', true, verifyResponse.data)
  } catch (error) {
    printResult('New Token Verification', false, null, getErrorDetails(error))
  }

  // Step 7: Logout (Token Revocation)
  log('\n🚀 Step 7: Logout (Token Revocation)')
  try {
    const logoutResponse = await axios.post(
      `${API_BASE_URL}/auth/revoke`,
      {
        token: accessToken,
        tokenTypeHint: 'accessToken',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    printResult('Logout', true, logoutResponse.data)
  } catch (error) {
    printResult('Logout', false, null, getErrorDetails(error))
  }

  // Step 8: Try to use token after logout (should fail)
  log('\n🚀 Step 8: Use Token After Logout (Should Fail)')
  try {
    await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    printResult('Post-Logout Access', false, { message: 'Should have failed!' })
  } catch (error) {
    const errorDetails = getErrorDetails(error)
    const isExpectedError = errorDetails.status === 401

    printResult('Post-Logout Access', isExpectedError, {
      message: 'Failed as expected',
      status: errorDetails.status,
    })
  }

  log('\n' + '='.repeat(60))
  log('Authentication Flow Test Complete!')
  log('='.repeat(60))

  // Close log stream
  logStream.end()
}

// Run the test
testAuthFlow().catch((error) => {
  log('Unexpected error: ' + JSON.stringify(error, null, 2))
  logStream.end()
  process.exit(1)
})
