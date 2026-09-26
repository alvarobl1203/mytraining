/*
# Create exercises table for MyTraining

## Purpose
Stores the exercise catalog: base/public exercises (shared across all users)
and custom exercises created by individual users.

## New Tables
- `exercises`
  - `id` (uuid, primary key, defaults to gen_random_uuid)
  - `name` (text, NOT NULL)
  - `category` (text, 'Fuerza' | 'Hipertrofia' | 'Cardio')
  - `primary_muscle` (text, MuscleGroup enum)
  - `secondary_muscles` (text[], array of MuscleGroup)
  - `equipment` (text, Equipment enum)
  - `instructions` (text, defaults to empty string)
  - `is_public` (boolean, default false — true for catalog base)
  - `user_id` (uuid, nullable — null for public, auth.uid() for custom)
  - `created_at` (timestamptz, default now)

## Security — RLS with dual-access pattern
- Public exercises (is_public = true): readable by all authenticated users.
- Custom exercises (is_public = false): only readable/managed by owner (user_id = auth.uid()).
- INSERT: authenticated users can create custom exercises (user_id = auth.uid()).
  Public exercises are seeded via migration (service role), not via client.
- UPDATE/DELETE: only the owner of custom exercises can modify them.
  Public exercises cannot be modified by any client (no UPDATE/DELETE policy matching is_public = true).

## Notes
1. user_id is nullable: null for public catalog exercises, auth.uid() for custom.
2. The SELECT policy allows reading all public exercises + own custom exercises.
3. Public exercises are protected from client modification (UPDATE/DELETE only for user_id = auth.uid()).
*/

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Fuerza', 'Hipertrofia', 'Cardio')),
  primary_muscle text NOT NULL CHECK (
    primary_muscle IN (
      'Pectoral', 'Dorsal', 'Trapecio',
      'Deltoides Anterior', 'Deltoides Lateral', 'Deltoides Posterior',
      'Bíceps', 'Tríceps', 'Antebrazos',
      'Cuádriceps', 'Isquiosurales', 'Glúteos', 'Gemelos',
      'Core', 'Cardiovascular'
    )
  ),
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  equipment text NOT NULL CHECK (
    equipment IN (
      'Barra', 'Mancuernas', 'Multipower (Smith)', 'Máquina',
      'Polea', 'Peso Corporal', 'Kettlebell', 'Cardio'
    )
  ),
  instructions text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for filtering by user ownership
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_is_public ON exercises(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscle ON exercises(primary_muscle);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can read public exercises + their own custom ones
DROP POLICY IF EXISTS "select_exercises" ON exercises;
CREATE POLICY "select_exercises" ON exercises
  FOR SELECT TO authenticated
  USING (is_public = true OR user_id = auth.uid());

-- INSERT: authenticated users can create custom exercises (own only, not public)
DROP POLICY IF EXISTS "insert_own_exercises" ON exercises;
CREATE POLICY "insert_own_exercises" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_public = false);

-- UPDATE: only owner can update their custom exercises
DROP POLICY IF EXISTS "update_own_exercises" ON exercises;
CREATE POLICY "update_own_exercises" ON exercises
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: only owner can delete their custom exercises
DROP POLICY IF EXISTS "delete_own_exercises" ON exercises;
CREATE POLICY "delete_own_exercises" ON exercises
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
