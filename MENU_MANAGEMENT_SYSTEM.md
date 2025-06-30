# Menu Management System Documentation

This document provides detailed information about the menu management system implemented for the Farewell/Howdy Unified Project.

## Overview

The menu management system allows administrators to edit the drinks and food menu for both venues while preserving the unique style and structure of the menu. The system supports creating, updating, and deleting menu items, as well as organizing them into categories.

## Features

- **CRUD Operations**: Create, read, update, and delete menu items
- **Category Management**: Organize menu items into categories (e.g., Cocktails, Beer, Booze-Free)
- **Style Preservation**: Maintain the unique aesthetic of the menu while making it editable
- **Rich Text Descriptions**: Support for formatted text in menu item descriptions
- **Price Management**: Edit prices for menu items
- **Admin UI**: User-friendly interface for managing the menu

## Implementation Details

### Database Schema

The menu system uses the following tables in the D1 database:

```sql
CREATE TABLE menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue TEXT NOT NULL CHECK (venue IN ('farewell', 'howdy')),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);
```

### API Endpoints

The menu management system provides the following API endpoints:

#### Public API Endpoints

- `GET /api/venues/:venue/menu` - Get all menu items for a venue

#### Admin API Endpoints

- `GET /api/admin/venues/:venue/menu` - Get all menu items for a venue (admin view)
- `POST /api/admin/venues/:venue/menu` - Create a new menu for a venue
- `GET /api/admin/menu/:id` - Get menu items for a specific menu ID
- `POST /api/admin/venues/:venue/menu-items` - Create a new menu item
- `PUT /api/admin/menu-items/:id` - Update a menu item
- `DELETE /api/admin/menu-items/:id` - Delete a menu item

#### Menu Items

- `GET /api/admin/categories/:categoryId/items` - Get all items in a category
- `GET /api/admin/menu-items/:id` - Get a specific menu item
- `POST /api/admin/categories/:categoryId/items` - Create a new menu item
- `PUT /api/admin/menu-items/:id` - Update a menu item
- `DELETE /api/admin/menu-items/:id` - Delete a menu item

### Admin UI

The menu management UI in the admin dashboard includes:

1. **Menu Management Section**:
   - Shows all menu items for the selected venue (Farewell or Howdy)
   - Allows adding new menu items
   - Provides interface for editing existing items

2. **Menu Item Form**:
   - Form for adding or editing menu items
   - Fields for name, price, category, and description
   - Validation to ensure required fields are filled
   
3. **Menu Categories**:
   - Predefined categories like Cocktails, Domestics, Boulevard, etc.
   - Items are grouped by category for display

4. **Item Management**:
   - Add, edit, and delete menu items
   - Set item availability (is_available flag)
   - Mark items as specials (is_special flag)
   - Set pricing information

### Public Display

The public menu display preserves the unique style of the original static menu while pulling data from the database:

1. **Menu Rendering**:
   - Displays categories in the specified order
   - Shows items within each category based on display_order
   - Applies appropriate styling to maintain the aesthetic
   - Highlights specials with unique styling

2. **Fallback Mechanism**:
   - If the API fails to load menu data, falls back to a static representation
   - Ensures the menu is always available to users

## Usage Guidelines

### Creating a New Menu Item

1. Navigate to the "Venue Settings" section in the admin dashboard
2. Click on the venue tab (Farewell or Howdy)
3. Click "Add Menu Item"
4. Enter the item name, price, category, and description
5. Click "Add Item"

### Editing Menu Items

1. In the Venue Settings section, find the item in the menu list
2. Click the "Edit" button
3. Update the item details
4. Click "Update Item"

### Deleting Menu Items

1. In the Venue Settings section, find the item in the menu list
2. Click the "Delete" button
3. Confirm the deletion

## Styling Preservation

The menu management system preserves the unique styling of the original menu through:

1. **CSS Classes**: Maintaining the original CSS classes for menu display
2. **Original Layout**: Preserving the two-column layout design
3. **Font Styling**: Keeping the custom fonts and typography
4. **Image Assets**: Using the original menu header images and illustrations

## Future Enhancements

Planned enhancements for the menu management system include:

1. **Drag-and-Drop Ordering**: Add ability to reorder menu items via drag-and-drop
2. **Image Support**: Add images for menu items
3. **Seasonal Specials**: Support for marking items as seasonal specials
4. **Menu Versioning**: Track changes to menus over time
5. **Rich Text Descriptions**: Add support for formatted text in item descriptions

## Troubleshooting

Common issues and their solutions:

1. **Menu Not Displaying**: Verify the API endpoints are working properly and check browser console for errors
2. **API Errors**: Check that the menu item has all required fields (name, price, category)
3. **Pricing Format**: Ensure prices are entered without the dollar sign for consistent formatting
4. **Static Fallback**: If dynamic content fails to load, the system will display static menu content

**Last Updated**: June 30, 2025
