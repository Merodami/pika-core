// packages/tests/src/mocks/serviceClientMocks.ts

import type { CreditsDomain } from '@pika/shared'
import { vi } from 'vitest'

/**
 * Mock for PaymentServiceClient - handles credit processing
 */
export function createPaymentServiceClientMock() {
  return {
    // Credit operations
    processSubscriptionCredits: vi.fn().mockResolvedValue({
      credits: {
        id: 'mock-credits-id',
        userId: 'test-user-id',
        amountDemand: 25,
        amountSub: 0,
        totalAmount: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CreditsDomain,
      transactionId: 'mock-transaction-id',
    }),
    getUserCredits: vi.fn().mockResolvedValue({
      id: 'mock-credits-id',
      userId: 'test-user-id',
      amountDemand: 25,
      amountSub: 0,
      totalAmount: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CreditsDomain),
    hasCredits: vi.fn().mockResolvedValue(true),

    // Product and price management (Stripe operations)
    createProduct: vi.fn().mockResolvedValue({
      id: 'prod_mock_123',
      name: 'Mock Product',
      description: 'Mock Description',
      active: true,
      metadata: {},
    }),
    updateProduct: vi.fn().mockResolvedValue({
      id: 'prod_mock_123',
      name: 'Updated Mock Product',
      description: 'Updated Description',
      active: false,
      metadata: {},
    }),
    createPrice: vi.fn().mockResolvedValue({
      id: 'price_mock_123',
      productId: 'prod_mock_123',
      amount: 29.99,
      currency: 'usd',
      active: true,
      recurring: {
        interval: 'month',
        intervalCount: 1,
      },
    }),
    deactivatePrice: vi.fn().mockResolvedValue({
      id: 'price_mock_123',
      productId: 'prod_mock_123',
      amount: 29.99,
      currency: 'usd',
      active: false,
      recurring: {
        interval: 'month',
        intervalCount: 1,
      },
    }),
    listProducts: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'prod_mock_123',
          name: 'Mock Product',
          description: 'Mock Description',
          active: true,
          metadata: {},
        },
      ],
    }),
    listPrices: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'price_mock_123',
          productId: 'prod_mock_123',
          amount: 29.99,
          currency: 'usd',
          active: true,
          recurring: {
            interval: 'month',
            intervalCount: 1,
          },
        },
      ],
    }),
  }
}

/**
 * Mock for CommunicationServiceClient - handles notifications
 */
export function createCommunicationServiceClientMock() {
  return {
    createNotification: vi.fn().mockResolvedValue({
      id: 'mock-notification-id',
      status: 'sent',
    }),
    sendTemplatedEmail: vi.fn().mockResolvedValue({
      id: 'mock-email-id',
      status: 'sent',
    }),
    sendEmail: vi.fn().mockResolvedValue({
      id: 'mock-email-id',
      status: 'sent',
    }),
  }
}

/**
 * Mock for UserServiceClient - handles user operations
 */
export function createUserServiceClientMock() {
  return {
    getUserById: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
    }),
    updateUserMembership: vi.fn().mockResolvedValue({
      success: true,
    }),
  }
}

/**
 * Mock for VoucherServiceClient - handles voucher operations
 */
export function createVoucherServiceClientMock() {
  return {
    getVouchersByIds: vi.fn().mockResolvedValue(
      new Map([
        [
          'voucher-1',
          {
            id: 'voucher-1',
            businessId: 'business-1',
            title: { en: 'Mock Voucher 1' },
            description: { en: 'Mock Description 1' },
            terms: { en: 'Mock Terms 1' },
            discountType: 'percentage',
            discountValue: 10,
            businessName: 'Mock Business 1',
            category: 'restaurants',
            qrPayload: 'mock-qr-payload-1',
            shortCode: 'MOCK01',
          },
        ],
        [
          'voucher-2',
          {
            id: 'voucher-2',
            businessId: 'business-2',
            title: { en: 'Mock Voucher 2' },
            description: { en: 'Mock Description 2' },
            terms: { en: 'Mock Terms 2' },
            discountType: 'fixed',
            discountValue: 5,
            businessName: 'Mock Business 2',
            category: 'retail',
            qrPayload: 'mock-qr-payload-2',
            shortCode: 'MOCK02',
          },
        ],
      ]),
    ),
    getVoucherById: vi.fn().mockResolvedValue({
      id: 'voucher-1',
      businessId: 'business-1',
      title: { en: 'Mock Voucher' },
      description: { en: 'Mock Description' },
      terms: { en: 'Mock Terms' },
      discountType: 'percentage',
      discountValue: 10,
      businessName: 'Mock Business',
      category: 'restaurants',
      qrPayload: 'mock-qr-payload',
      shortCode: 'MOCK01',
    }),
    getVouchersByProviderId: vi.fn().mockResolvedValue([
      {
        id: 'voucher-1',
        businessId: 'business-1',
        title: { en: 'Mock Voucher' },
        description: { en: 'Mock Description' },
        terms: { en: 'Mock Terms' },
        discountType: 'percentage',
        discountValue: 10,
        businessName: 'Mock Business',
        category: 'restaurants',
        qrPayload: 'mock-qr-payload',
        shortCode: 'MOCK01',
      },
    ]),
    getVouchersForBook: vi.fn().mockResolvedValue({
      vouchers: [
        {
          id: 'voucher-1',
          businessId: 'business-1',
          title: { en: 'Mock Voucher 1' },
          description: { en: 'Mock Description 1' },
          terms: { en: 'Mock Terms 1' },
          discountType: 'percentage',
          discountValue: 10,
          businessName: 'Mock Business 1',
          category: 'restaurants',
          qrPayload: 'mock-qr-payload-1',
          shortCode: 'MOCK01',
        },
        {
          id: 'voucher-2',
          businessId: 'business-2',
          title: { en: 'Mock Voucher 2' },
          description: { en: 'Mock Description 2' },
          terms: { en: 'Mock Terms 2' },
          discountType: 'fixed',
          discountValue: 5,
          businessName: 'Mock Business 2',
          category: 'retail',
          qrPayload: 'mock-qr-payload-2',
          shortCode: 'MOCK02',
        },
      ],
      count: 2,
    }),
    validateBookStateTransition: vi.fn().mockResolvedValue({
      allowed: true,
      reason: undefined,
      requiredFields: undefined,
    }),
  }
}

/**
 * Setup mocks for all service clients
 */
export function setupServiceClientMocks() {
  const paymentClientMock = createPaymentServiceClientMock()
  const communicationClientMock = createCommunicationServiceClientMock()
  const userClientMock = createUserServiceClientMock()
  const voucherClientMock = createVoucherServiceClientMock()

  return {
    PaymentServiceClient: vi.fn(() => paymentClientMock),
    CommunicationServiceClient: vi.fn(() => communicationClientMock),
    UserServiceClient: vi.fn(() => userClientMock),
    VoucherServiceClient: vi.fn(() => voucherClientMock),
    // Return instances for direct usage
    paymentClientMock,
    communicationClientMock,
    userClientMock,
    voucherClientMock,
  }
}
