# Changelog

All notable changes to the Farewell/Howdy Unified Project.

## [2.1.10] - July 16, 2025

### 🧹 UI Improvements

- **Streamlined Event Controls**: Enhanced usability in homepage slideshow area
  - Removed redundant "show past events"/"hide past events" toggle link
  - Made dropdown selector the primary control for filtering past/upcoming events
  - Clarified calendar download link to specify it's venue-specific
  - Improved UI consistency by removing duplicate controls
  - Better tooltip text explains the calendar download functionality
  - Changed "BOOKING" to "BOOK" in navigation for better fit on mobile
  - Reduced navigation padding to prevent overflow on narrow screens

## [2.1.9] - July 15, 2025

### 📱 Mobile Optimization

- **Enhanced Mobile Responsiveness**: Fixed layout issues on narrow screens
  - Improved events.html layout for narrowest phone screens
  - Fixed close and home button sizing to prevent text overflow
  - Optimized modals width to prevent horizontal scrolling
  - Enhanced button visibility with better backgrounds and spacing
  - Added extra small screen support for devices under 360px width
  - Implemented better vertical spacing for button stacking

## [2.1.8] - July 15, 2025

### 🐞 Bug Fixes

- **Admin Interface Fix**: Fixed date comparison issue in admin-unified.js
  - Updated `parseEventDate()` function to properly handle Date objects
  - Modified event date handling to use raw date strings for consistent parsing
  - Fixed inconsistency between admin and public-facing date handling
  - Events now correctly show as past/upcoming in admin interface

## [2.1.7] - July 14, 2025

### 📅 Calendar Integration Completion

- **Calendar System Finalization**: Completed integration of all calendar-related functionality
  - Added tooltips to events.html calendar download button to explain .ics files
  - Integrated ifrevl.js with proper calendar link handling
  - Updated calendar download buttons with consistent styling and tooltips
  - Added "Download All Events" text to all calendar download links
  - Ensured proper tooltip display on all calendar download buttons
  - Implemented clear, user-friendly calendar file naming across all downloads
  - Maintained visual consistency between individual and bulk event downloads

## [2.1.6] - July 13, 2025

### 📅 Calendar Integration Enhancements

- **Event Calendar Downloads**: Added comprehensive calendar functionality
  - Added individual event calendar downloads within event modals
  - Improved existing venue-wide calendar downloads with clearer labeling
  - Added "Download All Events" text to bulk calendar download links
  - Implemented consistent styling for calendar download buttons
  - Standardized ICS file format and naming conventions
  - Created clear visual distinction between single-event and all-events downloads
  - No database or API changes required - purely frontend enhancement

- **CSS and JS File Inventory**: Added comprehensive inventory
  - Created CSS_AND_JS_INVENTORY.md with detailed usage information
  - Documented all CSS and JS files with their status and usage
  - Fixed admin-header.css integration in admin.html
  - Added missing chunky font styling to admin header

## [2.1.5] - July 12, 2025

### 🚀 Bug Fixes and Enhancements

- **Menu Animation Fix**: Fixed GSAP animation issue in menu renderer
  - Added missing GSAP library reference to `/public/menu/index.html`
  - Resolved "gsap not avail" console error
  - Enabled smooth animations for menu items and header
  - Fixed animation functionality without changing core renderer logic
  - No database or API changes required

- **Events Display Improvement**: Enhanced events functionality
  - Fixed inline events modal to show all events, not just current month
  - Added EVENTS link to navigation on more.htm, about.htm, and booking.htm pages
  - Fixed date comparison issue causing same-day events to incorrectly display as past
  - Improved event filtering logic to properly handle current day events (ensures today's events show as "upcoming")
  - Added consistent openEventsPopup function across all pages
  - Fixed issue where events happening later on the current day were incorrectly marked as "past"
  - Modified fetchEvents function in events-modal.js to conditionally use includePast parameter only when showing archived events
  - Added limit=100 parameter to API call to retrieve more events
  - Updated event filtering to ensure proper date comparison (using >= for today's dates)
  - Ensured admin interface uses consistent date comparison logic

## [2.1.4] - July 11, 2025

### 🔧 Archive Management Improvements

- **Archive Management Script**: Enhanced archive management workflow
  - Created new `scripts/archive-and-commit.sh` script for selective archiving
  - Implemented automatic git tracking for important archived files
  - Added preservation of file path structure during archiving
  - Maintained proper git history for archived code
  - Provided user-friendly interface with detailed instructions

### 🗄️ Archive Repository Optimization

- **Archive Repository Structure**: Optimized archived content in repository
  - Added critical legacy handlers and middleware to git tracking
  - Preserved important documentation files from ye_olde_docs
  - Maintained core TypeScript implementation files for reference
  - Reduced repository bloat by selectively choosing archived content
  - Enhanced project history preservation without compromising repository performance

## [2.1.3] - July 10, 2025

### 📚 Documentation Updates

- **System Documentation**: Updated documentation to reflect UI improvements
  - Added detailed section about admin header styling
  - Documented custom font and text-shadow implementation
  - Updated last modified date to July 10, 2025
  - Fixed Markdown formatting issues for better readability

## [2.1.2] - July 8, 2025

### 🛡️ Security Improvements

- **Password Salt Management**: Enhanced authentication security
  - Added secure salt management with environment variable support
  - Created `generate-password-salt.js` script for generating and configuring secure salts
  - Improved password hashing with fallback compatibility
  - Maintained backward compatibility with existing password hashes
  - Preserved emergency access functionality

### 🔧 Project Infrastructure

- **Script Organization**: Standardized and improved project scripts
  - Moved all utility scripts to `scripts/` directory
  - Improved `commit-changes.sh` with better documentation and flexibility
  - Created standardized `archive-legacy.sh` script with dry-run option
  - Added simplified `deploy.sh` script for streamlined deployment
  - Made all scripts more modular and reusable

### 🗄️ Legacy Code Archival

- **Obsolete Code Cleanup**: Moved all legacy code to project_archive directory
  - Archived ye_olde_docs/ and ye_olde_src/ directories
  - Moved unused src/wot/ directory with obsolete handlers
  - Relocated crap_unused_old/ directory containing deprecated JS
  - Updated .gitignore to exclude all archived content
  - Created move_to_archive.sh script for consistent archiving process

### 📊 Dashboard Enhancements

- **Recent Activity Display**: Added recent activity section to admin dashboard
  - Shows the 5 most recent events and blog posts
  - Displays relative time (e.g., "2 hours ago")
  - Includes venue and date information for events
  - Automatically updates when dashboard loads
  - Improves at-a-glance awareness of site changes

### 🖼️ Asset Updates

- **Updated Calendar Images**: Refreshed calendar images for both venues
  - Updated Farewell calendar icon with improved resolution
  - Updated Howdy calendar icon with improved resolution
  - Consistent styling between both venue calendar icons

### 🎨 UI Improvements

- **Compact Admin Header**: Streamlined admin interface layout
  - Merged main-header and admin-header into a single compact design
  - Improved space utilization in the admin interface
  - Enhanced navigation with properly updating section indicators
  - Better organization of title, navigation, and dashboard elements
  - Added chunky font and text-shadow styling to match public site branding

## [2.1.1] - July 7, 2025

### 🧹 Project Organization

- **Project Root Cleanup**: Archived numerous outdated documentation files, development artifacts, and old backups into a single `project_archive/` directory to significantly clean up the project root.

### 📱 Interface Refinements

- **Inline Events Modal**: Removed redundant "VENUE:" and "SHOW:" text labels from the filter button rows on the index page modal for a cleaner, more readable interface.
- **Full-Page Events Modal**:
  - Redesigned the `/events.html` page with a simplified, modern, and more intuitive layout.
  - Improved the styling with responsive design, a card-based grid for events, and improved controls using inline CSS.

## [2.1.0] - July 6, 2025

### 📚 Documentation Verification

- **Cloudflare Workers Documentation**: Verified all documentation correctly reflects Cloudflare Workers deployment
  - README.md properly describes Cloudflare Workers, D1, and R2 stack
  - SYSTEM_DOCUMENTATION.md includes comprehensive deployment section with Wrangler CLI
  - package.json correctly configured for Cloudflare Workers with Hono framework
  - wrangler.jsonc properly configured with D1, R2, and KV bindings
  - No traditional server references or misleading deployment instructions
  - All development and deployment commands use `npx wrangler` correctly

### 🔧 Fixed - Legacy Event Editing

- **Legacy Event Data Retention**: Fixed issue where flyer URLs and event times were not retained when editing legacy events
  - Added support for legacy `imageUrl` field in addition to current `flyer_image_url` field
  - Added missing `event_time` form field to admin interface to properly handle legacy `time` data  
  - Updated JavaScript to populate form fields from both legacy and current field names
  - Legacy events from [https://fygw0.kcmo.xyz/list/farewell](https://fygw0.kcmo.xyz/list/farewell) and [https://fygw0.kcmo.xyz/list/howdy](https://fygw0.kcmo.xyz/list/howdy) now edit correctly
  - All legacy event data (flyer images, event times, descriptions) is now preserved during editing
- **Event Duplication Bug**: Fixed issue where editing events could create duplicate entries
  - Added form submission protection to prevent multiple submissions
  - Improved event listener attachment to prevent duplicate handlers
  - Added proper form state management and button disable/enable logic
- **Delete Button Fix**: Fixed delete button error on confirm delete
  - Fixed API delete function to properly parse JSON responses
  - Added better error handling and user feedback for delete operations
- **Legacy Event Repair Tool**: Added automated repair function for legacy events
  - New "🔧 Repair Legacy" button in Event Management section
  - Automatically restores missing flyer URLs, event times, and ticket URLs from legacy data
  - Safely updates events without creating duplicates

### 🔧 Fixed - API Consistency

- **Menu CRUD Endpoints**: Added missing admin menu management endpoints
  - `GET/POST/PUT/DELETE /api/admin/venues/:venue/menu` - Menu info management
  - `POST /api/admin/menu-items/upload-image` - Menu item image uploads
- **Blog Featured Content**: Added missing `GET /api/admin/blog/featured` endpoint
- **Database Migration**: Added `POST /api/admin/migrate/events` for schema updates
- **Endpoint Verification**: All frontend API calls now have matching backend endpoints
- **Business Hours Management**: Fixed missing hours management functionality
  - Added complete JavaScript implementation for Farewell hours editing
  - Fixed hours handler to use upsert logic (update existing or create new)
  - Hours management now properly loads and saves for Farewell venue only

### 🎨 UI/UX Fixes

- **Menu Container Layout**: Fixed menu cards to use full container width instead of 50%
  - Updated CSS layout from grid to block with 100% width
  - Menu cards now display properly in admin interface
- **Admin Dropdown Logout**: Fixed missing logout functionality in dropdown navigation
  - Added proper logout function with API call to `/api/logout`
  - Prevents dropdown from staying on "logout" selection
  - Properly clears session and redirects after logout
  - No deployment required - frontend JavaScript fix only

### 🧹 Code Cleanup

- **Menu Handler Refactoring**: Updated menu handler to match simplified single-menu architecture
  - Fixed inconsistency between multi-menu logic and single-menu implementation
  - Added image_url support for menu items
  - Improved error handling and validation
- **File Cleanup**: Removed obsolete files and duplicates
  - Deleted obsolete "yeo" prefixed handler files (yeothrift.ts, yeoevents.ts, yeoevents-new.ts)
  - Removed duplicate CSS files (3ccssss.css, ccssss2.css, admin-redesigned variants)
  - Cleaned up unused debug HTML file (literary-admin-debug.html)
  - **Favicon Fix**: Corrected favicon references from `favicon.png` to `flavicon.png` across all HTML files
    - Updated 7 HTML files to use correct favicon filename
    - Removed duplicate `favicon.png` file

### 📚 Documentation

- **Consolidated Documentation**: Reduced from 27 files to 5 core documents
- **System Documentation**: Created comprehensive technical reference
- **API Reference**: Complete endpoint documentation with examples
- **Archive System**: Moved obsolete docs to `ye_olde_docs/` directory
- **Updated README**: Accurate project setup and deployment instructions

### 🛡️ Security

- **Authentication**: JWT-based session management with blocklist
- **Image Uploads**: File validation and path traversal protection
- **Admin Routes**: All administrative endpoints protected by middleware
- **Input Validation**: SQL injection prevention via prepared statements

---

## [2.0.0] - July 2-5, 2025

### 🎨 UI/UX Improvements

- **Mobile Admin Dashboard**: Complete responsive redesign
  - Dropdown navigation replaces sidebar for all screen sizes
  - Modal-based forms optimized for mobile devices
  - Touch-friendly buttons and form controls
- **Menu Management**: Consolidated UI with full-width layout
- **Image Upload Forms**: Separate file input and URL display for all upload types
- **Button Styling**: Standardized admin interface buttons for consistency

### ⚡ Menu System Overhaul

- **Simplified Architecture**: Single menu system (Farewell-focused)
- **Drag-and-Drop Reordering**: Visual menu item organization
- **Category Management**: Automatic grouping by item categories
- **Real-time Updates**: Live menu updates via API integration
- **Database Optimization**: Removed duplicate menu items and venues

### 🎥 Featured Content System

- **Multi-Video Support**: YouTube carousel with multiple videos
- **Fallback Logic**: Robust content loading with multiple endpoint support
- **Admin Management**: Dedicated featured videos management interface
- **Public Display**: Enhanced carousel display on blog/news pages

### 🔧 Backend Improvements

- **Image Handling**: R2 storage integration with automatic URL generation
- **Event Management**: Added ticket URL support with database migration
- **Blog System**: Rich text editor with image embedding
- **Business Hours**: Venue-specific hours management
- **Error Handling**: Comprehensive error responses and logging

---

## [1.5.0] - June 2025

### 📱 Mobile Responsiveness

- **Public Site**: Mobile-optimized event display and navigation
- **Admin Interface**: Basic mobile support for admin functions
- **Event Modals**: Mobile-friendly event display modals

### 🔒 Security Enhancements

- **Authentication System**: JWT implementation with session management
- **Admin Protection**: Route-level authentication middleware
- **Input Validation**: Basic SQL injection prevention

### 🎪 Event Management

- **Dual Venue Support**: Farewell and Howdy event management
- **Image Uploads**: Event flyer upload to R2 storage
- **Slideshow Integration**: Public homepage event slideshow
- **Admin Interface**: Event CRUD operations in admin dashboard

---

## [1.0.0] - May 2025

### 🚀 Initial Release

- **Project Foundation**: Cloudflare Workers + D1 + R2 architecture
- **Basic Admin Dashboard**: Initial admin interface
- **Event System**: Basic event management functionality
- **Database Schema**: Core table structure for events, menu, blog
- **Public Website**: Initial public-facing website

---

## Technical Debt Addressed

### July 2025 Cleanup

- **Code Consolidation**: Removed duplicate and conflicting JavaScript modules
- **API Standardization**: Unified response formats across all endpoints
- **Documentation Overhaul**: Reduced documentation from 27 to 5 files
- **Mobile Optimization**: Comprehensive mobile-first redesign
- **Security Hardening**: Enhanced authentication and validation

### Legacy System Retirement

- **Old Menu Management**: Archived legacy menu code after functionality verification
- **Obsolete Documentation**: Moved 22 outdated documents to archive
- **Dead Code Removal**: Cleaned up unused functions and files
- **Database Optimization**: Removed duplicate entries and unused tables

---

## Breaking Changes

### 2.1.0

- **Menu API**: Simplified to single-menu architecture (Farewell only)
- **Admin Navigation**: Replaced sidebar with dropdown (no functional impact)

### 2.0.0

- **Menu Management**: Complete UI rewrite (old interface removed)
- **Image Uploads**: Changed to file + URL input pattern (improved UX)
- **Mobile Layout**: Admin dashboard layout completely restructured

---

## Upgrade Notes

### From 1.x to 2.x

1. **Database Migration**: Run `POST /api/admin/migrate/events` to add ticket_url column
2. **Menu Items**: Verify menu items display correctly with new single-menu system
3. **Admin Users**: Test all admin functionality after UI overhaul
4. **Image Uploads**: Verify all image upload forms work with new file/URL pattern

### General Maintenance

- **Sessions**: Periodically clear expired session tokens from KV store
- **Images**: Monitor R2 storage usage and manually clean up unused files as needed; do not automate this process.
- **Database**: Do not remove any events, flyers, or posts; they should be archived.

---

## Known Issues

### Current Limitations

- **Single Menu**: Only supports Farewell menu (Howdy does not need a menu)
- **User Management**: Single admin user model
- **Caching**: Limited API response caching
- **File Optimization**: No automatic image compression
- **Event Duplication**: Occasionally creates duplicate events when adding new events

### Future Enhancements

- **Enhanced Menu Features**: Advanced menu customization and seasonal offerings (Farewell only)
- **User Roles**: Multiple admin users with role-based permissions
- **Advanced Caching**: API response caching and optimization
- **Image Processing**: Automatic image optimization and resizing

---

*For detailed technical information, see [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)*  
*For complete API reference, see [API_REFERENCE.md](API_REFERENCE.md)*
