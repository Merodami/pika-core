#!/bin/bash
set -e

echo "🔍 Pika Deployment Validation"
echo "==============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Function to check command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        FAILED=1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
    else
        echo -e "${RED}✗${NC} $1 is missing"
        FAILED=1
    fi
}

# Function to check environment variable
check_env() {
    if [ -z "${!1}" ]; then
        echo -e "${YELLOW}⚠${NC}  $1 is not set (required for deployment)"
    else
        echo -e "${GREEN}✓${NC} $1 is set"
    fi
}

echo "📋 Checking prerequisites..."
echo ""

# Check required commands
check_command "node"
check_command "yarn"
check_command "vercel"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 22 ]; then
    echo -e "${GREEN}✓${NC} Node.js version is 22+"
else
    echo -e "${RED}✗${NC} Node.js version must be 22+ (found v$NODE_VERSION)"
    FAILED=1
fi

# Check Yarn version
YARN_VERSION=$(yarn --version | cut -d'.' -f1)
if [ "$YARN_VERSION" -eq 4 ]; then
    echo -e "${GREEN}✓${NC} Yarn version is 4.x"
else
    echo -e "${RED}✗${NC} Yarn version must be 4.x (found $YARN_VERSION)"
    FAILED=1
fi

echo ""
echo "📁 Checking deployment files..."
echo ""

# Check critical files
check_file "vercel.json"
check_file "api/index.js"
check_file "packages/deployment/package.json"
check_file ".env.vercel.example"
check_file "DEPLOYMENT.md"

echo ""
echo "🔧 Checking build setup..."
echo ""

# Check if build:vercel script exists
if grep -q '"build:vercel"' package.json; then
    echo -e "${GREEN}✓${NC} build:vercel script exists"
else
    echo -e "${RED}✗${NC} build:vercel script missing in package.json"
    FAILED=1
fi

# Test build process
echo ""
echo "🏗️  Testing build process..."
echo ""

if yarn build:vercel > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build completed successfully"
    
    # Check critical build outputs
    if [ -d "packages/deployment/dist" ]; then
        echo -e "${GREEN}✓${NC} Deployment package built"
    else
        echo -e "${RED}✗${NC} Deployment package not built"
        FAILED=1
    fi
else
    echo -e "${RED}✗${NC} Build failed"
    FAILED=1
fi

echo ""
echo "🌍 Checking environment variables..."
echo ""

# Check required environment variables
check_env "DATABASE_URL"
check_env "REDIS_URL"
check_env "JWT_SECRET"
check_env "JWT_REFRESH_SECRET"
check_env "INTERNAL_API_KEY"

echo ""
echo "🚀 Testing Vercel configuration..."
echo ""

# Validate vercel.json
if node -e "
const config = require('./vercel.json');
if (!config.functions || !config.functions['api/index.js']) {
    console.error('Invalid vercel.json: missing function configuration');
    process.exit(1);
}
if (!config.buildCommand || !config.buildCommand.includes('build:vercel')) {
    console.error('Invalid vercel.json: incorrect build command');
    process.exit(1);
}
console.log('vercel.json is valid');
" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} vercel.json is valid"
else
    echo -e "${RED}✗${NC} vercel.json is invalid"
    FAILED=1
fi

# Test Vercel build
echo ""
echo "🔨 Testing Vercel build..."
echo ""

if VERCEL=1 vercel build --prod > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Vercel build successful"
    
    if [ -d ".vercel/output" ]; then
        echo -e "${GREEN}✓${NC} Vercel output directory created"
    else
        echo -e "${RED}✗${NC} Vercel output directory missing"
        FAILED=1
    fi
else
    echo -e "${YELLOW}⚠${NC}  Vercel build failed (may need environment variables)"
fi

echo ""
echo "📊 Summary"
echo "========="
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Run 'vercel' to deploy"
    echo "3. Run database migrations after deployment"
    exit 0
else
    echo -e "${RED}❌ Validation failed! Please fix the issues above.${NC}"
    exit 1
fi