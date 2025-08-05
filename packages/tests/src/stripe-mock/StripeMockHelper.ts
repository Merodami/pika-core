import { logger } from '@pika/shared'
import fetch from 'node-fetch'
import Stripe from 'stripe'

export interface StripeMockConfig {
  host?: string
  port?: number
  apiKey?: string
}

export class StripeMockHelper {
  private static defaultConfig: StripeMockConfig = {
    host: process.env.STRIPE_MOCK_HOST || 'localhost',
    port: parseInt(process.env.STRIPE_MOCK_PORT || '12111'),
    apiKey: 'sk_test_123', // stripe-mock expects this format
  }

  /**
   * Creates a Stripe instance configured for stripe-mock
   */
  static createMockStripeInstance(config?: StripeMockConfig): Stripe {
    const finalConfig = { ...this.defaultConfig, ...config }

    return new Stripe(finalConfig.apiKey!, {
      apiVersion: '2025-06-30.basil',
      host: finalConfig.host,
      port: finalConfig.port,
      protocol: 'http',
    })
  }

  /**
   * Waits for stripe-mock to be ready
   */
  static async waitForStripeMock(
    config?: StripeMockConfig,
    maxRetries = 30,
  ): Promise<boolean> {
    const finalConfig = { ...this.defaultConfig, ...config }
    const url = `http://${finalConfig.host}:${finalConfig.port}/v1/charges`

    logger.debug('Waiting for stripe-mock to be ready...', { url })

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${finalConfig.apiKey}`,
          },
        })

        if (response.ok || response.status === 400) {
          logger.debug('stripe-mock is ready')

          return true
        }
      } catch {
        // Expected during startup
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    logger.error('stripe-mock did not become ready in time')

    return false
  }

  /**
   * Resets stripe-mock state between tests
   * Note: stripe-mock doesn't have a built-in reset endpoint,
   * so this is a placeholder for future functionality
   */
  static async resetStripeMock(): Promise<void> {
    // stripe-mock automatically resets between connections
    // This method is here for future use if stripe-mock adds a reset endpoint
    logger.debug('stripe-mock reset requested (no-op currently)')
  }

  /**
   * Generates a properly signed webhook event for testing
   */
  static generateWebhookEvent(
    type: string,
    data: any,
  ): { payload: string; signature: string } {
    const event = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2025-05-28.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: data,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
      type,
    }

    const payload = JSON.stringify(event)
    const timestamp = Math.floor(Date.now() / 1000)

    // Create a fake signature (stripe-mock doesn't validate signatures)
    const signature = `t=${timestamp},v1=test_signature`

    return { payload, signature }
  }

  /**
   * Common test fixtures for Stripe objects
   */
  static fixtures = {
    customer: (overrides?: Partial<Stripe.Customer>): Stripe.Customer =>
      ({
        id: 'cus_test_123',
        object: 'customer',
        address: null,
        balance: 0,
        created: Math.floor(Date.now() / 1000),
        currency: 'gbp',
        default_source: null,
        delinquent: false,
        description: null,
        discount: null,
        email: 'test@example.com',
        invoice_prefix: 'TEST',
        invoice_settings: {
          custom_fields: null,
          default_payment_method: null,
          footer: null,
          rendering_options: null,
        },
        livemode: false,
        metadata: {},
        name: 'Test Customer',
        next_invoice_sequence: 1,
        phone: null,
        preferred_locales: [],
        shipping: null,
        tax_exempt: 'none',
        test_clock: null,
        ...overrides,
      }) as Stripe.Customer,

    product: (overrides?: Partial<Stripe.Product>): Stripe.Product =>
      ({
        id: 'prod_test_123',
        object: 'product',
        active: true,
        created: Math.floor(Date.now() / 1000),
        default_price: null,
        description: 'Test Product Description',
        images: [],
        livemode: false,
        metadata: {},
        name: 'Test Product',
        package_dimensions: null,
        shippable: null,
        statement_descriptor: null,
        tax_code: null,
        type: 'service',
        unit_label: null,
        updated: Math.floor(Date.now() / 1000),
        url: null,
        ...overrides,
      }) as Stripe.Product,

    price: (overrides?: Partial<Stripe.Price>): Stripe.Price =>
      ({
        id: 'price_test_123',
        object: 'price',
        active: true,
        billing_scheme: 'per_unit',
        created: Math.floor(Date.now() / 1000),
        currency: 'gbp',
        custom_unit_amount: null,
        livemode: false,
        lookup_key: null,
        metadata: {},
        nickname: null,
        product: 'prod_test_123',
        recurring: {
          aggregate_usage: null,
          interval: 'month',
          interval_count: 1,
          trial_period_days: null,
          usage_type: 'licensed',
        },
        tax_behavior: 'unspecified',
        tiers_mode: null,
        transform_quantity: null,
        type: 'recurring',
        unit_amount: 2999,
        unit_amount_decimal: '2999',
        ...overrides,
      }) as Stripe.Price,

    subscription: (
      overrides?: Partial<Stripe.Subscription>,
    ): Stripe.Subscription =>
      ({
        id: 'sub_test_123',
        object: 'subscription',
        application: null,
        application_fee_percent: null,
        automatic_tax: {
          enabled: false,
        },
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
        billing_thresholds: null,
        cancel_at: null,
        cancel_at_period_end: false,
        canceled_at: null,
        collection_method: 'charge_automatically',
        created: Math.floor(Date.now() / 1000),
        currency: 'gbp',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        current_period_start: Math.floor(Date.now() / 1000),
        customer: 'cus_test_123',
        days_until_due: null,
        default_payment_method: null,
        default_source: null,
        default_tax_rates: [],
        discount: null,
        ended_at: null,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_123',
              object: 'subscription_item',
              billing_thresholds: null,
              created: Math.floor(Date.now() / 1000),
              metadata: {},
              price: {
                id: 'price_test_123',
                object: 'price',
                active: true,
                billing_scheme: 'per_unit',
                created: Math.floor(Date.now() / 1000),
                currency: 'gbp',
                custom_unit_amount: null,
                livemode: false,
                lookup_key: null,
                metadata: {},
                nickname: null,
                product: 'prod_test_123',
                recurring: {
                  aggregate_usage: null,
                  interval: 'month',
                  interval_count: 1,
                  trial_period_days: null,
                  usage_type: 'licensed',
                },
                tax_behavior: 'unspecified',
                tiers_mode: null,
                transform_quantity: null,
                type: 'recurring',
                unit_amount: 2999,
                unit_amount_decimal: '2999',
              },
              quantity: 1,
              subscription: 'sub_test_123',
              tax_rates: [],
            },
          ],
          has_more: false,
          url: '/v1/subscription_items?subscription=sub_test_123',
        },
        latest_invoice: null,
        livemode: false,
        metadata: {},
        next_pending_invoice_item_invoice: null,
        on_behalf_of: null,
        pause_collection: null,
        payment_settings: {
          payment_method_options: null,
          payment_method_types: null,
          save_default_payment_method: 'off',
        },
        pending_invoice_item_interval: null,
        pending_setup_intent: null,
        pending_update: null,
        schedule: null,
        start_date: Math.floor(Date.now() / 1000),
        status: 'active',
        test_clock: null,
        transfer_data: null,
        trial_end: null,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'create_invoice',
          },
        },
        trial_start: null,
        ...overrides,
      }) as Stripe.Subscription,
  }
}
