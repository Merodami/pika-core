import { vi } from 'vitest'

// Create mock for PaymentServiceClient before any imports
export const mockPaymentClient = {
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
    },
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
  }),
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

// Mock the PaymentServiceClient constructor
export const MockPaymentServiceClient = vi.fn(() => mockPaymentClient)
