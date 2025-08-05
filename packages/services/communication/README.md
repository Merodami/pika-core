# Communication Service

Multi-channel communication service for the Pika platform, handling email, SMS, and in-app notifications with template management and delivery tracking.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/communication:local

# Build
yarn nx run @pikaommunication:build

# Test
yarn vitest packages/services/communication
```

## 📋 Overview

The Communication Service manages all outbound communications for the Pika platform:

- **Email Delivery**: Multi-provider support (AWS SES, Resend, Console)
- **SMS Messaging**: SMS notifications via configured providers
- **In-App Notifications**: Real-time user notifications
- **Template Management**: Dynamic content templates with variables
- **Delivery Tracking**: Communication history and status tracking
- **Bulk Operations**: Efficient bulk email sending

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/           # HTTP request handlers
│   ├── EmailController    # Email operations
│   ├── NotificationController # In-app notifications
│   └── TemplateController # Template management
├── services/              # Business logic
│   ├── EmailService       # Email sending logic
│   ├── NotificationService # Notification handling
│   └── TemplateService    # Template processing
├── repositories/          # Data access layer
│   ├── CommunicationLogRepository # History tracking
│   ├── NotificationRepository # Notification storage
│   └── TemplateRepository # Template management
├── providers/             # External integrations
│   ├── AwsSesProvider     # AWS SES integration
│   ├── ResendProvider     # Resend integration
│   └── ConsoleProvider    # Development logging
├── routes/                # API route definitions
└── types/                 # TypeScript definitions
```

### Key Components

- **Multi-Provider Architecture**: Switchable email/SMS providers
- **Template Engine**: Dynamic content rendering with variables
- **Queue Integration**: Asynchronous processing for bulk operations
- **Delivery Tracking**: Complete audit trail of all communications
- **Retry Mechanism**: Automatic retry for failed deliveries

## 🔌 API Endpoints

### Email Operations

| Method | Endpoint                       | Description       |
| ------ | ------------------------------ | ----------------- |
| POST   | `/communication/email/send`    | Send single email |
| POST   | `/communication/email/bulk`    | Send bulk emails  |
| GET    | `/communication/email/history` | Get email history |
| GET    | `/communication/email/:id`     | Get email details |

### Notification Operations

| Method | Endpoint                                | Description         |
| ------ | --------------------------------------- | ------------------- |
| POST   | `/communication/notifications`          | Create notification |
| GET    | `/communication/notifications`          | List notifications  |
| PUT    | `/communication/notifications/:id/read` | Mark as read        |
| DELETE | `/communication/notifications/:id`      | Delete notification |

### Template Management

| Method | Endpoint                       | Description     |
| ------ | ------------------------------ | --------------- |
| POST   | `/communication/templates`     | Create template |
| GET    | `/communication/templates`     | List templates  |
| GET    | `/communication/templates/:id` | Get template    |
| PUT    | `/communication/templates/:id` | Update template |
| DELETE | `/communication/templates/:id` | Delete template |

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
COMMUNICATION_SERVICE_PORT=5507
COMMUNICATION_SERVICE_NAME=communication

# Email Provider Selection
EMAIL_PROVIDER=resend # Options: aws-ses, resend, console

# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=your-access-key
AWS_SES_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_FROM_EMAIL=noreply@pikaom

# Resend Configuration
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@pikaom

# SMS Provider (Future)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Notification Settings
NOTIFICATION_RETENTION_DAYS=30
NOTIFICATION_BATCH_SIZE=100
```

## 📧 Template System

### Template Structure

```json
{
  "name": "welcome-email",
  "subject": "Welcome to Pika, {{userName}}!",
  "body": {
    "html": "<h1>Welcome {{userName}}</h1><p>{{content}}</p>",
    "text": "Welcome {{userName}}\n\n{{content}}"
  },
  "variables": ["userName", "content"],
  "category": "onboarding"
}
```

### Template Variables

- Dynamic variable replacement using Handlebars syntax
- Support for nested objects and arrays
- Conditional rendering and loops
- Default values for missing variables

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/communication

# Integration tests
yarn vitest packages/services/communication/src/test/integration

# Test email sending (console provider)
EMAIL_PROVIDER=console yarn vitest
```

## 🔄 Integration

### Service Dependencies

- **Database**: PostgreSQL for template and log storage
- **Redis**: Notification caching and rate limiting
- **User Service**: Recipient information lookup
- **Auth Service**: API authentication

### Event-Driven Communications

```typescript
// Example: Send welcome email on user registration
eventBus.on('user.registered', async (event) => {
  await emailService.send({
    template: 'welcome-email',
    to: event.email,
    variables: { userName: event.name },
  })
})
```

## 📊 Communication Types

### Email Categories

- **Transactional**: Order confirmations, password resets
- **Marketing**: Promotions, newsletters (with unsubscribe)
- **System**: Maintenance notices, security alerts
- **Onboarding**: Welcome emails, tutorials

### Notification Types

- **Info**: General information
- **Success**: Action confirmations
- **Warning**: Important notices
- **Error**: Error notifications
- **System**: Platform updates

## 🚨 Error Handling

| Error Code | Description                |
| ---------- | -------------------------- |
| COMM001    | Invalid recipient          |
| COMM002    | Template not found         |
| COMM003    | Provider error             |
| COMM004    | Rate limit exceeded        |
| COMM005    | Invalid template variables |

## 📈 Performance & Reliability

- **Bulk Processing**: Batch operations for efficiency
- **Queue Integration**: Asynchronous processing
- **Retry Logic**: Exponential backoff for failures
- **Rate Limiting**: Provider-specific limits respected
- **Delivery Tracking**: Complete audit trail

## 🔒 Security Features

- **Content Sanitization**: XSS prevention in templates
- **Rate Limiting**: Per-user and global limits
- **Unsubscribe Management**: Compliance with regulations
- **Bounce Handling**: Automatic bad email detection
- **SPF/DKIM**: Email authentication configured

## 📊 Monitoring & Analytics

- **Delivery Rates**: Track successful deliveries
- **Open Rates**: Email engagement metrics
- **Click Tracking**: Link click analytics
- **Bounce Management**: Handle hard/soft bounces
- **Complaint Handling**: Feedback loop processing

## 🔄 Future Enhancements

- [ ] WhatsApp integration
- [ ] Push notifications (mobile)
- [ ] A/B testing for templates
- [ ] Advanced analytics dashboard
- [ ] Webhook delivery system
- [ ] Template versioning
- [ ] Scheduled communications
- [ ] Multi-language support
