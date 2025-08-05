# User Service

User profile and account management service for the Pika platform, handling user data, preferences, and profile information.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/user:local

# Build
yarn nx run @pikabuild

# Test
yarn vitest packages/services/user
```

## 📋 Overview

The User Service manages all user-related operations for the Pika platform:

- **Profile Management**: User personal information and preferences
- **Account Settings**: Privacy, notifications, and app preferences
- **Health Information**: PARQ forms, medical questionnaires
- **Address Management**: User location and contact details
- **Professional Profiles**: Trainer and staff information
- **User Status**: Account verification and role management
- **Data Privacy**: GDPR compliance and data protection

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/           # HTTP request handlers
│   └── UserController     # User operations
├── services/              # Business logic
│   └── UserService        # User management logic
├── repositories/          # Data access layer
│   └── UserRepository     # User data operations
├── routes/                # API route definitions
│   ├── UserRoutes         # Main user endpoints
│   └── healthRoutes       # Health check endpoints
└── utils/                 # User utilities
```

### Key Features

- **Comprehensive Profiles**: Personal, health, and professional data
- **Privacy Controls**: Granular data visibility settings
- **Role-Based Access**: User, trainer, admin, staff roles
- **Data Validation**: Health and safety requirement checks
- **Profile Completeness**: Guided profile setup
- **Audit Logging**: Data change tracking

## 🔌 API Endpoints

### Profile Management

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| GET    | `/users/profile` | Get current user profile |
| PUT    | `/users/profile` | Update profile           |
| GET    | `/users/:id`     | Get user by ID           |
| PUT    | `/users/:id`     | Update user (admin)      |
| DELETE | `/users/:id`     | Deactivate account       |

### Health Information

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| GET    | `/users/health/parq`    | Get PARQ form data      |
| PUT    | `/users/health/parq`    | Update PARQ form        |
| GET    | `/users/health/medical` | Get medical information |
| PUT    | `/users/health/medical` | Update medical info     |

### Address & Contact

| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| GET    | `/users/addresses`     | List user addresses |
| POST   | `/users/addresses`     | Add new address     |
| PUT    | `/users/addresses/:id` | Update address      |
| DELETE | `/users/addresses/:id` | Remove address      |

### Professional Profiles

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/users/professional`       | Get professional profile |
| PUT    | `/users/professional`       | Update professional info |
| GET    | `/users/trainers`           | List trainers            |
| GET    | `/users/:id/certifications` | Get certifications       |

### Privacy & Settings

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/users/settings` | Get user settings    |
| PUT    | `/users/settings` | Update settings      |
| GET    | `/users/privacy`  | Get privacy settings |
| PUT    | `/users/privacy`  | Update privacy       |

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
USER_SERVICE_PORT=5501
USER_SERVICE_NAME=user

# Profile Settings
REQUIRE_PARQ_COMPLETION=true
PROFILE_COMPLETION_THRESHOLD=80
DEFAULT_PRIVACY_LEVEL=FRIENDS

# Data Validation
MIN_AGE_YEARS=13
MAX_AGE_YEARS=120
REQUIRE_ADDRESS_VERIFICATION=false

# Professional Profiles
TRAINER_VERIFICATION_REQUIRED=true
CERTIFICATION_EXPIRY_TRACKING=true

# Data Retention
INACTIVE_ACCOUNT_DAYS=365
DATA_EXPORT_FORMAT=json
```

## 👤 User Profile Structure

### Core Profile

```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  phone?: string
  profilePicture?: string
  bio?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
  role: 'USER' | 'TRAINER' | 'ADMIN' | 'STAFF'
  preferences: UserPreferences
  privacy: PrivacySettings
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}
```

### Health Profile (PARQ)

```typescript
{
  hasHeartCondition: boolean
  hasChestPainDuringActivity: boolean
  hasChestPainAtRest: boolean
  hasLostConsciousness: boolean
  hasBoneJointProblems: boolean
  takesMedication: boolean
  hasOtherReasons: boolean
  additionalInfo?: string
  completedAt: Date
  validUntil: Date
  doctorClearance?: {
    required: boolean
    provided: boolean
    expiryDate?: Date
  }
}
```

### Professional Profile

```typescript
{
  licenseNumber?: string
  specializations: string[]
  certifications: {
    name: string
    issuer: string
    issueDate: Date
    expiryDate?: Date
    credentialId?: string
  }[]
  experience: {
    title: string
    company: string
    startDate: Date
    endDate?: Date
    description?: string
  }[]
  hourlyRate?: number
  availability: {
    [day: string]: {
      start: string
      end: string
      available: boolean
    }
  }
  rating?: {
    average: number
    totalReviews: number
  }
}
```

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/user

# Integration tests
yarn vitest packages/services/user/src/test/integration

# Test profile validation
yarn vitest packages/services/user --grep "validation"
```

## 🔄 Integration

### Service Dependencies

- **Database**: PostgreSQL for user data
- **Storage Service**: Profile pictures and documents
- **Auth Service**: Authentication integration
- **Communication Service**: Account notifications

### Profile Completion Flow

```typescript
// Profile completion tracking
async updateProfile(userId: string, profileData: UpdateProfileDTO) {
  // 1. Validate data
  await this.validateProfileData(profileData)

  // 2. Update profile
  const updatedUser = await this.userRepository.update(userId, profileData)

  // 3. Calculate completion percentage
  const completionScore = this.calculateProfileCompletion(updatedUser)

  // 4. Check for milestones
  if (completionScore >= PROFILE_COMPLETION_THRESHOLD) {
    await this.unlockFeatures(userId)
    await communicationService.send({
      template: 'profile-completion-reward',
      userId,
      data: { completionScore }
    })
  }

  // 5. Update completion status
  await this.updateCompletionStatus(userId, completionScore)

  return updatedUser
}
```

## 🔐 Privacy & Data Protection

### Privacy Levels

```typescript
enum PrivacyLevel {
  PUBLIC = 'PUBLIC', // Visible to all users
  FRIENDS = 'FRIENDS', // Friends and connections only
  PRIVATE = 'PRIVATE', // Only the user
}
```

### Privacy Settings

```typescript
{
  profileVisibility: PrivacyLevel
  contactInfoVisibility: PrivacyLevel
  workoutHistoryVisibility: PrivacyLevel
  achievementsVisibility: PrivacyLevel
  locationSharingEnabled: boolean
  activitySharingEnabled: boolean
  marketingEmailsEnabled: boolean
  pushNotificationsEnabled: boolean
  smsNotificationsEnabled: boolean
}
```

## 📊 User Analytics

### Profile Metrics

- **Completion Rate**: Average profile completeness
- **PARQ Compliance**: Health form completion rate
- **Active Users**: Daily/monthly active users
- **Role Distribution**: User type breakdown
- **Feature Adoption**: Setting usage patterns

### Health & Safety Tracking

```typescript
{
  parqCompletionRate: 85.2, // % of users
  doctorClearanceRequired: 12.5, // % needing clearance
  healthRiskCategories: {
    low: 75.3,
    medium: 20.1,
    high: 4.6
  },
  averageCompletionTime: 8.5 // minutes
}
```

## 🚨 Error Handling

| Error Code | Description           |
| ---------- | --------------------- |
| USR001     | User not found        |
| USR002     | Email already exists  |
| USR003     | Invalid age           |
| USR004     | PARQ form required    |
| USR005     | Profile incomplete    |
| USR006     | Invalid phone number  |
| USR007     | Certification expired |

## 🏥 Health & Safety Compliance

### PARQ Requirements

- Mandatory for all users before first session
- Annual renewal required
- Doctor clearance for high-risk responses
- Age-appropriate questionnaires

### Data Security

- **Encryption**: All personal data encrypted at rest
- **Access Logging**: Audit trail for data access
- **GDPR Compliance**: Right to deletion and export
- **Data Minimization**: Only collect necessary data

## 🔄 Account Lifecycle

### Registration Flow

1. **Email Verification**: Confirm account ownership
2. **Basic Profile**: Name, age, contact info
3. **Health Questionnaire**: PARQ form completion
4. **Profile Enhancement**: Optional additional information
5. **Feature Unlock**: Access to booking and social features

### Account Deactivation

```typescript
async deactivateAccount(userId: string, reason?: string) {
  // 1. Cancel active bookings
  await sessionService.cancelUserBookings(userId)

  // 2. Process refunds
  await paymentService.processDeactivationRefunds(userId)

  // 3. Archive user data
  await this.archiveUserData(userId)

  // 4. Update status
  await this.updateStatus(userId, 'INACTIVE')

  // 5. Send confirmation
  await communicationService.send({
    template: 'account-deactivated',
    userId,
    data: { reason }
  })
}
```

## 🔄 Future Enhancements

- [ ] Biometric data integration
- [ ] AI-powered health insights
- [ ] Social profile synchronization
- [ ] Advanced privacy controls
- [ ] Multi-language support
- [ ] Accessibility features
- [ ] Family account management
- [ ] Professional networking features
