// ===========================================================================
// MyTraining — Disciplinas activas
// ===========================================================================
// Lista blanca de disciplinas válidas + utilidades de saneado + filtros
// contextuales.
// Cualquier valor que llegue desde BD, backups o datos antiguos y no esté
// en ACTIVE_DISCIPLINES se descarta automáticamente.
// ===========================================================================

import type { Equipment, ExerciseType } from '../types';
import { EQUIPMENT_LIST } from './constants';

/** Disciplinas activas de MyTraining. */
export const ACTIVE_DISCIPLINES: readonly ExerciseType[] = [
  'gym',
  'calistenia',
  'cardio',
] as const;

/** ¿El valor es una disciplina activa? */
export function isActiveDiscipline(v: unknown): v is ExerciseType {
  return v === 'gym' || v === 'calistenia' || v === 'cardio';
}

/**
 * Convierte un `exercise_type` crudo de BD al `exerciseType` de la app.
 * Devuelve `null` para cualquier valor no reconocido.
 */
export function toActiveExerciseType(raw: unknown): ExerciseType | null {
  return isActiveDiscipline(raw) ? raw : null;
}

/**
 * Sanea un array de `preferred_types`:
 * - Filtra a las disciplinas activas.
 * - Deduplica preservando orden.
 * - Si no queda ninguna, devuelve las 3 activas por defecto.
 */
export function sanitizePreferredTypes(raw: unknown): ExerciseType[] {
  const fallback: ExerciseType[] = ['gym', 'calistenia', 'cardio'];
  if (!Array.isArray(raw)) return fallback;
  const filtered = raw.filter(isActiveDiscipline);
  const seen = new Set<ExerciseType>();
  const out: ExerciseType[] = [];
  filtered.forEach((d) => {
    if (!seen.has(d)) {
      seen.add(d);
      out.push(d);
    }
  });
  return out.length > 0 ? out : fallback;
}

/**
 * Chips de material contextuales según la disciplina activa.
 * - `gym`: materiales de gimnasio (sin "Peso Corporal", que no aplica
 *   como filtro principal aunque haya ejercicios de dominadas/fondos).
 * - `calistenia`: solo "Peso Corporal".
 * - `cardio`: solo "Cardio".
 * - `all`: la lista completa.
 */
export function equipmentForDiscipline(
  d: ExerciseType | 'all',
): readonly Equipment[] {
  switch (d) {
    case 'gym':
      return [
        'Barra',
        'Mancuernas',
        'Multipower (Smith)',
        'Máquina',
        'Polea',
        'Kettlebell',
      ];
    case 'calistenia':
      return ['Peso Corporal'];
    case 'cardio':
      return ['Cardio'];
    case 'all':
    default:
      return EQUIPMENT_LIST;
  }
}