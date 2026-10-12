import { supabase } from './supabase';
import { estimateOneRm } from './calculations';

export interface PRCheckInput {
  userId: string;
  exerciseId: string;
  weightKg: number | null;
  reps: number | null;
  rir: number;
}

export interface PRCheckResult {
  isPR: boolean;
  previousBest: number | null;
  currentEstimate: number | null;
  /** true si es el primer registro (baseline). No se marca como PR. */
  isBaseline: boolean;
}

/**
 * Determina si una serie es un nuevo PR.
 * Reglas:
 *  - Si no hay historial → baseline (isPR = false).
 *  - Si estimated1Rm > max histórico → PR (isPR = true).
 *  - Si no supera → no PR.
 */
export async function checkIsPR(input: PRCheckInput): Promise<PRCheckResult> {
  const { userId, exerciseId, weightKg, reps, rir } = input;

  if (!weightKg || !reps || reps <= 0) {
    return { isPR: false, previousBest: null, currentEstimate: null, isBaseline: false };
  }

  const currentEstimate = estimateOneRm(weightKg, reps, rir);

  const { data: ws } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .not('finished_at', 'is', null);

  const ids = (ws ?? []).map((w: { id: string }) => w.id);
  if (ids.length === 0) {
    return { isPR: false, previousBest: null, currentEstimate, isBaseline: true };
  }

  const { data: rows } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, rir')
    .in('workout_id', ids)
    .eq('exercise_id', exerciseId)
    .eq('completed', true);

  if (!rows || rows.length === 0) {
    return { isPR: false, previousBest: null, currentEstimate, isBaseline: true };
  }

  let previousBest = 0;
  (rows as Record<string, unknown>[]).forEach((r) => {
    const w = Number(r.weight_kg ?? 0);
    const rep = Number(r.reps ?? 0);
    if (!w || !rep) return;
    const rm = estimateOneRm(w, rep, Number(r.rir ?? 0));
    if (rm > previousBest) previousBest = rm;
  });

  return {
    isPR: currentEstimate > previousBest,
    previousBest: previousBest > 0 ? previousBest : null,
    currentEstimate,
    isBaseline: false,
  };
}