import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useExercises } from './useExercises';
import type { MuscleGroup } from '../types';

export function useWeeklyVolume(userId: string) {
  const { exercises } = useExercises();
  const [rawSets, setRawSets] = useState<{ exerciseId: string }[]>([]);

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: workouts } = await supabase
        .from('workouts').select('id').eq('user_id', userId)
        .gte('finished_at', weekAgo.toISOString())
        .not('finished_at', 'is', null);

      if (!workouts || workouts.length === 0) { setRawSets([]); return; }

      const ids = workouts.map((w: { id: string }) => w.id);
      const { data: sets } = await supabase
        .from('workout_sets').select('exercise_id')
        .in('workout_id', ids).eq('completed', true);

      setRawSets((sets ?? []).map((s: Record<string, unknown>) => ({
        exerciseId: s.exercise_id as string,
      })));
    })();
  }, [userId]);

  const setsPerMuscle = useMemo(() => {
    const acc = new Map<MuscleGroup, number>();
    const exMap = new Map(exercises.map((e) => [e.id, e]));

    rawSets.forEach((s) => {
      const ex = exMap.get(s.exerciseId);
      if (!ex) return;

      const involvement = ex.muscleInvolvement ?? {};
      const hasInvolvement = Object.keys(involvement).length > 0;

      if (hasInvolvement) {
        Object.entries(involvement).forEach(([m, weight]) => {
          if (!weight) return;
          const key = m as MuscleGroup;
          acc.set(key, (acc.get(key) ?? 0) + weight);
        });
      } else {
        ex.primaryMuscles.forEach((m) => {
          acc.set(m, (acc.get(m) ?? 0) + 1.0);
        });
        ex.secondaryMuscles.forEach((m) => {
          acc.set(m, (acc.get(m) ?? 0) + 0.5);
        });
      }
    });

    return acc;
  }, [rawSets, exercises]);

  return { setsPerMuscle };
}