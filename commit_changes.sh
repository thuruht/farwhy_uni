#!/bin/bash

# Archive any documentation files if they exist
mkdir -p project_archive/docs 2>/dev/null
for file in ADMIN_UI_IMPROVEMENTS.md API_CONSISTENCY_FIXES_SUMMARY.md API_DEVELOPMENT_WORKFLOW.md API_ENDPOINTS_DOCUMENTATION.md ARCHITECTURAL_INSIGHTS.md BLOG_NEWS_IMPLEMENTATION.md BLOG_SYSTEM_DOCUMENTATION.md COMMIT_MESSAGE*.txt CONSOLIDATED_DOCUMENTATION.md CRITICAL_SYSTEM_DOCS.md DOCUMENTATION_AUDIT.md DOCUMENTATION_CONSOLIDATION_COMPLETE.md DOCUMENTATION_UPDATE_SUMMARY.md FEATURED_VIDEOS_UPDATE.md ICS_CALENDAR_IMPLEMENTATION.md MENU_MANAGEMENT_SYSTEM.md PROGRESS_REPORT.md PROJECT_CHECKLIST_AND_ROADMAP.md RECENT_IMPLEMENTATIONS.md SECURITY_FIXES_JUNE_2025.md TECHNICAL_MAP.md implementation-plan.md original_more.htm wrangler.jsonc.new; do
  if [ -f "$file" ]; then
    echo "Moving $file to project_archive/docs/"
    mv "$file" project_archive/docs/
  fi
done

# Add modified files
git add CHANGELOG.md
git add public/admin.html
git add public/img/fwcal.png
git add public/img/hycal.png
git add public/jss/admin-unified.js

# Add any changes to .gitignore
git add .gitignore

# Create commit with message
git commit -m "Add Recent Activity to Admin Dashboard and Update UI" -m "- Added a new Recent Activity section to the admin dashboard" -m "  - Shows the 5 most recent events and blog posts with timestamps" -m "  - Provides at-a-glance visibility into recent content changes" -m "  - Includes relative time indicators (e.g., \"2 hours ago\")" -m "" -m "- Updated calendar icons for both venues with improved resolution" -m "  - Higher quality images for Farewell and Howdy calendar icons" -m "  - Consistent styling between venue calendar images" -m "" -m "- Improved admin interface layout" -m "  - Combined and streamlined admin headers for a more compact design" -m "  - Improved header styling with better space utilization" -m "  - Updated navigation system to properly set section indicators" -m "" -m "- Updated documentation" -m "  - Added entries to CHANGELOG.md for the recent activity feature" -m "  - Updated help documentation to reference dropdown navigation (not sidebar)" -m "  - Added troubleshooting note about duplicate events issue" -m "  - Added event duplication to known issues in the changelog" -m "" -m "This commit brings the local repository in sync with what's currently deployed."

# Push to remote repository
# Uncomment the next line when ready to push
# git push origin main
