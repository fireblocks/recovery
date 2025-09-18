#!/bin/bash

# Build script for cross-platform Electron app builds
# Builds for Linux and Mac on both x64 and arm64 architectures

set -e

echo "Starting cross-platform build..."

# Build the dependencies first
echo "Building dependencies..."
yarn turbo run build --filter=!@fireblocks/e2e-tests --filter=!@fireblocks/recovery-utility

# Navigate to the Electron app directory
cd apps/recovery-utility

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist

# Build for all platforms and architectures in a single command
# This prevents electron-builder from cleaning between builds
echo "Building for all platforms and architectures..."
yarn nextron build --mac --linux --x64 --arm64

# Return to root directory
cd ../..

echo "Cross-platform build completed!"
echo "Build artifacts can be found in apps/recovery-utility/dist/"
ls -la apps/recovery-utility/dist/