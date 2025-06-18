# Farewell Unified Project

A unified Cloudflare Worker that serves both the public Farewell/Howdy website and admin dashboard, replacing the previous multi-worker architecture.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Deploy to Cloudflare
npm run deploy

# Local development
npm run dev
```

## 🌐 Live Sites

- **Public Site**: https://dev.farewellcafe.com
- **Admin Dashboard**: https://admin.farewellcafe.com

## ✨ Features

### 🎭 **Public Frontend**
- **State Switching**: Toggle between Farewell and Howdy venues
- **Event Slideshow**: Dynamic slideshows with venue-specific events
- **Legacy Compatibility**: Maintains existing frontend functionality
- **Responsive Design**: Mobile-friendly interface

### 🛠️ **Admin Dashboard**
- **Event Management**: Full CRUD operations for events
- **Flyer Uploads**: R2-powered image storage with auto-thumbnails
- **Calendar Editing**: Manual control over merged Farewell/Howdy calendar ✅
- **Legacy Data Import**: Sync from existing backend systems
- **Authentication**: JWT-based secure access

### 🔗 **API Features**
- **Legacy API Compatibility**: `/list/{state}`, `/archives` endpoints
- **Modern RESTful API**: `/api/events`, `/api/auth`, etc.
- **Multi-venue Support**: Single API serving both venues
- **Real-time Updates**: Live calendar and event data

## 🏗️ Architecture

### Single Worker Design
```
farewell-unified
├── dev.farewellcafe.com/*     → Public website (ffww-based)
└── admin.farewellcafe.com/*   → Admin dashboard
```

### Data Storage
- **D1 Database**: Event data, user sessions
- **R2 Bucket**: Flyer images and assets  
- **KV Namespace**: Session management and caching

## 📋 Requirements Status

### ✅ **Completed**
- [x] Core worker architecture with host-based routing
- [x] Legacy API compatibility for existing frontend
- [x] Event CRUD operations with admin interface
- [x] Flyer upload system with R2 storage
- [x] Manual calendar editing capability
- [x] Authentication and session management

### 🚧 **In Progress**
- [ ] Legacy data migration from `fygw0.kcmo.xyz`
- [ ] Blog CRUD interface completion
- [ ] YouTube video carousel implementation

### 📋 **Planned**
- [ ] Show history/archive page (Fugazi-inspired)
- [ ] Image gallery for major shows
- [ ] Merch display (t-shirts/stickers with prices)
- [ ] Auto-population settings for venue-specific defaults

## 🔧 Development

### Project Structure
```
src/
├── index.ts                    # Main worker entry
├── handlers/                   # API request handlers
├── middleware/                 # Authentication middleware  
├── dashboard/                  # Admin interface generator
└── types/                      # TypeScript definitions

public/                         # Static assets (from ffww)
database/                       # SQL schema files
```

### Key Files
- `wrangler.jsonc` - Cloudflare Worker configuration
- `src/index.ts` - Main application router
- `src/handlers/events.ts` - Event management logic
- `database/schema.sql` - Database structure

## 📚 Documentation

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) - Detailed status and progress
- [`database/schema.sql`](database/schema.sql) - Database structure
- [`wrangler.jsonc`](wrangler.jsonc) - Deployment configuration

## 🚀 Deployment

The worker is configured to deploy to:
- **Production Routes**: 
  - `dev.farewellcafe.com/*`
  - `admin.farewellcafe.com/*`
- **Resources**:
  - D1 Database: `farewell-db`
  - R2 Bucket: `fwhy-images`
  - KV Namespace: `SESSIONS_KV`

---

**Status**: ✅ Ready for production deployment  
**Last Updated**: June 18, 2025  
**Contact**: Update Aaron when calendar editing is complete
