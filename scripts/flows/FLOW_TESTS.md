# Flow Tests

Flow scripts for testing complete user journeys through the API.

## Setup Scripts

### Test User Setup

**Script:** `setup-test-users.ts`  
**Command:** `yarn flow:setup-users`

Creates pre-configured test users for flow testing:

- Admin user (email: admin@example.com, verified)
- Customer user (email: customer@example.com, verified)
- Business owner (email: business@example.com, verified)
- Unverified customer (email: unverified@example.com)

All test users use their role name + "Password123!" as password.

## Auth Flow

**Script:** `auth-flow.ts`  
**Command:** `yarn flow:auth`

Tests the complete authentication flow:

- User registration with email verification
- Login attempts (blocked until verified)
- Email verification process
- Token operations (refresh, introspect)
- Password management
- Profile updates

### Key validations:

- Registration returns `emailSent` status
- Unverified emails cannot login
- OAuth 2.0 compliant responses

## Category Flow

**Script:** `category-flow.ts`  
**Command:** `yarn flow:category`

Tests complete category management across user roles:

### Admin Operations:

- Create parent categories
- Create subcategories (hierarchical)
- Update category details
- Toggle activation status
- Delete categories

### Public Operations:

- List categories (authenticated)
- Get category hierarchy
- Get category path (breadcrumb)

### Key validations:

- Hierarchical structure support
- Admin-only write operations
- Public read access (requires auth)
- Parent-child relationships

## Business Flow

**Script:** `business-flow.ts`  
**Command:** `yarn flow:business`

Tests complete business management lifecycle:

### Business Owner Operations:

- Register new business
- Update business profile
- Upload business logo
- View own business details

### Admin Operations:

- List all businesses
- Verify business
- Toggle business status (active/inactive)
- Delete business

### Public Operations:

- Search businesses by name
- Filter by status (active, verified)
- Paginated business listing

### Key validations:

- Business owner can manage own business
- Admin has full control over all businesses
- Public can browse active businesses
- Proper authorization checks
