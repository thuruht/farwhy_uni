# Farewell/Howdy Unified Project

A unified administration dashboard for the Farewell and Howdy venues.

## Overview

This project contains the admin dashboard and APIs for managing events, blog posts, and venue settings for the Farewell and Howdy platforms. It is built as a Cloudflare Workers application with a D1 database.

## Features

- Responsive admin dashboard
- Event management
- Blog post management
- Venue settings
- Legacy data import
- Authentication system

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: JWT-based sessions

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)

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

## License

This project is proprietary and confidential.
