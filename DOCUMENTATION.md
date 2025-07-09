# Farewell/Howdy Unified Project Documentation

This file serves as a reference to the primary documentation files for the Farewell/Howdy Unified Project.

## Primary Documentation Files

- [README.md](README.md) - Project overview and quick start guide
- [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md) - Comprehensive technical documentation
- [API_REFERENCE.md](API_REFERENCE.md) - API endpoint documentation
- [CHANGELOG.md](CHANGELOG.md) - Recent updates and version history

## Recent Updates (July 2025)

- Added comprehensive calendar download functionality with two complementary options:
  - Individual event downloads from event modals
  - Bulk venue calendar downloads from main page
- Improved events modal system with archive toggle and pagination
- Added GSAP library for smooth menu animations
- Fixed date comparison logic for consistent event display
- Updated API endpoint documentation with new parameters
- Added events.html navigation links to more pages
- Expanded system documentation with frontend component details

## Event Calendar Features

The website now offers two complementary calendar download options:

### Bulk Calendar Downloads

The "Download All Events" links allow users to download all upcoming events for the currently selected venue or both venues.

- **Location**: Found on the index page and the events.html page
- **Functionality**: Downloads a single .ics file containing all upcoming events for the active venue
- **File Naming**: `VenueName_Events_YYYYMMDD.ics` (e.g., "Farewell_Events_20250713.ics")
- **Visual Indicator**: "Download All Events" text clearly indicates this downloads multiple events
- **User Guidance**: Includes tooltip explaining that this downloads an .ics file for import into calendar apps

### Individual Event Downloads

The "ADD TO CALENDAR" button allows users to download a single event they're currently viewing.

- **Location**: Found within the event details modal when viewing a specific event
- **Functionality**: Downloads a single .ics file containing just that specific event
- **Appearance**: Button with calendar icon (📅) and "ADD TO CALENDAR" text
- **File Naming**: `Venue_Event_YYYYMMDD.ics` (e.g., "Farewell_Event_20250720.ics")
- **User Guidance**: Includes tooltip explaining what an .ics file is and how to use it

For detailed information about these updates, please refer to the [CHANGELOG.md](CHANGELOG.md) file.

Last updated: July 9, 2025

## UI Consistency Improvements

Several UI consistency improvements have been implemented to create a more unified experience across the site:

### Header Layout Standardization

- Fixed inconsistent header height between Farewell/Howdy states
- Added fixed height and line-height to header title elements
- Ensured consistent dimensions when toggling between venues
- Maintained mobile responsiveness with appropriate sizing

### Navigation Consistency

- Standardized all navigation labels to use "BOOK" instead of "BOOKING"
- Ensures navigation labels match across all pages (index.html, about.htm, more.htm, etc.)
- Better fits mobile layouts while maintaining consistent branding

### Context-Aware Calendar Downloads

- Enhanced calendar download functionality to be context-aware:
  - On venue-specific pages: Downloads only events for the current venue
  - On events.html: Downloads all events regardless of venue
- Clear labeling indicates what's being downloaded (venue-specific vs. all events)
- Implemented through the ics-generator.js script

## Error Handling

### Custom 404 Page Implementation

The website now features enhanced error handling with a custom 404 page:

- **Consistent Branding**: Error page maintains site navigation and styling
- **Improved User Experience**: Users can easily navigate back to main content
- **Content-Type Awareness**: Serves appropriate response format based on request type
  - JSON responses for API requests
  - HTML 404 page for web page requests
- **Implementation**: Cloudflare Workers catch-all route serves 404.html for unknown paths

For technical implementation details, refer to the [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md) file.

## System Features

### Event Management

The event management system now includes:

- Modal-based events display for multiple pages
- Toggle between current and archived events
- Consistent date comparison logic for past/upcoming events
- Configurable API limits for pagination support
- Responsive design with mobile optimization

### Menu Rendering

The menu rendering system now includes:

- GSAP animation library integration
- Smooth transitions and animations
- Responsive design for all screen sizes

## Documentation Status

All documentation files have been updated to reflect the recent changes to the system. The documentation consolidation effort has reduced the number of documentation files from 27 to 5, making it easier to maintain and reference.

---

Last updated: July 9, 2025
