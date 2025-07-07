# Changelog

All notable changes to the Farewell/Howdy Unified Project.

## [2.1.2] - July 7, 2025

### 🛠️ Improved Legacy Events Management

- **Enhanced Import System**: Significantly improved legacy event import functionality
  - Modified sync handler to never overwrite existing events 
  - Added proper duplicate detection to prevent creating identical events
  - Events with the same title, date and venue will be skipped during import
  - Added detailed warnings before import to clarify the process
  - Implemented better error handling with detailed success/failure reporting
  - Fixed bug that could potentially cause data loss during imports

- **Refined Legacy Repair Function**: Improved the repair function for legacy events
  - Added more robust deduplication to prevent errors with duplicated events
  - Improved error handling to reduce unnecessary error notifications
  - Better handling of image URLs from the legacy system
  - Fixed bug where duplicate "No Image" events would appear in the interface
  - Better logging to track exactly which fields were repaired

## [2.1.1] - July 7, 2025

### 🧹 Code Cleanup
- **Project Root Cleanup**: Archived numerous outdated documentation files, development artifacts, and old backups into a single `project_archive/` directory to significantly clean up the project root.

### 🎨 UI/UX Fixes
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
  - Legacy events from https://fygw0.kcmo.xyz/list/farewell and https://fygw0.kcmo.xyz/list/howdy now edit correctly
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
- **Images**: Monitor R2 storage usage  **never delete old photos or flyers - they are destined for the archives - see below**
- **Database**: never delete old events or flyers - they are archived and a special shows archive for both venues will be created eventually to painstakingly document all past events and allow the public to view and contribute to the archive
 
---

## Known Issues

### Current Limitations

- **Single Menu**: Only supports Farewell menu (Howdy placeholder message)
- **User Management**: Single admin user model
- **Caching**: Limited API response caching
- **File Optimization**: No automatic image compression

### Future Enhancements

- **Enhanced Menu Features**: Advanced menu customization and seasonal offerings (Farewell only)
- **User Roles**: Multiple admin users with role-based permissions
- **Advanced Caching**: API response caching and optimization
- **Image Processing**: Automatic image optimization and resizing

---

*For detailed technical information, see [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)*  
*For complete API reference, see [API_REFERENCE.md](API_REFERENCE.md)*
