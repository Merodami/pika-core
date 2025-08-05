import { UserRole } from '@pika/types'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// Import our schemas to test compilation
import { ZodRegistry } from '../common/registry/base.js'
import { validate } from '../common/utils/validators.js'
import { shared } from '../index.js'
import { paginatedResponse } from '../schemas/shared/responses.js'

const { DateTime, Email, ErrorResponse, Money, Password, UserId, UUID } = shared

import { TokenRequest, TokenResponse } from '../schemas/auth/public/oauth.js'

describe('Zod Schema Compilation', () => {
  it('should compile branded types', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000' as any
    const parsed = UserId.parse(userId)

    expect(parsed).toBe(userId)
  })

  it('should compile and validate email', () => {
    const email = 'USER@EXAMPLE.COM'
    const parsed = Email.parse(email)

    expect(parsed).toBe('user@example.com') // Should be lowercased
  })

  it('should compile money type', () => {
    const amount = 1000
    const parsed = Money.parse(amount)

    expect(parsed).toBe(amount)
  })

  it('should compile primitive schemas', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'

    expect(UUID.parse(uuid)).toBe(uuid)

    const password = 'SecurePass123!'

    expect(Password.parse(password)).toBe(password)
  })

  it('should compile datetime transform', () => {
    const dateStr = '2024-01-01T00:00:00Z'
    const parsed = DateTime.parse(dateStr)

    expect(parsed).toBeInstanceOf(Date)
  })

  it('should compile OAuth token request schemas', () => {
    const tokenData: z.infer<typeof TokenRequest> = {
      grantType: 'password',
      username: 'user@example.com' as any,
      password: 'SecurePass123!',
    }

    const parsed = TokenRequest.parse(tokenData)

    expect(parsed.grantType).toBe('password')
    if (parsed.grantType === 'password') {
      expect(parsed.username).toBe('user@example.com')
    }
  })

  it('should compile response schemas', () => {
    const errorData = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Test error message',
      correlationId: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: '2024-01-01T00:00:00Z',
    }

    const parsed = ErrorResponse.parse(errorData)

    expect(parsed.statusCode).toBe(400)
    expect(parsed.error).toBe('Bad Request')
    expect(parsed.message).toBe('Test error message')
  })

  it('should compile paginated response factory', () => {
    const UserSchema = z.object({
      id: UserId,
      email: Email,
      name: z.string(),
    })

    const PaginatedUsers = paginatedResponse(UserSchema)

    const data = {
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000' as any,
          email: 'user@example.com' as any,
          name: 'Test User',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }

    const parsed = PaginatedUsers.parse(data)

    expect(parsed.data).toHaveLength(1)
    expect(parsed.pagination.page).toBe(1)
  })

  it('should create middleware validator', () => {
    const middleware = validate(TokenRequest)

    expect(middleware).toBeTypeOf('function')
    expect(middleware).toHaveLength(3) // req, res, next
  })

  it('should create and use registry', () => {
    const registry = new ZodRegistry({
      title: 'Test API',
      version: '1.0.0',
    })

    registry.registerSchema(
      'TestSchema',
      z.object({
        test: z.string(),
      }),
    )

    const schema = registry.getSchema('TestSchema')

    expect(schema).toBeDefined()
  })
})

describe('Type Inference', () => {
  it('should infer types correctly', () => {
    // Test type inference
    type TokenRequestType = z.infer<typeof TokenRequest>
    type TokenResponseType = z.infer<typeof TokenResponse>

    // These should compile without errors
    const req: TokenRequestType = {
      grantType: 'password',
      username: 'test@example.com' as any,
      password: 'SecurePass123!',
    }

    const resp: TokenResponseType = {
      accessToken: 'jwt-token' as any,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshToken: 'refresh-token' as any,
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000' as any,
        email: 'test@example.com' as any,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        profilePicture: 'https://example.com/pic.jpg',
      },
    }

    expect(req).toBeDefined()
    expect(resp).toBeDefined()
  })
})
