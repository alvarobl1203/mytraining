import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup, Equipment, ExerciseCategory } from '@/types/exercise';

interface UseExercisesReturn {
  exercises: Exercise[];
  loading: boolean;
  error: string;
  createExercise: (data: Omit<Exercise, 'id' | 'created_at' | 'is_public' | 'user_id'>) => Promise<void>;
}

export function useExercises(
  search: string,
  muscleFilters: MuscleGroup[],
  categoryFilters: ExerciseCategory[],
  equipmentFilters: Equipment[]
): UseExercisesReturn {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError('');

    let query = supabase.from('exercises').select('*').order('name');

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setExercises([]);
      setLoading(false);
      return;
    }

    let filtered = (data as Exercise[]) || [];

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(term));
    }

    if (muscleFilters.length > 0) {
      filtered = filtered.filter(
        (ex) =>
          muscleFilters.includes(ex.primary_muscle) ||
          ex.secondary_muscles.some((m) => muscleFilters.includes(m))
      );
    }

    if (categoryFilters.length > 0) {
      filtered = filtered.filter((ex) => categoryFilters.includes(ex.category));
    }

    if (equipmentFilters.length > 0) {
      filtered = filtered.filter((ex) => equipmentFilters.includes(ex.equipment));
    }

    setExercises(filtered);
    setLoading(false);
  }, [search, muscleFilters, categoryFilters, equipmentFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const createExercise = useCallback(
    async (data: Omit<Exercise, 'id' | 'created_at' | 'is_public' | 'user_id'>) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) throw new Error('No hay sesión activa');

      const { error: insertError } = await supabase.from('exercises').insert({
        name: data.name,
        category: data.category,
        primary_muscle: data.primary_muscle,
        secondary_muscles: data.secondary_muscles,
        equipment: data.equipment,
        instructions: data.instructions,
        is_public: false,
        user_id: sessionData.session.user.id,
      });

      if (insertError) throw insertError;
      fetchExercises();
    },
    [fetchExercises]
  );

  return { exercises, loading, error, createExercise };
}
