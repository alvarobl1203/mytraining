import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeDeload, type DeloadSignals } from '../lib/deload';
import type { Workout, WorkoutSet } from '../types';

export function useDeload(userId: string | null, plateauCount: number) {
  const [data, setData] = useState<DeloadSignals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString();
      const { data: ws } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('finished_at', since)
        .not('finished_at', 'is', null);

      const ids = (ws ?? []).map((w: Record<string, unknown>) => w.id as string);
      const { data: sets } = ids.length
        ? await supabase.from('workout_sets').select('*').in('workout_id', ids)
        : { data: [] as unknown[] };

      const wf: Workout[] = (ws ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        userId: r.user_id as string,
        routineId: (r.routine_id as string | null) ?? null,
        startedAt: r.started_at as string,
        finishedAt: (r.finished_at as string | null) ?? null,
        notes: (r.notes as string | null) ?? null,
      }));

    const sf: WorkoutSet[] = (sets ?? []).map((r: Record<string, unknown>) => ({
  id: r.id as string,
  workoutId: r.workout_id as string,
  exerciseId: r.exercise_id as string,
  setNumber: r.set_number as number,
  weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
  reps: r.reps !== null ? Number(r.reps) : null,
  rir: r.rir !== null ? Number(r.rir) : null,
  technique: (r.technique as WorkoutSet['technique']) ?? 'Normal',
  cardioSeconds: r.cardio_seconds !== null ? Number(r.cardio_seconds) : null,
  cardioKm: r.cardio_km !== null ? Number(r.cardio_km) : null,
  cardioKcal: r.cardio_kcal !== null ? Number(r.cardio_kcal) : null,
  notes: (r.notes as string | null) ?? null, 
  estimated1Rm: r.estimated_1rm !== null && r.estimated_1rm !== undefined
  ? Number(r.estimated_1rm) : null,
isPr: Boolean(r.is_pr),
  completed: Boolean(r.completed),
}));

      setData(computeDeload(wf, sf, plateauCount));
      setLoading(false);
    })();
  }, [userId, plateauCount]);

  return { deload: data, loading };
}