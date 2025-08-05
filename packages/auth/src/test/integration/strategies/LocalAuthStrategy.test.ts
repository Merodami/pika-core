import { UserRole, UserStatus } from '@pika/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtTokenService } from '../../../services/JwtTokenService.js'
import { PasswordSecurityService } from '../../../services/PasswordSecurityService.js'
import {
  LoginCredentials,
  RegistrationData,
} from '../../../strategies/AuthStrategy.js'
import {
  LocalAuthStrategy,
  UserService,
  UserServiceUser,
} from '../../../strategies/LocalAuthStrategy.js'

describe('LocalAuthStrategy Integration', () => {
  let authStrategy: LocalAuthStrategy
  let userService: UserService
  let passwordService: PasswordSecurityService
  let tokenService: JwtTokenService

  const mockUser: UserServiceUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    createdAt: new Date(),
    lastLoginAt: new Date(),
    isActive: () => true,
  }

  const createMockUserService = (): UserService => ({
    findByEmail: vi.fn(),
    createUser: vi.fn(),
    updateLastLogin: vi.fn(),
    emailExists: vi.fn(),
    phoneExists: vi.fn(),
  })

  beforeEach(() => {
    userService = createMockUserService()
    passwordService = new PasswordSecurityService()
    tokenService = new JwtTokenService(
      'test-secret-key-32-characters-long-for-testing',
    )
    authStrategy = new LocalAuthStrategy(
      userService,
      passwordService,
      tokenService,
    )
  })

  describe('Authentication Flow', () => {
    it('should authenticate user with correct credentials', async () => {
      const plainPassword = 'testPassword123!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)
      const userWithHashedPassword = { ...mockUser, password: hashedPassword }

      vi.mocked(userService.findByEmail).mockResolvedValue(
        userWithHashedPassword,
      )
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined)

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: plainPassword,
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()
      expect(result.user?.id).toBe(mockUser.id)
      expect(result.user?.email).toBe(mockUser.email)
      expect(result.tokens?.accessToken).toBeTruthy()
      expect(result.tokens?.refreshToken).toBeTruthy()

      // Verify user service calls
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(userService.updateLastLogin).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Date),
      )
    })

    it('should reject authentication with incorrect password', async () => {
      const correctPassword = 'testPassword123!'
      const wrongPassword = 'wrongPassword456!'
      const hashedPassword = await passwordService.hashPassword(correctPassword)
      const userWithHashedPassword = { ...mockUser, password: hashedPassword }

      vi.mocked(userService.findByEmail).mockResolvedValue(
        userWithHashedPassword,
      )

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: wrongPassword,
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
      expect(result.user).toBeUndefined()
      expect(result.tokens).toBeUndefined()

      // Should not update last login on failed auth
      expect(userService.updateLastLogin).not.toHaveBeenCalled()
    })

    it('should reject authentication for non-existent user', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(null)

      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'testPassword123!',
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
      expect(result.user).toBeUndefined()
      expect(result.tokens).toBeUndefined()
    })

    it('should reject authentication for inactive user', async () => {
      const inactiveUser = {
        ...mockUser,
        status: 'SUSPENDED' as any,
        isActive: () => false,
      }

      vi.mocked(userService.findByEmail).mockResolvedValue(inactiveUser)

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'testPassword123!',
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Account is inactive. Please contact support.')
      expect(result.user).toBeUndefined()
      expect(result.tokens).toBeUndefined()
    })

    it('should reject authentication for user without password', async () => {
      const userWithoutPassword = { ...mockUser, password: undefined }

      vi.mocked(userService.findByEmail).mockResolvedValue(userWithoutPassword)

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'testPassword123!',
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Password authentication not available for this account',
      )
    })

    it('should handle authentication errors gracefully', async () => {
      vi.mocked(userService.findByEmail).mockRejectedValue(
        new Error('Database error'),
      )

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'testPassword123!',
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed. Please try again.')
    })
  })

  describe('Registration Flow', () => {
    it('should register new user successfully', async () => {
      const plainPassword = 'testPassword123!'
      const newUser = { ...mockUser, id: 'new-user-123' }

      vi.mocked(userService.emailExists).mockResolvedValue(false)
      vi.mocked(userService.phoneExists).mockResolvedValue(false)
      vi.mocked(userService.createUser).mockResolvedValue(newUser)

      const registrationData: RegistrationData = {
        email: 'newuser@example.com',
        password: plainPassword,
        firstName: 'New',
        lastName: 'User',
        role: UserRole.ADMIN,
        phoneNumber: '+1234567890',
        source: 'web',
        acceptTerms: true,
      }

      const result = await authStrategy.register(registrationData)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeUndefined() // No tokens for unverified users
      expect(result.user?.id).toBe(newUser.id)

      // Verify password was hashed before storage
      const createUserCall = vi.mocked(userService.createUser).mock.calls[0][0]

      expect(createUserCall.password).not.toBe(plainPassword)
      expect(createUserCall.password).toMatch(/^\$2b\$12\$/)

      // Verify other fields
      expect(createUserCall.email).toBe('newuser@example.com')
      expect(createUserCall.firstName).toBe('New')
      expect(createUserCall.lastName).toBe('User')
      expect(createUserCall.role).toBe(UserRole.ADMIN)
      expect(createUserCall.phoneNumber).toBe('+1234567890')
    })

    it('should reject registration with existing email', async () => {
      vi.mocked(userService.emailExists).mockResolvedValue(true)

      const registrationData: RegistrationData = {
        email: 'existing@example.com',
        password: 'testPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        source: 'web',
        acceptTerms: true,
      }

      const result = await authStrategy.register(registrationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already registered')
      expect(userService.createUser).not.toHaveBeenCalled()
    })

    it('should reject registration with existing phone number', async () => {
      vi.mocked(userService.emailExists).mockResolvedValue(false)
      vi.mocked(userService.phoneExists).mockResolvedValue(true)

      const registrationData: RegistrationData = {
        email: 'test@example.com',
        password: 'testPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        phoneNumber: '+1234567890',
        source: 'web',
        acceptTerms: true,
      }

      const result = await authStrategy.register(registrationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Phone number already registered')
      expect(userService.createUser).not.toHaveBeenCalled()
    })

    it('should handle registration without phone number', async () => {
      const newUser = { ...mockUser, id: 'new-user-123' }

      vi.mocked(userService.emailExists).mockResolvedValue(false)
      vi.mocked(userService.createUser).mockResolvedValue(newUser)

      const registrationData: RegistrationData = {
        email: 'test@example.com',
        password: 'testPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        source: 'web',
        acceptTerms: true,
        // No phone number
      }

      const result = await authStrategy.register(registrationData)

      expect(result.success).toBe(true)
      expect(userService.phoneExists).not.toHaveBeenCalled()
    })

    it('should handle registration errors gracefully', async () => {
      vi.mocked(userService.emailExists).mockRejectedValue(
        new Error('Database error'),
      )

      const registrationData: RegistrationData = {
        email: 'test@example.com',
        password: 'testPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        source: 'web',
        acceptTerms: true,
      }

      const result = await authStrategy.register(registrationData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('Token Refresh Flow', () => {
    it('should refresh tokens successfully', async () => {
      // First generate tokens
      const plainPassword = 'testPassword123!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)
      const userWithHashedPassword = { ...mockUser, password: hashedPassword }

      vi.mocked(userService.findByEmail).mockResolvedValue(
        userWithHashedPassword,
      )
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined)

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: plainPassword,
        source: 'web',
      }

      const authResult = await authStrategy.authenticate(credentials)

      expect(authResult.success).toBe(true)

      // Now test refresh
      const refreshResult = await authStrategy.refreshToken(
        authResult.tokens!.refreshToken,
      )

      expect(refreshResult.success).toBe(true)
      expect(refreshResult.tokens).toBeDefined()
      expect(refreshResult.tokens?.accessToken).toBeTruthy()
      expect(refreshResult.tokens?.refreshToken).toBeTruthy()
      expect(refreshResult.tokens?.expiresAt).toBeInstanceOf(Date)
    })

    it('should reject refresh with invalid token', async () => {
      const result = await authStrategy.refreshToken('invalid.token.here')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      const userId = 'user-123'
      const token = 'valid.jwt.token'

      await expect(authStrategy.logout(userId, token)).resolves.not.toThrow()
    })

    it('should handle logout without token', async () => {
      const userId = 'user-123'

      await expect(authStrategy.logout(userId)).resolves.not.toThrow()
    })

    it('should handle logout errors gracefully', async () => {
      const userId = 'user-123'
      const invalidToken = 'invalid.token'

      // Should not throw even with invalid token
      await expect(
        authStrategy.logout(userId, invalidToken),
      ).resolves.not.toThrow()
    })
  })

  describe('Input Validation', () => {
    it('should validate login credentials', async () => {
      const invalidCredentials = [
        { email: '', password: 'test' },
        { email: 'invalid-email', password: 'test' },
        { email: 'test@example.com', password: '' },
        { email: null as any, password: 'test' },
        { email: 'test@example.com', password: null as any },
      ]

      for (const credentials of invalidCredentials) {
        const result = await authStrategy.authenticate(
          credentials as LoginCredentials,
        )

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        // The error can be authentication failure or validation failure
        expect(typeof result.error).toBe('string')
      }
    })

    it('should validate registration data', async () => {
      const invalidRegistrations = [
        {
          email: '',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ADMIN,
          acceptTerms: true,
        },
        {
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.ADMIN,
          acceptTerms: true,
        },
        {
          email: 'test@example.com',
          password: 'Test123!',
          firstName: '',
          lastName: 'User',
          role: UserRole.ADMIN,
          acceptTerms: true,
        },
        {
          email: 'test@example.com',
          password: 'Test123!',
          firstName: 'Test',
          lastName: '',
          role: UserRole.ADMIN,
          acceptTerms: true,
        },
        {
          email: 'test@example.com',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'INVALID' as any,
          acceptTerms: true,
        },
      ]

      for (const data of invalidRegistrations) {
        const result = await authStrategy.register(data as RegistrationData)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        // The error message can be either validation error or registration error
        expect(typeof result.error).toBe('string')
      }
    })

    it('should validate phone numbers', async () => {
      vi.mocked(userService.emailExists).mockResolvedValue(false)

      const registrationWithInvalidPhone: RegistrationData = {
        email: 'test@example.com',
        password: 'testPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ADMIN,
        phoneNumber: '123', // Too short
        source: 'web',
        acceptTerms: true,
      }

      const result = await authStrategy.register(registrationWithInvalidPhone)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid phone number format')
    })
  })

  describe('Security Tests', () => {
    it('should not expose sensitive information in errors', async () => {
      vi.mocked(userService.findByEmail).mockRejectedValue(
        new Error(
          'Database connection failed with credentials user:password@host',
        ),
      )

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'testPassword123!',
        source: 'web',
      }

      const result = await authStrategy.authenticate(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed. Please try again.')
      expect(result.error).not.toContain('Database')
      expect(result.error).not.toContain('connection')
      expect(result.error).not.toContain('credentials')
    })

    it('should normalize email addresses', async () => {
      const plainPassword = 'testPassword123!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)
      const userWithHashedPassword = { ...mockUser, password: hashedPassword }

      vi.mocked(userService.findByEmail).mockResolvedValue(
        userWithHashedPassword,
      )
      vi.mocked(userService.updateLastLogin).mockResolvedValue(undefined)

      const credentials: LoginCredentials = {
        email: '  TEST@EXAMPLE.COM  ', // With spaces and uppercase
        password: plainPassword,
        source: 'web',
      }

      await authStrategy.authenticate(credentials)

      // Should have normalized the email
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should trim input fields during registration', async () => {
      const newUser = { ...mockUser, id: 'new-user-123' }

      vi.mocked(userService.emailExists).mockResolvedValue(false)
      vi.mocked(userService.createUser).mockResolvedValue(newUser)

      const registrationData: RegistrationData = {
        email: '  test@example.com  ',
        password: 'testPassword123!',
        firstName: '  Test  ',
        lastName: '  User  ',
        role: UserRole.ADMIN,
        phoneNumber: '  +1234567890  ',
        source: 'web',
        acceptTerms: true,
      }

      await authStrategy.register(registrationData)

      const createUserCall = vi.mocked(userService.createUser).mock.calls[0][0]

      expect(createUserCall.email).toBe('test@example.com')
      expect(createUserCall.firstName).toBe('Test')
      expect(createUserCall.lastName).toBe('User')
      expect(createUserCall.phoneNumber).toBe('+1234567890')
    })
  })

  describe('Strategy Support Check', () => {
    it('should support email/password credentials', () => {
      const credentials = { email: 'test@example.com', password: 'test123' }

      expect(authStrategy.supports(credentials)).toBe(true)
    })

    it('should not support credentials without email or password', () => {
      const invalidCredentials = [
        { email: 'test@example.com' }, // No password
        { password: 'test123' }, // No email
        { username: 'test', password: 'test123' }, // No email
        {},
      ]

      invalidCredentials.forEach((credentials) => {
        expect(authStrategy.supports(credentials)).toBe(false)
      })
    })
  })
})
