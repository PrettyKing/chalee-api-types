#!/bin/bash

# Chalee API Types - Publish Script
# This script builds and publishes the package to the private Verdaccio registry

set -e  # Exit on any error

# 配置你的私有仓库地址
REGISTRY_URL="http://your-registry-host:4873/"
PACKAGE_NAME="chalee-api-types"

echo "🚀 Publishing $PACKAGE_NAME to private registry..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root."
    exit 1
fi

# 提示用户配置registry地址
if [[ "$REGISTRY_URL" == "http://your-registry-host:4873/" ]]; then
    echo "⚠️  请先在脚本中配置你的私有仓库地址！"
    echo "编辑 scripts/publish.sh 文件，将 REGISTRY_URL 设置为你的实际地址"
    echo "例如: REGISTRY_URL=\"http://192.168.1.100:4873/\""
    exit 1
fi

# Check if the private registry is accessible
echo "🔍 Checking registry accessibility..."
if ! curl -f "$REGISTRY_URL" > /dev/null 2>&1; then
    echo "❌ Error: Cannot reach registry at $REGISTRY_URL"
    echo "Please ensure Verdaccio is running and accessible."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linter..."
npm run lint

# Build the project
echo "🔨 Building project..."
npm run build

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found after build"
    exit 1
fi

# Make bin file executable
chmod +x bin/chalee-types.js

# Set registry for publishing
echo "🔧 Configuring registry..."
npm config set registry "$REGISTRY_URL"

# Check if user is logged in
echo "🔐 Checking authentication..."
if ! npm whoami --registry "$REGISTRY_URL" > /dev/null 2>&1; then
    echo "Please login to the registry first:"
    echo "npm login --registry $REGISTRY_URL"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Ask for version bump
echo "Select version bump type:"
echo "1) patch (x.x.X)"
echo "2) minor (x.X.x)"
echo "3) major (X.x.x)"
echo "4) use current version ($CURRENT_VERSION)"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🔢 Bumping patch version..."
        npm version patch --no-git-tag-version
        ;;
    2)
        echo "🔢 Bumping minor version..."
        npm version minor --no-git-tag-version
        ;;
    3)
        echo "🔢 Bumping major version..."
        npm version major --no-git-tag-version
        ;;
    4)
        echo "📋 Using current version: $CURRENT_VERSION"
        ;;
    *)
        echo "❌ Invalid choice. Using current version."
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo "📋 Publishing version: $NEW_VERSION"

# Publish to registry
echo "📤 Publishing to registry..."
npm publish --registry "$REGISTRY_URL"

if [ $? -eq 0 ]; then
    echo "✅ Successfully published $PACKAGE_NAME@$NEW_VERSION to $REGISTRY_URL"
    echo ""
    echo "🎉 Package published successfully!"
    echo "📦 Install with: npm install $PACKAGE_NAME --registry $REGISTRY_URL"
    echo "🌐 View at: $REGISTRY_URL-/web/detail/$PACKAGE_NAME"
else
    echo "❌ Failed to publish package"
    exit 1
fi

# Reset registry to default (optional)
echo "🔧 Resetting npm registry to default..."
npm config delete registry

echo "✨ Done!"