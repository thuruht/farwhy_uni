# Critical System Documentation - DO NOT REMOVE OR MODIFY

## Last Updated: July 2, 2025

This document describes critical system components that should not be modified without careful consideration and testing. These components have been carefully developed and tested to ensure the application works correctly.

## 1. API Endpoints

### 1.1 Business Hours Endpoint

- **Route**: `/api/hours`
- **Handler Function**: Custom implementation in `src/index.ts`
- **Purpose**: Provides business hours data for all venues
- **Consumer**: Used by `more.htm` to display business hours
- **Database Table**: `business_hours`
- **Response Format**:

```json
{
  "success": true,
  "data": {
    "farewell": [
      { "venue": "farewell", "day_of_week": 0, "open_time": "12:00", "close_time": "22:00", "is_closed": false, "notes": "..." },
      // Additional days...
    ],
    "howdy": [
      // Hours for Howdy venue...
    ]
  }
}
```

- **Notes**: This endpoint groups hours by venue name, allowing for easy display of hours for both venues. The endpoint must return data in this exact format to ensure the hours display correctly on the public site.

### 1.2 Menu Management Endpoints

- **Public Routes**:
  - GET `/api/venues/:venue/menu-items` - Get menu items for a specific venue
  - GET `/api/menu` - Get all menu items for Farewell (legacy endpoint)

- **Admin Routes** (require authentication):
  - GET `/api/admin/venues/:venue/menu-items` - Get menu items for admin dashboard
  - POST `/api/admin/venues/:venue/menu-items` - Create a new menu item
  - PUT `/api/admin/menu-items/:id` - Update an existing menu item
  - DELETE `/api/admin/menu-items/:id` - Delete a menu item
  - POST `/api/admin/menu-items/reorder` - Update the display order of menu items

- **Database Table**: `menu_items`
- **Response Format Example**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menu_id": 1,
      "name": "Cappuccino",
      "description": "Espresso with steamed milk and foam",
      "price": 4.5,
      "category": "Coffee",
      "display_order": 1,
      "active": 1
    },
    // Additional items...
  ]
}
```

## 2. Frontend Components

### 2.1 Menu Management UI

- **Admin Dashboard File**: `public/admin.html`
- **JavaScript**: `public/jss/admin-unified.js`
- **Key Functions**:
  - `loadVenueSettings()` - Loads menu items and business hours for the venue
  - `editMenuItem(item)` - Opens the edit modal for a menu item
  - `deleteMenuItem(item)` - Deletes a menu item after confirmation
  - `showMenuItemForm(item)` - Opens the menu item form for creating/editing
  - `toggleMenuReorderMode()` - Toggles the reorder mode for menu items
  
- **UI Components**:
  - Menu item form modal: `<div id="menu-item-modal">`
  - Menu list container: `<div id="menu-list">`
  - Add menu item button: `<button id="add-menu-btn">`
  - Reorder menu button: `<button id="reorder-menu-btn">`

- **Data Flow**:
  1. User clicks "Add Menu Item" button -> `showMenuItemForm()` -> Modal opens
  2. User submits form -> API call to create/update item -> `loadVenueSettings()` refreshes the list
  3. User clicks "Reorder Menu" -> `toggleMenuReorderMode()` -> Drag and drop enabled
  4. User saves reordered menu -> API call to update display order

- **Required CSS Classes**: 
  - `menu-container` - Container for all menu items
  - `menu-category` - Container for category of menu items
  - `menu-item` - Individual menu item
  - `reorder-mode` - Added to container when reordering is active

## 2. Admin Modal System

### 2.1 Modal Structure
The admin dashboard uses dedicated modals for each form type:
- Event Modal: `id="event-modal"` (for creating/editing events)
- Blog Modal: `id="blog-modal"` (for creating/editing blog posts)
- Menu Item Modal: `id="menu-item-modal"` (for creating/editing menu items)

### 2.2 Form Handler Functions
Each modal has corresponding JavaScript functions:
- **Events**: 
  - `showEventForm(eventData)` - Opens modal and populates form
  - `closeEventForm()` - Closes modal
  - `handleEventFormSubmit(e)` - Processes form submission
- **Blog Posts**:
  - `showBlogForm(blogData)` - Opens modal and populates form
  - `closeBlogForm()` - Closes modal
  - `handleBlogFormSubmit(e)` - Processes form submission
- **Menu Items**:
  - `showMenuItemForm(item)` - Opens modal and populates form
  - `closeMenuItemForm()` - Closes modal
  - `setupMenuItemForm()` - Sets up form submission handler

### 2.3 Image Upload Flow
Forms with image uploads use a two-part system:
1. File input for selecting the image: `id="event-flyer-upload"` or `id="blog-image-upload"`
2. URL input that gets populated after upload: `id="event-flyer-url"` or `id="blog-image-url"`

This ensures that images are properly uploaded to R2 and their URLs are stored in the database.

## 3. Mobile Responsiveness
- All modals are designed to be fully responsive down to mobile sizes
- Admin dashboard uses responsive CSS with media queries to adapt to screen size
- Public pages (about.htm, more.htm) include responsive design for mobile viewing

## 4. Critical CSS Components
- Modal overlay system with z-index ensures proper stacking of UI elements
- Responsive media queries adjust layout for mobile devices
- Form styling provides consistent user experience across all admin functions

## 5. Important Notes
- DO NOT combine modal functions - each form type (event, blog, menu) needs its own dedicated modal
- DO NOT modify the image upload flow without testing on both desktop and mobile
- DO NOT remove the business hours endpoint as it's critical for the more.htm page
- Test ALL changes thoroughly across different screen sizes before deploying

## 6. Test Procedures
1. Test each form (event, blog, menu) with both create and edit operations
2. Verify image uploads work and URL fields get populated correctly
3. Check that all forms are fully usable on mobile devices
4. Verify that business hours display correctly on more.htm
5. Confirm menu items appear correctly in the admin and public interfaces

These carefully implemented features ensure the stability and reliability of the application. Modify with extreme caution.
