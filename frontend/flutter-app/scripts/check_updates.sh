#!/bin/bash

# Flutter Package Update Checker
# This script checks for outdated packages and generates a report

echo "🔍 Checking Flutter package updates..."
echo "======================================="
echo ""

# Create reports directory if it doesn't exist
mkdir -p reports

# Generate timestamp for the report
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="reports/package_updates_$TIMESTAMP.txt"

# Check outdated packages and save to report
echo "📦 Running flutter pub outdated..."
flutter pub outdated > "$REPORT_FILE" 2>&1

# Also check for security vulnerabilities with pub audit
echo "🔒 Running security audit..."
echo -e "\n\n=== SECURITY AUDIT ===" >> "$REPORT_FILE"
dart pub audit >> "$REPORT_FILE" 2>&1

# Display summary
echo ""
echo "✅ Update check complete!"
echo "📄 Full report saved to: $REPORT_FILE"
echo ""

# Show summary of outdated packages
echo "📊 Summary of outdated packages:"
echo "--------------------------------"
grep -E "^\*|^direct dependencies:|^dev_dependencies:" "$REPORT_FILE" || echo "All packages are up to date!"

# Check for major version updates
echo ""
echo "⚠️  Major version updates available:"
echo "-----------------------------------"
grep -E "freezed|analyzer|json_serializable" "$REPORT_FILE" | grep -E "\*[0-9]+\.[0-9]+\.[0-9]+" || echo "No major updates found"

# Optional: Create a JSON report for CI/CD integration
echo ""
echo "💡 Tip: Run 'flutter pub upgrade' to update minor versions"
echo "       Run 'flutter pub upgrade --major-versions' to update major versions"