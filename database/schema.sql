-- /database/schema.sql

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS events;

-- Create the Events table, using the text 'id' from the legacy system as the primary key.
-- The REPLACE INTO command in the sync handler will rely on this primary key.
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    flyer_image_url TEXT,
    ticket_url TEXT,
    description TEXT,
    age_restriction TEXT,
    event_time TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for faster queries by date
CREATE INDEX idx_events_date ON events (date);
