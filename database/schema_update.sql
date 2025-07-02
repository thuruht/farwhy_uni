-- Add missing columns to the events table
ALTER TABLE events ADD COLUMN event_type TEXT;
ALTER TABLE events ADD COLUMN performers TEXT;
ALTER TABLE events ADD COLUMN tags TEXT;
ALTER TABLE events ADD COLUMN external_links TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type);
