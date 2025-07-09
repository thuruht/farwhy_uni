# CSS and JavaScript File Inventory

This document provides an overview of CSS and JavaScript files in the project, their usage status, and recommendations.

## CSS Files

| File | Status | Used In | Notes |
|------|--------|---------|-------|
| admin-button-fix.css | ❓ Unused | - | Not linked in any HTML file |
| admin-header.css | ✅ Active | admin.html | Styling for admin header with chunky font and text-shadow |
| admin-help.css | ✅ Active | admin.html | Admin help panel styling |
| ccssss.css | ✅ Active | index.html, events.html, admin.html, about.htm | Main site-wide styling |
| events-calendar-button.css | ✅ Active | index.html, events.html | Styling for event calendar button |
| events-modal.css | ✅ Active | index.html, events.html | Styling for event modals |
| events-page.css | ❓ Unused | - | Not linked in any HTML file, but may be needed for events.html |
| featured-videos.css | ✅ Active | admin.html | Styling for featured videos management |
| fleeting-journey.css | ✅ Active | admin.html, (commented out in index.html) | Used in admin, commented out in index |
| image-upload.css | ✅ Active | admin.html | Styling for image uploads in admin |
| literary-admin.css | ✅ Active | admin.html | Admin interface styling |
| menu-management.css | ✅ Active | admin.html | Menu management interface styling |
| quill.snow.css | ✅ Active | admin.html | Styling for Quill rich text editor |
| unified-buttons.css | ✅ Active | admin.html | Consistent button styling |

## JavaScript Files

| File | Status | Used In | Notes |
|------|--------|---------|-------|
| admin-patch-recent.js | ❓ Unused | - | Not linked in any HTML file |
| admin-patch.js | ✅ Active | admin.html | Admin interface patches |
| admin-patches.js | ❓ Unused | - | Not linked in any HTML file |
| admin-unified.js | ✅ Active | admin.html | Main admin functionality |
| admin-unified.js.bak | 📝 Backup | - | Backup file, not in use |
| ansik.js | ✅ Active | index.html, about.htm | Used in public-facing pages |
| dash.js | ❓ Unused | - | Not linked in any HTML file |
| event-form-patch.js | ✅ Active | admin.html | Event form functionality patches |
| events-modal-calendar.js | ✅ Active | index.html, events.html | Adds calendar download button to event modals |
| events-modal.js | ✅ Active | index.html, events.html | Event modal functionality |
| events-modal.js.bak | 📝 Backup | - | Backup file, not in use |
| events-modal.js.bak2 | 📝 Backup | - | Backup file, not in use |
| events-modal.js.old | 📝 Backup | - | Backup file, not in use |
| events-page.js | ❓ Unused | - | Not linked in events.html but may be needed |
| featured-videos-manager.js | ✅ Active | admin.html | Featured videos management |
| gsap-public/* | ✅ Active | index.html, events.html, about.htm | GSAP animation library |
| ics-generator.js | ✅ Active | index.html | Generates calendar files |
| ifrevl.js | ✅ Active | index.html | Handles URL generation and link updating for calendar features |
| menu-management.js | ✅ Active | admin.html | Menu management functionality |
| quill.min.js | ✅ Active | admin.html | Quill rich text editor |
| script.js | ✅ Active | index.html, about.htm | Main site functionality |

## Recommendations

1. **Integrate events-modal-calendar.js**: This file contains calendar download functionality for events but is not currently linked in any HTML files. Consider adding it to index.html and events.html after events-modal.js to add calendar download functionality to event modals.

2. **Add events-calendar-button.css**: This CSS file likely styles the calendar button in event modals. It should be linked in the same pages as events-modal-calendar.js.

3. **Review and possibly remove backup files**: Several .bak and .old files could be archived or removed.

4. **Check admin-patch-recent.js and admin-patches.js**: These may contain newer patches that haven't been integrated into the main admin-patch.js file.

5. **Review events-page.js**: This file may contain event page functionality that should be linked in events.html.

6. **Check ifrevl.js and dash.js**: Determine if these files contain necessary functionality that should be integrated.

7. **Ensure admin-button-fix.css is linked**: If this contains important button styling fixes for the admin interface, it should be linked in admin.html.

8. **Implement consistent path references**: Some files use relative paths (./css/) while others use absolute paths (/css/). Consider standardizing these references.
