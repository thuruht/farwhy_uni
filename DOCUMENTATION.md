# Farewell/Howdy Admin Dashboard Documentation

## Overview

This document describes the Farewell/Howdy Admin Dashboard, a web application for managing events, blog posts, and venue settings for the Farewell and Howdy platforms.

## Project Structure

The Farewell/Howdy Admin Dashboard is a Cloudflare Workers project with the following structure:

```
/
├── database/
│   └── schema.sql       # Database schema
├── public/              # Static assets and frontend code
│   ├── admin.html       # Main admin dashboard HTML
│   ├── css/
│   │   └── admin-redesigned.css  # Admin dashboard styles
│   ├── img/             # Image assets
│   ├── jss/
│   │   └── admin-unified.js  # Main admin dashboard JavaScript
│   ├── u/               # User-facing pages
├── src/                 # Backend code
│   ├── index.ts         # Main entry point
│   ├── dashboard/       # Admin dashboard API handlers
│   ├── handlers/        # API request handlers
│   ├── middleware/      # Authentication middleware
│   └── types/           # TypeScript type definitions
└── wrangler.jsonc       # Cloudflare Workers configuration
```

## Database Structure

The application uses Cloudflare D1 as its database. Key tables include:

- `users` - Admin user accounts
  - Fields: id, username, password_hash, role, created_at, updated_at
- `events` - Event listings for Farewell and Howdy venues
  - Contains approximately 39 events as of latest check
- `blog_posts` - Blog content
  - Currently contains new test posts created during debugging

## Authentication

The admin dashboard uses session-based authentication with a JWT stored in cookies:

1. Users authenticate via the login form
2. Successful login stores a `sessionToken` cookie
3. Protected routes verify this token via the authentication middleware
4. The token contains the username and role of the authenticated user

## Admin Dashboard Features

### User Interface Components

- **Sidebar Navigation**: Access different sections (Dashboard, Events, Blog, Venue Settings, Import)
- **Mobile Menu Toggle**: Responsive design for mobile devices
- **Modal System**: For forms and interactive elements
- **Toast Notifications**: For feedback and status messages

### Core Functionality

1. **Dashboard**: Overview of site statistics
2. **Events Management**:
   - View all events
   - Add new events
   - Edit existing events
   - Delete events
   - Filter events by venue
3. **Blog Management**:
   - Add blog posts
   - Edit blog posts
   - Filter and search posts
4. **Venue Settings**:
   - Configure venue-specific settings
5. **Legacy Data Import**:
   - Import events from legacy systems

## JavaScript Architecture

The admin dashboard follows a Single Page Application (SPA) pattern:

1. **Core App Logic**: 
   - Login/logout and dashboard rendering
   - State management through the `dashboardState` object

2. **Initialization**: 
   - Setup handlers via `setupEventListeners()` function
   - Load data with `loadInitialData()`, `loadEvents()`, and `loadBlogPosts()`
   - Initialize UI components

3. **API Communication**: 
   - Wrapper for fetch with error handling via the `api` object
   - Support for GET, POST, PUT, and DELETE methods
   - Error handling and authentication checks

4. **Section Management**: 
   - Show/hide different dashboard sections with `showSection()`
   - Modal handling via global event handlers

5. **Event Handlers**: 
   - Global click handlers for modal buttons and actions
   - Form submission handlers for events and blog posts

6. **Form Processing**: 
   - Create and edit forms for events and blog posts
   - Form submission with validation and API calls

## CSS Organization

The CSS is organized into sections:

1. **Variables and Base Styles**: Color scheme and typography
2. **Layout Grid**: Admin panel structure
3. **Sidebar Styles**: Navigation sidebar
4. **Content Area**: Main content display
5. **Modal Styles**: Dialog boxes and forms
6. **Responsive Design**: Mobile adaptations

## Known Issues and Solutions

1. **Modal Display**:
   - Fixed by adding `.modal-overlay.active` CSS rule
   - Enhanced with debugging logs for visibility tracking

2. **Mobile Menu Toggle**:
   - Fixed by adding CSS for `.sidebar.open`
   - Added event listeners for toggle button

3. **API Response Handling**:
   - The `api.post` and `api.put` methods need to properly parse JSON responses
   - Issue: They return the response object instead of the parsed JSON

4. **Event/Blog Form Submissions**:
   - Form visibility works correctly
   - Submission handling needs to be fixed to properly parse API responses
