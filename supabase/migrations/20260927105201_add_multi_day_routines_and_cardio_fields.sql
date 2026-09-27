/*
# Add multi-day routines, cardio workout fields, and session start timestamp

## Purpose
1. Enable routines to be assigned to multiple days of the week simultaneously
   (e.g., "Pierna A" on both Lunes and Jueves without duplicating the routine).
2. Add cardio-specific fields to workout_sets for tracking time, distance, and calories.
3. Add a started_at timestamp to workout_sessions for accurate duration calculation.

## Changes

### 1. routines table — new `days_of_week` column
- Added `days_of_week text[]` column (NOT NULL, defaults to '{}'::text[]).
- Migrated existing `day_of_week` values into `days_of_week` arrays.
- The original `day_of_week` column is kept for backward compatibility but
  the app will use `days_of_week` going forward.

### 2. workout_sets table — cardio fields
- Added `duration_min numeric` (default 0) — exercise duration in minutes for cardio.
- Added `distance_km numeric` (default 0) — distance in kilometers for cardio.
- Added `kcal numeric` (default 0) — calories burned for cardio.

### 3. workout_sessions table — started_at timestamp
- Added `started_at timestamptz` (default now()) — precise session start time
  for accurate duration calculation when finishing a workout.

## Security
- No changes to RLS policies. All existing policies remain in effect.
- New columns inherit the same RLS protection as their parent tables.

## Notes
1. `days_of_week` stores an array of DayOfWeek values (e.g., ['Lunes', 'Jueves']).
2. The migration is idempotent — uses DO $$ ... IF NOT EXISTS ... END $$ blocks.
3. Existing routines get their single day_of_week value wrapped into a days_of_week array.
4. Empty/Flexible routines get days_of_week = ['Flexible'].
*/
