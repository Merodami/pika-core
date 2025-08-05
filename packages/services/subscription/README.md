# Subscription Service

Membership and subscription management service for the Pika platform, handling subscription plans, billing cycles, and member benefits.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/subscription:local

# Build
yarn nx run @pikaription:build

# Test
yarn vitest packages/services/subscription
```

## 📋 Overview

The Subscription Service manages all subscription-related operations for the Pika platform:

- **Subscription Plans**: Flexible membership tiers and pricing
- **Member Management**: User subscription lifecycle
- **Billing Integration**: Automated recurring payments
- **Credit Processing**: Monthly credit allocation
- **Plan Benefits**: Feature access management
- **Subscription Analytics**: Usage and revenue tracking
- **Proration Handling**: Mid-cycle plan changes

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/           # HTTP request handlers
│   ├── PlanController     # Plan management
│   └── SubscriptionController # Subscription operations
├── services/              # Business logic
│   ├── PlanService        # Plan operations
│   ├── SubscriptionService # Subscription logic
│   ├── UserMembershipService # Member management
│   └── CreditProcessingService # Credit allocation
├── repositories/          # Data access layer
│   ├── PlanRepository     # Plan storage
│   └── SubscriptionRepository # Subscription data
├── models/                # Domain models
│   └── SubscriptionPlan   # Plan model
├── scripts/               # Utilities
│   └── seedSubscriptionPlans # Initial plan setup
├── routes/                # API route definitions
└── types/                 # TypeScript definitions
```

### Key Features

- **Flexible Billing**: Monthly, quarterly, annual cycles
- **Plan Hierarchies**: Basic, Premium, Elite tiers
- **Feature Gating**: Access control by plan
- **Credit Systems**: Included credits per cycle
- **Trial Periods**: Free trial management
- **Grandfathering**: Legacy plan preservation

## 🔌 API Endpoints

### Plan Management

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| GET    | `/subscription/plans`     | List available plans    |
| GET    | `/subscription/plans/:id` | Get plan details        |
| POST   | `/subscription/plans`     | Create plan (admin)     |
| PUT    | `/subscription/plans/:id` | Update plan (admin)     |
| DELETE | `/subscription/plans/:id` | Deactivate plan (admin) |

### Subscription Operations

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/subscription/current`     | Current subscription     |
| POST   | `/subscription/subscribe`   | Subscribe to plan        |
| POST   | `/subscription/change-plan` | Change subscription plan |
| POST   | `/subscription/cancel`      | Cancel subscription      |
| POST   | `/subscription/reactivate`  | Reactivate subscription  |
| GET    | `/subscription/history`     | Subscription history     |

### Billing & Credits

| Method | Endpoint                        | Description               |
| ------ | ------------------------------- | ------------------------- |
| GET    | `/subscription/billing`         | Billing information       |
| GET    | `/subscription/credits`         | Credit allocation details |
| POST   | `/subscription/credits/process` | Process monthly credits   |

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
SUBSCRIPTION_SERVICE_PORT=5506
SUBSCRIPTION_SERVICE_NAME=subscription

# Billing Settings
DEFAULT_BILLING_CYCLE=monthly
TRIAL_PERIOD_DAYS=14
GRACE_PERIOD_DAYS=3
PRORATION_ENABLED=true

# Credit Processing
CREDIT_PROCESSING_DAY=1 # Monthly on 1st
CREDIT_PROCESSING_HOUR=0 # At midnight UTC
CREDIT_EXPIRY_MONTHS=12

# Plan Limits
MAX_CONCURRENT_SUBSCRIPTIONS=1
MIN_SUBSCRIPTION_MONTHS=1
CANCELLATION_EFFECTIVE=end_of_period
```

## 💳 Subscription Plans

### Plan Structure

```typescript
{
  id: string
  name: string
  description: string
  tier: 'BASIC' | 'PREMIUM' | 'ELITE'
  price: {
    monthly: number
    quarterly?: number
    annual?: number
  }
  features: {
    monthlyCredits: number
    maxBookingsPerDay: number
    priorityBooking: boolean
    groupSessions: boolean
    personalTraining: boolean
    nutritionPlanning: boolean
    progressTracking: boolean
  }
  trial: {
    enabled: boolean
    durationDays: number
    trialCredits: number
  }
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED'
  displayOrder: number
}
```

### Default Plans

#### Basic Plan - $29/month

- 20 monthly credits
- 2 bookings per day
- Group sessions access
- Basic progress tracking

#### Premium Plan - $59/month

- 50 monthly credits
- 5 bookings per day
- Priority booking
- Personal training access
- Advanced analytics

#### Elite Plan - $99/month

- 100 monthly credits
- Unlimited bookings
- All premium features
- Nutrition planning
- Dedicated support

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/subscription

# Integration tests
yarn vitest packages/services/subscription/src/test/integration

# Test billing cycles
yarn vitest packages/services/subscription --grep "billing"
```

## 🔄 Integration

### Service Dependencies

- **Database**: PostgreSQL for subscription data
- **Payment Service**: Billing and payment processing
- **User Service**: Member profile management
- **Communication Service**: Billing notifications

### Subscription Lifecycle

```typescript
// Subscription flow
async subscribe(userId: string, planId: string) {
  // 1. Validate user eligibility
  await this.validateEligibility(userId)

  // 2. Create subscription record
  const subscription = await this.createSubscription(userId, planId)

  // 3. Setup billing with Payment Service
  await paymentService.createSubscription({
    customerId: subscription.customerId,
    planId: subscription.planId,
    trialDays: subscription.plan.trial.durationDays
  })

  // 4. Allocate trial credits
  if (subscription.plan.trial.enabled) {
    await creditService.allocateCredits({
      userId,
      amount: subscription.plan.trial.trialCredits,
      source: 'TRIAL'
    })
  }

  // 5. Send welcome email
  await communicationService.send({
    template: 'subscription-welcome',
    userId,
    data: { plan: subscription.plan }
  })
}
```

## 📊 Credit Processing

### Monthly Credit Allocation

```typescript
// Automated monthly process
async processMonthlyCredits() {
  const activeSubscriptions = await this.getActiveSubscriptions()

  for (const subscription of activeSubscriptions) {
    // Skip if already processed this month
    if (subscription.lastCreditProcessed >= startOfMonth()) {
      continue
    }

    // Allocate credits based on plan
    await creditService.allocateCredits({
      userId: subscription.userId,
      amount: subscription.plan.features.monthlyCredits,
      source: 'SUBSCRIPTION',
      expiryDate: addMonths(new Date(), 12)
    })

    // Update processing timestamp
    await this.markCreditProcessed(subscription.id)
  }
}
```

### Credit Allocation Rules

- Credits allocated on billing anniversary
- Unused credits expire after 12 months
- Pro-rated credits for mid-cycle changes
- Bonus credits for annual payments

## 🚨 Error Handling

| Error Code | Description                  |
| ---------- | ---------------------------- |
| SUB001     | Plan not found               |
| SUB002     | Already subscribed           |
| SUB003     | Invalid plan transition      |
| SUB004     | Payment method required      |
| SUB005     | Subscription not active      |
| SUB006     | Cancellation not allowed     |
| SUB007     | Proration calculation failed |

## 📈 Subscription Analytics

### Key Metrics

- **Monthly Recurring Revenue (MRR)**
- **Annual Recurring Revenue (ARR)**
- **Customer Lifetime Value (CLV)**
- **Churn Rate**: Monthly cancellations
- **Upgrade Rate**: Plan tier improvements
- **Trial Conversion**: Trial to paid rate

### Cohort Analysis

```typescript
{
  month: "2024-01",
  newSubscribers: 150,
  cohortValue: {
    month1: 150, // 100% retention
    month2: 135, // 90% retention
    month3: 120, // 80% retention
    month6: 90,  // 60% retention
    month12: 75  // 50% retention
  },
  revenuePerCohort: {
    month1: 4500,
    month2: 4050,
    month3: 3600
  }
}
```

## 🔄 Plan Changes

### Upgrade Flow

```typescript
// Immediate upgrade with proration
async upgradePlan(subscriptionId: string, newPlanId: string) {
  const subscription = await this.getSubscription(subscriptionId)
  const newPlan = await this.getPlan(newPlanId)

  // Calculate proration
  const prorationAmount = this.calculateProration(
    subscription.currentPlan,
    newPlan,
    subscription.currentPeriodEnd
  )

  // Update subscription
  await this.updateSubscription(subscriptionId, {
    planId: newPlanId,
    prorationAmount
  })

  // Process immediate payment for upgrade
  if (prorationAmount > 0) {
    await paymentService.chargeProration(
      subscription.customerId,
      prorationAmount
    )
  }

  // Allocate additional credits if applicable
  const additionalCredits = this.calculateAdditionalCredits(
    subscription.currentPlan,
    newPlan
  )

  if (additionalCredits > 0) {
    await creditService.allocateCredits({
      userId: subscription.userId,
      amount: additionalCredits,
      source: 'PLAN_UPGRADE'
    })
  }
}
```

### Downgrade Flow

- Applied at next billing cycle
- No immediate charges
- Credits remain unchanged
- Feature access updated immediately

## 🎯 Feature Access Control

### Plan-Based Features

```typescript
// Feature checking middleware
async checkFeatureAccess(userId: string, feature: string) {
  const subscription = await this.getCurrentSubscription(userId)

  if (!subscription?.isActive) {
    return { allowed: false, reason: 'NO_ACTIVE_SUBSCRIPTION' }
  }

  const featureAllowed = subscription.plan.features[feature]

  return {
    allowed: featureAllowed,
    reason: featureAllowed ? null : 'FEATURE_NOT_INCLUDED'
  }
}

// Usage in other services
if (!(await subscriptionService.checkFeatureAccess(userId, 'priorityBooking')).allowed) {
  throw new Error('Priority booking requires Premium subscription')
}
```

## 🔄 Future Enhancements

- [ ] Corporate/team subscriptions
- [ ] Family plan sharing
- [ ] Add-on services
- [ ] Loyalty rewards integration
- [ ] Seasonal promotions
- [ ] Usage-based billing tiers
- [ ] International currency support
- [ ] Subscription pause/hold feature
