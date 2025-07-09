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

Last updated: July 15, 2025

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

Last updated: July 15, 2025
