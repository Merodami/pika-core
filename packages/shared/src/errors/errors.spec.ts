import { describe, expect, it } from 'vitest'

import {
  ApplicationError,
  ErrorDomain,
  ErrorFactory,
  ErrorSeverity,
  ValidationError,
} from './index.js'

describe('New Error System', () => {
  describe('ApplicationError', () => {
    it('should create an application error with correct properties', () => {
      const error = new ApplicationError('Test error message', {
        code: 'TEST_ERROR',
        httpStatus: 400,
      })

      expect(error).toBeInstanceOf(ApplicationError)
      expect(error.message).toBe('Test error message')
      expect(error.context.code).toBe('TEST_ERROR')
      expect(error.context.domain).toBe(ErrorDomain.APPLICATION)
      expect(error.context.httpStatus).toBe(400)
      expect(error.getHttpStatus()).toBe(400)
    })
  })

  describe('ValidationError', () => {
    it('should create a validation error with validation details', () => {
      const validationErrors = {
        email: ['Email is required', 'Email must be valid'],
        password: ['Password is too short'],
      }

      const error = new ValidationError(validationErrors)

      expect(error).toBeInstanceOf(ValidationError)
      expect(error.context.domain).toBe(ErrorDomain.VALIDATION)
      expect(error.validationErrors).toEqual(validationErrors)
      expect(error.getHttpStatus()).toBe(400)

      const response = error.toResponseObject()

      expect(response.error.validationErrors).toEqual(validationErrors)
    })
  })

  describe('ErrorFactory', () => {
    it('should create a resource not found error', () => {
      const error = ErrorFactory.resourceNotFound('User', '123')

      expect(error.message).toContain('User with ID 123 not found')
      expect(error.getHttpStatus()).toBe(404)
      expect(error.context.severity).toBe(ErrorSeverity.INFO)
    })

    it('should create a validation error', () => {
      const validationErrors = { name: ['Name is required'] }
      const error = ErrorFactory.validationError(validationErrors)

      expect(error.validationErrors).toEqual(validationErrors)
      expect(error.getHttpStatus()).toBe(400)
    })

    it('should transform an unknown error', () => {
      const originalError = new Error('Something went wrong')
      const error = ErrorFactory.fromError(originalError)

      expect(error.message).toBe('Something went wrong')
      expect(error.context.code).toBe('UNEXPECTED_ERROR')
      expect(error.context.httpStatus).toBe(500)
    })
  })
})
