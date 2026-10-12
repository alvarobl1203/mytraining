import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Routine, RoutineExercise, Exercise } from '../types';
import type { RoutineTemplate } from '../lib/templates';

export interface RoutineWithExercises extends Routine {
  exercises: (RoutineExercise & { exercise?: Exercise })[];
}

export interface CreateRoutineArgs {
  planName: string;
  dayOfWeek: number | null;
  dayLabel?: string | null;
  isRest?: boolean;
}

export function useRoutines(userId: string | null) {
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: rs } = await supabase
      .from('routines')
      .select('*')
      .order('created_at');

    if (!rs) {
      setLoading(false);
      return;
    }

    const ids = rs.map((r) => r.id as string);
    const { data: res } = ids.length
      ? await supabase
          .from('routine_exercises')
          .select('*, exercise:exercises(*)')
          .in('routine_id', ids)
          .order('position')
      : { data: [] as unknown[] };

       const map = new Map<string, RoutineWithExercises['exercises']>();
    (res ?? []).forEach((re: Record<string, unknown>) => {
      const ex = re.exercise as Record<string, unknown> | null;
      const list = map.get(re.routine_id as string) ?? [];
      list.push({
        id: re.id as string,
        routineId: re.routine_id as string,
        exerciseId: re.exercise_id as string,
        position: re.position as number,
        targetSets: re.target_sets as number,
        targetRepsMin: re.target_reps_min as number,
        targetRepsMax: re.target_reps_max as number,
        targetRir: re.target_rir as number,
        restSeconds: re.rest_seconds as number,
        exercise: ex
          ? {
              id: ex.id as string,
              name: ex.name as string,
              category: ex.category as Exercise['category'],
              primaryMuscle: ex.primary_muscle as Exercise['primaryMuscle'],
              primaryMuscles: Array.isArray(ex.primary_muscles)
                ? (ex.primary_muscles as Exercise['primaryMuscles'])
                : ([ex.primary_muscle as Exercise['primaryMuscle']].filter(
                    Boolean
                  ) as Exercise['primaryMuscles']),
              secondaryMuscles:
                (ex.secondary_muscles as Exercise['secondaryMuscles']) ?? [],
              equipment: ex.equipment as Exercise['equipment'],
              instructions: (ex.instructions as string) ?? '',
              isPublic: Boolean(ex.is_public),
              userId: (ex.user_id as string | null) ?? null,
              imageUrl: (ex.image_url as string | null) ?? null,
              biomechanicalType:
                (ex.biomechanical_type as Exercise['biomechanicalType']) ??
                null,
              exerciseType:
                (ex.exercise_type as Exercise['exerciseType']) ?? null,
              difficulty:
                (ex.difficulty as Exercise['difficulty']) ?? null,
              isCompound: Boolean(ex.is_compound),
              movementPattern:
                (ex.movement_pattern as Exercise['movementPattern']) ?? null,
            }
          : undefined,
      });
      map.set(re.routine_id as string, list);
    });

    setRoutines(
      rs.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        userId: r.user_id as string,
        name: r.name as string,
        planName: (r.plan_name as string | null) ?? null,
        dayLabel: (r.day_label as string | null) ?? null,
        isRest: Boolean(r.is_rest),
        dayOfWeek: (r.day_of_week as number | null) ?? null,
        createdAt: r.created_at as string,
        exercises: map.get(r.id as string) ?? [],
      }))
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async ({
      planName,
      dayOfWeek,
      dayLabel = null,
      isRest = false,
    }: CreateRoutineArgs) => {
      if (!userId) throw new Error('Sin sesión');
      const { error } = await supabase.from('routines').insert({
        user_id: userId,
        name: planName,
        plan_name: planName,
        day_label: dayLabel,
        is_rest: isRest,
        day_of_week: dayOfWeek,
      });
      if (error) throw error;
      await reload();
    },
    [userId, reload]
  );

  const update = useCallback(
    async (
      id: string,
      patch: {
        planName?: string;
        dayLabel?: string | null;
        isRest?: boolean;
        dayOfWeek?: number | null;
      }
    ) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.planName !== undefined) {
        dbPatch.plan_name = patch.planName;
        dbPatch.name = patch.planName;
      }
      if (patch.dayLabel !== undefined) dbPatch.day_label = patch.dayLabel;
      if (patch.isRest !== undefined) dbPatch.is_rest = patch.isRest;
      if (patch.dayOfWeek !== undefined) dbPatch.day_of_week = patch.dayOfWeek;

      const { error } = await supabase
        .from('routines')
        .update(dbPatch)
        .eq('id', id);
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  const removePlan = useCallback(
    async (planName: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('user_id', userId)
        .eq('plan_name', planName);
      if (error) throw error;
      await reload();
    },
    [userId, reload]
  );

  const addExercise = useCallback(
    async (
      routineId: string,
      exerciseId: string,
      defaults?: Partial<{
        targetSets: number;
        targetRepsMin: number;
        targetRepsMax: number;
        targetRir: number;
        restSeconds: number;
      }>
    ) => {
      const current = routines.find((r) => r.id === routineId);
      const pos = current ? current.exercises.length : 0;
      const { error } = await supabase.from('routine_exercises').insert({
        routine_id: routineId,
        exercise_id: exerciseId,
        position: pos,
        target_sets: defaults?.targetSets ?? 3,
        target_reps_min: defaults?.targetRepsMin ?? 8,
        target_reps_max: defaults?.targetRepsMax ?? 12,
        target_rir: defaults?.targetRir ?? 2,
        rest_seconds: defaults?.restSeconds ?? 90,
      });
      if (error) throw error;
      await reload();
    },
    [routines, reload]
  );

  const removeRoutineExercise = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  const reorder = useCallback(
    async (_routineId: string, orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase
            .from('routine_exercises')
            .update({ position: idx })
            .eq('id', id)
        )
      );
      await reload();
    },
    [reload]
  );

  const installTemplate = useCallback(
    async (tpl: RoutineTemplate, exerciseLookup: Map<string, string>) => {
      if (!userId) throw new Error('Sin sesión');
      const { data: routine, error } = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          name: tpl.name,
          plan_name: tpl.name,
          day_label: tpl.name,
          day_of_week: tpl.dayOfWeek,
        })
        .select('id')
        .single();
      if (error) throw error;

      const rows = tpl.exercises
        .map((te, idx) => {
          const exId = exerciseLookup.get(te.name);
          if (!exId) return null;
          return {
            routine_id: routine.id as string,
            exercise_id: exId,
            position: idx,
            target_sets: te.targetSets,
            target_reps_min: te.targetRepsMin,
            target_reps_max: te.targetRepsMax,
            target_rir: te.targetRir,
            rest_seconds: te.restSeconds,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (rows.length) {
        const { error: e2 } = await supabase
          .from('routine_exercises')
          .insert(rows);
        if (e2) throw e2;
      }
      await reload();
    },
    [userId, reload]
  );

  return {
    routines,
    loading,
    reload,
    create,
    update,
    remove,
    removePlan,
    addExercise,
    removeRoutineExercise,
    reorder,
    installTemplate,
  };
}