import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Exercise, MuscleGroup } from '../types';

function rowToExercise(r: Record<string, unknown>): Exercise {
  const primaryMuscles = Array.isArray(r.primary_muscles)
    ? (r.primary_muscles as MuscleGroup[])
    : [];
  const primaryFallback = [r.primary_muscle as MuscleGroup].filter(
    Boolean
  ) as MuscleGroup[];

  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Exercise['category'],
    primaryMuscle: r.primary_muscle as Exercise['primaryMuscle'],
    primaryMuscles:
      primaryMuscles.length > 0 ? primaryMuscles : primaryFallback,
    secondaryMuscles:
      (r.secondary_muscles as Exercise['secondaryMuscles']) ?? [],
    equipment: r.equipment as Exercise['equipment'],
    instructions: (r.instructions as string) ?? '',
    isPublic: Boolean(r.is_public),
    userId: (r.user_id as string | null) ?? null,
    isCustom: r.user_id !== null,
    imageUrl: (r.image_url as string | null) ?? null,
    biomechanicalType:
      (r.biomechanical_type as Exercise['biomechanicalType']) ?? null,
    // --- NUEVOS mapeos v3 ---
    exerciseType: (r.exercise_type as Exercise['exerciseType']) ?? null,
    difficulty: (r.difficulty as Exercise['difficulty']) ?? null,
    jointStress: Array.isArray(r.joint_stress)
      ? (r.joint_stress as string[])
      : [],
    muscleInvolvement:
      r.muscle_involvement && typeof r.muscle_involvement === 'object'
        ? (r.muscle_involvement as Exercise['muscleInvolvement'])
        : {},
    timeUnderTension:
      r.time_under_tension !== null && r.time_under_tension !== undefined
        ? Number(r.time_under_tension)
        : null,
    restSuggested:
      r.rest_suggested !== null && r.rest_suggested !== undefined
        ? Number(r.rest_suggested)
        : null,
    isCompound: Boolean(r.is_compound),
    movementPattern:
      (r.movement_pattern as Exercise['movementPattern']) ?? null,
  };
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setExercises(data.map(rowToExercise));
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createCustom = useCallback(
    async (payload: {
      name: string;
      category: Exercise['category'];
      primaryMuscle: Exercise['primaryMuscle'];
      secondaryMuscles: Exercise['secondaryMuscles'];
      equipment: Exercise['equipment'];
      instructions: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('Sin sesión');
      const { error } = await supabase.from('exercises').insert({
        user_id: uid,
        name: payload.name,
        category: payload.category,
        primary_muscle: payload.primaryMuscle,
        primary_muscles: [payload.primaryMuscle],
        secondary_muscles: payload.secondaryMuscles,
        equipment: payload.equipment,
        instructions: payload.instructions,
        is_public: false,
      });
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  return { exercises, loading, reload, createCustom };
}