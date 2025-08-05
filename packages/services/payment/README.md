# Payment Service

Payment processing and credit management service for the Pika platform, integrating with Stripe for secure transactions and managing user credits, memberships, and promo codes.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/payment:local

# Build
yarn nx run @pikant:build

# Test
yarn vitest packages/services/payment
```

## 📋 Overview

The Payment Service handles all financial transactions and credit management for the Pika platform:

- **Credit System**: Virtual currency for booking sessions
- **Credit Packs**: Pre-defined credit bundles with pricing
- **Membership Management**: Subscription-based access with credits
- **Payment Processing**: Secure Stripe integration
- **Promo Codes**: Discount and promotional code system
- **Transaction History**: Complete audit trail
- **Webhook Handling**: Real-time Stripe event processing

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/           # HTTP request handlers
│   ├── CreditsController  # Credit operations
│   ├── CreditPackController # Credit pack management
│   ├── MembershipController # Membership operations
│   ├── PromoCodeController # Promo code management
│   ├── ProductController  # Stripe product sync
│   └── WebhookController  # Stripe webhook handler
├── services/              # Business logic
│   ├── CreditsService     # Credit management
│   ├── CreditPackService  # Pack operations
│   ├── MembershipService  # Membership logic
│   ├── PromoCodeService   # Promo validation
│   ├── StripeService      # Stripe integration
│   └── TransactionService # Transaction tracking
├── repositories/          # Data access layer
│   ├── CreditsRepository  # Credit storage
│   ├── CreditPackRepository # Pack definitions
│   ├── MembershipRepository # Membership data
│   └── PromoCodeRepository # Promo code storage
├── config/                # Configuration
│   └── stripe.config      # Stripe settings
├── routes/                # API route definitions
└── types/                 # TypeScript definitions
```

### Key Components

- **Stripe Integration**: Full payment processing lifecycle
- **Credit Ledger**: Immutable transaction history
- **Webhook Security**: Signature verification for events
- **Idempotency**: Prevent duplicate transactions
- **Real-time Updates**: WebSocket credit balance updates

## 🔌 API Endpoints

### Credit Management

| Method | Endpoint                    | Description             |
| ------ | --------------------------- | ----------------------- |
| GET    | `/payment/credits/balance`  | Get user credit balance |
| GET    | `/payment/credits/history`  | Transaction history     |
| POST   | `/payment/credits/transfer` | Transfer credits        |
| POST   | `/payment/credits/refund`   | Refund credits          |

### Credit Packs

| Method | Endpoint                             | Description          |
| ------ | ------------------------------------ | -------------------- |
| GET    | `/payment/credit-packs`              | List available packs |
| GET    | `/payment/credit-packs/:id`          | Get pack details     |
| POST   | `/payment/credit-packs/:id/purchase` | Purchase pack        |

### Memberships

| Method | Endpoint                             | Description         |
| ------ | ------------------------------------ | ------------------- |
| GET    | `/payment/memberships`               | List memberships    |
| GET    | `/payment/memberships/current`       | Current membership  |
| POST   | `/payment/memberships/:id/subscribe` | Subscribe           |
| POST   | `/payment/memberships/cancel`        | Cancel subscription |

### Promo Codes

| Method | Endpoint                        | Description    |
| ------ | ------------------------------- | -------------- |
| POST   | `/payment/promo-codes/validate` | Validate code  |
| POST   | `/payment/promo-codes/apply`    | Apply discount |

### Webhooks

| Method | Endpoint                   | Description          |
| ------ | -------------------------- | -------------------- |
| POST   | `/payment/webhooks/stripe` | Stripe event handler |

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
PAYMENT_SERVICE_PORT=5505
PAYMENT_SERVICE_NAME=payment

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16

# Credit System
DEFAULT_CREDIT_PRICE=1.00 # USD per credit
CREDIT_EXPIRY_DAYS=365
MIN_CREDIT_PURCHASE=10
MAX_CREDIT_BALANCE=10000

# Transaction Limits
MAX_DAILY_TRANSACTIONS=100
MAX_TRANSACTION_AMOUNT=5000
```

## 💳 Payment Flow

### Credit Pack Purchase

```
1. User selects credit pack
2. Create Stripe checkout session
3. User completes payment
4. Webhook confirms payment
5. Credits added to user account
6. Send confirmation email
```

### Membership Subscription

```
1. User selects membership plan
2. Create Stripe subscription
3. Initial payment processed
4. Monthly credits allocated
5. Recurring billing setup
6. Webhook handles renewals
```

## 💰 Credit System

### Credit Types

- **Purchased**: Bought via credit packs
- **Membership**: Monthly allocation from subscription
- **Promotional**: Bonus credits from promo codes
- **Refunded**: Credits returned from cancellations

### Credit Rules

- First-in-first-out (FIFO) usage
- Expiration tracking per credit batch
- Non-transferable between users
- Partial refunds supported

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/payment

# Integration tests with Stripe mock
yarn vitest packages/services/payment/src/test/integration

# Test webhook handling
yarn vitest packages/services/payment --grep "webhook"
```

## 🔄 Integration

### Service Dependencies

- **Database**: PostgreSQL for transaction ledger
- **Redis**: Payment idempotency keys
- **User Service**: User validation
- **Communication Service**: Payment receipts
- **Subscription Service**: Membership management

### Stripe Integration Points

```typescript
// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: pack.price * 100, // cents
  currency: 'usd',
  metadata: {
    userId,
    packId,
    credits: pack.credits,
  },
})

// Handle webhook events
switch (event.type) {
  case 'payment_intent.succeeded':
    await handlePaymentSuccess(event.data.object)
    break
  case 'customer.subscription.updated':
    await handleSubscriptionUpdate(event.data.object)
    break
}
```

## 🔒 Security Features

- **PCI Compliance**: No card data stored
- **Webhook Signatures**: Verify Stripe authenticity
- **Idempotency Keys**: Prevent duplicate charges
- **Rate Limiting**: Transaction frequency limits
- **Fraud Detection**: Unusual activity monitoring

## 📊 Transaction Tracking

### Transaction Record

```json
{
  "id": "txn_123",
  "userId": "user_456",
  "type": "CREDIT_PURCHASE",
  "amount": 50.0,
  "credits": 50,
  "status": "COMPLETED",
  "stripePaymentIntentId": "pi_789",
  "metadata": {
    "packId": "pack_abc",
    "promoCode": "SAVE20"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Transaction Types

- CREDIT_PURCHASE
- MEMBERSHIP_PAYMENT
- CREDIT_USAGE
- CREDIT_REFUND
- CREDIT_TRANSFER
- CREDIT_EXPIRY

## 🚨 Error Handling

| Error Code | Description                 |
| ---------- | --------------------------- |
| PAY001     | Insufficient credits        |
| PAY002     | Payment failed              |
| PAY003     | Invalid promo code          |
| PAY004     | Subscription already active |
| PAY005     | Webhook signature invalid   |
| PAY006     | Credit limit exceeded       |

## 📈 Analytics & Reporting

- **Revenue Tracking**: Daily/monthly reports
- **Credit Usage**: Consumption patterns
- **Popular Packs**: Best-selling analysis
- **Churn Analysis**: Subscription cancellations
- **Promo Performance**: Code usage metrics

## 🎫 Promo Code System

### Code Types

- **Percentage**: 10-50% discount
- **Fixed Amount**: $5-$50 off
- **Bonus Credits**: Extra credits on purchase
- **Free Trial**: Membership trial periods

### Code Restrictions

- Usage limits per code
- User eligibility rules
- Expiration dates
- Minimum purchase amounts
- Product restrictions

## 🔄 Future Enhancements

- [ ] Multi-currency support
- [ ] Corporate billing accounts
- [ ] Gift cards and vouchers
- [ ] Loyalty rewards program
- [ ] Payment plan options
- [ ] Cryptocurrency payments
- [ ] Apple Pay / Google Pay
- [ ] Automated dunning management
