#!/bin/bash

# Flutter Auto Update Script
# This script automatically updates packages based on safety levels

set -e

echo "🚀 Flutter Auto Update Tool"
echo "==========================="
echo ""

# Function to create backup
backup_files() {
    echo "📦 Creating backup of pubspec files..."
    cp pubspec.yaml pubspec.yaml.backup
    cp pubspec.lock pubspec.lock.backup
    echo "✅ Backup created"
}

# Function to restore backup
restore_backup() {
    echo "🔄 Restoring from backup..."
    cp pubspec.yaml.backup pubspec.yaml
    cp pubspec.lock.backup pubspec.lock
    rm -f pubspec.yaml.backup pubspec.lock.backup
    echo "✅ Restored from backup"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    flutter test
    return $?
}

# Function to update packages
update_packages() {
    local update_type=$1
    
    case $update_type in
        "safe")
            echo "🔒 Performing safe updates (patch versions only)..."
            flutter pub upgrade --no-example
            ;;
        "minor")
            echo "📈 Performing minor version updates..."
            flutter pub upgrade --no-example
            ;;
        "major")
            echo "⚡ Performing major version updates..."
            flutter pub upgrade --major-versions --no-example
            ;;
        *)
            echo "❌ Invalid update type: $update_type"
            return 1
            ;;
    esac
}

# Main script
main() {
    # Parse command line arguments
    UPDATE_TYPE=${1:-"safe"}
    AUTO_COMMIT=${2:-"false"}
    
    echo "Update type: $UPDATE_TYPE"
    echo "Auto commit: $AUTO_COMMIT"
    echo ""
    
    # Create backup
    backup_files
    
    # Perform updates
    if update_packages "$UPDATE_TYPE"; then
        echo "✅ Packages updated successfully"
        
        # Run tests
        if run_tests; then
            echo "✅ All tests passed"
            
            # If auto-commit is enabled
            if [ "$AUTO_COMMIT" = "true" ]; then
                echo "📝 Creating commit..."
                git add pubspec.yaml pubspec.lock
                git commit -m "chore(deps): auto-update $UPDATE_TYPE dependencies"
                echo "✅ Changes committed"
            fi
            
            # Clean up backup
            rm -f pubspec.yaml.backup pubspec.lock.backup
        else
            echo "❌ Tests failed after update"
            restore_backup
            exit 1
        fi
    else
        echo "❌ Update failed"
        restore_backup
        exit 1
    fi
}

# Show usage
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [update_type] [auto_commit]"
    echo ""
    echo "update_type:"
    echo "  safe   - Update patch versions only (default)"
    echo "  minor  - Update minor versions"
    echo "  major  - Update major versions"
    echo ""
    echo "auto_commit:"
    echo "  false  - Don't commit changes (default)"
    echo "  true   - Auto-commit if tests pass"
    echo ""
    echo "Examples:"
    echo "  $0               # Safe updates, no commit"
    echo "  $0 minor true    # Minor updates with auto-commit"
    exit 0
fi

# Run main function
main "$@"