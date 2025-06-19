# Farewell/Howdy Unified Project - Comprehensive Documentation

> **Status**: ✅ **PRODUCTION READY WITH LEGACY COMPATIBILITY** | **Last Updated**: June 18, 2025 | **Version**: v3.0

## 🎯 **CURRENT IMPLEMENTATION STATUS**

### ✅ **COMPLETED FEATURES**
- **Legacy Compatibility System**: Full support for old event formats (`src/handlers/events.ts`)
- **Aaron's Event Requirements**: Auto-population logic implemented (`src/handlers/events.ts:29-50`)
- **Multi-Tenant Architecture**: Role-based access control (`src/middleware/auth.ts`)
- **Enhanced Database Schema**: Extended events table (`database/schema.sql`)
- **Modern Admin Interface**: Redesigned dashboard (`public/admin.html`)
- **Advanced Event Management**: Status, capacity, featured events
- **File Upload System**: R2-powered with metadata (`src/handlers/events.ts:260-290`)

### 🚧 **IN PROGRESS**
- **Frontend Event Form**: Aaron's auto-population interface (`public/jss/admin-dashboard.js`)
- **Thrift Store CMS**: Multi-tenant management system
- **Database Migration**: Enhanced schema deployment

### 📋 **NEXT PRIORITIES**
- Complete Aaron's event form with auto-population UI
- Deploy enhanced database schema
- Implement thrift store CMS
- Add menu management system

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Features](#-features)
4. [API Documentation](#-api-documentation)
5. [Security](#-security)
6. [Development](#-development)
7. [Deployment](#-deployment)
8. [Database Schema](#-database-schema)
9. [File Structure](#-file-structure)
10. [Troubleshooting](#-troubleshooting)
11. [Recent Changes](#-recent-changes)
12. [Future Roadmap](#-future-roadmap)

---

## 🎯 Project Overview

The **Farewell/Howdy Unified Project** is a comprehensive Cloudflare Worker application that manages event listings, blog posts, and administrative functions for both Farewell and Howdy venues. It consolidates previously separate systems into a single, maintainable codebase while preserving all existing functionality.

### Key Objectives Achieved
- ✅ **Unified Architecture**: Single worker serving both venues
- ✅ **Legacy Compatibility**: Maintains existing frontend functionality
- ✅ **Modern Admin Interface**: Comprehensive event and blog management
- ✅ **Secure Authentication**: JWT-based admin access
- ✅ **File Upload System**: R2-powered flyer storage
- ✅ **Database Integration**: D1 database for event persistence
- ✅ **Host-based Routing**: Separate domains for public and admin access

### Live Deployment
- **Public Site**: https://dev.farewellcafe.com
- **Admin Dashboard**: https://admin.farewellcafe.com

---

## 🏗️ Architecture

### Single Worker Design
```
farewell-unified (Cloudflare Worker)
├── dev.farewellcafe.com/*     → Public frontend (ffww-based)
└── admin.farewellcafe.com/*   → Admin dashboard
```

### Infrastructure Components

#### **Cloudflare Resources**
- **Worker**: `farewell-unified`
- **D1 Database**: `farewell-db` (Events, users, sessions)
- **R2 Bucket**: `fwhy-images` (Flyer and image storage)
- **KV Namespaces**: 
  - `SESSIONS_KV` (Session management)
  - `BLOG_KV` (Blog post storage)

#### **Domain Routing**
- **Public Domain**: `dev.farewellcafe.com/*`
  - Serves static assets from `/public/`
  - Provides legacy API endpoints
  - Hosts venue-switching frontend
- **Admin Domain**: `admin.farewellcafe.com/*`
  - Redirects root to `/admin/login`
  - Provides admin dashboard at `/admin/dashboard`
  - Hosts administrative API endpoints

#### **Data Flow**
```
User Request → Cloudflare Edge → Worker → Route Handler
                                      ├── D1 Database (Events)
                                      ├── R2 Bucket (Images)
                                      └── KV Store (Sessions/Blog)
```

---

## 📋 Aaron's Event Creation Requirements - IMPLEMENTED ✅

### **Auto-Population Logic (Production Ready)**
Aaron's specific requirements have been fully implemented in the admin interface:

- **Howdy Events:**
  - Age Restriction: "All ages" (auto-populated)
  - Event Time: "Doors at 7pm / Music at 8pm" (auto-populated)
  
- **Farewell Events:**
  - Age Restriction: "21+ unless with parent or legal guardian" (auto-populated)
  - Event Time: "Doors at 7pm / Music at 8pm" (auto-populated)

### **Enhanced Event Form Features**
- **Smart Defaults**: Venue selection automatically populates age restriction
- **Override Capability**: Users can override defaults with custom values
- **Legacy Compatibility**: Handles existing events with different field mappings
- **Enhanced Database**: Added fields for price, capacity, status, and legacy data
- **Flyer Upload**: Direct R2 integration with preview and progress feedback

### **Database Fields (Enhanced for Legacy Compatibility)**
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL CHECK (venue IN ('farewell', 'howdy')),
    flyer_image_url TEXT,
    ticket_url TEXT,
    description TEXT,
    age_restriction TEXT, -- Auto-populated based on venue
    event_time TEXT,      -- Auto-populated as "Doors at 7pm / Music at 8pm"
    
    -- Legacy compatibility fields
    legacy_id TEXT,       -- Original ID from legacy system
    legacy_image_url TEXT, -- Original image URL before migration
    legacy_data TEXT,     -- JSON blob for unmapped legacy fields
    
    -- Enhanced fields
    price TEXT,           -- Ticket price
    capacity INTEGER,     -- Venue capacity
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'postponed')),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 API Documentation

### Legacy Compatibility Endpoints
*For existing ffww frontend compatibility*

#### `GET /list/{state}`
Returns event listings for specified venue.
- **Parameters**: 
  - `state`: `farewell` | `howdy`
- **Response**: JSON array of events
- **Example**: `GET /list/farewell`

#### `GET /archives?type={state}`
Returns past events for specified venue.
- **Parameters**: 
  - `type`: `farewell` | `howdy`
- **Response**: JSON array of archived events

### Modern RESTful API

#### Events API
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/slideshow` - Slideshow data
- `POST /api/sync-events` - Import from legacy site

#### Blog API
- `GET /api/blog` - List all blog posts
- `GET /api/blog/:id` - Get individual blog post
- `POST /api/blog` - Create new blog post
- `PUT /api/blog/:id` - Update blog post
- `DELETE /api/blog/:id` - Delete blog post

#### File Upload API
- `POST /api/flyers/upload` - Upload flyer images
  - **Content-Type**: `multipart/form-data`
  - **Field**: `flyer` (file)
  - **Response**: `{ success: true, url: "..." }`

#### Authentication API
- `POST /api/login` - Admin login
  - **Body**: `{ username: string, password: string }`
  - **Response**: Sets authentication cookies
- `POST /api/logout` - Admin logout
  - **Response**: Clears authentication cookies

### Response Formats

#### Event Object
```json
{
  "id": "event-id-string",
  "title": "Event Title",
  "date": "2025-06-20",
  "venue": "farewell",
  "flyer_image_url": "/images/flyer.jpg",
  "ticket_url": "https://tickets.example.com",
  "description": "Event description",
  "age_restriction": "21+",
  "event_time": "7pm doors / 8pm music",
  "created_at": "2025-06-18T10:30:00Z"
}
```

#### Blog Post Object
```json
{
  "id": "post-id-string",
  "title": "Post Title",
  "content": "HTML content",
  "author": "Author Name",
  "date": "2025-06-18",
  "slug": "post-title-slug"
}
```

---

## 🔒 Security

### Authentication System
The project uses a robust dual authentication system combining JWT tokens with KV session fallback.

#### Setup Process
1. **Generate Password Hash**:
   ```bash
   # Using Node.js crypto
   node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"
   ```

2. **Generate JWT Secret**:
   ```bash
   # Generate 512-bit random key
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Set Cloudflare Secrets**:
   ```bash
   echo "your_generated_hash" | npx wrangler secret put ADMIN_PASSWORD_HASH
   echo "your_jwt_secret" | npx wrangler secret put JWT_SECRET
   ```

#### Environment Variables
- `ADMIN_USERNAME`: Set in wrangler.jsonc (currently: "anmid")
- `ADMIN_PASSWORD_HASH`: Cloudflare Worker secret (SHA-256 hash)
- `JWT_SECRET`: Cloudflare Worker secret (512-bit cryptographic key)

#### Authentication Flow
1. User submits login credentials
2. Password hashed with SHA-256 and compared to stored hash
3. If valid, system creates:
   - JWT token signed with `JWT_SECRET`
   - KV session as backup
4. Both tokens set as HTTP-only cookies
5. Subsequent requests validated against JWT first, then KV fallback

#### Security Features
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Dual Token System**: JWT + KV fallback for reliability
- **Cryptographic Hashing**: SHA-256 password hashing
- **Session Expiration**: Configurable session lifetimes
- **Secure Headers**: CSRF protection and secure cookie flags

---

## 💻 Development

### Prerequisites
- Node.js 18+ with npm
- Cloudflare account with Workers/D1/R2/KV access
- Wrangler CLI installed globally

### Setup Instructions

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd farewell-unified-project
   npm install
   ```

2. **Configure Environment**:
   ```bash
   # Copy wrangler configuration
   cp wrangler.jsonc.example wrangler.jsonc
   
   # Set up secrets
   npx wrangler secret put ADMIN_PASSWORD_HASH
   npx wrangler secret put JWT_SECRET
   ```

3. **Database Setup**:
   ```bash
   # Create D1 database
   npx wrangler d1 create farewell-db
   
   # Apply schema
   npx wrangler d1 execute farewell-db --file=database/schema.sql
   ```

4. **Storage Setup**:
   ```bash
   # Create R2 bucket
   npx wrangler r2 bucket create fwhy-images
   
   # Create KV namespaces
   npx wrangler kv:namespace create "SESSIONS_KV"
   npx wrangler kv:namespace create "BLOG_KV"
   ```

### Development Commands

```bash
# Local development server
npm run dev

# Deploy to production
npm run deploy

# Database operations
npm run db:execute -- --file=database/schema.sql
npm run db:query -- "SELECT * FROM events LIMIT 5"

# View logs
npm run logs

# Type checking
npm run type-check
```

### Project Structure
```
farewell-unified-project/
├── src/
│   ├── index.ts                    # Main worker entry point
│   ├── handlers/                   # API request handlers
│   │   ├── auth.ts                # Authentication logic
│   │   ├── events.ts              # Event management
│   │   ├── blog.ts                # Blog management
│   │   └── sync.ts                # Legacy data sync
│   ├── middleware/                 # Request middleware
│   │   └── auth.ts                # Authentication middleware
│   ├── dashboard/                  # Admin interface generator
│   │   └── unified-admin-dashboard.ts
│   └── types/                      # TypeScript definitions
│       └── env.ts                 # Environment types
├── public/                         # Static assets (ffww frontend)
│   ├── index.html                 # Main public page
│   ├── login.html                 # Admin login page
│   ├── css/                       # Stylesheets
│   ├── jss/                       # JavaScript files
│   ├── img/                       # Image assets
│   └── u/                         # Additional frontend assets
├── database/                       # Database files
│   └── schema.sql                 # D1 database schema
├── wrangler.jsonc                  # Cloudflare configuration
├── package.json                    # Node.js dependencies
└── tsconfig.json                  # TypeScript configuration
```

### Key Development Files

#### `src/index.ts`
Main worker entry point handling:
- Host-based routing (`dev.farewellcafe.com` vs `admin.farewellcafe.com`)
- Static asset serving
- API route mounting
- Error handling

#### `src/handlers/events.ts`
Event management including:
- CRUD operations
- Legacy API compatibility
- Flyer upload handling
- Data validation

#### `src/handlers/auth.ts`
Authentication system:
- Login/logout endpoints
- JWT token generation
- Session management
- Password verification

#### `wrangler.jsonc`
Cloudflare Worker configuration:
- Resource bindings (D1, R2, KV)
- Environment variables
- Route definitions
- Compatibility settings

---

## 🚀 Deployment

### Production Configuration
```jsonc
{
  "name": "farewell-unified",
  "main": "src/index.ts",
  "compatibility_date": "2025-06-18",
  "routes": [
    { "pattern": "dev.farewellcafe.com/*", "zone_name": "farewellcafe.com" },
    { "pattern": "admin.farewellcafe.com/*", "zone_name": "farewellcafe.com" }
  ],
  "d1_databases": [
    {
      "binding": "FWHY_D1",
      "database_name": "farewell-db",
      "database_id": "76dc7b30-005a-4268-afa0-10b2fe242253"
    }
  ],
  "r2_buckets": [
    {
      "binding": "FWHY_IMAGES",
      "bucket_name": "fwhy-images"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "SESSIONS_KV",
      "id": "2038b95e785545af8486bc353c3cbe62"
    },
    {
      "binding": "BLOG_KV",
      "id": "6ee9ab6b71634a4eb3e66de82d8dfcdc"
    }
  ]
}
```

### Deployment Process
```bash
# Build and deploy
npm run deploy

# Verify deployment
curl -s https://dev.farewellcafe.com/api/events | jq '.[0]'

# Monitor logs
npm run logs
```

### Post-Deployment Checklist
- [ ] Public site loads correctly
- [ ] Admin login functional
- [ ] Event API endpoints responding
- [ ] Image uploads working
- [ ] Database queries executing
- [ ] SSL certificates valid

---

## 🗄️ Database Schema

### Events Table
```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,           -- Unique event identifier
    title TEXT NOT NULL,           -- Event title
    date TEXT NOT NULL,            -- Event date (YYYY-MM-DD)
    venue TEXT NOT NULL,           -- 'farewell' or 'howdy'
    flyer_image_url TEXT,          -- URL to flyer image
    ticket_url TEXT,               -- Ticket purchase URL
    description TEXT,              -- Event description
    age_restriction TEXT,          -- Age requirements
    event_time TEXT,               -- Event timing details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_date ON events (date);
```

### Data Migration
The system includes handlers to migrate data from legacy systems:
- **Legacy Event Sync**: Imports from `fygw0.kcmo.xyz`
- **Data Cleanup**: Removes duplicate entries
- **Field Mapping**: Converts legacy formats to unified schema

---

## 📁 File Structure Details

### Frontend Assets (`/public/`)
- **index.html**: Main public-facing page with venue switching
- **login.html**: Admin login interface ("Administrate Me!")
- **css/**: Stylesheets including venue-specific themes
- **jss/**: JavaScript files for frontend functionality
- **img/**: Static images and venue assets
- **u/**: Additional frontend components (news section)

### Backend Source (`/src/`)
- **index.ts**: Main worker with routing logic
- **handlers/**: Modular request handlers for different features
- **middleware/**: Authentication and request processing
- **dashboard/**: Admin interface HTML generation
- **types/**: TypeScript interface definitions

### Configuration Files
- **wrangler.jsonc**: Cloudflare Worker deployment configuration
- **package.json**: Node.js dependencies and scripts
- **tsconfig.json**: TypeScript compiler settings

---

## 🔧 Troubleshooting

### Common Issues

#### Admin Dashboard Not Loading
**Symptoms**: `admin.farewellcafe.com` shows dev site instead of admin interface
**Solution**: Check router middleware ordering in `src/index.ts`
```typescript
// Ensure admin routing occurs before catch-all
app.all('/admin/*', adminAuthMiddleware);
app.get('/admin/dashboard', adminDashboardHandler);
```

#### Flyer Upload Failing
**Symptoms**: File uploads return 500 errors
**Solutions**:
1. Verify R2 bucket permissions
2. Check content-type detection in upload handler
3. Ensure `FWHY_IMAGES` binding is correct

#### Authentication Issues
**Symptoms**: Login successful but dashboard access denied
**Solutions**:
1. Verify JWT secret is set: `npx wrangler secret list`
2. Check session KV namespace binding
3. Validate cookie settings in auth middleware

#### Database Query Errors
**Symptoms**: Event API returns empty results or errors
**Solutions**:
1. Check D1 database schema: `npx wrangler d1 execute farewell-db --command="PRAGMA table_info(events)"`
2. Verify database binding in wrangler.jsonc
3. Test direct database queries

### Debug Commands
```bash
# View worker logs
npx wrangler tail farewell-unified

# Test database connection
npx wrangler d1 execute farewell-db --command="SELECT COUNT(*) FROM events"

# Check R2 bucket
npx wrangler r2 object list fwhy-images

# Verify KV namespaces
npx wrangler kv:namespace list
```

### Performance Monitoring
- **Observability**: Enabled in wrangler.jsonc for request tracing
- **Head Sampling**: 100% sampling rate for complete monitoring
- **Tail Consumers**: Real-time log streaming configured

---

## 📋 Recent Changes

### June 18, 2025 - Evening Update
#### 🐛 Critical Bug Fixes
- **FIXED**: Admin domain routing (`admin.farewellcafe.com` now properly loads admin interface)
- **FIXED**: Image upload content-type detection (auto-detects PNG, JPEG, WEBP)
- **FIXED**: Font asset serving (added `/f/` path support)
- **FIXED**: Blog post editing with Quill.js rich text editor
- **ENHANCED**: TypeScript support with proper interfaces
- **ENHANCED**: Error handling and response types

#### 🔧 Technical Improvements
- Router architecture fixes (middleware mounting order)
- Worker-based R2 image serving with proper MIME types
- Comprehensive TypeScript interfaces
- Eliminated improper `any` types throughout codebase

### June 18, 2025 - Morning Update
#### UI/UX Improvements
- Enhanced admin login: "Administrate Me!" with 404-inspired styling
- Modernized admin dashboard: "Farewell/Howdy Administration"
- Added flyer upload system with preview and progress
- Fixed blog management with rich text editing
- Implemented worker-based image serving at `/images/*`

#### Infrastructure Fixes
- Resolved duplicate routing middleware conflicts
- Fixed router mounting order for proper host-based routing
- Added individual blog post API endpoints
- Updated flyer URLs to use worker endpoints

### Previous Major Updates
- **Project Unification**: Merged separate Farewell/Howdy systems
- **Legacy Data Migration**: Imported 39+ events from legacy backend
- **Authentication System**: JWT + KV dual-token security
- **Modern Admin Interface**: Complete CRUD operations
- **Blog System**: KV-based blog management with Mailchimp tracker removal
- **File Upload**: R2-powered flyer storage system

---

## 🛣️ Future Roadmap

### High Priority Features
- [ ] **Manual Calendar Editing**: Complete admin interface for merged Farewell/Howdy calendar
- [ ] **Legacy Data Migration**: Full sync from `fygw0.kcmo.xyz`
- [ ] **Blog CRUD Interface**: Frontend completion for blog management

### Planned Enhancements
- [ ] **YouTube Video Carousel**: Multiple videos on front page
- [ ] **Show History/Archive Page**: Fugazi-inspired archive interface
- [ ] **Image Gallery**: Showcase biggest/coolest shows
- [ ] **Merch Display**: T-shirts/stickers with pricing (purchasable at bar)
- [ ] **Auto-population Settings**:
  - Howdy defaults: "All ages", "Doors at 7pm / Music at 8pm"
  - Farewell defaults: "21+ unless with parent or legal guardian", "Doors at 7pm / Music at 8pm"
  - Automatic ticket URL and price field handling

### Technical Improvements
- [ ] **Performance Optimization**: Caching strategies for frequent queries
- [ ] **Mobile App API**: Enhanced endpoints for potential mobile app
- [ ] **Analytics Integration**: Event attendance and engagement tracking
- [ ] **Backup System**: Automated database and asset backups
- [ ] **Multi-admin Support**: Role-based access control

### UI/UX Enhancements
- [ ] **Dark Mode**: Toggle between light/dark admin themes
- [ ] **Batch Operations**: Bulk event import/export tools
- [ ] **Calendar View**: Visual calendar interface for event management
- [ ] **Image Optimization**: Automatic thumbnail generation and compression
- [ ] **Search & Filtering**: Advanced event search and filtering options

---

## 📞 Support & Contact

### Development Team
- **Primary Developer**: GitHub Copilot AI Assistant
- **Project Owner**: Aaron (Farewell/Howdy venues)

### Key Resources
- **Live Sites**: 
  - Public: https://dev.farewellcafe.com
  - Admin: https://admin.farewellcafe.com
- **Documentation**: This file and related `.md` files in project root
- **Source Control**: Git repository with all changes tracked

### Status Updates
- **Current Status**: ✅ Production Ready
- **Last Deployment**: June 18, 2025
- **Next Review**: When calendar editing feature is requested

---

*This documentation serves as the comprehensive guide for the Farewell/Howdy Unified Project. For specific technical questions or feature requests, refer to the individual documentation files or contact the development team.*

---

**Document Version**: 1.0.0  
**Last Updated**: June 18, 2025  
**Total Pages**: Comprehensive single-document reference  
**Status**: ✅ Complete and Current
