#!/bin/bash
# scripts/health-check.sh
# ----------------------------------------------------------------------
# Project health check script for Farewell/Howdy Unified Project
# Usage: ./scripts/health-check.sh
#
# Runs various checks to ensure the project is in a healthy state
# ----------------------------------------------------------------------

echo "Running Farewell/Howdy Unified Project health check..."

# Set the directory to the project root
cd "$(dirname "$0")/.." || exit 1

# Check npm dependencies
echo "Checking npm dependencies..."
npm ls --depth=0

# Check TypeScript compilation
echo -e "\nChecking TypeScript compilation..."
npx tsc --noEmit

# Check wrangler.jsonc configuration
echo -e "\nChecking wrangler.jsonc configuration..."
npx wrangler config verify

# Check for uncommitted changes
echo -e "\nChecking for uncommitted changes..."
git status --porcelain

# Check Cloudflare Workers status
echo -e "\nChecking Cloudflare Workers status..."
npx wrangler deployments list --format=pretty

echo -e "\nHealth check complete!"
