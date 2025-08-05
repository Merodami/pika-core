#!/bin/bash
set -e

echo "🧪 Testing Vercel Build Process Locally"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

echo -e "${BLUE}📋 Step 1: Clean environment${NC}"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .vercel 2>/dev/null || true
rm -rf api/.prisma 2>/dev/null || true
find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

echo -e "${GREEN}✓${NC} Environment cleaned"
echo ""

echo -e "${BLUE}📋 Step 2: Simulate Vercel's Node/Yarn environment${NC}"
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "📍 Current Node.js version: v$(node -v)"

if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠${NC}  Warning: Vercel uses Node.js 20+ by default"
fi

# Test Yarn workspace protocol compatibility
echo ""
echo "🔍 Testing Yarn workspace compatibility..."

# Simulate what Vercel does - use system yarn (v1) first
if command -v yarn1 &> /dev/null; then
    echo "Testing with Yarn 1.x (Vercel default):"
    if yarn1 install --frozen-lockfile 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Yarn 1.x can install dependencies"
    else
        echo -e "${RED}✗${NC} Yarn 1.x fails with workspace: protocol"
        FAILED=1
    fi
fi

# Test with our Yarn 4
echo "Testing with Yarn 4.x (our version):"
if yarn install --immutable --silent; then
    echo -e "${GREEN}✓${NC} Yarn 4.x installs dependencies successfully"
else
    echo -e "${RED}✗${NC} Yarn 4.x installation failed"
    FAILED=1
fi

echo ""
echo -e "${BLUE}📋 Step 3: Test Vercel build command simulation${NC}"
echo ""

# Simulate the exact build command from vercel.json
echo "🔨 Running build command..."
echo "Command: yarn build:vercel"

if yarn build:vercel; then
    echo -e "${GREEN}✓${NC} Build completed successfully"
else
    echo -e "${RED}✗${NC} Build failed"
    FAILED=1
fi

# Check if deployment package exists
if [ -d "packages/deployment/dist" ]; then
    echo -e "${GREEN}✓${NC} Deployment package built"
else
    echo -e "${RED}✗${NC} Deployment package missing"
    FAILED=1
fi

echo ""
echo -e "${BLUE}📋 Step 4: Test Vercel CLI build${NC}"
echo ""

# Set environment variables for testing
export VERCEL=1
export VERCEL_ENV=preview
export NODE_ENV=production

echo "🚀 Running 'vercel build' (simulates Vercel's build process)..."

if vercel build --yes 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Vercel build successful"
    
    # Check output directory
    if [ -d ".vercel/output" ]; then
        echo -e "${GREEN}✓${NC} Vercel output directory created"
        echo "📊 Output contents:"
        ls -la .vercel/output/
    else
        echo -e "${RED}✗${NC} Vercel output directory missing"
        FAILED=1
    fi
else
    echo -e "${RED}✗${NC} Vercel build failed"
    FAILED=1
fi

echo ""
echo -e "${BLUE}📋 Step 5: Test function bundling${NC}"
echo ""

# Check if the function is properly bundled
if [ -f ".vercel/output/functions/api/index.js.func/index.js" ]; then
    echo -e "${GREEN}✓${NC} Serverless function bundled correctly"
    
    # Check bundle size
    BUNDLE_SIZE=$(du -sh .vercel/output/functions/api/index.js.func/ | cut -f1)
    echo "📦 Function bundle size: $BUNDLE_SIZE"
    
    # Check if Prisma client is included
    if find .vercel/output/functions/api/index.js.func/ -name "*prisma*" -type d | head -1 > /dev/null; then
        echo -e "${GREEN}✓${NC} Prisma client included in bundle"
    else
        echo -e "${YELLOW}⚠${NC}  Prisma client might be missing"
    fi
else
    echo -e "${RED}✗${NC} Serverless function not bundled"
    FAILED=1
fi

echo ""
echo -e "${BLUE}📋 Step 6: Test local dev server${NC}"
echo ""

echo "🌐 Starting Vercel dev server (will test for 10 seconds)..."

# Start vercel dev in background
vercel dev --listen 3001 > /dev/null 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Test if server responds
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Local dev server responding"
else
    echo -e "${RED}✗${NC} Local dev server not responding"
    FAILED=1
fi

# Cleanup
kill $DEV_PID 2>/dev/null || true
sleep 2

echo ""
echo -e "${BLUE}📊 Final Results${NC}"
echo "================="
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment should succeed.${NC}"
    echo ""
    echo "Ready for deployment:"
    echo "1. 'vercel' - Deploy to preview"
    echo "2. 'vercel --prod' - Deploy to production"
    echo ""
else
    echo -e "${RED}❌ Tests failed! Fix issues before deploying.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Update vercel.json to use Yarn 4"
    echo "2. Check workspace dependencies"
    echo "3. Verify build command works locally"
    echo ""
fi

exit $FAILED