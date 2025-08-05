// packages/tests/src/mocks/stripeMock.ts

import { vi } from 'vitest'

/**
 * Mock Stripe API responses for testing
 * Provides realistic mock data that matches Stripe's API structure
 */
export function createStripeMock() {
  return {
    products: {
      create: vi.fn().mockResolvedValue({
        id: 'prod_test_mock_123',
        object: 'product',
        name: 'Mock Product',
        description: 'Mock product description',
        active: true,
        created: Math.floor(Date.now() / 1000),
        updated: Math.floor(Date.now() / 1000),
        metadata: {},
        images: [],
        livemode: false,
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        type: 'service',
        unit_label: null,
        url: null,
      }),

      update: vi.fn().mockImplementation((id, updates) =>
        Promise.resolve({
          id,
          object: 'product',
          name: updates.name || 'Updated Mock Product',
          description: updates.description || 'Updated description',
          active: updates.active !== undefined ? updates.active : true,
          created: Math.floor(Date.now() / 1000),
          updated: Math.floor(Date.now() / 1000),
          metadata: updates.metadata || {},
          images: [],
          livemode: false,
        }),
      ),

      list: vi.fn().mockResolvedValue({
        object: 'list',
        data: [
          {
            id: 'prod_test_mock_123',
            object: 'product',
            name: 'Mock Product',
            description: 'Mock product description',
            active: true,
            created: Math.floor(Date.now() / 1000),
            updated: Math.floor(Date.now() / 1000),
            metadata: { features: JSON.stringify(['Feature 1', 'Feature 2']) },
            livemode: false,
          },
        ],
        has_more: false,
        url: '/v1/products',
      }),
    },

    prices: {
      create: vi.fn().mockImplementation((params) =>
        Promise.resolve({
          id: 'price_test_mock_123',
          object: 'price',
          active: true,
          billing_scheme: 'per_unit',
          created: Math.floor(Date.now() / 1000),
          currency: params.currency || 'gbp',
          livemode: false,
          lookup_key: null,
          metadata: {},
          nickname: null,
          product: params.product,
          recurring: params.recurring
            ? {
                aggregate_usage: null,
                interval: params.recurring.interval,
                interval_count: params.recurring.interval_count || 1,
                usage_type: 'licensed',
              }
            : null,
          tax_behavior: 'unspecified',
          tiers_mode: null,
          transform_quantity: null,
          type: params.recurring ? 'recurring' : 'one_time',
          unit_amount: params.unit_amount,
          unit_amount_decimal: params.unit_amount.toString(),
        }),
      ),

      update: vi.fn().mockImplementation((id, updates) =>
        Promise.resolve({
          id,
          object: 'price',
          active: updates.active !== undefined ? updates.active : true,
          billing_scheme: 'per_unit',
          created: Math.floor(Date.now() / 1000),
          currency: 'gbp',
          livemode: false,
          lookup_key: null,
          metadata: {},
          nickname: null,
          product: 'prod_test_mock_123',
          recurring: {
            aggregate_usage: null,
            interval: 'month',
            interval_count: 1,
            usage_type: 'licensed',
          },
          unit_amount: 2999,
          unit_amount_decimal: '2999',
        }),
      ),

      list: vi.fn().mockImplementation((params) =>
        Promise.resolve({
          object: 'list',
          data: [
            {
              id: 'price_test_mock_123',
              object: 'price',
              active: true,
              billing_scheme: 'per_unit',
              created: Math.floor(Date.now() / 1000),
              currency: 'gbp',
              livemode: false,
              metadata: {},
              product: params?.product || 'prod_test_mock_123',
              recurring: {
                aggregate_usage: null,
                interval: 'month',
                interval_count: 1,
                usage_type: 'licensed',
              },
              type: 'recurring',
              unit_amount: 2999,
              unit_amount_decimal: '2999',
            },
          ],
          has_more: false,
          url: '/v1/prices',
        }),
      ),
    },

    customers: {
      create: vi.fn().mockResolvedValue({
        id: 'cus_test_mock_123',
        object: 'customer',
        address: null,
        balance: 0,
        created: Math.floor(Date.now() / 1000),
        currency: null,
        default_source: null,
        delinquent: false,
        description: null,
        discount: null,
        email: 'test@example.com',
        invoice_prefix: 'ABC123',
        invoice_settings: {},
        livemode: false,
        metadata: {},
        name: 'Test Customer',
        next_invoice_sequence: 1,
        phone: null,
        preferred_locales: [],
        shipping: null,
        tax_exempt: 'none',
        test_clock: null,
      }),
    },

    subscriptions: {
      create: vi.fn().mockResolvedValue({
        id: 'sub_test_mock_123',
        object: 'subscription',
        application: null,
        application_fee_percent: null,
        automatic_tax: { enabled: false },
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
        billing_thresholds: null,
        cancel_at: null,
        cancel_at_period_end: false,
        canceled_at: null,
        collection_method: 'charge_automatically',
        created: Math.floor(Date.now() / 1000),
        currency: 'gbp',
        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
        current_period_start: Math.floor(Date.now() / 1000),
        customer: 'cus_test_mock_123',
        days_until_due: null,
        default_payment_method: null,
        default_source: null,
        default_tax_rates: [],
        description: null,
        discount: null,
        ended_at: null,
        invoice_customer_balance_settings: {},
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_mock_123',
              object: 'subscription_item',
              billing_thresholds: null,
              created: Math.floor(Date.now() / 1000),
              metadata: {},
              price: {
                id: 'price_test_mock_123',
                object: 'price',
                active: true,
                currency: 'gbp',
                product: 'prod_test_mock_123',
                type: 'recurring',
                unit_amount: 2999,
              },
              quantity: 1,
              subscription: 'sub_test_mock_123',
              tax_rates: [],
            },
          ],
          has_more: false,
          total_count: 1,
          url: '/v1/subscription_items',
        },
        latest_invoice: null,
        livemode: false,
        metadata: {},
        next_pending_invoice_item_invoice: null,
        pause_collection: null,
        payment_settings: {},
        pending_invoice_item_interval: null,
        pending_setup_intent: null,
        pending_update: null,
        schedule: null,
        start_date: Math.floor(Date.now() / 1000),
        status: 'active',
        test_clock: null,
        transfer_data: null,
        trial_end: null,
        trial_start: null,
      }),

      cancel: vi.fn().mockResolvedValue({
        id: 'sub_test_mock_123',
        object: 'subscription',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      }),
    },

    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test_mock_123',
        object: 'payment_intent',
        amount: 2999,
        currency: 'gbp',
        status: 'requires_payment_method',
        created: Math.floor(Date.now() / 1000),
        client_secret: 'pi_test_mock_123_secret_abc',
        livemode: false,
        metadata: {},
        automatic_payment_methods: { enabled: true },
      }),

      confirm: vi.fn().mockResolvedValue({
        id: 'pi_test_mock_123',
        object: 'payment_intent',
        amount: 2999,
        currency: 'gbp',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        client_secret: 'pi_test_mock_123_secret_abc',
        livemode: false,
        metadata: {},
      }),
    },
  }
}

/**
 * Setup Stripe module mock for testing
 * Use this in your test files to mock the entire Stripe module
 *
 * @example
 * ```ts
 * // In your test file
 * vi.mock('stripe', setupStripeMock)
 * ```
 */
export function setupStripeMock() {
  const stripeMock = createStripeMock()

  return () => ({
    default: vi.fn().mockImplementation(() => stripeMock),
  })
}

/**
 * Reset all Stripe mocks
 * Call this in beforeEach to ensure clean test state
 */
export function resetStripeMocks() {
  const stripeMock = createStripeMock()

  // Reset all mock implementations
  Object.values(stripeMock).forEach((service) => {
    Object.values(service).forEach((method) => {
      if (vi.isMockFunction(method)) {
        method.mockClear()
      }
    })
  })
}

/**
 * Get access to Stripe mock functions for assertions
 * Use this when you need to verify that specific Stripe methods were called
 */
export function getStripeMocks() {
  return createStripeMock()
}
