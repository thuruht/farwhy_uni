-- Migration script to add missing columns to the events table
-- This addresses the error: "table events has no column named event_type"

-- First, make sure the transaction is atomic
BEGIN TRANSACTION;

-- Check if the event_type column exists, and add it if it doesn't
SELECT CASE 
  WHEN COUNT(*) = 0 THEN
    -- Column doesn't exist, add it
    'ALTER TABLE events ADD COLUMN event_type TEXT;'
  ELSE
    -- Column exists, do nothing
    'SELECT 1;'
END as sql_to_execute
FROM pragma_table_info('events') 
WHERE name = 'event_type';

-- Check if the performers column exists, and add it if it doesn't
SELECT CASE 
  WHEN COUNT(*) = 0 THEN
    -- Column doesn't exist, add it
    'ALTER TABLE events ADD COLUMN performers TEXT;'
  ELSE
    -- Column exists, do nothing
    'SELECT 1;'
END as sql_to_execute
FROM pragma_table_info('events') 
WHERE name = 'performers';

-- Check if the tags column exists, and add it if it doesn't
SELECT CASE 
  WHEN COUNT(*) = 0 THEN
    -- Column doesn't exist, add it
    'ALTER TABLE events ADD COLUMN tags TEXT;'
  ELSE
    -- Column exists, do nothing
    'SELECT 1;'
END as sql_to_execute
FROM pragma_table_info('events') 
WHERE name = 'tags';

-- Check if the external_links column exists, and add it if it doesn't
SELECT CASE 
  WHEN COUNT(*) = 0 THEN
    -- Column doesn't exist, add it
    'ALTER TABLE events ADD COLUMN external_links TEXT;'
  ELSE
    -- Column exists, do nothing
    'SELECT 1;'
END as sql_to_execute
FROM pragma_table_info('events') 
WHERE name = 'external_links';

-- Commit the transaction
COMMIT;
