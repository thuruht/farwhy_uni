#!/bin/bash
# scripts/archive-legacy.sh
# ----------------------------------------------------------------------
# Legacy code archival script for Farewell/Howdy Unified Project
# Usage: ./scripts/archive-legacy.sh [--dry-run]
#
# This script moves obsolete files and directories to project_archive
# preserving directory structure.
# ----------------------------------------------------------------------

# Process command line arguments
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "Running in dry-run mode - no files will be moved"
fi

# Function to move files/directories with proper backup
move_to_archive() {
  local source=$1
  local name=$(basename "$source")
  local parent_dir=$(dirname "$source" | sed 's/^\.\///')
  
  if [[ "$parent_dir" == "." ]]; then
    parent_dir=""
  fi
  
  # Create target directory in project_archive
  local target_dir="project_archive"
  if [[ -n "$parent_dir" ]]; then
    target_dir="project_archive/$parent_dir"
    if [[ "$DRY_RUN" == "false" ]]; then
      mkdir -p "$target_dir"
    fi
  fi
  
  echo "Moving: $source → $target_dir/$name"
  
  if [[ "$DRY_RUN" == "false" ]]; then
    if [[ -d "$source" ]]; then
      # For directories, copy contents then remove
      cp -r "$source" "$target_dir/"
      rm -rf "$source"
    else
      # For files, move directly
      mv "$source" "$target_dir/"
    fi
  fi
}

echo "Legacy code archival process starting..."

# Create project_archive directory if it doesn't exist
if [[ "$DRY_RUN" == "false" ]]; then
  mkdir -p project_archive
fi

# Process specific directories we know should be archived
KNOWN_DIRECTORIES=(
  "ye_olde_docs"
  "ye_olde_src"
  "src/wot"
  "public/jss/crap_unused_old"
)

for dir in "${KNOWN_DIRECTORIES[@]}"; do
  if [[ -d "$dir" ]]; then
    echo "Found directory: $dir"
    move_to_archive "$dir"
  fi
done

# Find any ye_olde* or yeo* files that weren't in the known directories
echo "Searching for ye_olde* and yeo* files..."
LEGACY_FILES=$(find . -path "./node_modules" -prune -o -path "./project_archive" -prune -o \( -name "ye_olde*" -o -name "yeo*" \) -type f -print)

if [[ -n "$LEGACY_FILES" ]]; then
  echo "Found legacy files:"
  echo "$LEGACY_FILES" | while read file; do
    move_to_archive "$file"
  done
else
  echo "No additional legacy files found"
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run complete - no files were actually moved"
else
  echo "Archive process complete - all legacy files moved to project_archive/"
fi
