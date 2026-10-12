import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Workout, WorkoutSet } from '../types';

export interface ExerciseHistory {
  workouts: Workout[];
  sets: WorkoutSet[];
  loading: boolean;
}

export function useExerciseHistory(
  userId: string | null,
  exerciseId: string | null
): ExerciseHistory {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !exerciseId) {
      setWorkouts([]);
      setSets([]);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: rawSets } = await supabase
        .from('workout_sets')
        .select('*, workouts!inner(user_id, finished_at)')
        .eq('exercise_id', exerciseId)
        .eq('completed', true)
        .eq('workouts.user_id', userId);

      if (!rawSets || rawSets.length === 0) {
        setWorkouts([]);
        setSets([]);
        setLoading(false);
        return;
      }

      const workoutIds = Array.from(
        new Set(
          rawSets.map((s: Record<string, unknown>) => s.workout_id as string)
        )
      );
      const { data: rawWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .in('id', workoutIds);

      const wf: Workout[] = (rawWorkouts ?? []).map(
        (r: Record<string, unknown>) => ({
          id: r.id as string,
          userId: r.user_id as string,
          routineId: (r.routine_id as string | null) ?? null,
          startedAt: r.started_at as string,
          finishedAt: (r.finished_at as string | null) ?? null,
          notes: (r.notes as string | null) ?? null,
        })
      );

      const sf: WorkoutSet[] = rawSets.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        workoutId: r.workout_id as string,
        exerciseId: r.exercise_id as string,
        setNumber: r.set_number as number,
        weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
        reps: r.reps !== null ? Number(r.reps) : null,
        rir: r.rir !== null ? Number(r.rir) : null,
        technique: (r.technique as WorkoutSet['technique']) ?? 'Normal',
        cardioSeconds:
          r.cardio_seconds !== null ? Number(r.cardio_seconds) : null,
        cardioKm: r.cardio_km !== null ? Number(r.cardio_km) : null,
        cardioKcal: r.cardio_kcal !== null ? Number(r.cardio_kcal) : null,
        notes: (r.notes as string | null) ?? null,
        estimated1Rm: r.estimated_1rm !== null && r.estimated_1rm !== undefined
  ? Number(r.estimated_1rm) : null,
isPr: Boolean(r.is_pr),
        completed: Boolean(r.completed),
      }));

      setWorkouts(wf);
      setSets(sf);
      setLoading(false);
    })();
  }, [userId, exerciseId]);

  return { workouts, sets, loading };
}