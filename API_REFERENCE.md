# API Endpoints Documentation

## Overview
This document lists all API endpoints available in the Farewell/Howdy Cloudflare Worker application, organized by functionality.

## Base URLs
- **Public API**: `/api/`
- **Admin API**: `/api/admin/` (requires authentication)

---

## Authentication Endpoints

### Public Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout  
- `GET /api/check` - Check authentication status

### Admin Authentication
- Same endpoints as public, but accessed via admin interface

---

## Public API Endpoints

### Events
- `GET /api/events` - List all public events
- `GET /api/events/slideshow` - Get events for slideshow display
  - Parameters:
    - `includePast` (boolean) - Include past events when set to 'true'
    - `venue` (string) - Filter by venue name
    - `limit` (number) - Maximum number of events to return (default: 20)
- `GET /api/events/:id` - Get specific event by ID (mock endpoint)
- `GET /api/slideshow` - Alternative slideshow endpoint

### Blog/News
- `GET /api/blog` - Get public blog posts
- `GET /api/blog/posts` - Alternative endpoint for blog posts
- `GET /api/blog/featured` - Get featured blog content
- `GET /api/blog/:id` - Get specific blog post by ID

### Menu
- `GET /api/menu` - Get unified menu items (all active items)
- `GET /api/venues/:venue/menu` - Get menu for a specific venue.
- `GET /api/venues/:venue/menu-items` - Get all active menu items, ignoring the venue parameter.

### Featured Content
- `GET /api/featured` - Get main featured content
- `GET /api/venues/:venue/featured` - Get venue-specific featured content (mock endpoint, returns an empty array)

### Business Hours
- `GET /api/hours` - Get business hours for all venues

### Health Check
- `GET /api/health` - API health check

---

## Admin API Endpoints

### Events Management
- `GET /api/admin/events` - List all events (admin view)
- `POST /api/admin/events` - Create new event
- `PUT /api/admin/events/:id` - Update existing event
- `DELETE /api/admin/events/:id` - Delete event
- `POST /api/admin/events/flyer` - Upload event flyer image
- `POST /api/admin/events/sync` - Synchronize events (specific functionality may vary)

### Blog Management
- `GET /api/admin/blog/posts` - List all blog posts (admin view)
- `POST /api/admin/blog/posts` - Create new blog post
- `POST /api/admin/blog` - Alias for creating a new blog post
- `PUT /api/admin/blog/posts/:id` - Update existing blog post
- `PUT /api/admin/blog/:id` - Alias for updating an existing blog post
- `DELETE /api/admin/blog/posts/:id` - Delete blog post
- `DELETE /api/admin/blog/:id` - Alias for deleting a blog post
- `GET /api/admin/blog/featured` - Get featured blog content (admin)
- `POST /api/admin/blog/featured` - Set featured blog content
- `POST /api/admin/blog/upload-image` - Upload blog post image

### Menu Management
- `GET /api/admin/venues/:venue/menu` - Get menu info for venue (mock endpoint)
- `POST /api/admin/venues/:venue/menu` - Create new menu for venue (mock endpoint)
- `PUT /api/admin/venues/:venue/menu/:id` - Update menu info (mock endpoint)
- `DELETE /api/admin/venues/:venue/menu/:id` - Delete menu (restricted, mock endpoint)
- `GET /api/admin/menu-items` - Get all menu items for the single-menu system
- `POST /api/admin/menu-items` - Create new menu item
- `PUT /api/admin/menu-items/:id` - Update menu item
- `DELETE /api/admin/menu-items/:id` - Delete menu item
- `GET /api/admin/venues/:venue/menu-items` - Get all menu items for the single-menu system, ignoring the venue parameter
- `POST /api/admin/venues/:venue/menu-items` - Create a new menu item, ignoring the venue parameter
- `POST /api/admin/menu-items/reorder` - Reorder menu items
- `POST /api/admin/menu-items/upload-image` - Upload menu item image

### Business Hours Management
- `POST /api/admin/hours` - Create/update business hours
- `PUT /api/admin/hours/:id` - Update specific hours entry
- `DELETE /api/admin/hours/:id` - Delete hours entry

### Featured Content Management
- `GET /api/admin/featured` - Get featured content (admin view)
- `POST /api/admin/featured` - Update featured content

### Migration & Maintenance
- `POST /api/admin/migrate/events` - Run events schema migration
- `POST /api/admin/menu/cleanup` - Clean up duplicate menu items

### Health Check
- `GET /api/admin/health` - Admin API health check

---

## Image Serving

### Public Images
- `GET /images/*` - Serve images from R2 storage
  - Public images: accessible to all
  - Private images (admin/*): require authentication
  - Security features: extension validation, path traversal protection

---

## Legacy Endpoints (Backward Compatibility)
- `GET /list/:state` - Legacy event listing by venue
- `GET /archives` - Legacy archives view

---

## Response Format

All API endpoints return JSON responses in this format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": "Optional additional details"
}
```

### HTTP Status Codes

The API uses the following HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authenticated user doesn't have permission
- `404 Not Found` - Resource or endpoint not found
- `500 Internal Server Error` - Server-side error

### 404 Error Handling

The API uses two approaches to 404 errors:

1. **API Endpoint Not Found** - When a non-existent API endpoint is requested, returns:
```json
{
  "success": false,
  "error": "API endpoint not found"
}
```
With HTTP status code 404.

2. **Resource Not Found** - When a specific resource (event, menu item, etc.) is not found:
```json
{
  "success": false,
  "error": "Resource not found",
  "details": "The requested [resource_type] could not be found"
}
```
With HTTP status code 404.

---

## Frontend-Backend Mapping

### Admin Dashboard JavaScript Files
- `admin-unified.js` - Main admin functionality
- `menu-management.js` - Menu CRUD operations
- `featured-videos-manager.js` - Featured videos management
- `event-form-patch.js` - Event form handling

### Public Site JavaScript Files
- `script.js` - Main public site functionality  
- `menu-renderer.js` - Public menu display
- `news.js` - Blog/news page functionality

---

## Database Schema Dependencies

### Tables Used
- `events` - Event data with columns: id, title, description, date, venue, flyer_image_url, ticket_url
- `menu_items` - Menu items with columns: id, name, description, price, category, active, display_order
- `blog_posts` - Blog posts with columns: id, title, content, author, featured_image_url, created_at
- `business_hours` - Hours data with columns: id, venue, day_of_week, open_time, close_time, is_closed
- `featured_content` - Featured content with columns: id, venue, content_type, content_data

### KV Stores Used
- `SESSIONS_KV` - User session management
- `FWHY_D1` - Main database (D1)
- `FWHY_IMAGES` - Image storage (R2)

---

## Security Features

### Authentication
- JWT-based session management
- Session blocklist for logout
- Admin route protection via middleware

### Image Security
- File extension validation
- Path traversal protection
- Authorization checks for private images
- Content-Type validation

### Input Validation
- Form data sanitization
- SQL injection prevention via prepared statements
- File upload size/type restrictions

---

## Recent Changes & Fixes

### Added Missing Endpoints
1. `GET /api/admin/blog/featured` - Admin access to featured blog content
2. `POST /api/admin/migrate/events` - Events schema migration
3. `GET|POST|PUT|DELETE /api/admin/venues/:venue/menu` - Menu CRUD operations
4. `POST /api/admin/menu-items/upload-image` - Menu item image uploads

### Fixed Inconsistencies
1. Standardized response format across all endpoints
2. Added proper error handling and validation
3. Unified menu item handling (single menu approach)
4. Consistent authentication middleware application

---

## Testing Checklist

### Admin Dashboard
- [ ] Event creation/editing/deletion
- [ ] Blog post creation/editing/deletion  
- [ ] Menu item management (CRUD)
- [ ] Featured videos management
- [ ] Image uploads (events, blog, menu items)
- [ ] Business hours management

### Public Site
- [ ] Event slideshow display
- [ ] Blog/news page functionality
- [ ] Menu display from API
- [ ] Featured content carousel
- [ ] Business hours display

### API Consistency
- [ ] All frontend API calls match backend endpoints
- [ ] Error responses are handled gracefully
- [ ] Authentication works across all admin endpoints
- [ ] Image uploads populate URL fields correctly

---

Last Updated: July 9, 2025
