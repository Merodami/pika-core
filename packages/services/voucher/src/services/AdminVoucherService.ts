import { DEFAULT_LANGUAGE } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import type { VoucherDomain } from '@pika/sdk'
import type {
  CreateVoucherData as DomainCreateVoucherData,
  UpdateVoucherData as DomainUpdateVoucherData,
} from '@pika/sdk'
import {
  BusinessServiceClient,
  ErrorFactory,
  FileStoragePort,
  logger,
  VoucherBusinessRules,
} from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import {
  type LanguageCode,
  PaginatedResult,
  type ParsedIncludes,
  VoucherDiscountType,
  VoucherState,
} from '@pika/types'
import { v4 as uuid } from 'uuid'

import type { IAdminVoucherRepository } from '../repositories/AdminVoucherRepository.js'
import type {
  BusinessVoucherStats,
  GenerateCodesData,
  VoucherAnalytics,
  VoucherCode,
  VoucherSearchParams,
  VoucherTranslations,
} from '../types/index.js'
import {
  generateSecureShortCode,
  generateVoucherCodes,
} from '../utils/codeGenerator.js'

export interface IAdminVoucherService {
  // Core CRUD operations
  getAllVouchers(
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>>
  getVoucherById(
    id: string,
    parsedIncludes?: ParsedIncludes,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  createVoucher(
    data: DomainCreateVoucherData,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  updateVoucher(
    id: string,
    data: DomainUpdateVoucherData,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  deleteVoucher(id: string): Promise<void>

  // State management
  updateVoucherState(
    id: string,
    state: VoucherState,
    language?: LanguageCode,
  ): Promise<VoucherDomain>
  publishVoucher(id: string, language?: LanguageCode): Promise<VoucherDomain>
  expireVoucher(id: string, language?: LanguageCode): Promise<VoucherDomain>

  // Asset management
  uploadVoucherImage(voucherId: string, file: any): Promise<string>

  // Code generation
  generateVoucherCodes(
    voucherId: string,
    data: GenerateCodesData,
  ): Promise<VoucherCode[]>

  // Translation management
  updateVoucherTranslations(
    voucherId: string,
    translations: VoucherTranslations,
  ): Promise<void>
  getVoucherTranslations(voucherId: string): Promise<VoucherTranslations>

  // Bulk operations
  bulkUpdateVouchers(
    data: { ids: string[]; updates: DomainUpdateVoucherData },
    language?: LanguageCode,
  ): Promise<VoucherDomain[]>

  // Analytics and reporting
  getVoucherAnalytics(filters?: {
    businessId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<VoucherAnalytics>
  getBusinessVoucherStats(businessId: string): Promise<BusinessVoucherStats>
}

export class AdminVoucherService implements IAdminVoucherService {
  constructor(
    private readonly repository: IAdminVoucherRepository,
    private readonly cache: ICacheService,
    private readonly translationClient: TranslationClient,
    private readonly translationResolver: TranslationResolver,
    private readonly fileStorage?: FileStoragePort,
    private readonly businessServiceClient?: BusinessServiceClient,
  ) {}

  async getAllVouchers(
    params: VoucherSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const result = await this.repository.findAll(params)

      // Resolve translations if language is provided - one line!
      if (language) {
        const resolvedData = await this.translationResolver.resolveArray(
          result.data,
          language,
        )

        return { data: resolvedData, pagination: result.pagination }
      }

      return result
    } catch (error) {
      logger.error('Failed to get all vouchers', { error, params, language })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherById(
    id: string,
    parsedIncludes?: ParsedIncludes,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findById(id)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Resolve translations if language is provided - one line!
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by id', { error, id, language })
      throw ErrorFactory.fromError(error)
    }
  }

  async createVoucher(
    data: DomainCreateVoucherData,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      // Validate business exists
      if (this.businessServiceClient) {
        try {
          await this.businessServiceClient.getBusiness(data.businessId)
        } catch {
          throw ErrorFactory.resourceNotFound('Business', data.businessId)
        }
      }

      // Validate voucher type and required fields
      if (
        data.discountType === VoucherDiscountType.percentage &&
        !data.discountValue
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Discount voucher requires discount percentage',
          'Discount value is required for percentage discount vouchers',
        )
      }

      if (
        data.discountType === VoucherDiscountType.fixed &&
        !data.discountValue
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Fixed value voucher requires value',
          'Discount value is required for fixed discount vouchers',
        )
      }

      // Generate translation keys for voucher fields
      const titleKey = `voucher.title.${uuid()}`
      const descriptionKey = `voucher.description.${uuid()}`
      const termsAndConditionsKey = `voucher.termsAndConditions.${uuid()}`

      // Create translations for all provided languages
      const translationPromises: Promise<void>[] = []

      // Process title translations
      for (const [lang, value] of Object.entries(data.title)) {
        translationPromises.push(
          this.translationClient.set(titleKey, lang as LanguageCode, value),
        )
      }

      // Process description translations
      for (const [lang, value] of Object.entries(data.description)) {
        translationPromises.push(
          this.translationClient.set(
            descriptionKey,
            lang as LanguageCode,
            value,
          ),
        )
      }

      // Process terms translations
      for (const [lang, value] of Object.entries(data.termsAndConditions)) {
        translationPromises.push(
          this.translationClient.set(
            termsAndConditionsKey,
            lang as LanguageCode,
            value,
          ),
        )
      }

      // Execute all translation operations in parallel
      await Promise.all(translationPromises)

      // Generate QR code
      const qrCode = await this.generateQRCode()

      // Map domain fields to repository fields
      const voucher = await this.repository.create({
        businessId: data.businessId,
        categoryId: data.categoryId,
        type:
          data.discountType === VoucherDiscountType.percentage
            ? 'percentage'
            : 'fixed',
        titleKey,
        descriptionKey,
        termsAndConditionsKey,
        value:
          data.discountType === VoucherDiscountType.fixed
            ? data.discountValue
            : undefined,
        discount:
          data.discountType === VoucherDiscountType.percentage
            ? data.discountValue
            : undefined,
        currency: data.currency,
        maxRedemptions: data.maxRedemptions ?? undefined,
        maxRedemptionsPerUser: data.maxRedemptionsPerUser,
        validFrom: data.validFrom,
        validUntil: data.expiresAt,
        metadata: data.metadata ?? undefined,
        imageUrl: data.imageUrl ?? undefined,
        qrCode,
        state: VoucherState.draft,
      })

      // Invalidate cache
      await this.invalidateCache()

      logger.info('Admin created voucher', {
        voucherId: voucher.id,
        businessId: data.businessId,
      })

      // Resolve translations if language is provided
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to create voucher', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucher(
    id: string,
    data: DomainUpdateVoucherData,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      // Validate voucher exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state allows updates
      if (
        existing.state === VoucherState.expired ||
        existing.state === VoucherState.redeemed
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot update expired or redeemed voucher',
          'Voucher is in a final state',
        )
      }

      const updateData: any = {}
      const translationPromises: Promise<void>[] = []

      // Update title translations for all provided languages
      if (data.title) {
        for (const [lang, value] of Object.entries(data.title)) {
          translationPromises.push(
            this.translationClient.set(
              existing.titleKey,
              lang as LanguageCode,
              value,
            ),
          )
        }
      }

      // Update description translations for all provided languages
      if (data.description) {
        for (const [lang, value] of Object.entries(data.description)) {
          translationPromises.push(
            this.translationClient.set(
              existing.descriptionKey,
              lang as LanguageCode,
              value,
            ),
          )
        }
      }

      // Update terms translations for all provided languages
      if (data.termsAndConditions) {
        for (const [lang, value] of Object.entries(data.termsAndConditions)) {
          translationPromises.push(
            this.translationClient.set(
              existing.termsAndConditionsKey,
              lang as LanguageCode,
              value,
            ),
          )
        }
      }

      // Execute all translation updates in parallel
      if (translationPromises.length > 0) {
        await Promise.all(translationPromises)
      }

      // Update other fields - these don't need translation
      if (data.discountType !== undefined) {
        updateData.type =
          data.discountType === VoucherDiscountType.percentage
            ? 'percentage'
            : 'fixed'
      }
      if (data.discountValue !== undefined) {
        if (
          data.discountType === VoucherDiscountType.percentage ||
          existing.discountType === VoucherDiscountType.percentage
        ) {
          updateData.discount = data.discountValue
        } else {
          updateData.value = data.discountValue
        }
      }
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.location !== undefined) updateData.location = data.location
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.maxRedemptions !== undefined)
        updateData.maxRedemptions = data.maxRedemptions
      if (data.maxRedemptionsPerUser !== undefined)
        updateData.maxRedemptionsPerUser = data.maxRedemptionsPerUser
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom
      if (data.expiresAt !== undefined) updateData.validUntil = data.expiresAt
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      const voucher = await this.repository.update(id, updateData)

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Admin updated voucher', {
        voucherId: id,
        updates: Object.keys(updateData),
      })

      // Resolve translations if language is provided
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to update voucher', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteVoucher(id: string): Promise<void> {
    try {
      // Validate voucher exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state allows deletion
      if (existing.state === VoucherState.published) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot delete published voucher',
          'Published vouchers can only be expired',
        )
      }

      // Soft delete the voucher
      await this.repository.delete(id)

      // Note: We don't delete translations when soft deleting
      // This preserves history and allows for potential restoration
      // Translations will be cleaned up in a separate maintenance process

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Admin deleted voucher', { voucherId: id })
    } catch (error) {
      logger.error('Failed to delete voucher', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucherState(
    id: string,
    state: VoucherState,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      // Validate voucher exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state transition using shared business rules
      VoucherBusinessRules.validateStateTransition(existing.state, state)

      const voucher = await this.repository.updateState(id, state)

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Admin updated voucher state', {
        voucherId: id,
        oldState: existing.state,
        newState: state,
      })

      // Resolve translations if language is provided
      if (language) {
        return await this.translationResolver.resolve(voucher, language)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to update voucher state', { error, id, state })
      throw ErrorFactory.fromError(error)
    }
  }

  async publishVoucher(
    id: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findById(id)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state transition using shared business rules
      VoucherBusinessRules.validateStateTransition(
        voucher.state,
        VoucherState.published,
      )

      // Additional business rule validation for publishing (from legacy canBePublished)
      const now = new Date()

      if (voucher.validFrom && voucher.validFrom > now) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot publish voucher before its valid from date',
          `Voucher becomes valid at ${voucher.validFrom.toISOString()}`,
        )
      }

      if (voucher.expiresAt && voucher.expiresAt < now) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot publish expired voucher',
          `Voucher expired at ${voucher.expiresAt.toISOString()}`,
        )
      }

      const updatedVoucher = await this.repository.updateState(
        id,
        VoucherState.published,
      )

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Admin published voucher', { voucherId: id })

      // Resolve translations if language is provided
      if (language) {
        return await this.translationResolver.resolve(updatedVoucher, language)
      }

      return updatedVoucher
    } catch (error) {
      logger.error('Failed to publish voucher', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async expireVoucher(
    id: string,
    language?: LanguageCode,
  ): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findById(id)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state transition using shared business rules
      VoucherBusinessRules.validateStateTransition(
        voucher.state,
        VoucherState.expired,
      )

      const updatedVoucher = await this.repository.updateState(
        id,
        VoucherState.expired,
      )

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Admin expired voucher', { voucherId: id })

      // Resolve translations if language is provided
      if (language) {
        return await this.translationResolver.resolve(updatedVoucher, language)
      }

      return updatedVoucher
    } catch (error) {
      logger.error('Failed to expire voucher', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async uploadVoucherImage(voucherId: string, file: any): Promise<string> {
    try {
      if (!this.fileStorage) {
        throw ErrorFactory.serviceUnavailable(
          'File storage service is not available',
          {
            source: 'AdminVoucherService.uploadVoucherImage',
          },
        )
      }

      // Validate voucher exists
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Upload file with voucher context for service-to-service call
      const uploadResult = await this.fileStorage.saveFile(
        file,
        `vouchers/${voucherId}`,
        {
          context: {
            voucherId,
            businessId: voucher.businessId,
          },
        },
      )

      // Update voucher with new image URL
      await this.repository.update(voucherId, { imageUrl: uploadResult.url })

      // Invalidate cache
      await this.invalidateCache(voucherId)

      logger.info('Admin uploaded voucher image', {
        voucherId,
        imageUrl: uploadResult.url,
      })

      return uploadResult.url
    } catch (error) {
      logger.error('Failed to upload voucher image', { error, voucherId })
      throw ErrorFactory.fromError(error)
    }
  }

  async generateVoucherCodes(
    voucherId: string,
    data: GenerateCodesData,
  ): Promise<VoucherCode[]> {
    try {
      // Validate voucher exists
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Generate codes based on type
      const codeOptions = {
        generateQR: data.codeType === 'qr',
        generateShortCode: data.codeType === 'short',
        generateStaticCode: data.codeType === 'static',
      }

      const generatedCodes: VoucherCode[] = []

      const quantity = data.quantity || 1

      for (let i = 0; i < quantity; i++) {
        const codes = await generateVoucherCodes(codeOptions, voucherId)

        // Find the requested code type
        const code = codes.find((c) => c.type.toLowerCase() === data.codeType)

        if (code) {
          generatedCodes.push({
            id: uuid(),
            code: code.code,
            type: data.codeType,
            voucherId,
            createdAt: new Date(),
          })
        }
      }

      // TODO: Store codes in the database if needed
      // await this.repository.createVoucherCodes(generatedCodes)

      logger.info('Admin generated voucher codes', {
        voucherId,
        codeType: data.codeType,
        count: generatedCodes.length,
      })

      return generatedCodes
    } catch (error) {
      logger.error('Failed to generate voucher codes', {
        error,
        voucherId,
        data,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucherTranslations(
    voucherId: string,
    translations: VoucherTranslations,
  ): Promise<void> {
    try {
      // Validate voucher exists
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      const translationUpdates = []

      // Update title translations
      if (translations.title) {
        for (const [language, value] of Object.entries(translations.title)) {
          translationUpdates.push({
            key: voucher.titleKey,
            value,
            language,
            context: 'Voucher title',
            service: 'voucher-service',
          })
        }
      }

      // Update description translations
      if (translations.description) {
        for (const [language, value] of Object.entries(
          translations.description,
        )) {
          translationUpdates.push({
            key: voucher.descriptionKey,
            value,
            language,
            context: 'Voucher description',
            service: 'voucher-service',
          })
        }
      }

      // Update terms translations
      if (translations.termsAndConditions) {
        for (const [language, value] of Object.entries(
          translations.termsAndConditions,
        )) {
          translationUpdates.push({
            key: voucher.termsAndConditionsKey,
            value,
            language,
            context: 'Voucher terms and conditions',
            service: 'voucher-service',
          })
        }
      }

      // Apply all translation updates
      for (const update of translationUpdates) {
        await this.translationClient.set(
          update.key,
          update.language,
          update.value,
          update.context,
          update.service,
        )
      }

      // Invalidate cache
      await this.invalidateCache(voucherId)

      logger.info('Admin updated voucher translations', {
        voucherId,
        languages: Object.keys(translations.title || {}),
      })
    } catch (error) {
      logger.error('Failed to update voucher translations', {
        error,
        voucherId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherTranslations(
    voucherId: string,
  ): Promise<VoucherTranslations> {
    try {
      // Validate voucher exists
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Get translations for all supported languages
      const supportedLanguages = ['es', 'en', 'gn'] // TODO: Get from language service
      const translations: VoucherTranslations = {
        title: {},
        description: {},
        termsAndConditions: {},
      }

      // Get translations for each language
      for (const lang of supportedLanguages) {
        const [title, description, terms] = await Promise.all([
          this.translationClient.get(voucher.titleKey, lang),
          this.translationClient.get(voucher.descriptionKey, lang),
          this.translationClient.get(voucher.termsAndConditionsKey, lang),
        ])

        if (title) {
          Object.assign(translations.title, { [lang]: title })
        }
        if (description) {
          Object.assign(translations.description, { [lang]: description })
        }
        if (terms) {
          Object.assign(translations.termsAndConditions, { [lang]: terms })
        }
      }

      return translations
    } catch (error) {
      logger.error('Failed to get voucher translations', { error, voucherId })
      throw ErrorFactory.fromError(error)
    }
  }

  async bulkUpdateVouchers(
    data: { ids: string[]; updates: DomainUpdateVoucherData },
    language?: LanguageCode,
  ): Promise<VoucherDomain[]> {
    try {
      const { ids, updates } = data
      const updatedVouchers: VoucherDomain[] = []
      const failedUpdates: Array<{ id: string; error: string }> = []

      // Process each voucher update
      for (const id of ids) {
        try {
          const updated = await this.updateVoucher(id, updates, language)

          updatedVouchers.push(updated)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'

          failedUpdates.push({ id, error: errorMessage })
          logger.error('Failed to update voucher in bulk operation', {
            error,
            voucherId: id,
          })
        }
      }

      // Invalidate cache for all vouchers
      await this.invalidateCache()

      logger.info('Admin completed bulk voucher update', {
        totalRequested: ids.length,
        totalUpdated: updatedVouchers.length,
        totalFailed: failedUpdates.length,
        failed: failedUpdates,
      })

      // If some updates failed, throw an error with details
      if (failedUpdates.length > 0) {
        throw ErrorFactory.businessRuleViolation(
          `Bulk update partially failed: ${failedUpdates.length} of ${ids.length} vouchers failed to update`,
          'Some vouchers could not be updated',
          { metadata: { failedUpdates } },
        )
      }

      return updatedVouchers
    } catch (error) {
      // If it's already our custom error, re-throw it
      if (
        error instanceof Error &&
        error.message.includes('Bulk update partially failed')
      ) {
        throw error
      }

      logger.error('Failed to bulk update vouchers', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherAnalytics(filters?: {
    businessId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<VoucherAnalytics> {
    try {
      // Build search params for analytics
      const searchParams: VoucherSearchParams = {
        businessId: filters?.businessId,
        page: 1,
        limit: 10000, // Large limit to get all vouchers for analytics
      }

      // Get all vouchers matching filters
      const result = await this.repository.findAll(searchParams)

      // Calculate analytics
      const vouchers = result.data
      const totalVouchers = vouchers.length
      const activeVouchers = vouchers.filter(
        (v) => v.state === VoucherState.published,
      ).length
      const expiredVouchers = vouchers.filter(
        (v) => v.state === VoucherState.expired,
      ).length
      const totalRedemptions = vouchers.reduce(
        (sum, v) => sum + (v.currentRedemptions || 0),
        0,
      )

      // Calculate redemption rate
      const vouchersWithMaxRedemptions = vouchers.filter(
        (v) => v.maxRedemptions && v.maxRedemptions > 0,
      )
      const maxPossibleRedemptions = vouchersWithMaxRedemptions.reduce(
        (sum, v) => sum + (v.maxRedemptions || 0),
        0,
      )
      const redemptionRate =
        maxPossibleRedemptions > 0
          ? (totalRedemptions / maxPossibleRedemptions) * 100
          : 0

      // Calculate average value
      const vouchersWithValue = vouchers.filter(
        (v) => v.discountValue && v.discountValue > 0,
      )
      const averageValue =
        vouchersWithValue.length > 0
          ? vouchersWithValue.reduce(
              (sum, v) => sum + (v.discountValue || 0),
              0,
            ) / vouchersWithValue.length
          : 0

      // Group by type
      const vouchersByTypeMap = new Map<string, number>()

      vouchers.forEach((v) => {
        const type = v.discountType || 'unknown'

        vouchersByTypeMap.set(type, (vouchersByTypeMap.get(type) || 0) + 1)
      })

      const vouchersByType = Object.fromEntries(vouchersByTypeMap)

      // Group by state
      const vouchersByStateMap = new Map<string, number>()

      vouchers.forEach((v) => {
        const state = v.state || 'unknown'

        vouchersByStateMap.set(state, (vouchersByStateMap.get(state) || 0) + 1)
      })

      const vouchersByState = Object.fromEntries(vouchersByStateMap)

      // Group by business
      const vouchersByBusinessMap = new Map<string, number>()

      vouchers.forEach((v) => {
        const businessId = v.businessId || 'unknown'

        vouchersByBusinessMap.set(
          businessId,
          (vouchersByBusinessMap.get(businessId) || 0) + 1,
        )
      })

      const vouchersByBusiness = Object.fromEntries(vouchersByBusinessMap)

      const analytics: VoucherAnalytics = {
        totalVouchers,
        activeVouchers,
        expiredVouchers,
        totalRedemptions,
        redemptionRate: Math.round(redemptionRate * 100) / 100, // Round to 2 decimal places
        averageValue: Math.round(averageValue * 100) / 100, // Round to 2 decimal places
        vouchersByType,
        vouchersByState,
        vouchersByBusiness,
      }

      logger.info('Admin retrieved voucher analytics', { filters, analytics })

      return analytics
    } catch (error) {
      logger.error('Failed to get voucher analytics', { error, filters })
      throw ErrorFactory.fromError(error)
    }
  }

  async getBusinessVoucherStats(
    businessId: string,
  ): Promise<BusinessVoucherStats> {
    try {
      // Get business details if available
      let businessName: string | undefined

      if (this.businessServiceClient) {
        try {
          const business =
            await this.businessServiceClient.getBusiness(businessId)

          // Resolve business name from translation key
          if (business.businessNameKey) {
            businessName = await this.translationClient.get(
              business.businessNameKey,
              DEFAULT_LANGUAGE,
            )
          }
        } catch (error) {
          logger.warn('Failed to fetch business details for stats', {
            businessId,
            error,
          })
        }
      }

      // Get all vouchers for the business
      const result = await this.repository.findByBusinessId(businessId, {
        page: 1,
        limit: 10000, // Large limit to get all vouchers
      })

      const vouchers = result.data
      const totalVouchers = vouchers.length
      const activeVouchers = vouchers.filter(
        (v) => v.state === VoucherState.published,
      ).length
      const expiredVouchers = vouchers.filter(
        (v) => v.state === VoucherState.expired,
      ).length
      const totalRedemptions = vouchers.reduce(
        (sum, v) => sum + (v.currentRedemptions || 0),
        0,
      )

      // Calculate total revenue (sum of redeemed voucher values)
      const redeemedVouchers = vouchers.filter(
        (v) => (v.currentRedemptions || 0) > 0,
      )
      const totalRevenue = redeemedVouchers.reduce((sum, v) => {
        const redemptions = v.currentRedemptions || 0
        const value = v.discountValue || 0

        return sum + redemptions * value
      }, 0)

      // Calculate average redemption value
      const averageRedemptionValue =
        totalRedemptions > 0 ? totalRevenue / totalRedemptions : 0

      const stats: BusinessVoucherStats = {
        businessId,
        businessName,
        totalVouchers,
        activeVouchers,
        expiredVouchers,
        totalRedemptions,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        averageRedemptionValue: Math.round(averageRedemptionValue * 100) / 100, // Round to 2 decimal places
      }

      logger.info('Admin retrieved business voucher stats', {
        businessId,
        stats,
      })

      return stats
    } catch (error) {
      logger.error('Failed to get business voucher stats', {
        error,
        businessId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  private async generateQRCode(voucherId?: string): Promise<string> {
    try {
      if (voucherId) {
        // Generate secure JWT-based QR code for specific voucher
        const codes = await generateVoucherCodes(
          {
            generateQR: true,
            generateShortCode: false,
            generateStaticCode: false,
          },
          voucherId,
        )

        const qrCode = codes.find((code) => code.type === 'QR')

        if (qrCode) {
          return qrCode.code
        }
      }

      // Fallback: generate a secure short code for display
      return await generateSecureShortCode({
        length: 12,
        includeDash: true,
        prefix: 'VCH-',
      })
    } catch (error) {
      logger.error('Failed to generate QR code', { error, voucherId })

      // Ultimate fallback
      return `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }
  }

  private async invalidateCache(voucherId?: string): Promise<void> {
    try {
      // Invalidate specific voucher cache if ID provided
      if (voucherId) {
        await this.cache.del(`service:voucher:${voucherId}`)
        await this.cache.del(`admin:voucher:${voucherId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:vouchers:*')
      await this.cache.delPattern?.('vouchers:*')
      await this.cache.delPattern?.('voucher:*')
      await this.cache.delPattern?.('admin:vouchers:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }
}
