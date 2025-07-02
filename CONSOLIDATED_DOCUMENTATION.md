# Farewell/Howdy Unified Project Documentation

This document consolidates all documentation for the Farewell/Howdy Unified Project, providing a comprehensive reference for developers and administrators.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Feature Documentation](#feature-documentation)
   - [Authentication System](#authentication-system)
   - [Event Management](#event-management)
   - [Blog System](#blog-system)
   - [Menu Management System](#menu-management-system)
   - [Business Hours Management](#business-hours-management)
   - [Featured Content Management](#featured-content-management)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Development Guide](#development-guide)
7. [Deployment Instructions](#deployment-instructions)
8. [Recent Updates & Fixes](#recent-updates--fixes)
9. [Project Status & Roadmap](#project-status--roadmap)

---

## Project Overview

The Farewell/Howdy Unified Project is a comprehensive content management system for the Farewell and Howdy venues in Kansas City, MO. It provides an admin dashboard for managing events, blog posts, venue settings, business hours, and the drinks/food menu.

### Core Features

- **Admin Dashboard**: Central management interface for all content
- **Event Management**: Create, edit, and delete events with flyer uploads
- **Blog System**: Blog post creation with rich text editor and image uploads
- **Menu Management**: Edit food and drink menus while preserving unique style
- **Business Hours**: Configure operating hours for each venue
- **Featured Content**: Manage featured videos and announcements
- **Image Management**: Upload and manage images for events, blog posts, etc.

### Tech Stack

- **Frontend**: HTML, CSS, JavaScript
  - Responsive design with CSS Grid and Flexbox
  - Single Page Application (SPA) architecture
  - Quill.js for rich text editing
- **Backend**: Cloudflare Workers (TypeScript)
  - RESTful API architecture
  - JWT-based authentication
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for image uploads
- **Deployment**: Cloudflare Workers deployment via Wrangler CLI

---

## Technical Architecture

### Backend Architecture

The backend is built on Cloudflare Workers with TypeScript, providing a serverless architecture with the following components:

1. **Routing System**
   - Main router in `src/index.ts`
   - Path-based routing for API endpoints
   - Method-based routing (GET, POST, PUT, DELETE)

2. **Handlers**
   - Specialized handlers for each feature area
   - Located in `src/handlers/` directory
   - Modular design for maintainability

3. **Authentication**
   - JWT-based authentication
   - Token validation middleware
   - Protected routes for admin operations

4. **Database**
   - Cloudflare D1 (SQLite-compatible)
   - Structured data storage for all content
   - Defined schema in `database/schema.sql`

5. **Storage**
   - Cloudflare R2 for binary storage
   - Used for images, event flyers, etc.
   - Secured access controls

### Frontend Architecture

The frontend uses a modular JavaScript approach with the following structure:

1. **Admin Dashboard**
   - Centralized admin interface
   - Tab-based navigation
   - Feature-specific sections
   - Located in `public/admin.html` and `public/jss/admin-unified.js`

2. **Public Site**
   - Separate components for events, blog, menu, etc.
   - Responsive design for all devices
   - Dynamic content loading from API endpoints

3. **Shared Components**
   - Reusable UI elements
   - Common styling through shared CSS
   - Utility functions for common operations

### File Structure

```
├── database/           # Database schema and scripts
├── public/             # Public frontend assets
│   ├── css/            # Stylesheets
│   ├── img/            # Static images
│   ├── jss/            # JavaScript files
│   └── u/              # Blog/news system
├── src/                # Backend TypeScript code
│   ├── handlers/       # API endpoint handlers
│   ├── middleware/     # Middleware functions
│   └── types/          # TypeScript type definitions
└── wrangler.jsonc      # Cloudflare configuration
```

---

## Feature Documentation

### Authentication System

The authentication system provides secure access to the admin dashboard and API endpoints.

#### Features

- JWT-based authentication
- Secure password storage
- Role-based access control
- Session management with expiration
- Token invalidation on logout

#### User Flow

1. Admin navigates to `/admin.html`
2. Enters credentials in the login form
3. Upon successful authentication, receives JWT token
4. Token is stored in cookies and used for subsequent requests
5. Protected routes check for valid token
6. On logout, token is invalidated

#### Implementation Details

- Login endpoint: `/api/login` (POST)
- Logout endpoint: `/api/logout` (POST)
- Auth check endpoint: `/api/check` (GET)
- JWT token stored in cookies with HTTP-only flag
- Token validation middleware for protected routes

### Event Management

The event management system allows administrators to create, edit, and delete events for both venues.

#### Features

- Create/edit/delete events
- Upload event flyers
- Filter events by venue
- Sort events by date
- Mark events as past/upcoming automatically
- Event archives for historical reference

#### Admin Interface

- Events tab in admin dashboard
- Table view of all events
- Form for creating/editing events
- Image upload for event flyers
- Date and time picker for event scheduling

#### Public Display

- Modal-based event display on the public site
- Filter by venue (Farewell/Howdy)
- Automatic past/upcoming categorization
- Detailed view with flyer images

#### Implementation Details

- Events stored in `events` table in D1
- Flyer images stored in R2 with references in the database
- Events automatically categorized as past/upcoming based on date
- Event dates use Central Time zone for consistency

### Blog System

The blog system provides a platform for publishing posts and featured content.

#### Features

- Create/edit/delete blog posts
- Rich text editing with Quill
- Image upload and embedding
- Featured content management
- YouTube video carousel

#### Admin Interface

- Blog tab in admin dashboard
- Post management table
- Quill editor for post content
- Image upload functionality
- Featured content management
- YouTube URL management

#### Public Display

- Blog/news page with all posts
- Featured content at the top
- YouTube video carousel
- Responsive design for all devices

#### Implementation Details

- Posts stored in `blog_posts` table
- Featured content stored in `featured_content` table
- Images stored in R2 with references in the database
- YouTube URLs stored as comma-separated values for carousel
- Posts displayed in reverse chronological order (newest first)

### Menu Management System

The menu management system allows editing the drinks and food menu while preserving its unique style.

#### Features

- Create/edit/delete menu items
- Organize items by category
- Set pricing information
- Preserve unique menu styling
- Active/inactive status for items

#### Admin Interface

- Menu management section in Venue Settings
- Add/edit/delete menu items
- Category organization
- Price management
- Active status toggle

#### Public Display

- Dynamic menu rendering from database
- Fallback to static content if needed
- Preserved styling and layout
- Category-based organization

#### Implementation Details

- Menu structure stored in `menus` and `menu_items` tables
- Categories defined in the database
- Items linked to menus with foreign keys
- Active items filtered for public display
- Fallback mechanism ensures menu always displays

### Business Hours Management

The business hours management system allows configuring operating hours for each venue.

#### Features

- Set hours for each day of the week
- Different hours for each venue
- Special hours for holidays/events
- Closed day management

#### Admin Interface

- Hours management in Venue Settings
- Day-by-day configuration
- Open/close time settings
- Closed day toggle

#### Public Display

- Hours displayed on the public site
- Day-by-day breakdown
- Responsive design for all devices
- Highlighting for current day

#### Implementation Details

- Hours stored in `business_hours` table
- Separate entries for each venue and day
- Special handling for closed days
- Fallback to default hours if needed

### Featured Content Management

The featured content system allows managing special announcements and featured videos.

#### Features

- Text announcements
- YouTube video embedding
- Multi-video carousel
- Featured content prioritization

#### Admin Interface

- Featured content section in Blog tab
- Text input for announcements
- YouTube URL input for videos
- Multi-video support with ordering

#### Public Display

- Featured content at the top of the blog page
- YouTube video carousel with navigation
- Responsive design for all devices

#### Implementation Details

- Featured content stored in `featured_content` table
- YouTube URLs stored as comma-separated values
- Carousel created dynamically from multiple URLs
- Text and videos can be used together or separately

---

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/login` | POST | User login | None |
| `/api/logout` | POST | User logout | Required |
| `/api/check` | GET | Check auth status | None |

### Event Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/events` | GET | List all events | None |
| `/api/events/slideshow` | GET | Get slideshow events | None |
| `/api/list/:state` | GET | Get venue events | None |
| `/api/archives` | GET | Get archived events | None |
| `/api/admin/events` | GET | Admin list events | Required |
| `/api/admin/events` | POST | Create event | Required |
| `/api/admin/events/:id` | PUT | Update event | Required |
| `/api/admin/events/:id` | DELETE | Delete event | Required |
| `/api/admin/events/flyer` | POST | Upload flyer | Required |

### Blog Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/blog/posts` | GET | Get public posts | None |
| `/api/blog/featured` | GET | Get featured content | None |
| `/api/admin/blog/posts` | GET | List all posts | Required |
| `/api/admin/blog/posts` | POST | Create post | Required |
| `/api/admin/blog/posts/:id` | GET | Get specific post | Required |
| `/api/admin/blog/posts/:id` | PUT | Update post | Required |
| `/api/admin/blog/posts/:id` | DELETE | Delete post | Required |
| `/api/admin/blog/featured` | POST | Update featured | Required |
| `/api/admin/blog/upload-image` | POST | Upload image | Required |

### Menu Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/venues/:venue/menu` | GET | Get venue menu | None |
| `/api/admin/venues/:venue/menu` | GET | Admin get menu | Required |
| `/api/admin/venues/:venue/menu` | POST | Create menu section | Required |
| `/api/admin/menu/:id` | GET | Get menu items | Required |
| `/api/admin/venues/:venue/menu-items` | POST | Create menu item | Required |
| `/api/admin/menu-items/:id` | PUT | Update menu item | Required |
| `/api/admin/menu-items/:id` | DELETE | Delete menu item | Required |

### Hours Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/hours` | GET | Get all hours | None |
| `/api/venues/:venue/hours` | GET | Get venue hours | None |
| `/api/admin/venues/:venue/hours` | PUT | Update hours | Required |

### Featured Content Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/featured` | GET | Get featured content | None |
| `/api/admin/featured` | GET | Admin get featured | Required |
| `/api/admin/featured` | POST | Update featured | Required |

### Image Serving

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/images/*` | GET | Serve images from R2 | Varies |

---

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

8. **Help Section**
   - Documentation and instructions
   - FAQ for common tasks

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

---

## Development Guide

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers, D1, and R2 access

### Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npx wrangler dev --local
   ```

4. Access the admin dashboard at `http://localhost:8787/admin.html`
   - Default login: username `admin` or `anmid`

### Database Operations

The project uses Cloudflare D1 as its database. For local development, Wrangler creates a local SQLite database.

To run database commands:

```bash
# Query local database
npx wrangler d1 execute farewell-db --command "SELECT * FROM users;"

# Query remote database
npx wrangler d1 execute farewell-db --command "SELECT * FROM users;" --remote
```

### Code Structure

1. **Backend (TypeScript)**
   - `src/index.ts`: Main routing and application setup
   - `src/handlers/`: API endpoint handlers
   - `src/middleware/`: Middleware functions
   - `src/types/`: TypeScript type definitions

2. **Frontend (JavaScript/HTML/CSS)**
   - `public/admin.html`: Admin dashboard shell
   - `public/jss/admin-unified.js`: Admin dashboard functionality
   - `public/css/`: Stylesheets
   - `public/u/`: Blog/news system

### Best Practices

1. **Authentication**
   - Always use the auth middleware for protected routes
   - Validate user input to prevent injection attacks
   - Use HTTP-only cookies for JWT tokens

2. **Error Handling**
   - Implement try/catch blocks for async operations
   - Return appropriate HTTP status codes
   - Provide meaningful error messages

3. **Security**
   - Sanitize HTML input to prevent XSS
   - Validate file uploads for type and size
   - Implement CSRF protection for forms

---

## Deployment Instructions

### Deployment to Cloudflare

To deploy the application to Cloudflare Workers:

1. Ensure you have the Wrangler CLI installed:

   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:

   ```bash
   wrangler login
   ```

3. Deploy the application:

   ```bash
   npx wrangler deploy
   ```

### Database Migration

To update the database schema:

1. Modify the schema in `database/schema.sql`
2. Apply changes to the local database:

   ```bash
   npx wrangler d1 execute farewell-db --file=database/schema.sql
   ```

3. Apply changes to the remote database:

   ```bash
   npx wrangler d1 execute farewell-db --file=database/schema.sql --remote
   ```

### R2 Storage Setup

For image uploads, ensure R2 storage is configured:

1. Create an R2 bucket in your Cloudflare dashboard
2. Update the `wrangler.jsonc` file with your bucket information
3. Configure CORS settings for the bucket if needed

---

## Recent Updates & Fixes

### Public Blog and Featured Content Fix (July 1, 2025)

- **Status**: ✅ Fixed
- **Description**: Fixed 404 errors on the blog and news page where posts and featured content weren't loading.
- **Implementation Details**:
  - Added missing public API endpoints for `/blog/posts` and `/blog/featured`
  - Fixed font file paths in the public blog CSS to use the correct directory
  - Ensured proper error handling for API failures
  - Added cross-compatibility between admin and public endpoints
  - Improved accessibility for non-loading content
  - Enhanced console logging for easier debugging

### URL Handling Fix for Event and Blog Images (July 1, 2025)

- **Status**: ✅ Fixed
- **Description**: Fixed the image upload functionality to properly handle URLs for display and backend storage.
- **Implementation Details**:
  - Improved URL processing to show full URLs (with domain) in the UI for better usability
  - Added proper URL conversion before form submission to maintain backend compatibility
  - Enhanced error handling for URL parsing and conversion
  - Added comprehensive logging for debugging URL processing
  - Fixed backend communication to ensure proper URL formats are used throughout the application

### Menu Management UI Fix (July 1, 2025)

- **Status**: ✅ Fixed
- **Description**: Fixed the admin menu management UI where buttons were not working and menu wasn't loading for editing.
- **Implementation Details**:
  - Added missing helper functions to menu-management.js
  - Fixed incorrect API endpoint usage for menu deletion and updates
  - Added comprehensive logging for easier debugging
  - Added missing API routes in index.ts for menu updates and deletion
  - Added inline CSS styles for modals and menu components
  - Fixed error handling throughout the menu management code
  - Improved user feedback with better error messages

### Menu System Unification (July 1, 2025)

- **Status**: ✅ Implemented
- **Description**: Verified and ensured full compatibility between admin menu management, backend API, and public menu display.
- **Implementation Details**:
  - Confirmed the admin menu management interface correctly saves menu items with active=1
  - Verified backend API endpoints in menu.ts properly handle all CRUD operations
  - Ensured menu-renderer.js correctly processes menu items from the database
  - Validated the unified menu endpoint (/api/menu) works with the same data structure
  - Fixed menu display by updating all items to active=1 in the database
  - Created consistent category structure across all components

For a full list of recent updates and fixes, see [RECENT_IMPLEMENTATIONS.md](RECENT_IMPLEMENTATIONS.md).

---

## Project Status & Roadmap

### Current Status (July 1, 2025)

The project has made significant progress and most core features are implemented and working:

1. **Admin Dashboard**
   - ✅ Authentication system with role-based access
   - ✅ Event management (create, edit, delete, upload flyers)
   - ✅ Blog post management with rich text editor
   - ✅ Featured content/videos management
   - ✅ Business hours management
   - ✅ Menu management

2. **Public Website**
   - ✅ Events display with filtering
   - ✅ Blog/news page with featured content carousel
   - ✅ Menu page with dynamic rendering
   - ✅ Business hours display
   - ✅ Mobile-responsive design

### Future Enhancements

1. **Image Gallery**
   - Create a page for an image gallery showcasing biggest/coolest shows
   - Implement storage and management for gallery images

2. **Show History/Archive Page**
   - Build a comprehensive archive page for past shows
   - Include storage for historical event information
   - Use Fugazi archive as inspiration

3. **Webstore Integration**
   - Add photos and information about Farewell and Howdy merchandise
   - Include prices and purchasing information
   - Potentially add e-commerce functionality

4. **Performance Optimizations**
   - Image optimization pipeline
   - Caching improvements
   - Code splitting for faster loads

5. **Security Enhancements**
   - Rate limiting for sensitive endpoints
   - Enhanced CSRF protection
   - Regular security audits

For a full breakdown of the project status and roadmap, see [PROJECT_CHECKLIST_AND_ROADMAP.md](PROJECT_CHECKLIST_AND_ROADMAP.md).

---

**Last Updated**: July 2, 2025
