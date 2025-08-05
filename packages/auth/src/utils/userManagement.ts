import { logger } from '@pika/shared'
import { User, UserRole } from '@pika/types'
import { PrismaClient } from '@prisma/client'

import { mapUserToDomain } from '../mappers/userMapper.js'

/**
 * Interface representing user attributes from identity providers
 */
export interface IdentityProviderUserAttributes {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  roles?: string[]
  [key: string]: any
}

/**
 * Create or link a local user with an identity provider
 *
 * This function will:
 * 1. Check if a user already exists with the given email
 * 2. If it exists, link it to the identity provider if not already linked
 * 3. If it doesn't exist, create a new user and link it to the identity provider
 *
 * @param prisma PrismaClient instance
 * @param provider The identity provider name (e.g., 'cognito')
 * @param userAttributes User attributes from the identity provider
 * @param role The role to assign to newly created users
 * @returns The created or linked user
 */
export async function createOrLinkUser(
  prisma: PrismaClient,
  provider: string,
  userAttributes: IdentityProviderUserAttributes,
  role: UserRole = UserRole.ADMIN,
): Promise<User> {
  // Default attributes
  const firstName = userAttributes.firstName || 'User'
  const lastName = userAttributes.lastName || ''
  const emailVerified = userAttributes.emailVerified || false
  const phoneVerified = userAttributes.phoneVerified || false

  try {
    // Find a user linked to this identity
    try {
      // Try to find user identity
      const identity = await prisma.userIdentity.findUnique({
        where: {
          provider_providerId: {
            provider,
            providerId: userAttributes.id,
          },
        },
        include: { user: true },
      })

      if (identity) {
        logger.debug(
          `User already linked to ${provider} identity ${userAttributes.id}`,
        )

        return mapUserToDomain(identity.user)
      }
    } catch (error) {
      logger.warn(
        `Error finding user identity: ${error instanceof Error ? error.message : String(error)}`,
      )
      // Continue with other methods
    }

    // Check if a user with the same email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userAttributes.email },
    })

    if (existingUser) {
      // User exists, link it to the identity provider
      logger.debug(
        `Linking existing user ${existingUser.id} to ${provider} identity ${userAttributes.id}`,
      )

      try {
        await prisma.userIdentity.create({
          data: {
            provider,
            providerId: userAttributes.id,
            userId: existingUser.id,
          },
        })
      } catch (error) {
        logger.error(
          `Failed to link identity to existing user: ${error instanceof Error ? error.message : String(error)}`,
        )
        // Continue with user update but log the error
      }

      // Update user information if needed
      if (!existingUser.emailVerified && emailVerified) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified },
        })
      }

      return mapUserToDomain(existingUser)
    }

    // Create a new user and link it to the identity provider
    logger.debug(
      `Creating new user for ${provider} identity ${userAttributes.id}`,
    )

    return prisma.$transaction(async (tx: any) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          email: userAttributes.email,
          firstName,
          lastName,
          emailVerified,
          phoneNumber: userAttributes.phoneNumber,
          phoneVerified,
          role,
          lastLoginAt: new Date(),
        },
      })

      // Link to identity provider
      try {
        await tx.userIdentity.create({
          data: {
            provider,
            providerId: userAttributes.id,
            userId: newUser.id,
          },
        })
      } catch (error) {
        logger.error(
          `Failed to create user identity: ${error instanceof Error ? error.message : String(error)}`,
        )
        // Continue with user creation but log the error
      }

      // User profile created - no additional role-specific setup needed

      return mapUserToDomain(newUser)
    })
  } catch (error) {
    logger.error(
      `Failed to create or link user for ${provider} identity ${userAttributes.id}:`,
      error,
    )
    throw error
  }
}
