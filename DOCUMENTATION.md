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
  - Contains 39 events as of latest check
- `blog_posts` - Blog content
  - Currently empty

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

1. **Core App Logic**: Login/logout and dashboard rendering
2. **Initialization**: Setup handlers, load data, initialize UI
3. **API Communication**: Wrapper for fetch with error handling
4. **Section Management**: Show/hide different dashboard sections
5. **Event Handlers**: Global click handlers for modal buttons and actions
6. **Form Processing**: Create and edit forms for events and blog posts

## CSS Organization

The CSS is organized into sections:

1. **Variables and Base Styles**: Color scheme and typography
2. **Layout Grid**: Admin panel structure
3. **Sidebar Styles**: Navigation sidebar
4. **Content Area**: Main content display
5. **Modal Styles**: Dialog boxes and forms
6. **Responsive Design**: Mobile adaptations

## Key JavaScript Functions

- `showLoginScreen()`: Displays the login form
- `showDashboard()`: Renders the main dashboard after login
- `initializeDashboard()`: Sets up dashboard components
- `setupModal()`: Initializes modal dialog functionality
- `loadEvents()`: Fetches and displays events
- `showEventForm()`: Displays the event creation/editing form
- `loadBlogPosts()`: Fetches and displays blog posts
- `showBlogForm()`: Displays the blog post creation/editing form

## Mobile Responsiveness

The admin dashboard is responsive with:

- A collapsible sidebar that transforms into a mobile menu
- Fluid layouts that adapt to screen size
- Touch-friendly controls
- Mobile-optimized forms

## Troubleshooting

Common issues and solutions:

1. **Modal Not Appearing**:
   - Ensure the CSS includes `.modal-overlay.active { display: flex; }`
   - Check that `modal.classList.add('active')` is being called

2. **Mobile Menu Not Working**:
   - Verify CSS includes proper `.sidebar.open` styling
   - Confirm the mobile toggle click handler is attached

3. **User Information Not Displaying**:
   - Check network requests to ensure authentication is successful
   - Verify the `currentUser` object is properly populated

## Development

To run the project locally:

```bash
npx wrangler dev --local
```

To query the database:

```bash
npx wrangler d1 execute farewell-db --command "SELECT * FROM users;" --remote
```
