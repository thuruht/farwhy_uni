# Farewell/Howdy System Documentation

> **Last Updated**: June 15, 2026  
> **Version**: 2.2.0  

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Database Schema](#database-schema)
5. [Security Model](#security-model)
6. [Frontend Components](#frontend-components)
7. [Development Guidelines](#development-guidelines)
8. [Critical System Components](#critical-system-components)

---

## System Overview

The Farewell/Howdy Unified Project is a comprehensive content management system for two music venues in Kansas City, MO. Built on Cloudflare Workers, it provides a modern admin dashboard and public-facing APIs.

### Technology Stack

- **Runtime**: Cloudflare Workers (Edge computing)
- **Language**: TypeScript (backend), vanilla JavaScript (frontend)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Image storage)
- **Authentication**: JWT tokens with session management
- **Frontend**: Responsive HTML/CSS/JS


### Key Capabilities

- **Event Management**: Create, edit, and display events for both venues
- **Blog System**: Rich text blog posts with image uploads and featured content
- **Menu Management**: Dynamic menu system with categories and pricing
- **Business Hours**: Venue-specific hours management
- **Featured Videos**: YouTube video carousel system
- **Image Handling**: Secure R2-based image storage with automatic optimization
- **Splash Guestbook**: Live scrolling comment ticker with KV-backed visitor guestbook on the splash page

---

## Architecture

### Backend Structure

```
src/
├── index.ts              # Main router and endpoint definitions
├── admin.html            # Admin dashboard served from src
├── wrangler.jsonc        # Wrangler configuration for src
├── handlers/             # Feature-specific handlers
│   ├── auth.ts          # Authentication logic
│   ├── events.ts        # Event management
│   ├── blog.ts          # Blog post management
│   ├── menu.ts          # Menu item management
│   ├── hours.ts         # Business hours
│   ├── featured.ts      # Featured content
│   └── sync.ts          # Sync logic
├── middleware/
│   └── auth.ts          # JWT authentication middleware
└── types/
    └── env.ts           # TypeScript type definitions
```

### Frontend Structure

```
public/
├── admin.html           # Admin dashboard (SPA)
├── index.html           # Public homepage
├── events.html          # Events page
├── login.html           # Login page
├── ...                  # Other HTML files
├── jss/                 # JavaScript modules
│   ├── admin-unified.js # Main admin functionality
│   ├── menu-management.js # Menu CRUD operations
│   ├── featured-videos-manager.js # Video management
│   ├── events-modal.js  # Events modal functionality
│   ├── ics-generator.js # Calendar download functionality
│   ├── script.js        # Public site functionality
│   └── ...              # Other JS files and libraries (e.g., gsap)
├── css/                 # Stylesheets
│   ├── admin-header.css # Admin header styling
│   ├── dark-mode.css    # Dark mode theme
│   ├── events-page.css  # Events page styling
│   └── ...              # Other CSS files
├── img/                 # Images
├── fnt/                 # Fonts
├── menu/                # Menu-related assets
└── u/                   # Blog/news-related assets
```

---

## Core Features

### Authentication System

- **JWT-based authentication** with configurable expiration
- **Session blocklist** for secure logout
- **Admin route protection** via middleware
- **Automatic token refresh** on admin dashboard

### Event Management

- **Dual-venue support** (Farewell & Howdy)
- **Event flyer uploads** to R2 storage
- **Ticket URL integration** for external ticketing
- **Public slideshow API** for homepage display with configurable limits
- **Admin filtering and search** capabilities
- **Consistent date comparison** for past/upcoming events
- **Events modal** with archive toggle and pagination support

### Blog System

- **Rich text editor** (Quill.js) with image embedding
- **Featured image uploads** with automatic URL population
- **Public blog endpoint** for news page display
- **Featured content management** with YouTube video support

### Menu Management

- **Category-based organization** (Domestics, Craft, Food, etc.)
- **Drag-and-drop reordering** with display_order persistence
- **Price management** with decimal precision
- **Active/inactive status** for items
- **Public menu API** for website display

### Business Hours Management

- **Day-specific hours** with open/close times
- **Closed day handling** with special notes
- **Venue-specific configuration**
- **API endpoint** for public site integration

### Splash Page & Guestbook

- **Venue selector splash** (`public/index.html`) with ambient background, rising orbs, and glitch-out nav transition
- **Scrolling ticker** (`public/guestbook.js`) displays live visitor comments via `GET /api/comments`; falls back to seed comments when empty
- **Guestbook panel**: slide-up sheet with color swatches, emoji grid, optional name/country fields, and email (stored privately)
- **KV backend** (`GUESTBOOK` namespace): stores up to 500 public comments and private email records keyed by comment ID
- **IP rate limiting**: 30-second cooldown per posting IP enforced in the worker
- **XSS safety**: all user content written via DOM `textContent`, never `innerHTML`; server-side HTML tag stripping on every field

---

## Database Schema

### Core Tables

```sql
-- Events table with ticket URL support
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    flyer_image_url TEXT,
    ticket_url TEXT,           -- Added in recent migration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Menu items with ordering and categories
CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts with rich content support
CREATE TABLE blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    author TEXT,
    featured_image_url TEXT,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Business hours with venue-specific support
CREATE TABLE business_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,  -- 0=Sunday, 1=Monday, etc.
    open_time TEXT,                -- HH:MM format
    close_time TEXT,               -- HH:MM format
    is_closed BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Featured content (videos, announcements)
CREATE TABLE featured_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,    -- 'youtube', 'text', etc.
    content_data TEXT NOT NULL,    -- JSON or URL
    venue TEXT,
    active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security Model

### Authentication Flow

1. **Login**: `POST /api/login` with credentials
2. **Token Generation**: JWT with unique `jti` (JWT ID) for session tracking
3. **Token Storage**: HttpOnly cookie with SameSite protection
4. **Token Validation**: Middleware checks signature and expiration
5. **Session Management**: Blocked tokens stored in KV for logout

### Image Security

- **File validation**: Extension and MIME type checking
- **Path protection**: Prevents directory traversal attacks
- **Access control**: Private images require authentication
- **Size limits**: Configurable upload size restrictions

### API Protection

- **Admin endpoints**: Protected by `authMiddleware()`
- **Input validation**: Prepared statements prevent SQL injection
- **CORS policy**: Configured for trusted origins only
- **Rate limiting**: Implemented at Cloudflare edge level

---

## Frontend Components

### Admin Dashboard Architecture

The admin interface is a **Single Page Application (SPA)** with:

- **Dropdown navigation** (mobile-friendly)
- **Modal-based forms** for all CRUD operations
- **Responsive design** with mobile optimizations
- **Live data updates** via API calls
- **Consistent styling** with public site branding via admin-header.css

### Public Site UI Components

#### Navigation System

- **Standardized Labels**: All pages use consistent "BOOK" navigation label
- **Responsive Design**: Navigation scales for mobile with consistent styling
- **Venue-Context Awareness**: UI elements adapt to current venue state (Farewell/Howdy)
- **Header Height Standardization**: Fixed height/line-height properties prevent layout shifts when toggling venues
- **Mobile-Optimized Buttons**: Close and home buttons on events page have increased width and padding to prevent text overflow

#### Calendar Download System

- **Context-Aware Downloads**: Calendar downloads adapt based on the current page context
  - On events.html: "DOWNLOAD ALL EVENTS" for all venues regardless of current state
  - On venue-specific pages: "DOWNLOAD VENUE CALENDAR" for current venue only
- **Intelligent File Naming**: Generated .ics files include venue name and date (e.g., "Farewell_Events_20250713.ics")
- **Implementation**: Uses ics-generator.js to detect current page and venue state

#### Calendar Downloads

- **Context-aware Downloads**: 
  - "DOWNLOAD VENUE CALENDAR" on venue-specific pages
  - "DOWNLOAD ALL EVENTS" on the events.html page
- **Dual Script System**:
  - `ics-generator.js`: Handles bulk venue/all-events calendar downloads
  - `events-modal-calendar.js`: Handles single event calendar downloads from event modals
- **User Experience**: Clear tooltips explain calendar functionality

#### Custom 404 Page

- **Branded Error Page**: Maintains site design language with the Farewell/Howdy header
- **Clear Messaging**: "404" with helpful explanation text
- **Navigation Options**: "TAKE ME HOME" button directs users back to the homepage
- **Implementation**: Served via Cloudflare Workers for all non-existent routes

#### Blog and Featured Videos Design

- **Simplified Visual Design**: Removed concentric borders in blog posts and featured videos sections
- **Reduced Shadow Effects**: Lighter shadows for improved visual clarity
- **Consistent Border Styling**: Eliminated redundant borders from preview containers
- **Container Hierarchy**: Simplified nesting structure to improve UI readability
- **Mobile Optimization**: Cleaner display of content on smaller screens

### Admin Header Styling

The admin interface header uses a consistent visual style with the public site:

- **Chunky font**: Custom "Chunk Five Regular" font face for headings
- **Text shadow effects**: Consistent dark shadows for depth
- **Hover animation**: Subtle color shift on hover for interactive elements
- **Color scheme**: Matches public site branding
- **Implementation**: Via dedicated admin-header.css stylesheet

### Key JavaScript Modules

#### admin-unified.js

- **Main admin controller** with section management
- **Event handlers** for all admin operations
- **API communication** with error handling
- **Modal management** and form validation

#### events-modal.js

- **Inline events display** for multiple pages
- **Toggle between current and archived events**
- **Date comparison logic** for past/upcoming classification
- **Pagination support** with configurable limits
- **Responsive design** with mobile optimization

#### menu-management.js

- **Menu CRUD operations** with drag-and-drop
- **Category organization** and item reordering
- **Real-time updates** via API integration

#### featured-videos-manager.js

- **YouTube URL processing** and validation
- **Video carousel management**
- **Multi-video support** with thumbnail generation

---

## Development Guidelines

### Project Scripts and Utilities

The project includes several utility scripts in the `scripts/` directory:

- **deploy.sh**: Deployment script for Cloudflare Workers
  - Usage: `./scripts/deploy.sh`
  - Handles Cloudflare Workers deployment with proper dependency installation

- **commit-changes.sh**: Standardized commit workflow
  - Usage: `./scripts/commit-changes.sh [commit_message] [description]`
  - Archives documentation files and creates structured commits

- **archive-legacy.sh**: Legacy code archival utility
  - Usage: `./scripts/archive-legacy.sh [--dry-run]`
  - Moves obsolete code to the project_archive directory

- **apply-migrations.js**: Database migration script
  - Applies SQL migrations to the D1 database

- **generate-jwt-secret.js**: Security utility
  - Generates secure JWT secrets for authentication

- **hash-password.js**: Admin user management
  - Creates password hashes compatible with the authentication system

- **clean_blog_posts.js**: Content maintenance
  - Cleans and formats blog post content

### Code Organization and Archival

The project follows a strict code organization approach to maintain a clean codebase:

- **Active Code**: Only actively used code should remain in the main source directories
- **Archival Process**: Obsolete code is moved to the `project_archive/` directory using the `move_to_archive.sh` script
- **Legacy Directories**: All directories with prefixes `ye_olde_` and `yeo_` have been archived
- **Unused Components**: The `src/wot/` directory and `public/jss/crap_unused_old/` have been archived
- **Git Exclusion**: All archived content is excluded via .gitignore
- **Documentation Structure**: Documentation maintained as 5 core files covering all system aspects

### API Endpoint Patterns

```typescript
// Public endpoints (no auth required)
app.get('/api/resource', handler);

// Admin endpoints (auth required)
const adminApi = new Hono();
adminApi.use('/*', authMiddleware());
adminApi.get('/resource', handler);
app.route('/api/admin', adminApi);
```

### Response Format Standard

```json
{
  "success": true|false,
  "data": <response_data>,
  "error": "Error message (if success=false)",
  "message": "Optional success message"
}
```

### Error Handling Pattern

```typescript
try {
  // Operation
  return c.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return c.json({ success: false, error: 'User-friendly message' }, 500);
}
```

### 404 Error Handling

The application implements a custom 404 error page for non-existent routes:

```typescript
// For unknown routes, serve custom 404 page
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  
  // Try to serve static assets first
  try {
    const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
    if (assetResponse.status === 200) {
      return assetResponse;
    }
  } catch (e) {
    // Not a static file, continue to 404 handling
  }
  
  // API routes return JSON 404
  if (url.pathname.startsWith('/api/')) {
    return c.json({ success: false, error: 'API endpoint not found' }, 404);
  }
  
  // All other routes serve the custom 404.html page
  return c.env.ASSETS.fetch(new Request(new URL('/404.html', c.req.url)));
});
```

This implementation includes:

- **Content-Type Specific Responses**: Returns appropriate format based on request type:
  - JSON responses for API routes (`/api/*`)
  - HTML 404 page for web requests
- **Custom 404.html Page**: Branded error page that maintains site navigation
- **Improved User Experience**: Users can easily navigate back to main site from error page
- **SEO Benefits**: Proper 404 status code helps search engines understand page status

---

## Critical System Components

> ⚠️ **WARNING**: The following components should not be modified without careful testing.

### Business Hours API

**Endpoint**: `GET /api/hours`

**Critical Format**: Must return venue-grouped data:

```json
{
  "success": true,
  "data": {
    "farewell": [...],
    "howdy": [...]
  }
}
```

**Used by**: `more.htm` for public hours display

### Menu Management UI

**Files**: `admin.html`, `admin-unified.js`

**Critical Elements**:

- Modal IDs: `#menu-item-modal`, `#form-modal`
- Container: `#menu-list.menu-container`
- Buttons: `#add-menu-btn`, `#reorder-menu-btn`

**Data Flow**: Add/Edit → Modal → API Call → Refresh List

### Image Upload Components

**Upload Pattern**: File Input → FormData → API → URL Population

**Security**: All uploads validated for type, size, and path safety

### Session Management

**Cookie Name**: `sessionToken`

**Logout Process**: Token added to blocklist + cookie cleared

**Admin Protection**: All `/api/admin/*` routes require valid session

---

## Current System Status

### Recent Updates (June 15, 2026)

- ✅ **Splash Guestbook**: Live ticker + KV-backed comment panel on splash page
- ✅ **GUESTBOOK KV**: New namespace provisioned and wired into worker bindings
- ✅ **API**: `GET /api/comments` and `POST /api/comments` with rate limiting and scrubbing
- ✅ **enter.js**: Keyboard navigation blocked while guestbook panel is open
- ✅ **Documentation**: Corrupted blank section removed; all docs updated to v2.2.0

### Previous Updates (July 9, 2025)

- ✅ **Mobile UI Optimization**: Improved button sizing and styling on events page
- ✅ **UI Consistency**: Fixed header height between Farewell/Howdy states
- ✅ **Date Comparison**: Fixed issue with events incorrectly marked as past
- ✅ **Visual Design**: Removed concentric borders in blog and featured videos
- ✅ **API Consistency**: All frontend/backend endpoints aligned
- ✅ **Mobile Responsiveness**: Admin dashboard fully responsive
- ✅ **Menu Management**: Consolidated UI with drag-and-drop
- ✅ **Image Uploads**: Separate file/URL inputs for all forms
- ✅ **Featured Videos**: Multi-video carousel support
- ✅ **Events Modal**: Improved with archive toggle and consistent date comparison
- ✅ **Menu Animation**: Added GSAP library for smooth menu transitions

### Known Limitations

- **Single Menu System**: Currently supports one menu (Farewell)
- **Basic User Management**: Single admin user model
- **File Storage**: No automatic image optimization
- **Caching**: Limited API response caching

### Deployment & Infrastructure

**Platform**: Cloudflare Workers (Edge computing)  
**CLI Tool**: Wrangler (`npx wrangler deploy`)  
**Environment**: Serverless, auto-scaling  
**Database**: Cloudflare D1 (managed SQLite)  
**Storage**: Cloudflare R2 (object storage)  
**DNS/CDN**: Cloudflare managed

**Local Development**:

```bash
npx wrangler dev --local  # Local development with D1 Local
```

**Production Deployment**:

```bash
npx wrangler deploy       # Deploy to Cloudflare Workers
```

### Maintenance Requirements

- **Session Cleanup**: Periodic removal of expired blocked tokens
- **Image Storage**: Monitor R2 usage and cleanup unused files
- **Database Maintenance**: Occasional cleanup of old events/posts
- **SSL Certificates**: Managed automatically by Cloudflare
- **Edge Cache**: Auto-managed by Cloudflare Workers runtime

---

*This documentation reflects the current system state as of July 9, 2025. For the most up-to-date API reference, see `API_REFERENCE.md`.*
