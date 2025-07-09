#!/bin/bash

# Add modified files
git add CHANGELOG.md
git add public/admin.html
git add public/img/fwcal.png
git add public/img/hycal.png
git add public/jss/admin-unified.js

# Create commit with message
git commit -m "Add Recent Activity to Admin Dashboard and Update UI" -m "- Added a new Recent Activity section to the admin dashboard" -m "  - Shows the 5 most recent events and blog posts with timestamps" -m "  - Provides at-a-glance visibility into recent content changes" -m "  - Includes relative time indicators (e.g., \"2 hours ago\")" -m "" -m "- Updated calendar icons for both venues with improved resolution" -m "  - Higher quality images for Farewell and Howdy calendar icons" -m "  - Consistent styling between venue calendar images" -m "" -m "- Improved admin interface layout" -m "  - Combined and streamlined admin headers for a more compact design" -m "  - Improved header styling with better space utilization" -m "  - Updated navigation system to properly set section indicators" -m "" -m "- Updated documentation" -m "  - Added entries to CHANGELOG.md for the recent activity feature" -m "  - Updated help documentation to reference dropdown navigation (not sidebar)" -m "  - Added troubleshooting note about duplicate events issue" -m "  - Added event duplication to known issues in the changelog" -m "" -m "This commit brings the local repository in sync with what's currently deployed."

# Push to remote repository
# Uncomment the next line when ready to push
# git push origin main
