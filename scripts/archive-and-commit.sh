#!/bin/bash

# Script to archive files and commit them to the repository
# Created on July 9, 2025

if [ $# -lt 2 ]; then
  echo "Usage: $0 <file_or_folder_to_archive> <commit_message>"
  echo "Example: $0 src/old_feature.js \"Archive old feature implementation\""
  exit 1
fi

SOURCE_PATH="$1"
COMMIT_MESSAGE="$2"

# Get the base name of the file/directory
BASE_NAME=$(basename "$SOURCE_PATH")
# Get the directory part of the path
DIR_PATH=$(dirname "$SOURCE_PATH")
# Convert relative directory to one relative to project_archive
ARCHIVE_DIR_PATH=$(echo "$DIR_PATH" | sed 's/^\.\///')

# Create target directory in project_archive
TARGET_DIR="project_archive/$ARCHIVE_DIR_PATH"
mkdir -p "$TARGET_DIR"

echo "Archiving $SOURCE_PATH to $TARGET_DIR"

# Copy the file/directory to the archive
if [ -d "$SOURCE_PATH" ]; then
  # If it's a directory, copy recursively
  cp -r "$SOURCE_PATH" "$TARGET_DIR/"
  echo "Copied directory $SOURCE_PATH to $TARGET_DIR/"
else
  # If it's a file, copy it
  cp "$SOURCE_PATH" "$TARGET_DIR/"
  echo "Copied file $SOURCE_PATH to $TARGET_DIR/"
fi

# Remove the original
if [ -d "$SOURCE_PATH" ]; then
  rm -rf "$SOURCE_PATH"
  echo "Removed original directory $SOURCE_PATH"
else
  rm "$SOURCE_PATH"
  echo "Removed original file $SOURCE_PATH"
fi

# Force add the archived file/directory to git (overriding .gitignore)
git add -f "$TARGET_DIR/$BASE_NAME"
echo "Added to git: $TARGET_DIR/$BASE_NAME"

# Remove the original from git if it was tracked
git rm -r --cached "$SOURCE_PATH" 2>/dev/null

# Commit the changes
git commit -m "Archive: $COMMIT_MESSAGE" -m "Moved $SOURCE_PATH to $TARGET_DIR/$BASE_NAME" -m "This commit preserves the file in the project_archive directory for reference while removing it from active codebase."

echo "Archive and commit complete. Run 'git push origin main' to update the remote repository."
