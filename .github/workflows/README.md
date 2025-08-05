# GitHub Actions Workflows

## Structure

```
.github/
├── workflows/           # Workflow definitions
│   ├── ci.yml          # Main CI pipeline
│   ├── pr-checks.yml   # Optimized PR checks
│   └── dependabot.yml  # Dependency updates
├── actions/            # Reusable actions
│   └── cache-setup/    # Shared cache configuration
└── env/                # Environment files
    └── .env.ci         # CI environment variables
```

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:** Push to `main` or `dev`, Pull requests

**Jobs:**

- `validate`: Quick linting and format checks
- `test`: Full test suite with services
- `ci-complete`: Summary for branch protection

**Features:**

- Split into fast validation and comprehensive testing
- Uses environment file for cleaner configuration
- Parallel execution where possible

### 2. PR Checks (`pr-checks.yml`)

**Triggers:** Pull requests only

**Jobs:**

- `changes`: Detects which parts changed
- `lint-changed`: Lints only modified files
- `test-affected`: Tests only affected projects

**Features:**

- Smart change detection
- Minimal testing for faster feedback
- Skips unchanged code

### 3. Dependabot (`dependabot.yml`)

Automated dependency updates with smart grouping.

## Environment Variables

All CI environment variables are stored in `.github/env/.env.ci` for:

- Cleaner workflow files
- Easier maintenance
- Single source of truth

## Reusable Components

### Cache Setup Action

Located at `.github/actions/cache-setup/action.yml`

Handles:

- Yarn cache
- NX cache
- Prisma engine cache

Usage:

```yaml
- name: Setup caches
  uses: ./.github/actions/cache-setup
```

## Local Development

### Testing Workflows Locally

```bash
# Install act
brew install act

# Test CI workflow
act push -W .github/workflows/ci.yml --env-file .github/env/.env.ci

# Test PR workflow
act pull_request -W .github/workflows/pr-checks.yml
```

### Environment Setup

1. **Local Development**: Use `.env` or `.env.local`
2. **Local Tests**: Use `.env.test`
3. **CI/CD**: Uses `.github/env/.env.ci`

## Adding New Workflows

1. Create workflow file in `.github/workflows/`
2. Use the cache-setup action for consistency
3. Load environment with: `cat .github/env/.env.ci >> $GITHUB_ENV`
4. Follow the established patterns

## Branch Protection

Configure in Settings → Branches:

**For `main`:**

- Require status check: `ci-complete`
- Require PR reviews
- Dismiss stale reviews
- Require up-to-date branches

**For `dev`:**

- Require status check: `ci-complete`
- No review required

## Monitoring

```markdown
![CI](https://github.com/YOUR_ORG/pika/actions/workflows/ci.yml/badge.svg)
![PRs](https://github.com/YOUR_ORG/pikactions/workflows/pr-checks.yml/badge.svg)
```

## Future Enhancements

When ready to add:

- [ ] Deployment workflows (Vercel → AWS)
- [ ] Release automation
- [ ] Performance benchmarking
- [ ] Security scanning (CodeQL)
- [ ] E2E testing workflow
