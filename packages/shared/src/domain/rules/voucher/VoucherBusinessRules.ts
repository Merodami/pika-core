import { VoucherState } from '@pika/types'

import { ErrorFactory } from '../../../errors/index.js'

/**
 * Voucher Business Rules
 *
 * Contains all business logic and validation rules for vouchers
 * that need to be shared across service layers (VoucherService,
 * AdminVoucherService, InternalVoucherService)
 */
export class VoucherBusinessRules {
  /**
   * Validates if a state transition is allowed according to business rules
   *
   * @param currentState - The current voucher state
   * @param newState - The desired new state
   * @throws BusinessRuleViolationError if transition is not allowed
   */
  static validateStateTransition(
    currentState: VoucherState,
    newState: VoucherState,
  ): void {
    // Define allowed state transitions based on business rules
    const allowedTransitions: Record<VoucherState, VoucherState[]> = {
      [VoucherState.draft]: [VoucherState.published],
      [VoucherState.published]: [VoucherState.claimed, VoucherState.expired],
      [VoucherState.claimed]: [VoucherState.redeemed, VoucherState.expired],
      [VoucherState.redeemed]: [VoucherState.expired],
      [VoucherState.expired]: [], // Terminal state
      [VoucherState.suspended]: [VoucherState.published, VoucherState.expired], // Can resume or expire
    }

    // No transition needed if states are the same
    if (currentState === newState) {
      return
    }

    const allowedForCurrentState =
      allowedTransitions[currentState as keyof typeof allowedTransitions] || []

    if (!allowedForCurrentState.includes(newState)) {
      throw ErrorFactory.businessRuleViolation(
        `Invalid state transition from ${currentState} to ${newState}`,
        `Allowed transitions from ${currentState}: ${allowedForCurrentState.join(', ')}`,
      )
    }
  }

  /**
   * Checks if a voucher can be published based on its current state and validity dates
   *
   * @param voucher - The voucher to check
   * @throws BusinessRuleViolationError if voucher cannot be published
   */
  static validateCanPublish(voucher: {
    state: VoucherState
    validFrom?: Date | null
    validUntil?: Date | null
  }): void {
    // First check state transition
    this.validateStateTransition(voucher.state, VoucherState.published)

    const now = new Date()

    // Check valid from date
    if (voucher.validFrom && voucher.validFrom > now) {
      throw ErrorFactory.businessRuleViolation(
        'Cannot publish voucher before its valid from date',
        `Voucher becomes valid at ${voucher.validFrom.toISOString()}`,
      )
    }

    // Check expiration date
    if (voucher.validUntil && voucher.validUntil < now) {
      throw ErrorFactory.businessRuleViolation(
        'Cannot publish expired voucher',
        `Voucher expired at ${voucher.validUntil.toISOString()}`,
      )
    }
  }

  /**
   * Checks if a voucher can be claimed by a user
   *
   * @param voucher - The voucher to check
   * @throws BusinessRuleViolationError if voucher cannot be claimed
   */
  static validateCanClaim(voucher: {
    state: VoucherState
    validFrom?: Date | null
    validUntil?: Date | null
    maxRedemptions?: number | null
    currentRedemptions?: number
  }): void {
    // Check if voucher is published
    if (voucher.state !== VoucherState.published) {
      throw ErrorFactory.businessRuleViolation(
        'Voucher is not available for claiming',
        `Voucher state is ${voucher.state}`,
      )
    }

    const now = new Date()

    // Check validity period
    if (voucher.validFrom && voucher.validFrom > now) {
      throw ErrorFactory.businessRuleViolation(
        'Voucher is not yet valid',
        'Voucher validity period has not started',
      )
    }

    if (voucher.validUntil && voucher.validUntil < now) {
      throw ErrorFactory.businessRuleViolation(
        'Voucher has expired',
        'Voucher validity period has ended',
      )
    }

    // Check redemption limits
    if (
      voucher.maxRedemptions &&
      voucher.currentRedemptions &&
      voucher.currentRedemptions >= voucher.maxRedemptions
    ) {
      throw ErrorFactory.businessRuleViolation(
        'Voucher has reached maximum redemptions',
        `Maximum redemptions: ${voucher.maxRedemptions}`,
      )
    }
  }

  /**
   * Checks if a voucher can be redeemed
   *
   * @param voucher - The voucher to check
   * @param userClaimedAt - When the user claimed the voucher
   * @throws BusinessRuleViolationError if voucher cannot be redeemed
   */
  static validateCanRedeem(
    voucher: {
      state: VoucherState
      validUntil?: Date | null
    },
    userClaimedAt?: Date,
  ): void {
    // Voucher must be in claimed state for the user
    if (
      voucher.state !== VoucherState.claimed &&
      voucher.state !== VoucherState.published
    ) {
      throw ErrorFactory.businessRuleViolation(
        'Voucher cannot be redeemed',
        `Voucher state is ${voucher.state}`,
      )
    }

    const now = new Date()

    // Check if voucher is still valid
    if (voucher.validUntil && voucher.validUntil < now) {
      throw ErrorFactory.businessRuleViolation(
        'Voucher has expired',
        'Voucher validity period has ended',
      )
    }

    // Additional business rule: Vouchers must be redeemed within 30 days of claiming
    if (userClaimedAt) {
      const claimExpirationDate = new Date(userClaimedAt)

      claimExpirationDate.setDate(claimExpirationDate.getDate() + 30)

      if (now > claimExpirationDate) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher claim has expired',
          'Vouchers must be redeemed within 30 days of claiming',
        )
      }
    }
  }

  /**
   * Checks if a voucher can be updated based on its current state
   *
   * @param currentState - The current voucher state
   * @throws BusinessRuleViolationError if voucher cannot be updated
   */
  static validateCanUpdate(currentState: VoucherState): void {
    const nonUpdatableStates = [VoucherState.expired, VoucherState.redeemed]

    if (nonUpdatableStates.includes(currentState)) {
      throw ErrorFactory.businessRuleViolation(
        'Cannot update voucher in current state',
        `Voucher is in ${currentState} state`,
      )
    }
  }

  /**
   * Checks if a voucher can be deleted based on its current state
   *
   * @param currentState - The current voucher state
   * @throws BusinessRuleViolationError if voucher cannot be deleted
   */
  static validateCanDelete(currentState: VoucherState): void {
    if (currentState === VoucherState.published) {
      throw ErrorFactory.businessRuleViolation(
        'Cannot delete published voucher',
        'Published vouchers can only be expired',
      )
    }
  }

  /**
   * Validates voucher discount rules based on type
   *
   * @param type - The voucher type
   * @param discount - The discount percentage (for percentage type)
   * @param value - The fixed value (for fixed type)
   * @throws BusinessRuleViolationError if validation fails
   */
  static validateDiscountRules(
    type: string,
    discount?: number,
    value?: number,
  ): void {
    if (type === 'discount' && (!discount || discount <= 0 || discount > 100)) {
      throw ErrorFactory.businessRuleViolation(
        'Invalid discount percentage',
        'Discount must be between 1 and 100',
      )
    }

    if (type === 'fixedValue' && (!value || value <= 0)) {
      throw ErrorFactory.businessRuleViolation(
        'Invalid voucher value',
        'Fixed value must be greater than 0',
      )
    }
  }
}
