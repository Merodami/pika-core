#!/bin/bash

# Pika Flutter App Validation Script
echo "🧪 Testing Pika Flutter App Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404\|401"; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "pubspec.yaml" ]; then
    echo -e "${RED}❌ Please run this script from the Flutter app directory${NC}"
    exit 1
fi

echo "📂 Current directory: $(pwd)"

# 1. Check Flutter installation
echo -e "\n${YELLOW}🔍 Checking Flutter installation...${NC}"
if command -v flutter &> /dev/null; then
    echo -e "${GREEN}✅ Flutter is installed${NC}"
    flutter --version
else
    echo -e "${RED}❌ Flutter is not installed${NC}"
    exit 1
fi

# 2. Check backend services
echo -e "\n${YELLOW}🔍 Checking backend services...${NC}"
check_service "http://localhost:8000/health" "API Gateway (8000)"
check_service "http://localhost:4000/health" "Category Service (4000)"
check_service "http://localhost:4002/health" "Service Service (4002)"
check_service "http://localhost:4003/health" "User Service (4003)"
check_service "http://localhost:4004/health" "Notification Service (4004)"
check_service "http://localhost:4005/health" "Messaging Service (4005)"

# 3. Check Firebase emulators
echo -e "\n${YELLOW}🔍 Checking Firebase emulators...${NC}"
check_service "http://localhost:9099" "Firebase Auth Emulator (9099)"
check_service "http://localhost:8080" "Firebase Firestore Emulator (8080)"
check_service "http://localhost:4000" "Firebase Emulator UI (4000)"

# 4. Test API endpoints
echo -e "\n${YELLOW}🔍 Testing API endpoints...${NC}"

# Test categories endpoint
if curl -s "http://localhost:8000/api/v1/categories" | grep -q "data\|error"; then
    echo -e "${GREEN}✅ Categories API is responding${NC}"
else
    echo -e "${RED}❌ Categories API is not responding${NC}"
fi

# Test auth endpoint
if curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid","password":"invalid"}' | grep -q "error\|message"; then
    echo -e "${GREEN}✅ Auth API is responding${NC}"
else
    echo -e "${RED}❌ Auth API is not responding${NC}"
fi

# 5. Check Flutter dependencies
echo -e "\n${YELLOW}🔍 Checking Flutter dependencies...${NC}"
if flutter pub deps | grep -q "riverpod\|firebase\|dio"; then
    echo -e "${GREEN}✅ Flutter dependencies are installed${NC}"
else
    echo -e "${YELLOW}⚠️  Running 'flutter pub get'...${NC}"
    flutter pub get
fi

# 6. Run Flutter analyze
echo -e "\n${YELLOW}🔍 Running Flutter analyze...${NC}"
if flutter analyze --no-fatal-infos | grep -q "No issues found"; then
    echo -e "${GREEN}✅ No analysis issues found${NC}"
else
    echo -e "${YELLOW}⚠️  Some analysis issues found. Check output above.${NC}"
fi

# 7. Check if build_runner is needed
echo -e "\n${YELLOW}🔍 Checking code generation...${NC}"
if [ -f "lib/core/models/user_model.g.dart" ]; then
    echo -e "${GREEN}✅ Generated files exist${NC}"
else
    echo -e "${YELLOW}⚠️  Running code generation...${NC}"
    flutter pub run build_runner build --delete-conflicting-outputs
fi

# 8. Test Firebase connection
echo -e "\n${YELLOW}🔍 Testing Firebase emulator connection...${NC}"
if curl -s "http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/pika-demo/accounts:lookup" \
    -H "Content-Type: application/json" \
    -d '{}' | grep -q "error\|users"; then
    echo -e "${GREEN}✅ Firebase Auth emulator is accessible${NC}"
else
    echo -e "${RED}❌ Firebase Auth emulator is not accessible${NC}"
fi

# 9. Check environment configuration
echo -e "\n${YELLOW}🔍 Checking environment configuration...${NC}"
if [ -f "../../../.env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check critical environment variables
    if grep -q "API_GATEWAY_PORT=8000" "../../../.env"; then
        echo -e "${GREEN}✅ API Gateway port configured correctly${NC}"
    else
        echo -e "${YELLOW}⚠️  API Gateway port not set to 8000${NC}"
    fi
    
    if grep -q "FIREBASE_EMULATOR=true" "../../../.env"; then
        echo -e "${GREEN}✅ Firebase emulator enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Firebase emulator not enabled${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
fi

# 10. Summary and next steps
echo -e "\n${YELLOW}📋 Validation Summary:${NC}"
echo "To start development:"
echo "1. Make sure all backend services are running: yarn local"
echo "2. Start Firebase emulators: firebase emulators:start"
echo "3. Run Flutter app: flutter run -d chrome"
echo ""
echo "For testing with real devices:"
echo "- Android: flutter run -d android"
echo "- iOS: flutter run -d ios"
echo ""
echo "To run tests:"
echo "- Unit tests: flutter test"
echo "- Integration tests: flutter test integration_test"

echo -e "\n${GREEN}🎉 Validation complete!${NC}"