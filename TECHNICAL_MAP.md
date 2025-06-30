# Farewell/Howdy Unified Project Technical Map

This document provides a comprehensive mapping of the Farewell/Howdy website architecture, including all backend APIs and their corresponding frontend implementations. It serves as a technical reference for developers working on the project.

## Backend API Endpoints

### Authentication

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/api/login` | POST | User login | Admin dashboard login form in `admin-unified.js` |
| `/api/logout` | POST | User logout | Admin dashboard logout button in `admin-unified.js` |
| `/api/check` | GET | Check authentication status | Auth check on admin page load in `admin-unified.js` |

### Events Management

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/api/events` | GET | List all events | Public events display in `events-modal.js`, Admin events list in `admin-unified.js` |
| `/api/events/slideshow` | GET | Get events for slideshow | Homepage slideshow |
| `/api/list/:state` | GET | Get events for specific venue | Venue-specific event listings |
| `/api/archives` | GET | Get archived events | Archives section in events modal |
| `/api/admin/events` | GET | Admin list all events | Admin dashboard events table |
| `/api/admin/events` | POST | Create new event | Event form in admin dashboard |
| `/api/admin/events/:id` | PUT | Update existing event | Edit event form in admin dashboard |
| `/api/admin/events/:id` | DELETE | Delete an event | Delete button in events table |
| `/api/admin/events/flyer` | POST | Upload event flyer | Event form flyer upload |
| `/api/admin/events/sync` | POST | Legacy events sync | Admin import tool |

### Blog Management

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/api/blog/posts` | GET | Get public blog posts | Public blog display in `/public/u/news.js` |
| `/api/blog/featured` | GET | Get featured content | Featured content display in `/public/u/news.js` with enhanced YouTube carousel |
| `/api/admin/blog/posts` | GET | List all posts (admin) | Admin blog post management in admin dashboard |
| `/api/admin/blog/posts` | POST | Create new blog post | Blog post form in admin dashboard with image upload |
| `/api/admin/blog/posts/:id` | GET | Get specific post | Edit post form in admin dashboard |
| `/api/admin/blog/posts/:id` | PUT | Update blog post | Edit post form submission in admin dashboard |
| `/api/admin/blog/posts/:id` | DELETE | Delete blog post | Delete button in admin dashboard blog table |
| `/api/admin/blog/featured` | POST | Update featured content | Featured content form in admin dashboard with multi-video support |
| `/api/admin/blog/upload-image` | POST | Upload blog image | Blog post image uploader in admin dashboard |

### Menu Management

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/api/venues/:venue/menu` | GET | Get menu for venue | Public menu display in `menu-renderer.js` |
| `/api/admin/venues/:venue/menu` | GET | Admin get menu | Menu management in admin dashboard |
| `/api/admin/venues/:venue/menu` | POST | Create menu section | Menu section form in admin dashboard |
| `/api/admin/menu/:id` | GET | Get menu items | Menu items display in admin dashboard |
| `/api/admin/venues/:venue/menu-items` | POST | Create menu item | Menu item form in admin dashboard |
| `/api/admin/menu-items/:id` | PUT | Update menu item | Edit menu item form |
| `/api/admin/menu-items/:id` | DELETE | Delete menu item | Delete button for menu items |

### Business Hours Management

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/api/hours` | GET | Get all business hours | Hours display on public site |
| `/api/venues/:venue/hours` | GET | Get hours for venue | Venue-specific hours display |
| `/api/admin/venues/:venue/hours` | PUT | Update business hours | Hours management form in admin dashboard |

### Featured Content Management

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/api/featured` | GET | Get featured videos/content | Featured content display on public site |
| `/api/admin/featured` | GET | Admin get featured content | Featured content management in admin dashboard |
| `/api/admin/featured` | POST | Update featured content | Featured content form in admin dashboard |

### Image Serving

| Endpoint | Method | Description | Frontend Implementation |
|----------|--------|-------------|-------------------------|
| `/images/*` | GET | Serve images from R2 storage | Used throughout the site for blog images, event flyers, etc. |

## Frontend Components

### Admin Dashboard (`admin-unified.js`)

The admin dashboard is the central management interface for all content. Key components include:

1. **Authentication**
   - Login/logout functionality
   - Session management

2. **Dashboard Overview**
   - Stats and activity summaries
   - Quick action buttons

3. **Events Management**
   - Events listing table
   - Event creation/editing form
   - Flyer image upload

4. **Blog Management**
   - Blog posts listing table
   - Post creation/editing form with Quill editor
   - Image upload functionality
   - Featured content management

5. **Menu Management**
   - Menu sections and items management
   - Item creation/editing forms

6. **Hours Management**
   - Business hours settings form

7. **Featured Videos Management**
   - YouTube video embedding
   - Featured content text editing

### Public Site Components

1. **Events Display (`events-modal.js`)**
   - Interactive events modal
   - Venue filtering
   - Upcoming/past events toggle
   - Event details display with flyers

2. **Blog Display (`news.js`)**
   - Blog posts listing
   - Featured content display
   - YouTube video embedding

3. **Menu Display (`menu-renderer.js`)**
   - Dynamic menu rendering
   - Categorized menu items
   - Fallback to static content

4. **Business Hours Display**
   - Venue-specific hours
   - Day-by-day breakdown

## File Structure

### Backend (TypeScript)

- `src/index.ts` - Main routing and application setup
- `src/handlers/` - API endpoint handlers
  - `auth.ts` - Authentication logic
  - `blog.ts` - Blog/featured content endpoints
  - `events.ts` - Events management endpoints
  - `menu.ts` - Menu management endpoints
  - `hours.ts` - Business hours endpoints
  - `featured.ts` - Featured content endpoints
  - `sync.ts` - Data synchronization utilities
- `src/middleware/` - Middleware functions
  - `auth.ts` - Authentication middleware
- `src/types/` - TypeScript type definitions
  - `env.ts` - Environment and data type definitions

### Frontend (JavaScript/HTML/CSS)

- `public/` - Public assets
  - `index.html` - Main public site
  - `admin.html` - Admin dashboard shell
  - `css/` - Stylesheets
    - `literary-admin.css` - Admin UI styling
    - `unified-buttons.css` - Standardized button styles
  - `jss/` - JavaScript files
    - `admin-unified.js` - Admin dashboard functionality
    - `events-modal.js` - Public events modal
    - `script.js` - Main site functionality
  - `menu/` - Menu-related files
    - `index.html` - Menu page
    - `menu-renderer.js` - Dynamic menu rendering
  - `u/` - Blog/news section
    - `index.html` - Blog page shell
    - `news.js` - Blog functionality
    - `news.css` - Blog styling

## Integration Points

This section identifies key integration points between different components of the system:

1. **Authentication Flow**
   - JWT tokens stored in cookies
   - Auth middleware for protected routes
   - Admin-only sections gated by auth checks

2. **Image Upload/Display Pipeline**
   - Client-side image upload via forms
   - Server-side storage in R2
   - Image URL references in database
   - Image serving via `/images/*` endpoint

3. **Admin/Public Content Flow**
   - Content created/edited in admin dashboard
   - Public endpoints filter content for display
   - Caching mechanisms for performance

4. **Error Handling**
   - Client-side error displays
   - Server-side error logging
   - Fallback mechanisms for critical components

## Deployment Architecture

- **Frontend**: Static assets served from Cloudflare Workers
- **Backend**: Cloudflare Workers running TypeScript
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for images and assets
- **Authentication**: Custom JWT implementation

## Development Workflow

1. Local development using Wrangler
2. Testing with mock data
3. CI/CD via GitHub Actions
4. Deployment to Cloudflare

## Future Enhancements

1. **Howdy Thrift Store Admin**
   - Separate admin interface
   - Custom authentication
   - Dedicated subdomain (howdythrift.farewellcafe.com)

2. **Performance Optimizations**
   - Image optimization pipeline
   - Caching improvements
   - Code splitting for faster loads

3. **Security Enhancements**
   - Rate limiting for sensitive endpoints
   - Enhanced CSRF protection
   - Regular security audits
