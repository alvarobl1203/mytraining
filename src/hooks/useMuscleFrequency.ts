import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MuscleGroup } from '../types';

export function useMuscleFrequency(userId: string | null, days = 30) {
  const [frequency, setFrequency] = useState<Map<MuscleGroup, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setFrequency(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      const { data: ws } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .gte('finished_at', since)
        .not('finished_at', 'is', null);

      const ids = (ws ?? []).map((w: { id: string }) => w.id);
      if (ids.length === 0) {
        setFrequency(new Map());
        setLoading(false);
        return;
      }

      const { data: rows } = await supabase
        .from('workout_sets')
        .select('exercise_id, workout_id, exercises(primary_muscle)')
        .in('workout_id', ids)
        .eq('completed', true);

      // Contamos el número de sesiones distintas por músculo (no de series)
      const perMuscleDays = new Map<MuscleGroup, Set<string>>();
      (rows ?? []).forEach((row: Record<string, unknown>) => {
        const ex = row.exercises as { primary_muscle?: MuscleGroup } | null;
        const m = ex?.primary_muscle;
        if (!m) return;
        const set = perMuscleDays.get(m) ?? new Set();
        set.add(row.workout_id as string);
        perMuscleDays.set(m, set);
      });

      const out = new Map<MuscleGroup, number>();
      perMuscleDays.forEach((set, m) => out.set(m, set.size));
      setFrequency(out);
      setLoading(false);
    })();
  }, [userId, days]);

  return { frequency, loading };
}