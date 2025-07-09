#!/bin/bash
# scripts/commit-changes.sh
# ----------------------------------------------------------------------
# Standardized commit script for Farewell/Howdy Unified Project
# Usage: ./scripts/commit-changes.sh [commit_message] [optional_description]
#
# This script:
# 1. Archives any documentation files to project_archive/docs
# 2. Adds modified files to git staging
# 3. Creates a commit with a structured message
# 4. Pushes to the remote repository (if uncommented)
# ----------------------------------------------------------------------

# Default commit message if none provided
COMMIT_MESSAGE=${1:-"Update project files"}
DESCRIPTION=${2:-"General code maintenance and updates"}

# Archive any documentation files if they exist
mkdir -p project_archive/docs 2>/dev/null
for file in ADMIN_UI_IMPROVEMENTS.md API_CONSISTENCY_FIXES_SUMMARY.md \
            API_DEVELOPMENT_WORKFLOW.md API_ENDPOINTS_DOCUMENTATION.md \
            ARCHITECTURAL_INSIGHTS.md BLOG_NEWS_IMPLEMENTATION.md \
            BLOG_SYSTEM_DOCUMENTATION.md COMMIT_MESSAGE*.txt \
            CONSOLIDATED_DOCUMENTATION.md CRITICAL_SYSTEM_DOCS.md \
            DOCUMENTATION_AUDIT.md DOCUMENTATION_CONSOLIDATION_COMPLETE.md \
            DOCUMENTATION_UPDATE_SUMMARY.md FEATURED_VIDEOS_UPDATE.md \
            ICS_CALENDAR_IMPLEMENTATION.md MENU_MANAGEMENT_SYSTEM.md \
            PROGRESS_REPORT.md PROJECT_CHECKLIST_AND_ROADMAP.md \
            RECENT_IMPLEMENTATIONS.md SECURITY_FIXES_JUNE_2025.md \
            TECHNICAL_MAP.md implementation-plan.md original_more.htm \
            wrangler.jsonc.new; do
  if [ -f "$file" ]; then
    echo "Moving $file to project_archive/docs/"
    mv "$file" project_archive/docs/
  fi
done

# Add commonly modified files
git add CHANGELOG.md README.md SYSTEM_DOCUMENTATION.md API_REFERENCE.md
git add public/
git add src/
git add scripts/

# Add any changes to .gitignore
git add .gitignore

# Show which files will be committed
echo "Files staged for commit:"
git diff --name-only --cached

# Confirm before committing
read -p "Proceed with commit? [y/N] " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
  echo "Commit aborted."
  exit 0
fi

# Create commit with message
git commit -m "$COMMIT_MESSAGE" -m "$DESCRIPTION"

# Push to remote repository - uncomment when ready to push
# read -p "Push to remote repository? [y/N] " push_confirm
# if [[ $push_confirm == [yY] || $push_confirm == [yY][eE][sS] ]]; then
#   git push origin main
# fi
