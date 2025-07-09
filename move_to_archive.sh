#!/bin/bash

# Script to move ye_olde* directories, crap_unused_old, and other obsolete files to project_archive
# Created on July 8, 2025

echo "Moving obsolete directories and files to project_archive..."

# Create project_archive directory if it doesn't exist
mkdir -p project_archive

# Move ye_olde_docs to project_archive
if [ -d "ye_olde_docs" ]; then
  echo "Moving ye_olde_docs/ to project_archive/"
  mkdir -p project_archive/ye_olde_docs
  cp -r ye_olde_docs/* project_archive/ye_olde_docs/
  rm -rf ye_olde_docs
fi

# Move ye_olde_src to project_archive
if [ -d "ye_olde_src" ]; then
  echo "Moving ye_olde_src/ to project_archive/"
  mkdir -p project_archive/ye_olde_src
  cp -r ye_olde_src/* project_archive/ye_olde_src/
  rm -rf ye_olde_src
fi

# Find and move any other ye_olde* files
find . -path "./node_modules" -prune -o -path "./project_archive" -prune -o -name "ye_olde*" -type f -print | while read file; do
  echo "Moving $file to project_archive/"
  dir=$(dirname "$file" | sed 's/^\.\///')
  mkdir -p "project_archive/$dir"
  cp "$file" "project_archive/$dir/"
  rm "$file"
done

# Find and move any yeo* files
find . -path "./node_modules" -prune -o -path "./project_archive" -prune -o -name "yeo*" -type f -print | while read file; do
  echo "Moving $file to project_archive/"
  dir=$(dirname "$file" | sed 's/^\.\///')
  mkdir -p "project_archive/$dir"
  cp "$file" "project_archive/$dir/"
  rm "$file"
done

# Check if src/wot directory is being used
if [ -d "src/wot" ]; then
  echo "Found src/wot/ directory"
  echo "Moving src/wot/ to project_archive/"
  mkdir -p project_archive/src
  cp -r src/wot project_archive/src/
  rm -rf src/wot
fi

# Move crap_unused_old directory
if [ -d "public/jss/crap_unused_old" ]; then
  echo "Found public/jss/crap_unused_old/ directory"
  echo "Moving crap_unused_old/ to project_archive/"
  mkdir -p project_archive/public/jss
  cp -r public/jss/crap_unused_old project_archive/public/jss/
  rm -rf public/jss/crap_unused_old
fi

echo "Update complete. Files moved to project_archive/"
