import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Routine, RoutineExercise, DayOfWeek, Technique } from '@/types/routine';
import type { Exercise } from '@/types/exercise';

export interface RoutineWithExercises extends Routine {
  routine_exercises: (RoutineExercise & { exercises: Exercise })[];
}

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('routines')
      .select(
        `*, routine_exercises ( *, exercises ( * ) )`
      )
      .order('created_at', { ascending: false })
      .order('order_index', { referencedTable: 'routine_exercises' });

    if (fetchError) {
      setError(fetchError.message);
      setRoutines([]);
      setLoading(false);
      return;
    }
    setRoutines((data as RoutineWithExercises[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const createRoutine = useCallback(
    async (name: string, daysOfWeek: DayOfWeek[], description: string) => {
      const { data, error: insertError } = await supabase
        .from('routines')
        .insert({ name, days_of_week: daysOfWeek, description })
        .select()
        .single();
      if (insertError) throw insertError;
      await fetchRoutines();
      return data as Routine;
    },
    [fetchRoutines]
  );

  const updateRoutine = useCallback(
    async (
      id: string,
      updates: { name?: string; description?: string; days_of_week?: DayOfWeek[] }
    ) => {
      const { error: updateError } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id);
      if (updateError) throw updateError;
      await fetchRoutines();
    },
    [fetchRoutines]
  );

  const duplicateRoutine = useCallback(
    async (id: string) => {
      const routine = routines.find((r) => r.id === id);
      if (!routine) return;
      const { data, error: insertError } = await supabase
        .from('routines')
        .insert({
          name: `${routine.name} (copia)`,
          description: routine.description,
          days_of_week: routine.days_of_week,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      const newRoutine = data as Routine;
      for (const re of routine.routine_exercises) {
        await supabase.from('routine_exercises').insert({
          routine_id: newRoutine.id,
          exercise_id: re.exercise_id,
          order_index: re.order_index,
          target_sets: re.target_sets,
          target_reps: re.target_reps,
          target_rir: re.target_rir,
          rest_seconds: re.rest_seconds,
          technique: re.technique,
          notes: re.notes,
        });
      }
      await fetchRoutines();
    },
    [routines, fetchRoutines]
  );

  const deleteRoutine = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('routines').delete().eq('id', id);
      if (deleteError) throw deleteError;
      await fetchRoutines();
    },
    [fetchRoutines]
  );

  const addExerciseToRoutine = useCallback(
    async (
      routineId: string,
      exerciseId: string,
      opts: {
        target_sets: number;
        target_reps: string;
        target_rir: number;
        rest_seconds: number;
        technique: Technique;
      }
    ) => {
      const { data: existing } = await supabase
        .from('routine_exercises')
        .select('order_index')
        .eq('routine_id', routineId)
        .order('order_index', { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;
      const { error: insertError } = await supabase.from('routine_exercises').insert({
        routine_id: routineId,
        exercise_id: exerciseId,
        order_index: nextOrder,
        target_sets: opts.target_sets,
        target_reps: opts.target_reps,
        target_rir: opts.target_rir,
        rest_seconds: opts.rest_seconds,
        technique: opts.technique,
      });
      if (insertError) throw insertError;
      await fetchRoutines();
    },
    [fetchRoutines]
  );

  const updateRoutineExercise = useCallback(
    async (
      routineExerciseId: string,
      opts: {
        target_sets?: number;
        target_reps?: string;
        target_rir?: number;
        rest_seconds?: number;
        technique?: Technique;
      }
    ) => {
      const { error: updateError } = await supabase
        .from('routine_exercises')
        .update(opts)
        .eq('id', routineExerciseId);
      if (updateError) throw updateError;
      await fetchRoutines();
    },
    [fetchRoutines]
  );

  const removeExerciseFromRoutine = useCallback(
    async (routineExerciseId: string) => {
      const { error: deleteError } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('id', routineExerciseId);
      if (deleteError) throw deleteError;
      await fetchRoutines();
    },
    [fetchRoutines]
  );

  const reorderExercises = useCallback(
    async (routineId: string, orderedIds: string[]) => {
      const updates = orderedIds.map((id, idx) =>
        supabase.from('routine_exercises').update({ order_index: idx }).eq('id', id)
      );
      await Promise.all(updates);
      await fetchRoutines();
    },
    [fetchRoutines]
  );

  return {
    routines,
    loading,
    error,
    createRoutine,
    updateRoutine,
    duplicateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    updateRoutineExercise,
    removeExerciseFromRoutine,
    reorderExercises,
    refetch: fetchRoutines,
  };
}
