-- ===========================================================================
-- MyTraining — Migración v6
-- ===========================================================================
-- Añade:
--   - profiles.rest_default_sec: descanso por defecto global (segundos)
--   - exercises.is_active:       soft-delete / ocultar del catálogo
--   - exercises.is_featured:     marcar como "principal"
--
-- Idempotente (usa IF NOT EXISTS). Sin pérdida de datos. Reversible.
-- ===========================================================================

-- 1. profiles.rest_default_sec
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rest_default_sec int NOT NULL DEFAULT 90
  CHECK (rest_default_sec BETWEEN 5 AND 900);

-- 2. exercises.is_active / is_featured
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- 3. Índices para las consultas del catálogo
CREATE INDEX IF NOT EXISTS idx_exercises_is_active
  ON exercises(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_exercises_is_featured
  ON exercises(is_featured)
  WHERE is_featured = true;

-- ===========================================================================
-- Rollback (comentado, solo si se necesita revertir):
-- ===========================================================================
-- DROP INDEX IF EXISTS idx_exercises_is_featured;
-- DROP INDEX IF EXISTS idx_exercises_is_active;
-- ALTER TABLE exercises DROP COLUMN IF EXISTS is_featured;
-- ALTER TABLE exercises DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE profiles  DROP COLUMN IF EXISTS rest_default_sec;