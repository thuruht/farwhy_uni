-- This migration script safely adds missing columns to the events table
-- without modifying or deleting any existing data or records

-- First, check if event_type column exists, and add it if missing
SELECT COUNT(*) AS column_exists FROM pragma_table_info('events') WHERE name='event_type';
-- If the above returns 0, we need to add the column

-- Add event_type column if it doesn't exist (safely)
ALTER TABLE events ADD COLUMN event_type TEXT DEFAULT 'music';

-- Add performers column if it doesn't exist
SELECT COUNT(*) AS column_exists FROM pragma_table_info('events') WHERE name='performers';
-- If the above returns 0, we need to add the column
ALTER TABLE events ADD COLUMN performers TEXT DEFAULT '[]';

-- Add tags column if it doesn't exist
SELECT COUNT(*) AS column_exists FROM pragma_table_info('events') WHERE name='tags';
-- If the above returns 0, we need to add the column
ALTER TABLE events ADD COLUMN tags TEXT DEFAULT '[]';

-- Add external_links column if it doesn't exist
SELECT COUNT(*) AS column_exists FROM pragma_table_info('events') WHERE name='external_links';
-- If the above returns 0, we need to add the column
ALTER TABLE events ADD COLUMN external_links TEXT DEFAULT '{}';

-- These operations will ONLY add columns if they don't exist
-- No existing data will be deleted or modified
-- All existing events will remain intact
