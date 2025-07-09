#!/bin/bash
# scripts/dev.sh
# ----------------------------------------------------------------------
# Local development script for Farewell/Howdy Unified Project
# Usage: ./scripts/dev.sh
#
# Starts a local development server with hot reloading
# ----------------------------------------------------------------------

echo "Starting Farewell/Howdy Unified Project in development mode..."

# Set the directory to the project root
cd "$(dirname "$0")/.." || exit 1

# Run build steps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start local development server
echo "Starting local development server..."
npx wrangler dev --local

# This script will keep running until Ctrl+C is pressed
