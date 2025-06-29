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
  name TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_special BOOLEAN NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);
```

### API Endpoints

The menu management system provides the following API endpoints:

#### Menus

- `GET /api/admin/menus` - Get all menus
- `GET /api/admin/menus/:id` - Get a specific menu
- `POST /api/admin/menus` - Create a new menu
- `PUT /api/admin/menus/:id` - Update a menu
- `DELETE /api/admin/menus/:id` - Delete a menu

#### Categories

- `GET /api/admin/menus/:menuId/categories` - Get all categories for a menu
- `GET /api/admin/categories/:id` - Get a specific category
- `POST /api/admin/menus/:menuId/categories` - Create a new category
- `PUT /api/admin/categories/:id` - Update a category
- `DELETE /api/admin/categories/:id` - Delete a category

#### Menu Items

- `GET /api/admin/categories/:categoryId/items` - Get all items in a category
- `GET /api/admin/menu-items/:id` - Get a specific menu item
- `POST /api/admin/categories/:categoryId/items` - Create a new menu item
- `PUT /api/admin/menu-items/:id` - Update a menu item
- `DELETE /api/admin/menu-items/:id` - Delete a menu item

### Admin UI

The menu management UI in the admin dashboard includes:

1. **Menu List View**:
   - Shows all menus for both venues
   - Allows creating new menus
   - Provides access to edit each menu

2. **Menu Editor**:
   - Displays categories and items in a hierarchical view
   - Allows drag-and-drop reordering of categories and items
   - Provides inline editing of item names, descriptions, and prices

3. **Category Management**:
   - Create, edit, and delete categories
   - Reorder categories to control display order

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

### Creating a New Menu

1. Navigate to the "Venue Settings" section in the admin dashboard
2. Click on "Menu Management"
3. Click "Create New Menu"
4. Enter the menu name and venue
5. Click "Save"

### Adding Categories

1. Open a menu in the editor
2. Click "Add Category"
3. Enter the category name and description
4. Click "Save"

### Adding Menu Items

1. Open a menu in the editor
2. Select a category
3. Click "Add Item"
4. Enter the item name, description, and price
5. Set availability and special status as needed
6. Click "Save"

### Editing Menu Items

1. Click on an item in the menu editor
2. Edit the item details
3. Click "Save"

## Styling Preservation

The menu management system preserves the unique styling of the original menu through:

1. **CSS Mapping**: Specific CSS classes for each menu section
2. **Custom Renderers**: Special rendering logic for different item types
3. **Style Templates**: Predefined templates for consistent styling

## Future Enhancements

Planned enhancements for the menu management system include:

1. **Image Support**: Add images for menu items
2. **Seasonal Menus**: Support for time-limited seasonal menus
3. **Menu Versioning**: Track changes to menus over time
4. **Nutrition Information**: Add nutritional data to menu items
5. **Allergen Tags**: Mark items with common allergens

## Troubleshooting

Common issues and their solutions:

1. **Menu Not Displaying**: Check that the menu API is responding correctly
2. **Items Out of Order**: Verify the display_order values for categories and items
3. **Styling Issues**: Ensure the CSS for menu display is properly loaded

For additional support, contact the development team.

**Last Updated**: June 22, 2025
