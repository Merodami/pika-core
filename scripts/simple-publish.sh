#!/bin/bash

# Super Simple GitHub Packages Publisher
# Assumes packages are already built (dist folders exist)

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/simple-publish.sh VERSION"
    echo "Example: ./scripts/simple-publish.sh 1.0.3"
    exit 1
fi

# Get script directory and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# GitHub token should be set as environment variable
# export NODE_AUTH_TOKEN="your-github-token-here"
NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN:-}"

# Check if GitHub token is available
if [ -z "$NODE_AUTH_TOKEN" ]; then
    echo "❌ Error: NODE_AUTH_TOKEN not set"
    exit 1
fi

echo "🔑 Using GitHub token: ${NODE_AUTH_TOKEN:0:10}..."

echo "📦 Publishing version $VERSION..."

# Build packages first
echo "🔨 Building packages..."
cd "$REPO_ROOT"
yarn nx run @pika/types:build
yarn nx run @pika/api:build

# Update versions
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$REPO_ROOT/packages/types/package.github.json"
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$REPO_ROOT/packages/api/package.github.json"
sed -i '' "s/@merodami\/pika-types\": \".*\"/@merodami\/pika-types\": \"^$VERSION\"/" "$REPO_ROOT/packages/api/package.github.json"

# Publish types
cd "$REPO_ROOT/packages/types"
cp package.github.json package.json
echo -e "@merodami:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=$NODE_AUTH_TOKEN" > .npmrc
npm publish
rm -f .npmrc
git checkout package.json

# Wait
sleep 15

# Publish API
cd "$REPO_ROOT/packages/api"
cp package.github.json package.json
echo -e "@merodami:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=$NODE_AUTH_TOKEN" > .npmrc
npm publish
rm -f .npmrc
git checkout package.json

echo "✅ Done! Published version $VERSION"