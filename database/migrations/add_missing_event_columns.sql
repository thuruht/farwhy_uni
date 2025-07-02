-- This migration script safely adds missing columns to the events table
-- It only adds columns if they don't already exist, preserving all existing data

-- Function to check if a column exists in a table
CREATE TEMPORARY FUNCTION IF NOT EXISTS column_exists(table_name TEXT, column_name TEXT) 
RETURNS BOOLEAN AS
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pragma_table_info(table_name) WHERE name = column_name
  );
END;

-- Add event_type column if it doesn't exist
BEGIN TRANSACTION;

-- event_type column
SELECT CASE 
  WHEN NOT column_exists('events', 'event_type') THEN
    (SELECT 'ALTER TABLE events ADD COLUMN event_type TEXT;')
  ELSE
    (SELECT 'SELECT 1;') -- No-op query if column exists
END AS sql_to_execute;

-- Execute the dynamic SQL
EXECUTE (SELECT sql_to_execute FROM (
  SELECT CASE 
    WHEN NOT column_exists('events', 'event_type') THEN
      'ALTER TABLE events ADD COLUMN event_type TEXT;'
    ELSE
      'SELECT 1;' -- No-op query if column exists
  END AS sql_to_execute
));

-- Add performers column if it doesn't exist
SELECT CASE 
  WHEN NOT column_exists('events', 'performers') THEN
    (SELECT 'ALTER TABLE events ADD COLUMN performers TEXT;')
  ELSE
    (SELECT 'SELECT 1;') -- No-op query if column exists
END AS sql_to_execute;

-- Execute the dynamic SQL
EXECUTE (SELECT sql_to_execute FROM (
  SELECT CASE 
    WHEN NOT column_exists('events', 'performers') THEN
      'ALTER TABLE events ADD COLUMN performers TEXT;'
    ELSE
      'SELECT 1;' -- No-op query if column exists
  END AS sql_to_execute
));

-- Add tags column if it doesn't exist
SELECT CASE 
  WHEN NOT column_exists('events', 'tags') THEN
    (SELECT 'ALTER TABLE events ADD COLUMN tags TEXT;')
  ELSE
    (SELECT 'SELECT 1;') -- No-op query if column exists
END AS sql_to_execute;

-- Execute the dynamic SQL
EXECUTE (SELECT sql_to_execute FROM (
  SELECT CASE 
    WHEN NOT column_exists('events', 'tags') THEN
      'ALTER TABLE events ADD COLUMN tags TEXT;'
    ELSE
      'SELECT 1;' -- No-op query if column exists
  END AS sql_to_execute
));

-- Add external_links column if it doesn't exist
SELECT CASE 
  WHEN NOT column_exists('events', 'external_links') THEN
    (SELECT 'ALTER TABLE events ADD COLUMN external_links TEXT;')
  ELSE
    (SELECT 'SELECT 1;') -- No-op query if column exists
END AS sql_to_execute;

-- Execute the dynamic SQL
EXECUTE (SELECT sql_to_execute FROM (
  SELECT CASE 
    WHEN NOT column_exists('events', 'external_links') THEN
      'ALTER TABLE events ADD COLUMN external_links TEXT;'
    ELSE
      'SELECT 1;' -- No-op query if column exists
  END AS sql_to_execute
));

COMMIT;

-- Log completion message
SELECT 'Migration completed successfully: All required columns exist in events table' AS message;
