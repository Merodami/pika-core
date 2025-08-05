# API Testing Tools

Development utilities for testing Pika APIs, including test token generation, authentication helpers, and testing workflows.

## 🚀 Quick Start

```bash
# Navigate to tools directory
cd tools/api-testing

# Install dependencies
yarn install

# Generate test tokens
yarn generate:tokens

# Show existing tokens
yarn show:tokens
```

## 📋 Overview

The API Testing Tools provide essential utilities for Pika development and testing:

- **Test Token Generation**: Create JWT tokens for API testing
- **User Authentication**: Mock user sessions for development
- **API Testing Workflows**: Streamlined testing processes
- **Environment Setup**: Development user creation
- **Token Management**: View and manage test credentials

## 🛠️ Available Tools

### Token Generation (`generate-test-tokens.ts`)

Generates JWT tokens for testing different user roles and scenarios:

```bash
# Generate tokens for all test users
yarn generate:tokens

# This creates tokens for:
# - Admin users
# - Regular users
# - Trainers
# - Different subscription tiers
```

### Token Display (`show-test-tokens.ts`)

Displays existing test tokens in a readable format:

```bash
# View all current test tokens
yarn show:tokens

# Output includes:
# - User information
# - Token expiration
# - Role and permissions
# - Formatted for easy copying
```

## 📁 File Structure

```
tools/api-testing/
├── generate-test-tokens.ts    # Token generation script
├── show-test-tokens.ts        # Token display utility
├── test-login.json           # Test user credentials
├── test-tokens.json          # Generated tokens storage
├── package.json              # Dependencies and scripts
└── README.md                 # This documentation
```

## 🔧 Configuration

### Test Users (`test-login.json`)

The tool uses predefined test users for consistent testing:

```json
{
  "users": [
    {
      "email": "admin@pika.com",
      "password": "admin123",
      "role": "ADMIN",
      "subscription": "ELITE"
    },
    {
      "email": "user@pika
      "password": "user123",
      "role": "USER",
      "subscription": "BASIC"
    },
    {
      "email": "trainer@pika
      "password": "trainer123",
      "role": "TRAINER",
      "subscription": "PREMIUM"
    }
  ]
}
```

### Generated Tokens (`test-tokens.json`)

Stores generated JWT tokens with metadata:

```json
{
  "generated": "2024-01-01T00:00:00Z",
  "tokens": {
    "admin": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "admin-123",
        "email": "admin@pika
        "role": "ADMIN"
      },
      "expiresAt": "2024-01-02T00:00:00Z"
    }
  }
}
```

## 🧪 Usage Examples

### Manual API Testing

```bash
# Generate fresh tokens
yarn generate:tokens

# Copy token for Postman/Insomnia
yarn show:tokens

# Use in HTTP requests
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:5500/api/users/profile
```

### Integration with Testing Scripts

```typescript
import tokens from './test-tokens.json'

describe('User API', () => {
  const adminToken = tokens.tokens.admin.token
  const userToken = tokens.tokens.user.token

  it('should get user profile', async () => {
    const response = await supertest(app).get('/users/profile').set('Authorization', `Bearer ${userToken}`).expect(200)
  })

  it('should allow admin access', async () => {
    const response = await supertest(app).get('/admin/users').set('Authorization', `Bearer ${adminToken}`).expect(200)
  })
})
```

### Development Workflow

```bash
# 1. Start local services
yarn local

# 2. Generate test tokens
cd tools/api-testing
yarn generate:tokens

# 3. Test API endpoints
curl -H "Authorization: Bearer $(cat test-tokens.json | jq -r '.tokens.user.token')" \
     http://localhost:5501/users/profile

# 4. View token details
yarn show:tokens
```

## 📊 Token Types Generated

### User Roles

- **ADMIN**: Full system access
- **USER**: Standard user permissions
- **TRAINER**: Trainer-specific features
- **STAFF**: Gym staff permissions

### Subscription Tiers

- **BASIC**: Limited features
- **PREMIUM**: Standard features
- **ELITE**: All features

### Special Tokens

- **Expired Token**: For testing auth failures
- **Invalid Token**: For error handling tests
- **Service Token**: Inter-service communication

## 🔐 Security Considerations

### Development Only

```bash
# These tools are for development/testing only
# Never use in production environments
NODE_ENV=development yarn generate:tokens
```

### Token Expiration

- Tokens expire after 24 hours by default
- Regenerate tokens daily for fresh testing
- Expired tokens help test auth error handling

### Credential Management

- Test credentials are not real user accounts
- Passwords are simple for development ease
- Real users should use secure passwords

## 🧪 Testing Scenarios

### Authentication Testing

```bash
# Test valid authentication
curl -H "Authorization: Bearer $(yarn show:tokens | grep user | cut -d: -f2)" \
     http://localhost:5501/users/profile

# Test invalid token
curl -H "Authorization: Bearer invalid_token" \
     http://localhost:5501/users/profile

# Test expired token (after 24 hours)
curl -H "Authorization: Bearer $(cat old-tokens.json | jq -r '.tokens.user.token')" \
     http://localhost:5501/users/profile
```

### Role-Based Access

```bash
# Admin-only endpoint
curl -H "Authorization: Bearer $(yarn show:tokens | grep admin | cut -d: -f2)" \
     http://localhost:5501/admin/users

# Trainer-only endpoint
curl -H "Authorization: Bearer $(yarn show:tokens | grep trainer | cut -d: -f2)" \
     http://localhost:5503/admin/sessions

# User-accessible endpoint
curl -H "Authorization: Bearer $(yarn show:tokens | grep user | cut -d: -f2)" \
     http://localhost:5504/sessions
```

## 📝 Scripts Reference

### Available Commands

```bash
# Generate new test tokens
yarn generate:tokens

# Display current tokens in readable format
yarn show:tokens

# Run token generation with debug output
DEBUG=1 yarn generate:tokens

# Generate tokens for specific environment
NODE_ENV=test yarn generate:tokens
```

### Custom Token Generation

```typescript
// Example: Generate custom token
import { generateToken } from './generate-test-tokens'

const customToken = generateToken({
  userId: 'custom-123',
  email: 'custom@pika
  role: 'USER',
  subscription: 'PREMIUM',
  expiresIn: '7d',
})
```

## 🔄 Integration with CI/CD

### Automated Testing

```yaml
# In GitHub Actions or similar
- name: Generate test tokens
  run: |
    cd tools/api-testing
    yarn generate:tokens

- name: Run API tests
  env:
    USER_TOKEN: ${{ secrets.TEST_USER_TOKEN }}
  run: yarn test:api
```

### Test Database Setup

```bash
# Generate tokens after test DB setup
yarn db:test:setup
cd tools/api-testing
yarn generate:tokens
yarn test:integration
```

## 🔄 Future Enhancements

- [ ] Multi-environment token generation
- [ ] Token refresh automation
- [ ] Custom claim injection
- [ ] Bulk user creation
- [ ] Performance testing tokens
- [ ] Mock service tokens
- [ ] Automated token rotation
- [ ] Integration with test frameworks
