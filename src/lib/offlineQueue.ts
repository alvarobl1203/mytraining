// ===========================================================================
// MyTraining — Cola offline con Dexie (IndexedDB)
// ===========================================================================
// Persiste series que no pudieron subirse a Supabase (sin red, timeout, RLS)
// y las reintenta automáticamente al recuperar conexión.
// ===========================================================================

import Dexie, { type Table } from 'dexie';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface PendingSet {
  id?: number;         // auto-incremental de Dexie
  localId: string;     // uuid de la UI, para poder borrar desde allí
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  technique: string;
  cardioSeconds: number | null;
  cardioKm: number | null;
  cardioKcal: number | null;
  notes: string | null;
  estimated1Rm: number | null;
  completed: boolean;
  isPr: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------
class MyTrainingDB extends Dexie {
  pendingSets!: Table<PendingSet, number>;

  constructor() {
    super('mytraining-offline');
    this.version(1).stores({
      // Índices para poder buscar por localId o workoutId
      pendingSets: '++id, localId, workoutId, createdAt',
    });
  }
}

export const db = new MyTrainingDB();

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Encola una serie pendiente de sincronizar. */
export async function enqueueSet(
  payload: Omit<PendingSet, 'id' | 'createdAt'>,
): Promise<number> {
  return db.pendingSets.add({
    ...payload,
    createdAt: new Date().toISOString(),
  });
}

/** Borra de la cola todas las series asociadas a un workout (cancel). */
export async function clearQueueForWorkout(workoutId: string): Promise<number> {
  return db.pendingSets.where('workoutId').equals(workoutId).delete();
}

/** Borra de la cola una serie concreta por localId. */
export async function removeFromQueue(localId: string): Promise<number> {
  return db.pendingSets.where('localId').equals(localId).delete();
}

/** Cuenta las series pendientes de sincronizar. */
export async function queueCount(): Promise<number> {
  return db.pendingSets.count();
}

/**
 * Reintenta subir todas las series pendientes a Supabase.
 * Devuelve cuántas se sincronizaron y cuántas fallaron.
 */
export async function flushQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await db.pendingSets.toArray();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const { error } = await supabase.from('workout_sets').insert({
        workout_id: item.workoutId,
        exercise_id: item.exerciseId,
        set_number: item.setNumber,
        weight_kg: item.weightKg,
        reps: item.reps,
        rir: item.rir,
        technique: item.technique,
        cardio_seconds: item.cardioSeconds,
        cardio_km: item.cardioKm,
        cardio_kcal: item.cardioKcal,
        notes: item.notes,
        estimated_1rm: item.estimated1Rm,
        is_pr: item.isPr,
        completed: item.completed,
      });
      if (error) throw error;

      await db.pendingSets.delete(item.id!);
      synced++;
    } catch (e) {
      console.warn('[offlineQueue] Fallo al reintentar una serie:', e);
      failed++;
    }
  }

  return { synced, failed };
}

/** Borra toda la cola (útil para debugging o logout). */
export async function clearQueue(): Promise<void> {
  await db.pendingSets.clear();
}