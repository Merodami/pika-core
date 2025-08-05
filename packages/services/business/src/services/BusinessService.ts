import type {
  CreateBusinessData,
  IBusinessRepository,
  UpdateBusinessData,
} from '@business/repositories/BusinessRepository.js'
import type { BusinessSearchParams } from '@business/types/search.js'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import type { BusinessDomain } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { TranslationClient } from '@pika/translation'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import { v4 as uuid } from 'uuid'

export interface IBusinessService {
  getAllBusinesses(
    params: BusinessSearchParams,
  ): Promise<PaginatedResult<BusinessDomain>>
  getBusinessById(
    id: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain>
  getBusinessByUserId(
    userId: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain>
  createBusiness(data: CreateBusinessRequest): Promise<BusinessDomain>
  updateBusiness(
    id: string,
    data: UpdateBusinessRequest,
  ): Promise<BusinessDomain>
  deleteBusiness(id: string): Promise<void>
  verifyBusiness(id: string): Promise<BusinessDomain>
  deactivateBusiness(id: string): Promise<BusinessDomain>
  updateBusinessRating(id: string, rating: number): Promise<BusinessDomain>
}

export interface CreateBusinessRequest {
  userId: string
  businessName: string
  businessDescription?: string
  categoryId: string
  verified?: boolean
  active?: boolean
}

export interface UpdateBusinessRequest {
  businessName?: string
  businessDescription?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}

/**
 * Business service implementation with business logic
 * Handles business operations including translation key management
 */
export class BusinessService implements IBusinessService {
  constructor(
    private readonly businessRepository: IBusinessRepository,
    private readonly translationService: TranslationClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Retrieve all businesses with filters and pagination
   */
  async getAllBusinesses(
    params: BusinessSearchParams,
  ): Promise<PaginatedResult<BusinessDomain>> {
    try {
      logger.debug('Fetching businesses with params:', params)

      const result = await this.businessRepository.findAll(params)

      logger.debug(`Found ${result.data.length} businesses`)

      return result
    } catch (error) {
      logger.error('Error in getAllBusinesses:', error)
      throw ErrorFactory.fromError(error, 'Error fetching businesses', {
        source: 'BusinessService.getAllBusinesses',
      })
    }
  }

  /**
   * Retrieve a business by ID
   */
  async getBusinessById(
    id: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Fetching business by ID: ${id}`)

      const business = await this.businessRepository.findById(id, includes)

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', id, {
          source: 'BusinessService.getBusinessById',
        })
      }

      return business
    } catch (error) {
      logger.error(`Error fetching business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error fetching business', {
        source: 'BusinessService.getBusinessById',
      })
    }
  }

  /**
   * Retrieve a business by user ID
   */
  async getBusinessByUserId(
    userId: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Fetching business by user ID: ${userId}`)

      const business = await this.businessRepository.findByUserId(
        userId,
        includes,
      )

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', `user:${userId}`, {
          source: 'BusinessService.getBusinessByUserId',
        })
      }

      return business
    } catch (error) {
      logger.error(`Error fetching business for user ${userId}:`, error)
      throw ErrorFactory.fromError(error, 'Error fetching business by user', {
        source: 'BusinessService.getBusinessByUserId',
      })
    }
  }

  /**
   * Create a new business
   */
  async createBusiness(data: CreateBusinessRequest): Promise<BusinessDomain> {
    try {
      logger.debug(`Creating business for user: ${data.userId}`)

      // Check if business already exists for this user
      const existingBusiness = await this.businessRepository.findByUserId(
        data.userId,
      )

      if (existingBusiness) {
        throw ErrorFactory.resourceConflict(
          'Business',
          'Business already exists for this user',
          {
            source: 'BusinessService.createBusiness',
            metadata: { userId: data.userId },
          },
        )
      }

      // Generate translation keys for business name and description
      const businessNameKey = `business.name.${uuid()}`
      const businessDescriptionKey = data.businessDescription
        ? `business.description.${uuid()}`
        : undefined

      // Create translations
      await this.translationService.set(
        businessNameKey,
        DEFAULT_LANGUAGE,
        data.businessName,
      )

      if (businessDescriptionKey && data.businessDescription) {
        await this.translationService.set(
          businessDescriptionKey,
          DEFAULT_LANGUAGE,
          data.businessDescription,
        )
      }

      // Create business record
      const createData: CreateBusinessData = {
        userId: data.userId,
        businessNameKey,
        businessDescriptionKey,
        categoryId: data.categoryId,
        verified: data.verified ?? false,
        active: data.active ?? true,
        avgRating: 0,
      }

      const business = await this.businessRepository.create(createData)

      logger.debug(`Business created successfully: ${business.id}`)

      return business
    } catch (error) {
      logger.error('Error creating business:', error)
      throw ErrorFactory.fromError(error, 'Error creating business', {
        source: 'BusinessService.createBusiness',
      })
    }
  }

  /**
   * Update an existing business
   */
  async updateBusiness(
    id: string,
    data: UpdateBusinessRequest,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Updating business: ${id}`)

      // Get existing business
      const existingBusiness = await this.businessRepository.findById(id)

      if (!existingBusiness) {
        throw ErrorFactory.resourceNotFound('Business', id, {
          source: 'BusinessService.updateBusiness',
        })
      }

      const updateData: UpdateBusinessData = {}

      // Update business name translation if provided
      if (data.businessName) {
        await this.translationService.set(
          existingBusiness.businessNameKey,
          DEFAULT_LANGUAGE,
          data.businessName,
        )
      }

      // Update business description translation if provided
      if (data.businessDescription !== undefined) {
        if (
          data.businessDescription &&
          existingBusiness.businessDescriptionKey
        ) {
          // Update existing description
          await this.translationService.set(
            existingBusiness.businessDescriptionKey,
            DEFAULT_LANGUAGE,
            data.businessDescription,
          )
        } else if (
          data.businessDescription &&
          !existingBusiness.businessDescriptionKey
        ) {
          // Create new description
          const businessDescriptionKey = `business.description.${uuid()}`

          await this.translationService.set(
            businessDescriptionKey,
            DEFAULT_LANGUAGE,
            data.businessDescription,
          )
          updateData.businessDescriptionKey = businessDescriptionKey
        } else if (
          !data.businessDescription &&
          existingBusiness.businessDescriptionKey
        ) {
          // Remove description
          updateData.businessDescriptionKey = null
        }
      }

      // Update other fields
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId
      }
      if (data.verified !== undefined) {
        updateData.verified = data.verified
      }
      if (data.active !== undefined) {
        updateData.active = data.active
      }

      const business = await this.businessRepository.update(id, updateData)

      // Invalidate related cache entries
      if (this.cacheService) {
        await this.cacheService.del(`business:${id}`)
        await this.cacheService.del(`business:user:${business.userId}`)
      }

      logger.debug(`Business updated successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error updating business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error updating business', {
        source: 'BusinessService.updateBusiness',
      })
    }
  }

  /**
   * Delete a business (soft delete)
   */
  async deleteBusiness(id: string): Promise<void> {
    try {
      logger.debug(`Deleting business: ${id}`)

      // Check if business exists
      const business = await this.businessRepository.findById(id)

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', id, {
          source: 'BusinessService.deleteBusiness',
        })
      }

      await this.businessRepository.delete(id)

      // Invalidate cache
      if (this.cacheService) {
        await this.cacheService.del(`business:${id}`)
        await this.cacheService.del(`business:user:${business.userId}`)
      }

      logger.debug(`Business deleted successfully: ${id}`)
    } catch (error) {
      logger.error(`Error deleting business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error deleting business', {
        source: 'BusinessService.deleteBusiness',
      })
    }
  }

  /**
   * Verify a business
   */
  async verifyBusiness(id: string): Promise<BusinessDomain> {
    try {
      logger.debug(`Verifying business: ${id}`)

      const business = await this.businessRepository.update(id, {
        verified: true,
      })

      logger.debug(`Business verified successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error verifying business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error verifying business', {
        source: 'BusinessService.verifyBusiness',
      })
    }
  }

  /**
   * Deactivate a business
   */
  async deactivateBusiness(id: string): Promise<BusinessDomain> {
    try {
      logger.debug(`Deactivating business: ${id}`)

      const business = await this.businessRepository.update(id, {
        active: false,
      })

      logger.debug(`Business deactivated successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error deactivating business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error deactivating business', {
        source: 'BusinessService.deactivateBusiness',
      })
    }
  }

  /**
   * Update business rating
   */
  async updateBusinessRating(
    id: string,
    rating: number,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Updating business rating: ${id}, rating: ${rating}`)

      // Validate rating range
      if (rating < 0 || rating > 5) {
        throw ErrorFactory.validationError(
          { rating: ['Rating must be between 0 and 5'] },
          { source: 'BusinessService.updateBusinessRating' },
        )
      }

      const business = await this.businessRepository.update(id, {
        avgRating: rating,
      })

      logger.debug(`Business rating updated successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error updating business rating ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error updating business rating', {
        source: 'BusinessService.updateBusinessRating',
      })
    }
  }
}
