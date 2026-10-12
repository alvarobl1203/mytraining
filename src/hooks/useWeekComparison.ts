import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface WeekComparison {
  currentTonnage: number;
  previousTonnage: number;
  deltaPercent: number | null;
  loading: boolean;
}

/**
 * Compara el tonelaje de los últimos 7 días con los 7 anteriores.
 */
export function useWeekComparison(userId: string | null): WeekComparison {
  const [state, setState] = useState<WeekComparison>({
    currentTonnage: 0,
    previousTonnage: 0,
    deltaPercent: null,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    (async () => {
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 3600 * 1000;
      const twoWeeksAgo = now - 14 * 24 * 3600 * 1000;

      const { data: ws } = await supabase
        .from('workouts')
        .select('id, started_at, finished_at')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .gte('finished_at', new Date(twoWeeksAgo).toISOString());

      const ids = (ws ?? []).map((w: { id: string }) => w.id);
      if (ids.length === 0) {
        setState({
          currentTonnage: 0,
          previousTonnage: 0,
          deltaPercent: null,
          loading: false,
        });
        return;
      }

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('workout_id, weight_kg, reps, completed')
        .in('workout_id', ids)
        .eq('completed', true);

      const workoutDates = new Map(
        (ws ?? []).map((w: Record<string, unknown>) => [
          w.id as string,
          new Date(w.finished_at as string).getTime(),
        ])
      );

      let current = 0;
      let previous = 0;
      (sets ?? []).forEach((s: Record<string, unknown>) => {
        const t = workoutDates.get(s.workout_id as string) ?? 0;
        const tonnage =
          Number(s.weight_kg ?? 0) * Number(s.reps ?? 0);
        if (t >= weekAgo) current += tonnage;
        else if (t >= twoWeeksAgo) previous += tonnage;
      });

      const delta =
        previous > 0 ? ((current - previous) / previous) * 100 : null;

      setState({
        currentTonnage: Math.round(current),
        previousTonnage: Math.round(previous),
        deltaPercent: delta !== null ? +delta.toFixed(1) : null,
        loading: false,
      });
    })();
  }, [userId]);

  return state;
}