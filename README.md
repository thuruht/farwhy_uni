# Farewell/Howdy Unified Project

A unified administration dashboard for the Farewell and Howdy venues in Kansas City, MO.

## Overview

This project contains the admin dashboard and APIs for managing events, blog posts, venue settings, and the drinks/food menu for the Farewell and Howdy platforms. It is built as a Cloudflare Workers application with a D1 database.

## Features

- Responsive admin dashboard with mobile-friendly design
- Event management system for both venues
  - Create, view, edit, and delete events
  - Upload event flyers
  - Filter events by venue
  - Auto-population of venue-specific defaults
  - Modal-based events display with archive toggle
  - Consistent date comparison for past/upcoming events
- Blog post management with rich text editor
  - Create and edit blog posts with WYSIWYG editor
  - Upload and embed images directly in blog posts
  - Add featured images to blog posts
  - YouTube video carousel for featured content
- Menu management system
  - Edit drinks and food menu items
  - Preserve the unique style of the menu
- Venue settings configuration
  - Update hours, contact information, and other venue details
- Legacy data import system
- Authentication system with role-based access

## Tech Stack

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

## Development

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

### Database

The project uses Cloudflare D1 as its database. For local development, Wrangler creates a local SQLite database.

To run database commands:

```bash
# Query local database
npx wrangler d1 execute farewell-db --command "SELECT * FROM users;"

# Query remote database
npx wrangler d1 execute farewell-db --command "SELECT * FROM users;" --remote
```

### Deployment

To deploy to Cloudflare:

```bash
npx wrangler deploy
```

## Documentation

### Documentation
- **[SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)** - Complete technical reference and architecture guide
- **[API_REFERENCE.md](API_REFERENCE.md)** - Comprehensive API endpoint documentation  
- **[CHANGELOG.md](CHANGELOG.md)** - Recent updates, fixes, and version history
- **[scripts/README.md](scripts/README.md)** - Utility scripts documentation
- **[style-guide/STYLE_GUIDE.md](style-guide/STYLE_GUIDE.md)** - Design system and UI patterns

### Quick Reference
- **Admin Dashboard**: Access at `/admin.html` (requires login)
- **Public API**: All endpoints under `/api/` (some require authentication)
- **Image Uploads**: Stored in R2 with automatic URL generation
- **Database**: Cloudflare D1 with SQLite-compatible schema

## Project Status

✅ **Production Ready** - Core features implemented and tested  
📱 **Mobile Optimized** - Responsive admin dashboard and public site  
🔒 **Secure** - JWT authentication with protected admin routes  
📚 **Well Documented** - Comprehensive technical documentation  

### Recent Updates (July 9, 2025)

- Mobile UI improvements for better usability:
  - Fixed event page button sizing and text overflow
  - Improved header height consistency between venue states
  - Fixed date comparison logic for events display
  - Removed concentric borders in blog and video sections
- Complete API consistency verification and fixes
- Mobile-responsive admin dashboard redesign  
- Consolidated documentation (reduced from 27 to 5 core files)
- Enhanced menu management system with drag-and-drop
- Multi-video featured content carousel
- Improved events modal with archive toggle and pagination
- Added GSAP library for smooth menu animations

## License

This project is proprietary and confidential.
