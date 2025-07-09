# Farewell/Howdy System Documentation

> **Last Updated**: July 10, 2025  
> **Version**: 2.1.2  

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
- **Frontend**: Responsive HTML/CSS/JS with modal-based UI

### Key Capabilities

- **Event Management**: Create, edit, and display events for both venues
- **Blog System**: Rich text blog posts with image uploads and featured content
- **Menu Management**: Dynamic menu system with categories and pricing
- **Business Hours**: Venue-specific hours management
- **Featured Videos**: YouTube video carousel system
- **Image Handling**: Secure R2-based image storage with automatic optimization

---

## Architecture

### Backend Structure

```
src/
├── index.ts              # Main router and endpoint definitions
├── handlers/             # Feature-specific handlers
│   ├── auth.ts          # Authentication logic
│   ├── events.ts        # Event management
│   ├── blog.ts          # Blog post management
│   ├── menu.ts          # Menu item management
│   ├── hours.ts         # Business hours
│   └── featured.ts      # Featured content
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
├── jss/                 # JavaScript modules
│   ├── admin-unified.js # Main admin functionality
│   ├── menu-management.js # Menu CRUD operations
│   ├── featured-videos-manager.js # Video management
│   └── script.js        # Public site functionality
└── css/                 # Stylesheets (responsive design)
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
- **Documentation Consolidation**: Documentation has been reduced from 27 files to 5 core documents

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

### Recent Updates (July 2025)

- ✅ **API Consistency**: All frontend/backend endpoints aligned
- ✅ **Mobile Optimization**: Admin dashboard fully responsive
- ✅ **Menu Management**: Consolidated UI with drag-and-drop
- ✅ **Image Uploads**: Separate file/URL inputs for all forms
- ✅ **Featured Videos**: Multi-video carousel support
- ✅ **Events Modal**: Improved with archive toggle and consistent date comparison
- ✅ **Menu Animation**: Added GSAP library for smooth menu transitions
- ✅ **Documentation**: Consolidated and current

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

*This documentation reflects the current system state as of July 6, 2025. For the most up-to-date API reference, see `API_REFERENCE.md`.*
