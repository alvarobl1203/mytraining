/*
# Add days_of_week column to routines table

## Purpose
Add a text[] column to store multiple days of the week per routine.

## New Columns
- routines.days_of_week (text[], NOT NULL, default '{}')

## Notes
- Idempotent: uses DO $$ block to check if column exists before adding.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routines' AND column_name = 'days_of_week'
  ) THEN
    ALTER TABLE routines ADD COLUMN days_of_week text[] NOT NULL DEFAULT '{}'::text[];
  END IF;
END $$;

-- Migrate existing day_of_week values into days_of_week
UPDATE routines
SET days_of_week = ARRAY[day_of_week]
WHERE day_of_week IS NOT NULL AND array_length(days_of_week, 1) IS NULL;

-- For routines with empty days_of_week, set to ['Flexible']
UPDATE routines
SET days_of_week = ARRAY['Flexible']::text[]
WHERE array_length(days_of_week, 1) IS NULL OR days_of_week = '{}';

-- Index for querying routines by day
CREATE INDEX IF NOT EXISTS idx_routines_days_of_week ON routines USING GIN (days_of_week);
