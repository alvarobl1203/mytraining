/*
# Add cardio fields to workout_sets and started_at to workout_sessions

## Purpose
1. Add cardio-specific tracking fields to workout_sets for exercises in the Cardio category.
2. Add a precise started_at timestamp to workout_sessions for accurate duration calculation.

## New Columns

### workout_sets
- duration_min (numeric, NOT NULL, default 0) — exercise duration in minutes
- distance_km (numeric, NOT NULL, default 0) — distance in kilometers
- kcal (numeric, NOT NULL, default 0) — calories burned

### workout_sessions
- started_at (timestamptz, NOT NULL, default now()) — precise session start time

## Security
- No changes to RLS policies.

## Notes
- Idempotent: uses DO $$ blocks to check column existence.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sets' AND column_name = 'duration_min'
  ) THEN
    ALTER TABLE workout_sets ADD COLUMN duration_min numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sets' AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE workout_sets ADD COLUMN distance_km numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sets' AND column_name = 'kcal'
  ) THEN
    ALTER TABLE workout_sets ADD COLUMN kcal numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sessions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE workout_sessions ADD COLUMN started_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;
