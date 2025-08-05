import { VerificationType } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Unified verification request schema
 */
export const UnifiedVerificationRequest = z.object({
  type: createZodEnum(VerificationType),
  token: z.string().optional(),
  code: z.string().length(6).optional(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

export type UnifiedVerificationRequest = z.infer<
  typeof UnifiedVerificationRequest
>

/**
 * Unified resend verification request schema
 */
export const UnifiedResendVerificationRequest = z.object({
  type: z.enum([VerificationType.EMAIL, VerificationType.PHONE]),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

export type UnifiedResendVerificationRequest = z.infer<
  typeof UnifiedResendVerificationRequest
>

/**
 * Unified verification response schema
 */
export const UnifiedVerificationResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export type UnifiedVerificationResponse = z.infer<
  typeof UnifiedVerificationResponse
>
