import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Workout, Technique } from '../types';

export interface ActiveSet {
  localId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  technique: Technique;
  cardioSeconds: number | null;
  cardioKm: number | null;
  cardioKcal: number | null;
  notes: string | null;
  estimated1Rm: number | null;
  completed: boolean;
}

export function useWorkouts(userId: string | null) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [sets, setSets] = useState<ActiveSet[]>([]);
  const [history, setHistory] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!userId) { setHistory([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('workouts').select('*').eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false }).limit(60);
    setHistory((data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, userId: r.user_id as string,
      routineId: (r.routine_id as string | null) ?? null,
      startedAt: r.started_at as string,
      finishedAt: (r.finished_at as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
    })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const startWorkout = useCallback(async (routineId: string | null) => {
    if (!userId) throw new Error('Sin sesión');
    const { data, error } = await supabase.from('workouts')
      .insert({ user_id: userId, routine_id: routineId }).select('*').single();
    if (error) throw error;
    const w: Workout = {
      id: data.id as string, userId: data.user_id as string,
      routineId: (data.routine_id as string | null) ?? null,
      startedAt: data.started_at as string, finishedAt: null, notes: null,
    };
    setActiveWorkout(w); setSets([]); return w;
  }, [userId]);

  const logSet = useCallback((s: Omit<ActiveSet, 'localId'>) => {
    setSets((prev) => [...prev, { ...s, localId: crypto.randomUUID() }]);
  }, []);

  const removeSet = useCallback((localId: string) => {
    setSets((prev) => prev.filter((s) => s.localId !== localId));
  }, []);

  
    const finishWorkout = useCallback(async () => {
    if (!activeWorkout) throw new Error('Sin workout activo');

    // 1. Construir filas base
    const baseRows = sets.map((s) => ({
      workout_id: activeWorkout.id,
      exercise_id: s.exerciseId,
      set_number: s.setNumber,
      weight_kg: s.weightKg,
      reps: s.reps,
      rir: s.rir,
      technique: s.technique,
      cardio_seconds: s.cardioSeconds,
      cardio_km: s.cardioKm,
      cardio_kcal: s.cardioKcal,
      notes: s.notes,
      estimated_1rm: s.estimated1Rm,
      is_pr: false,
      completed: s.completed,
    }));

    // 2. Evaluar PRs serie a serie (solo series de pesas completadas)
    const { checkIsPR } = await import('../lib/prLogic');
    const rowsWithPR = await Promise.all(
      baseRows.map(async (r, i) => {
        const original = sets[i];
        if (
          !r.weight_kg ||
          !r.reps ||
          original.cardioSeconds !== null
        ) {
          return r;
        }
        try {
          const result = await checkIsPR({
            userId: activeWorkout.userId,
            exerciseId: r.exercise_id,
            weightKg: r.weight_kg,
            reps: r.reps,
            rir: r.rir ?? 0,
          });
          return { ...r, is_pr: result.isPR };
        } catch {
          return r;
        }
      })
    );

    // 3. Insertar
    if (rowsWithPR.length) {
      const { error } = await supabase.from('workout_sets').insert(rowsWithPR);
      if (error) throw error;
    }

    const { error: e2 } = await supabase
      .from('workouts')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', activeWorkout.id);
    if (e2) throw e2;

    setActiveWorkout(null);
    setSets([]);
    await loadHistory();
  }, [activeWorkout, sets, loadHistory]);

  const cancelWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    await supabase.from('workouts').delete().eq('id', activeWorkout.id);
    setActiveWorkout(null); setSets([]);
  }, [activeWorkout]);

  return { activeWorkout, sets, history, loading,
    startWorkout, logSet, removeSet, finishWorkout, cancelWorkout, reload: loadHistory };
}