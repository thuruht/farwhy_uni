# Farewell/Howdy Unified Project

A unified administration dashboard for the Farewell and Howdy venues.

## Overview

This project contains the admin dashboard and APIs for managing events, blog posts, and venue settings for the Farewell and Howdy platforms. It is built as a Cloudflare Workers application with a D1 database.

## Features

- Responsive admin dashboard with mobile-friendly design
- Event management system for both venues
  - Create, view, edit, and delete events
  - Upload event flyers
  - Filter events by venue
- Blog post management with rich text editor
  - Create and edit blog posts with WYSIWYG editor
  - Upload and embed images directly in blog posts
  - Add featured images to blog posts
- Venue settings configuration
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
- **Deployment**: Cloudflare Workers deployment via Wrangler CLI

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account with Workers and D1 access

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
npx wrangler publish
```

## Documentation

For detailed documentation, see [DOCUMENTATION.md](DOCUMENTATION.md).
For project progress and todo list, see [PROGRESS_REPORT.md](PROGRESS_REPORT.md).

## Project Status

The project is currently in active development. See [PROGRESS_REPORT.md](PROGRESS_REPORT.md) for the latest status and upcoming tasks.

## License

This project is proprietary and confidential.
