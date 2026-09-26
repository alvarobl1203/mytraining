/*
# Create profiles table for MyTraining

## Purpose
Stores each user's onboarding data: biometrics (age, gender, weight, height),
activity level, calculated TDEE values, and available equipment.

## New Tables
- `profiles`
  - `id` (uuid, primary key, defaults to gen_random_uuid)
  - `user_id` (uuid, NOT NULL, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
  - `age` (int, check 13-100)
  - `gender` (text, 'masculino' | 'femenino')
  - `weight_kg` (numeric, check 30-300)
  - `height_cm` (int, check 120-250)
  - `activity_level` (text, one of 5 levels)
  - `tdee_maintenance` (int)
  - `tdee_deficit` (int)
  - `tdee_surplus` (int)
  - `equipment` (text[], available equipment list)
  - `onboarding_completed` (boolean, default false)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

## Security
- RLS enabled on `profiles`.
- 4 policies (SELECT/INSERT/UPDATE/DELETE) scoped TO authenticated,
  filtering by auth.uid() = user_id.
- user_id defaults to auth.uid() so inserts that omit it still pass the WITH CHECK.

## Notes
1. One row per user (UNIQUE constraint on user_id).
2. updated_at auto-refreshes via trigger on UPDATE.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  age int NOT NULL CHECK (age >= 13 AND age <= 100),
  gender text NOT NULL CHECK (gender IN ('masculino', 'femenino')),
  weight_kg numeric NOT NULL CHECK (weight_kg >= 30 AND weight_kg <= 300),
  height_cm int NOT NULL CHECK (height_cm >= 120 AND height_cm <= 250),
  activity_level text NOT NULL CHECK (activity_level IN ('sedentario', 'ligero', 'moderado', 'activo', 'muy_activo')),
  tdee_maintenance int NOT NULL DEFAULT 0,
  tdee_deficit int NOT NULL DEFAULT 0,
  tdee_surplus int NOT NULL DEFAULT 0,
  equipment text[] NOT NULL DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
