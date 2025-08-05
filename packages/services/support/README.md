# Support Service

Customer support and help desk service for the Pika platform, managing problem reporting, ticket tracking, and support communications.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/support:local

# Build
yarn nx run @pikaupport:build

# Test
yarn vitest packages/services/support
```

## 📋 Overview

The Support Service provides comprehensive customer support functionality for the Pika platform:

- **Problem Reporting**: User issue submission and tracking
- **Ticket Management**: Support ticket lifecycle management
- **Comment System**: Threaded conversations on tickets
- **Priority Handling**: Urgent issue escalation
- **Status Tracking**: Real-time ticket status updates
- **Knowledge Base**: Self-service documentation
- **Support Analytics**: Response time and resolution metrics

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/           # HTTP request handlers
│   ├── ProblemController  # Problem/ticket operations
│   └── SupportCommentController # Comment management
├── services/              # Business logic
│   ├── ProblemService     # Problem handling logic
│   └── SupportCommentService # Comment processing
├── repositories/          # Data access layer
│   ├── ProblemRepository  # Problem storage
│   └── SupportCommentRepository # Comment storage
├── routes/                # API route definitions
├── types/                 # TypeScript definitions
└── utils/                 # Support utilities
```

### Key Features

- **Multi-Channel Support**: Web, email, in-app
- **SLA Management**: Response time tracking
- **Escalation Rules**: Automatic priority handling
- **Canned Responses**: Quick reply templates
- **File Attachments**: Supporting documentation
- **Customer Satisfaction**: Post-resolution surveys

## 🔌 API Endpoints

### Problem Management

| Method | Endpoint                        | Description         |
| ------ | ------------------------------- | ------------------- |
| GET    | `/support/problems`             | List user problems  |
| GET    | `/support/problems/:id`         | Get problem details |
| POST   | `/support/problems`             | Create new problem  |
| PUT    | `/support/problems/:id`         | Update problem      |
| DELETE | `/support/problems/:id`         | Delete problem      |
| POST   | `/support/problems/:id/resolve` | Mark as resolved    |
| POST   | `/support/problems/:id/reopen`  | Reopen problem      |

### Admin Operations

| Method | Endpoint                               | Description       |
| ------ | -------------------------------------- | ----------------- |
| GET    | `/support/admin/problems`              | List all problems |
| PUT    | `/support/admin/problems/:id/assign`   | Assign to agent   |
| PUT    | `/support/admin/problems/:id/priority` | Update priority   |
| PUT    | `/support/admin/problems/:id/status`   | Update status     |
| GET    | `/support/admin/analytics`             | Support metrics   |

### Comments & Communication

| Method | Endpoint                           | Description    |
| ------ | ---------------------------------- | -------------- |
| GET    | `/support/problems/:id/comments`   | Get comments   |
| POST   | `/support/problems/:id/comments`   | Add comment    |
| PUT    | `/support/comments/:id`            | Update comment |
| DELETE | `/support/comments/:id`            | Delete comment |
| POST   | `/support/comments/:id/attachment` | Add attachment |

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
SUPPORT_SERVICE_PORT=5508
SUPPORT_SERVICE_NAME=support

# Ticket Settings
AUTO_ASSIGNMENT_ENABLED=true
DEFAULT_PRIORITY=MEDIUM
SLA_RESPONSE_HOURS=24
SLA_RESOLUTION_HOURS=72

# Escalation Rules
HIGH_PRIORITY_THRESHOLD_HOURS=4
CRITICAL_PRIORITY_THRESHOLD_HOURS=1
ESCALATION_EMAIL_ENABLED=true

# File Attachments
MAX_ATTACHMENT_SIZE_MB=25
ALLOWED_ATTACHMENT_TYPES=jpg,jpeg,png,pdf,doc,docx,txt,log

# Analytics
SATISFACTION_SURVEY_ENABLED=true
SURVEY_DELAY_HOURS=24
```

## 🎫 Problem Structure

### Problem Categories

```typescript
enum ProblemCategory {
  TECHNICAL = 'TECHNICAL', // App bugs, login issues
  BILLING = 'BILLING', // Payment problems
  BOOKING = 'BOOKING', // Session booking issues
  ACCOUNT = 'ACCOUNT', // Profile, settings
  GYM_FACILITY = 'GYM_FACILITY', // Equipment, cleanliness
  TRAINER = 'TRAINER', // Trainer-related issues
  FEATURE_REQUEST = 'FEATURE_REQUEST', // New feature suggestions
  OTHER = 'OTHER', // Miscellaneous
}
```

### Priority Levels

```typescript
enum Priority {
  LOW = 'LOW', // General questions
  MEDIUM = 'MEDIUM', // Standard issues
  HIGH = 'HIGH', // Affects core functionality
  CRITICAL = 'CRITICAL', // System down, security issues
}
```

### Problem Model

```typescript
{
  id: string
  userId: string
  category: ProblemCategory
  priority: Priority
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  assignedTo?: string // Support agent ID
  resolution?: string
  satisfaction?: {
    rating: 1 | 2 | 3 | 4 | 5
    feedback?: string
  }
  metadata: {
    userAgent?: string
    sessionId?: string
    gymId?: string
    errorCode?: string
  }
  attachments: string[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}
```

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/support

# Integration tests
yarn vitest packages/services/support/src/test/integration

# Test problem workflow
yarn vitest packages/services/support --grep "problem"
```

## 🔄 Integration

### Service Dependencies

- **Database**: PostgreSQL for ticket storage
- **User Service**: Customer information
- **Communication Service**: Email notifications
- **Storage Service**: File attachments
- **Analytics Service**: Support metrics

### Notification Flow

```typescript
// Problem lifecycle notifications
async createProblem(problemData: CreateProblemDTO) {
  // 1. Create problem record
  const problem = await this.problemRepository.create(problemData)

  // 2. Auto-assign if rules exist
  if (AUTO_ASSIGNMENT_ENABLED) {
    const agent = await this.findAvailableAgent(problem.category)
    if (agent) {
      await this.assignProblem(problem.id, agent.id)
    }
  }

  // 3. Send confirmation to user
  await communicationService.send({
    template: 'support-ticket-created',
    userId: problem.userId,
    data: {
      ticketId: problem.id,
      title: problem.title
    }
  })

  // 4. Notify support team
  await this.notifySupportTeam(problem)

  return problem
}
```

## 📊 Support Analytics

### Key Metrics

- **First Response Time**: Time to first agent reply
- **Resolution Time**: Time to close ticket
- **Customer Satisfaction**: Post-resolution surveys
- **Agent Performance**: Individual metrics
- **Category Trends**: Common problem types

### SLA Tracking

```typescript
{
  responseTime: {
    target: 24, // hours
    actual: 18.5,
    percentage: 85.2 // % within SLA
  },
  resolutionTime: {
    target: 72, // hours
    actual: 45.2,
    percentage: 92.1 // % within SLA
  },
  satisfaction: {
    average: 4.2, // out of 5
    responseRate: 68.5 // % who responded
  }
}
```

## 🚨 Error Handling

| Error Code | Description               |
| ---------- | ------------------------- |
| SUP001     | Problem not found         |
| SUP002     | Access denied             |
| SUP003     | Invalid status transition |
| SUP004     | Agent not available       |
| SUP005     | Attachment too large      |
| SUP006     | Comment not found         |
| SUP007     | Problem already resolved  |

## 🔄 Escalation Rules

### Automatic Escalation

```typescript
// Priority-based escalation
const escalationRules = {
  CRITICAL: {
    notifyImmediately: true,
    escalateAfterHours: 1,
    notifyManagement: true,
  },
  HIGH: {
    escalateAfterHours: 4,
    assignToSeniorAgent: true,
  },
  MEDIUM: {
    escalateAfterHours: 24,
    autoReminder: true,
  },
  LOW: {
    escalateAfterHours: 72,
  },
}
```

### Escalation Process

1. **Initial Assignment**: Based on category and availability
2. **SLA Monitoring**: Track response/resolution times
3. **Auto-Escalation**: When SLA thresholds breach
4. **Management Notification**: For critical issues
5. **Follow-up Reminders**: Automated agent reminders

## 💬 Comment System

### Comment Types

- **Public**: Visible to customer and agents
- **Internal**: Agent-only communication
- **System**: Automated status updates
- **Resolution**: Final solution documentation

### Comment Features

```typescript
{
  id: string
  problemId: string
  authorId: string
  authorType: 'USER' | 'AGENT' | 'SYSTEM'
  content: string
  type: 'PUBLIC' | 'INTERNAL' | 'SYSTEM' | 'RESOLUTION'
  attachments?: string[]
  metadata?: {
    previousStatus?: string
    newStatus?: string
    assignedTo?: string
  }
  createdAt: Date
  updatedAt: Date
}
```

## 📋 Knowledge Base

### Self-Service Features

- **FAQ System**: Common questions and answers
- **Step-by-Step Guides**: Problem resolution walkthroughs
- **Video Tutorials**: Visual problem solving
- **Search Functionality**: Quick answer lookup
- **Community Forum**: User-to-user help

### Deflection Strategy

- Show relevant KB articles before ticket creation
- Auto-suggest solutions based on problem description
- Track which articles reduce ticket volume

## 🔄 Future Enhancements

- [ ] Live chat integration
- [ ] AI-powered ticket routing
- [ ] Voice support integration
- [ ] Customer portal dashboard
- [ ] Advanced reporting suite
- [ ] Mobile app notifications
- [ ] Video call support
- [ ] Community-driven solutions
