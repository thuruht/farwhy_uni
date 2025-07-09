#!/bin/bash
# scripts/clean_blog_posts.sh
# ----------------------------------------------------------------------
# Script to clean blog post content and fix formatting
# Usage: ./scripts/clean_blog_posts.sh
#
# This is a shell wrapper for the clean_blog_posts.js script
# ----------------------------------------------------------------------

# Set the directory to the project root
cd "$(dirname "$0")/.." || exit 1

echo "Running blog post content cleaner..."
node scripts/clean_blog_posts.js

echo "Done"
