import { vi } from 'vitest'

/**
 * Mock JWT Service for testing authentication flows
 */
export class MockJWTService {
  generateToken = vi.fn().mockResolvedValue('mock-jwt-token')

  verifyToken = vi.fn().mockImplementation(async (token: string) => {
    // Parse mock JWT tokens for testing
    if (token.includes('expired')) {
      throw new Error('Token expired')
    }

    if (token.includes('invalid')) {
      throw new Error('Invalid token')
    }

    // Default mock response for authentication
    return {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      role: 'ADMIN',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    }
  })

  generateRefreshToken = vi.fn().mockResolvedValue('mock-refresh-token')

  verifyRefreshToken = vi.fn().mockImplementation(async (token: string) => {
    if (token.includes('expired')) {
      throw new Error('Refresh token expired')
    }

    if (token.includes('invalid')) {
      throw new Error('Invalid refresh token')
    }

    return {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      tokenFamily: 'family-123',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 604800, // 7 days
    }
  })

  // Method to customize the mock response for specific test scenarios
  mockUserToken(userId: string, email: string, role: string = 'ADMIN') {
    this.verifyToken.mockImplementationOnce(async (token: string) => {
      if (token.includes('expired') || token.includes('invalid')) {
        throw new Error('Invalid token')
      }

      return {
        userId,
        email,
        role,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      }
    })
  }
}
