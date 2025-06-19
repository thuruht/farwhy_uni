-- /database/schema.sql - Multi-Tenant Schema for Farewell/Howdy Platform

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS menus;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS business_hours;
-- Thrift tables removed as per frontend changes
-- DROP TABLE IF EXISTS thrift_items;
-- DROP TABLE IF EXISTS thrift_content;
-- DROP TABLE IF EXISTS thrift_social_links;

-- Users table with role-based access control
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table - Enhanced for legacy compatibility and Aaron's requirements
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL CHECK (venue IN ('farewell', 'howdy')),
    flyer_image_url TEXT,
    ticket_url TEXT,
    description TEXT,
    age_restriction TEXT, -- Auto-populated based on venue if not provided
    event_time TEXT, -- Auto-populated as "Doors at 7pm / Music at 8pm" if not provided
    
    -- Legacy compatibility fields (mapped from old system)
    legacy_id TEXT, -- Original ID from legacy system
    legacy_image_url TEXT, -- Original image URL before migration
    legacy_data TEXT, -- JSON blob for any unmapped legacy fields
    
    -- Enhanced fields for new events
    price TEXT, -- Ticket price (optional)
    capacity INTEGER, -- Venue capacity (optional)
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'postponed')),
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Additional CMS fields for the events modal
    event_type TEXT, -- e.g., 'music', 'art', 'comedy', 'special'
    performers TEXT, -- JSON array of performer names/details
    tags TEXT, -- JSON array of tags for filtering
    external_links TEXT, -- JSON object for social media/external links
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table with tagging for multi-tenant filtering
CREATE TABLE blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT, -- JSON array of tags for filtering (venues, thrift, etc.)
    author_id INTEGER,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Venue menu management
CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue TEXT NOT NULL CHECK (venue IN ('farewell', 'howdy')),
    name TEXT NOT NULL, -- e.g., 'Drinks', 'Food', 'Specials'
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items
CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category TEXT, -- e.g., 'beer', 'wine', 'cocktails', 'food'
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- Business hours for venues
CREATE TABLE business_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue TEXT NOT NULL CHECK (venue IN ('farewell', 'howdy')),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    open_time TEXT, -- HH:MM format
    close_time TEXT, -- HH:MM format
    is_closed BOOLEAN DEFAULT 0,
    notes TEXT, -- e.g., 'Happy Hour 4-6pm'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thrift tables removed as per frontend changes
/*
-- Thrift store inventory
CREATE TABLE thrift_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category TEXT, -- e.g., 'clothing', 'books', 'furniture', 'misc'
    condition TEXT, -- e.g., 'excellent', 'good', 'fair'
    image_url TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thrift store CMS content
CREATE TABLE thrift_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL, -- e.g., 'about', 'hours', 'announcements'
    title TEXT,
    content TEXT NOT NULL,
    custom_css TEXT, -- For section-specific styling
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thrift store social media links
CREATE TABLE thrift_social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL, -- e.g., 'instagram', 'facebook', 'twitter'
    url TEXT NOT NULL,
    display_name TEXT,
    icon_class TEXT, -- CSS class for icon
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events (date);
CREATE INDEX idx_events_venue ON events (venue);
CREATE INDEX idx_blog_posts_status ON blog_posts (status);
CREATE INDEX idx_blog_posts_created ON blog_posts (created_at DESC);
CREATE INDEX idx_menu_items_menu ON menu_items (menu_id);
-- Removed thrift-related indexes
-- CREATE INDEX idx_thrift_items_status ON thrift_items (status);
-- CREATE INDEX idx_thrift_items_category ON thrift_items (category);
CREATE INDEX idx_business_hours_venue ON business_hours (venue, day_of_week);

-- Insert default admin user (password hash should be replaced with actual hash)
INSERT INTO users (username, password_hash, role) VALUES ('anmid', 'your_password_hash_here', 'admin');

-- Insert default business hours (can be modified through admin)
-- Farewell default hours
INSERT INTO business_hours (venue, day_of_week, open_time, close_time, is_closed) VALUES 
('farewell', 0, NULL, NULL, 1), -- Sunday closed
('farewell', 1, '17:00', '02:00', 0), -- Monday 5pm-2am
('farewell', 2, '17:00', '02:00', 0), -- Tuesday 5pm-2am
('farewell', 3, '17:00', '02:00', 0), -- Wednesday 5pm-2am
('farewell', 4, '17:00', '02:00', 0), -- Thursday 5pm-2am
('farewell', 5, '17:00', '02:00', 0), -- Friday 5pm-2am
('farewell', 6, '17:00', '02:00', 0); -- Saturday 5pm-2am

-- Howdy default hours
INSERT INTO business_hours (venue, day_of_week, open_time, close_time, is_closed) VALUES 
('howdy', 0, NULL, NULL, 1), -- Sunday closed
('howdy', 1, '17:00', '02:00', 0), -- Monday 5pm-2am
('howdy', 2, '17:00', '02:00', 0), -- Tuesday 5pm-2am
('howdy', 3, '17:00', '02:00', 0), -- Wednesday 5pm-2am
('howdy', 4, '17:00', '02:00', 0), -- Thursday 5pm-2am
('howdy', 5, '17:00', '02:00', 0), -- Friday 5pm-2am
('howdy', 6, '17:00', '02:00', 0); -- Saturday 5pm-2am

-- Default thrift content removed
/*
INSERT INTO thrift_content (section, title, content) VALUES 
('about', 'About Our Thrift Store', '<p>Welcome to Howdy DIY Thrift! We specialize in unique finds and sustainable fashion.</p>'),
('announcements', 'Current Announcements', '<p>Check back regularly for special sales and new arrivals!</p>');
*/
