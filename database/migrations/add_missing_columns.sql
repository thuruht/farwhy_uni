-- Add missing columns to the events table
ALTER TABLE events ADD COLUMN event_type TEXT;
ALTER TABLE events ADD COLUMN performers TEXT;
ALTER TABLE events ADD COLUMN tags TEXT;
ALTER TABLE events ADD COLUMN external_links TEXT;
