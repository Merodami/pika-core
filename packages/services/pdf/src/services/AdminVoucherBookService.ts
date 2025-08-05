import type { VoucherBookDomain } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { VoucherBookStatus } from '@prisma/client'

import type {
  AdminVoucherBookSearchParams,
  BatchVoucherBookResult,
  VoucherBookStatistics,
} from '../types/index.js'
import { VoucherBookService } from './VoucherBookService.js'

export interface IAdminVoucherBookService {
  getAllVoucherBooks(
    params: AdminVoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>>
  getVoucherBookById(id: string): Promise<VoucherBookDomain>
  createVoucherBook(data: any): Promise<VoucherBookDomain>
  updateVoucherBook(id: string, data: any): Promise<VoucherBookDomain>
  deleteVoucherBook(id: string): Promise<void>
  updateVoucherBookStatus(
    id: string,
    status: VoucherBookStatus,
    userId: string,
  ): Promise<VoucherBookDomain>
  generatePDF(id: string, userId?: string): Promise<any>
  bulkArchiveVoucherBooks(
    ids: string[],
    userId: string,
  ): Promise<BatchVoucherBookResult>
  getAdminStatistics(
    year?: number,
    month?: number,
  ): Promise<VoucherBookStatistics>
}

/**
 * Admin voucher book service that extends the base VoucherBookService
 * with admin-specific operations and enhanced permissions.
 *
 * Based on the pika-old CQRS pattern but simplified for the new architecture.
 * Handles state transitions, bulk operations, and admin-specific business logic.
 */
export class AdminVoucherBookService
  extends VoucherBookService
  implements IAdminVoucherBookService
{
  /**
   * Update voucher book status with proper state transition validation
   * Based on the pika-old UpdateVoucherBookStatusCommandHandler pattern
   */
  async updateVoucherBookStatus(
    id: string,
    status: VoucherBookStatus,
    userId: string,
  ): Promise<VoucherBookDomain> {
    try {
      logger.info('Updating voucher book status', { id, status, userId })

      // 1. Fetch existing book to validate state transition
      const existingBook = await this.getVoucherBookById(id)

      // 2. Validate state transition (following pika-old pattern)
      this.validateStateTransition(
        existingBook.status as VoucherBookStatus,
        status,
      )

      // 3. Apply status-specific business logic - use base service methods
      let updatedBook: VoucherBookDomain

      switch (status) {
        case 'published':
          updatedBook = await this.publishVoucherBook(id, userId)
          break
        case 'archived':
          updatedBook = await this.archiveVoucherBook(id, userId)
          break
        case 'ready_for_print':
        case 'draft':
          // For other status changes, use repository's updateStatus method
          updatedBook = await this.voucherBookRepository.updateStatus(
            id,
            status,
            userId,
          )
          break
        default:
          throw ErrorFactory.badRequest(`Unsupported status: ${status}`)
      }

      logger.info('Voucher book status updated successfully', {
        id,
        oldStatus: existingBook.status,
        newStatus: status,
      })

      return updatedBook
    } catch (error) {
      logger.error('Failed to update voucher book status', {
        id,
        status,
        error,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to update voucher book status',
      )
    }
  }

  /**
   * Bulk archive voucher books with proper error handling
   * Based on the pika-old batch operation patterns
   */
  async bulkArchiveVoucherBooks(
    ids: string[],
    userId: string,
  ): Promise<BatchVoucherBookResult> {
    try {
      logger.info('Bulk archiving voucher books', { count: ids.length, userId })

      const results = []
      const errors = []

      // Process each book individually for proper error handling
      for (const id of ids) {
        try {
          await this.updateVoucherBookStatus(id, 'archived', userId)
          results.push({ id, success: true })
        } catch (error) {
          logger.warn('Failed to archive voucher book', { id, error })
          errors.push({ id, error: error.message })
          results.push({ id, success: false, error: error.message })
        }
      }

      if (errors.length > 0) {
        logger.warn('Some books failed to archive', {
          total: ids.length,
          successful: results.filter((r) => r.success).length,
          failed: errors.length,
          errors,
        })
      }

      const successCount = results.filter((r) => r.success).length

      logger.info('Bulk archive operation completed', {
        total: ids.length,
        successful: successCount,
        failed: errors.length,
      })

      return {
        processedCount: ids.length,
        successCount,
        failedCount: errors.length,
        results: results.map((r) => ({
          bookId: r.id,
          success: r.success,
          error: r.error,
        })),
      }
    } catch (error) {
      logger.error('Bulk archive operation failed', { ids, error })
      throw ErrorFactory.fromError(
        error,
        'Failed to bulk archive voucher books',
      )
    }
  }

  /**
   * Validate state transitions based on pika-old business rules
   *
   * Allowed transitions:
   * - DRAFT → READY_FOR_PRINT
   * - READY_FOR_PRINT → PUBLISHED (requires PDF)
   * - READY_FOR_PRINT → DRAFT (rollback)
   * - PUBLISHED → ARCHIVED
   * - Any status → ARCHIVED (admin override)
   */
  private validateStateTransition(
    currentStatus: VoucherBookStatus,
    newStatus: VoucherBookStatus,
  ): void {
    // Allow admin to archive any book
    if (newStatus === 'archived') {
      return
    }

    // Allow same status (no-op)
    if (currentStatus === newStatus) {
      return
    }

    const allowedTransitions: Record<VoucherBookStatus, VoucherBookStatus[]> = {
      draft: ['ready_for_print', 'archived'],
      ready_for_print: ['published', 'draft', 'archived'],
      published: ['archived'],
      archived: [], // Archived books cannot be changed
    }

    const allowed =
      allowedTransitions[currentStatus as keyof typeof allowedTransitions] || []

    if (!allowed.includes(newStatus)) {
      throw ErrorFactory.badRequest(
        `Invalid state transition from ${currentStatus} to ${newStatus}`,
        {
          source: 'AdminVoucherBookService.validateStateTransition',
          metadata: {
            currentStatus,
            newStatus,
            allowedTransitions: allowed,
          },
        },
      )
    }
  }

  /**
   * Override getAllVoucherBooks to support admin-specific filtering
   */
  async getAllVoucherBooks(
    params: AdminVoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>> {
    // Convert admin params to base service params
    const baseParams = {
      ...params,
      // Admin can see all statuses, not just published
      includeInactive: true,
    }

    return super.getAllVoucherBooks(baseParams)
  }

  /**
   * Get admin dashboard statistics for voucher books
   */
  async getAdminStatistics(
    year?: number,
    month?: number,
  ): Promise<VoucherBookStatistics> {
    try {
      logger.info('Getting voucher book statistics', { year, month })

      // Mock implementation - should be replaced with actual statistics logic
      return {
        total: 0,
        byStatus: {
          draft: 0,
          readyForPrint: 0,
          published: 0,
          archived: 0,
        },
        byType: {
          monthly: 0,
          specialEdition: 0,
          regional: 0,
        },
        distributions: {
          total: 0,
          pending: 0,
          shipped: 0,
          delivered: 0,
        },
        recentActivity: [],
      }
    } catch (error) {
      logger.error('Failed to get voucher book statistics', {
        year,
        month,
        error,
      })
      throw ErrorFactory.fromError(error, 'Failed to get statistics')
    }
  }
}
