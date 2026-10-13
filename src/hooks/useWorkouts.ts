import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '../lib/supabase';
import {
  db,
  enqueueSet,
  clearQueueForWorkout,
  removeFromQueue,
  flushQueue,
} from '../lib/offlineQueue';
import type { Workout, Technique } from '../types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export type SetSyncStatus = 'pending' | 'synced' | 'queued';

export interface ActiveSet {
  localId: string;
  remoteId: string | null;
  syncStatus: SetSyncStatus;
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

  // Reactivo: cuenta pendientes en Dexie automáticamente
  const pendingSyncCount =
    useLiveQuery(() => db.pendingSets.count(), [], 0) ?? 0;

  // ---------------------------------------------------------------------------
  // Carga de historial
  // ---------------------------------------------------------------------------
  const loadHistory = useCallback(async () => {
    if (!userId) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(60);
    setHistory(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        userId: r.user_id as string,
        routineId: (r.routine_id as string | null) ?? null,
        startedAt: r.started_at as string,
        finishedAt: (r.finished_at as string | null) ?? null,
        notes: (r.notes as string | null) ?? null,
      })),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // ---------------------------------------------------------------------------
  // Persistencia de una serie (background)
  // ---------------------------------------------------------------------------
  const persistSet = useCallback(
    async (s: ActiveSet, workoutId: string) => {
      const row = {
        workout_id: workoutId,
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
        is_pr: false, // El PR se evalúa al final del workout (batch)
        completed: s.completed,
      };

      try {
        const { data, error } = await supabase
          .from('workout_sets')
          .insert(row)
          .select('id')
          .single();
        if (error) throw error;

        // Marcar como sincronizada
        setSets((prev) =>
          prev.map((x) =>
            x.localId === s.localId
              ? {
                  ...x,
                  remoteId: data.id as string,
                  syncStatus: 'synced',
                }
              : x,
          ),
        );
      } catch (e) {
        console.warn('[logSet] Fallo al persistir. Encolando offline:', e);
        // Guardar en Dexie para reintentar después
        try {
          await enqueueSet({
            localId: s.localId,
            workoutId,
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            weightKg: s.weightKg,
            reps: s.reps,
            rir: s.rir,
            technique: s.technique,
            cardioSeconds: s.cardioSeconds,
            cardioKm: s.cardioKm,
            cardioKcal: s.cardioKcal,
            notes: s.notes,
            estimated1Rm: s.estimated1Rm,
            completed: s.completed,
            isPr: false,
          });
          setSets((prev) =>
            prev.map((x) =>
              x.localId === s.localId ? { ...x, syncStatus: 'queued' } : x,
            ),
          );
        } catch (dexieErr) {
          console.error('[logSet] Fallo también al encolar en Dexie:', dexieErr);
          // Último recurso: marcar como queued igualmente para dar feedback
          setSets((prev) =>
            prev.map((x) =>
              x.localId === s.localId ? { ...x, syncStatus: 'queued' } : x,
            ),
          );
        }
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Iniciar workout
  // ---------------------------------------------------------------------------
  const startWorkout = useCallback(
    async (routineId: string | null) => {
      if (!userId) throw new Error('Sin sesión');
      const { data, error } = await supabase
        .from('workouts')
        .insert({ user_id: userId, routine_id: routineId })
        .select('*')
        .single();
      if (error) throw error;
      const w: Workout = {
        id: data.id as string,
        userId: data.user_id as string,
        routineId: (data.routine_id as string | null) ?? null,
        startedAt: data.started_at as string,
        finishedAt: null,
        notes: null,
      };
      setActiveWorkout(w);
      setSets([]);
      return w;
    },
    [userId],
  );

  // ---------------------------------------------------------------------------
  // Registrar serie (UI instantánea + persistencia en background)
  // ---------------------------------------------------------------------------
  const logSet = useCallback(
    (s: Omit<ActiveSet, 'localId' | 'remoteId' | 'syncStatus'>) => {
      if (!activeWorkout) {
        console.warn('[logSet] No hay workout activo');
        return;
      }
      const localId = crypto.randomUUID();
      const newSet: ActiveSet = {
        ...s,
        localId,
        remoteId: null,
        syncStatus: 'pending',
      };

      // 1. UI instantánea (optimistic)
      setSets((prev) => [...prev, newSet]);

      // 2. Persistencia en background
      void persistSet(newSet, activeWorkout.id);
    },
    [activeWorkout, persistSet],
  );

  // ---------------------------------------------------------------------------
  // Borrar serie (local + remoto + cola)
  // ---------------------------------------------------------------------------
  const removeSet = useCallback(
    async (localId: string) => {
      const s = sets.find((x) => x.localId === localId);
      if (!s) return;

      // 1. Quitar de la UI
      setSets((prev) => prev.filter((x) => x.localId !== localId));

      // 2. Si estaba en Dexie, quitarla también
      try {
        await removeFromQueue(localId);
      } catch (e) {
        console.warn('[removeSet] Fallo al limpiar Dexie:', e);
      }

      // 3. Si ya tenía remoteId, borrarla en Supabase
      if (s.remoteId) {
        const { error } = await supabase
          .from('workout_sets')
          .delete()
          .eq('id', s.remoteId);
        if (error) console.warn('[removeSet] Fallo al borrar en Supabase:', error);
      }
    },
    [sets],
  );

  // ---------------------------------------------------------------------------
  // Finalizar workout
  // ---------------------------------------------------------------------------
  const finishWorkout = useCallback(async () => {
    if (!activeWorkout) throw new Error('Sin workout activo');

    // 1. Reintentar todo lo que esté encolado en Dexie (por si hay red ahora)
    try {
      await flushQueue();
    } catch (e) {
      console.warn('[finishWorkout] Fallo al hacer flush de la cola:', e);
    }

    // 2. Fallback: insertar en bloque las series que no llegaron a Supabase
    //    (por ejemplo, si persistSet seguía en vuelo cuando el usuario pulsó finalizar)
    const unsynced = sets.filter((s) => !s.remoteId);
    if (unsynced.length > 0) {
      const rows = unsynced.map((s) => ({
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
      const { error } = await supabase.from('workout_sets').insert(rows);
      if (error) {
        // No rompemos: las series están a salvo en Dexie
        console.error('[finishWorkout] Fallback insert falló:', error);
      }
    }

    // 3. Evaluar PRs de todas las series del workout en Supabase
    const { data: dbSets, error: e1 } = await supabase
      .from('workout_sets')
      .select('id, exercise_id, weight_kg, reps, rir, cardio_seconds')
      .eq('workout_id', activeWorkout.id);
    if (e1) throw e1;

    const { checkIsPR } = await import('../lib/prLogic');
    const prIds: string[] = [];

    await Promise.all(
      (dbSets ?? []).map(async (r) => {
        if (!r.weight_kg || !r.reps || r.cardio_seconds !== null) return;
        try {
          const result = await checkIsPR({
            userId: activeWorkout.userId,
            exerciseId: r.exercise_id as string,
            weightKg: r.weight_kg as number,
            reps: r.reps as number,
            rir: (r.rir as number) ?? 0,
          });
          if (result.isPR) prIds.push(r.id as string);
        } catch {
          // Ignoramos errores de PR, no bloquean el cierre del workout
        }
      }),
    );

    // 4. Aplicar flags de PR (batch update uno por uno, son pocos)
    for (const id of prIds) {
      await supabase
        .from('workout_sets')
        .update({ is_pr: true })
        .eq('id', id);
    }

    // 5. Marcar workout como terminado
    const { error: e2 } = await supabase
      .from('workouts')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', activeWorkout.id);
    if (e2) throw e2;

    // 6. Limpiar estado
    setActiveWorkout(null);
    setSets([]);
    await loadHistory();
  }, [activeWorkout, sets, loadHistory]);

  // ---------------------------------------------------------------------------
  // Cancelar workout
  // ---------------------------------------------------------------------------
  const cancelWorkout = useCallback(async () => {
    if (!activeWorkout) return;

    // 1. Borrar series encoladas en Dexie para este workout
    try {
      await clearQueueForWorkout(activeWorkout.id);
    } catch (e) {
      console.warn('[cancelWorkout] Fallo al limpiar Dexie:', e);
    }

    // 2. Borrar series en Supabase (por FK, antes del workout)
    await supabase
      .from('workout_sets')
      .delete()
      .eq('workout_id', activeWorkout.id);

    // 3. Borrar el workout
    await supabase.from('workouts').delete().eq('id', activeWorkout.id);

    setActiveWorkout(null);
    setSets([]);
  }, [activeWorkout]);

  return {
    activeWorkout,
    sets,
    history,
    loading,
    pendingSyncCount,
    startWorkout,
    logSet,
    removeSet,
    finishWorkout,
    cancelWorkout,
    reload: loadHistory,
  };
}