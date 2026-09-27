import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutSession, WorkoutSetWithExercise, Technique } from '@/types/routine';

export interface SessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSetWithExercise[];
}

export interface CardioSetData {
  duration_min?: number;
  distance_km?: number;
  kcal?: number;
}

export function useWorkout() {
  const [activeSession, setActiveSession] = useState<SessionWithSets | null>(null);
  const [sessions, setSessions] = useState<SessionWithSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const startTimeRef = useRef<number>(0);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('workout_sessions')
      .select(`*, workout_sets ( *, exercises ( * ) )`)
      .order('date', { ascending: false })
      .order('set_number', { referencedTable: 'workout_sets' });
    if (fetchError) {
      setError(fetchError.message);
      setSessions([]);
      setLoading(false);
      return;
    }
    setSessions((data as SessionWithSets[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = useCallback(
    async (routineId: string | null, name: string) => {
      startTimeRef.current = Date.now();
      const now = new Date().toISOString();
      const { data, error: insertError } = await supabase
        .from('workout_sessions')
        .insert({
          routine_id: routineId,
          name,
          date: now.split('T')[0],
          completed: false,
          started_at: now,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      const session = data as WorkoutSession;
      setActiveSession({ ...session, workout_sets: [] });
      return session;
    },
    []
  );

  const addSet = useCallback(
    async (
      sessionId: string,
      exerciseId: string,
      setNumber: number,
      weightKg: number,
      reps: number,
      rir: number,
      technique: Technique,
      restSeconds: number,
      cardio?: CardioSetData
    ) => {
      const { data, error: insertError } = await supabase
        .from('workout_sets')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight_kg: weightKg,
          reps,
          rir,
          technique,
          rest_seconds: restSeconds,
          completed: true,
          duration_min: cardio?.duration_min ?? 0,
          distance_km: cardio?.distance_km ?? 0,
          kcal: cardio?.kcal ?? 0,
        })
        .select(`*, exercises ( * )`)
        .single();
      if (insertError) throw insertError;
      const newSet = data as WorkoutSetWithExercise;
      setActiveSession((prev) => {
        if (!prev) return prev;
        return { ...prev, workout_sets: [...prev.workout_sets, newSet] };
      });
      return newSet;
    },
    []
  );

  const deleteSet = useCallback(async (setId: string) => {
    const { error: deleteError } = await supabase.from('workout_sets').delete().eq('id', setId);
    if (deleteError) throw deleteError;
    setActiveSession((prev) => {
      if (!prev) return prev;
      return { ...prev, workout_sets: prev.workout_sets.filter((s) => s.id !== setId) };
    });
  }, []);

  const finishSession = useCallback(
    async (sessionId: string) => {
      const durationMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
      const { error: updateError } = await supabase
        .from('workout_sessions')
        .update({ completed: true, duration_minutes: durationMinutes })
        .eq('id', sessionId);
      if (updateError) throw updateError;
      setActiveSession(null);
      await fetchSessions();
    },
    [fetchSessions]
  );

  const cancelSession = useCallback(
    async (sessionId: string) => {
      const { error: deleteError } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
      if (deleteError) throw deleteError;
      setActiveSession(null);
      await fetchSessions();
    },
    [fetchSessions]
  );

  return {
    activeSession,
    sessions,
    loading,
    error,
    startSession,
    addSet,
    deleteSet,
    finishSession,
    cancelSession,
    refetch: fetchSessions,
  };
}
