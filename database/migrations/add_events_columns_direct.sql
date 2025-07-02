-- Direct migration script to add missing columns to the events table
-- This addresses the error: "table events has no column named event_type"

-- Start transaction
BEGIN TRANSACTION;

-- Add missing columns directly
ALTER TABLE events ADD COLUMN event_type TEXT DEFAULT 'music';
ALTER TABLE events ADD COLUMN performers TEXT DEFAULT '[]';
ALTER TABLE events ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE events ADD COLUMN external_links TEXT DEFAULT '{}';

-- Commit the transaction
COMMIT;
