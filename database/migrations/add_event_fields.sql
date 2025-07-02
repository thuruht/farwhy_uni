-- Add missing columns to events table
ALTER TABLE events 
ADD COLUMN event_type TEXT DEFAULT 'music';

ALTER TABLE events 
ADD COLUMN performers TEXT DEFAULT '[]';

ALTER TABLE events 
ADD COLUMN tags TEXT DEFAULT '[]';

ALTER TABLE events 
ADD COLUMN external_links TEXT DEFAULT '{}';
