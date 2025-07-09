#!/bin/bash
# scripts/deploy.sh
# ----------------------------------------------------------------------
# Simplified deployment script for Farewell/Howdy Unified Project
# Usage: ./scripts/deploy.sh
#
# This script handles deployment using Wrangler to Cloudflare Workers
# ----------------------------------------------------------------------

echo "Deploying Farewell/Howdy Unified Project..."

# Set the directory to the project root
cd "$(dirname "$0")/.." || exit 1

# Run build steps if needed
echo "Installing dependencies..."
npm install

# Deploy with wrangler
echo "Running deployment..."
npx wrangler deploy

echo "Deployment complete!"
