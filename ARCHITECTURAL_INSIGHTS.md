# Farewell/Howdy Unified Project - Key Architectural Insights

Based on a thorough review of project documentation, we've identified several critical architectural and functional requirements that should guide our implementation work.

## Core Architectural Principles

1. **Dual-Venue Paradigm**
   - The platform serves both "Farewell" and "Howdy" venues
   - All content must be venue-aware through a foreign key relationship
   - The UI allows toggling between venue-specific content

2. **DIY Ethos**
   - Custom-built solutions preferred over off-the-shelf frameworks
   - Lean, modular architecture avoiding bloat
   - Modern, serverless stack with low overhead

3. **Brand Aesthetic**
   - Distinct visual identity by Austin Chapman and "jojo"
   - Admin dashboard should follow the core visual language while prioritizing function
   - Custom design system implemented via utility-first CSS approach

4. **Mobile-First Design**
   - Responsive design prioritizing mobile and tablet usage
   - Strategic breakpoints based on device capabilities rather than specific pixel values
   - Touch-friendly interface with appropriately sized interaction targets
   - Content remains accessible in both portrait and landscape orientations
   - Performance optimization for mobile networks

## Database Schema

The database uses a multi-tenant model with these key tables:

1. **Users Table**
   - Role-based access control (admin, user)
   - Secure password storage with SHA-256 hashing

2. **Events Table**
   - Venue-specific events with required fields (title, date, venue)
   - Auto-population fields for age restrictions and event times
   - Legacy compatibility fields for data migration

3. **Blog Posts Table**
   - Rich content storage with tag-based filtering
   - Status tracking (published, draft)

4. **Business Hours Table**
   - Venue-specific operating hours
   - Support for special notes and closures

## Security Architecture

The platform uses a robust dual authentication system:

1. **JWT + Session Authentication**
   - Primary: JWT tokens signed with HS256
   - Fallback: KV-based sessions for redundancy
   - HTTP-only cookies with SameSite=Strict setting

2. **Token Management**
   - 24-hour expiration for automatic rotation
   - Secure, HTTP-only cookies prevent XSS attacks

3. **Secret Management**
   - All sensitive data stored as Cloudflare secrets
   - Strong 512-bit cryptographic keys

## Aaron's Specific Requirements

From PRIORITY_GOALS.txt, we've identified these key requirements:

1. **Event Creation Auto-Population**
   - Venue "Howdy" → Auto-populate "All ages"
   - Venue "Farewell" → Auto-populate "21+ unless with parent or legal guardian"
   - Auto-populate "Doors at 7pm / Music at 8pm" for all events (editable)

2. **Calendar Management**
   - Merge Farewell and Howdy show calendars
   - Make calendar manually editable in dashboard
   - Highest priority item

3. **Future Feature Requests**
   - YouTube video carousel for multiple featured videos
   - Editable drink menu popup
   - Image gallery for notable shows
   - Show history/archive page
   - Editable hours section for both venues
   - Thrift store links
   - Potential webstore for merchandise

## Technical Implementation

The implementation must address these core functional areas:

1. **API Response Handling**
   - Proper JSON parsing in all API methods
   - Consistent error handling and user feedback

2. **Form Validation**
   - Client-side validation for all required fields
   - User-friendly error messages

3. **Modal System**
   - Consistent modal activation/deactivation
   - Proper form handling within modals

4. **Authentication Flow**
   - Secure login process
   - Proper session management
   - Role-based access control

This document provides a central reference for understanding the architectural and functional requirements of the Farewell/Howdy Unified Project, ensuring all implementation work aligns with the established vision and goals.
