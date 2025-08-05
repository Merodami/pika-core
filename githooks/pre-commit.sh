#!/bin/bash

set -e

echo "🔍 Checking affected packages..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No staged files found"
    exit 0
fi

# Show first few changed files
echo "📝 Modified files:"
echo "$STAGED_FILES" | head -5
if [ $(echo "$STAGED_FILES" | wc -l) -gt 5 ]; then
    echo "... and $(( $(echo "$STAGED_FILES" | wc -l) - 5 )) more files"
fi

# Check if we have any shared packages or core infrastructure changes
SHARED_PACKAGES_CHANGED=false
SHARED_PATTERNS=(
    "packages/shared/"
    "packages/types/"
    "packages/environment/"
    "packages/database/"
    "packages/redis/"
    "packages/http/"
    "packages/auth/"
    "packages/api/"
    "packages/crypto/"
    "packages/tests/"
    "nx.json"
    "package.json"
    "yarn.lock"
    "tsconfig"
    ".env"
    "vitest.config"
    "eslint.config"
    "prettier.config"
)

echo "🔎 Checking for shared package changes..."
for pattern in "${SHARED_PATTERNS[@]}"; do
    if echo "$STAGED_FILES" | grep -q "$pattern"; then
        SHARED_PACKAGES_CHANGED=true
        echo "🔗 Shared dependency changed: $pattern"
    fi
done

# Only check for test files if not already running all tests
TEST_FILES_CHANGED=false
if [ "$SHARED_PACKAGES_CHANGED" = false ]; then
    if echo "$STAGED_FILES" | grep -q "\.test\.\|\.spec\.\|/__tests__/\|/test/"; then
        TEST_FILES_CHANGED=true
        echo "🧪 Test files modified"
    fi
fi

# Determine test strategy
if [ "$SHARED_PACKAGES_CHANGED" = true ]; then
    echo "🌐 Running ALL tests (shared packages/config changed)"
    echo "This ensures all services work with the shared changes..."
    if ! yarn test --run --reporter=basic; then
        echo "❌ Tests failed"
        exit 1
    fi
else
    echo "🎯 Running tests for affected packages only"
    echo "Analyzing staged files to determine which packages to test..."
    
    # Extract unique packages from staged files
    PACKAGES_TO_TEST=()
    for file in $STAGED_FILES; do
        if [[ $file == packages/services/* ]]; then
            # Extract service name (e.g., packages/services/voucher/... -> voucher)
            package_name=$(echo "$file" | cut -d'/' -f3)
            service_project="@pika/$package_name"
            
            # Add to array if not already present
            if [[ ! " ${PACKAGES_TO_TEST[@]} " =~ " ${service_project} " ]]; then
                PACKAGES_TO_TEST+=("$service_project")
            fi
        elif [[ $file == packages/* ]]; then
            # Extract package name (e.g., packages/shared/... -> shared)
            package_name=$(echo "$file" | cut -d'/' -f2)
            package_project="@pika/$package_name"
            
            # Add to array if not already present  
            if [[ ! " ${PACKAGES_TO_TEST[@]} " =~ " ${package_project} " ]]; then
                PACKAGES_TO_TEST+=("$package_project")
            fi
        fi
    done
    
    if [ ${#PACKAGES_TO_TEST[@]} -eq 0 ]; then
        echo "✅ No testable packages found in staged files"
        exit 0
    fi
    
    echo "📦 Testing packages: ${PACKAGES_TO_TEST[*]}"
    
    # Run tests for each identified package
    for package in "${PACKAGES_TO_TEST[@]}"; do
        echo "🧪 Testing $package..."
        
        # Check if package has test files first
        package_name=$(echo $package | sed 's/@pika\///')
        
        # Check if it's a service (needs services/ prefix)
        if [[ -d "packages/services/$package_name" ]]; then
            package_path="packages/services/$package_name"
        else
            package_path="packages/$package_name"
        fi
        
        if find "$package_path" -name "*.test.*" -o -name "*.spec.*" | grep -q .; then
            echo "   Found test files, running tests..."
            if ! yarn test "$package_path" --reporter=basic; then
                echo "❌ Tests failed for $package"
                exit 1
            fi
        else
            echo "   No test files found, skipping tests for $package"
        fi
    done
fi

echo "✅ All relevant tests passed!"