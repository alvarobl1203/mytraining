import { supabase } from './supabase';
import type { Profile } from '../types';
import { downloadBlob } from './fileActions';

// ===========================================================================
// Tipos
// ===========================================================================
export interface BackupFile {
  version: string;
  app: string;
  exportedAt: string;
  profile: Profile | null;
  routines: unknown[];
  routineExercises: unknown[];
  workouts: unknown[];
  workoutSets: unknown[];
  bodyweightLogs: unknown[];
  customExercises: unknown[];
}

export interface ImportPreview {
  version: string;
  exportedAt: string;
  counts: {
    routines: number;
    routineExercises: number;
    workouts: number;
    workoutSets: number;
    bodyweightLogs: number;
    customExercises: number;
  };
}

export interface ImportResult {
  routines: number;
  routineExercises: number;
  workouts: number;
  workoutSets: number;
  bodyweightLogs: number;
  customExercises: number;
}

// ===========================================================================
// EXPORT
// ===========================================================================
export async function exportBackup(userId: string): Promise<void> {
  const [
    profileRes,
    routinesRes,
    workoutsRes,
    bodyweightRes,
    customExercisesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('routines').select('*').eq('user_id', userId),
    supabase.from('workouts').select('*').eq('user_id', userId),
    supabase.from('bodyweight_logs').select('*').eq('user_id', userId),
    supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', false),
  ]);

  const routines = routinesRes.data ?? [];
  const routineIds = routines.map((r: { id: string }) => r.id);
  const routineExercisesRes = routineIds.length
    ? await supabase
        .from('routine_exercises')
        .select('*')
        .in('routine_id', routineIds)
    : { data: [] as unknown[] };

  const workouts = workoutsRes.data ?? [];
  const workoutIds = workouts.map((w: { id: string }) => w.id);
  const workoutSetsRes = workoutIds.length
    ? await supabase
        .from('workout_sets')
        .select('*')
        .in('workout_id', workoutIds)
    : { data: [] as unknown[] };

  const backup: BackupFile = {
    version: '3.0.0',
    app: 'MyTraining',
    exportedAt: new Date().toISOString(),
    profile: (profileRes.data as Profile | null) ?? null,
    routines,
    routineExercises: routineExercisesRes.data ?? [],
    workouts,
    workoutSets: workoutSetsRes.data ?? [],
    bodyweightLogs: bodyweightRes.data ?? [],
    customExercises: customExercisesRes.data ?? [],
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const date = new Date().toISOString().slice(0, 10);
  await downloadBlob(blob, `mytraining-backup-${date}.json`);
}

// ===========================================================================
// IMPORT — Validación, preview y ejecución
// ===========================================================================

/**
 * Lee un File y devuelve un resumen de lo que contiene, sin tocar Supabase.
 * Lanza un Error con mensaje en español si el archivo no es válido.
 */
export async function previewBackup(file: File): Promise<ImportPreview> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('El archivo no tiene el formato esperado.');
  }

  const b = parsed as Partial<BackupFile>;

  if (b.app !== 'MyTraining') {
    throw new Error(
      'Este archivo no es un backup de MyTraining (falta el campo "app").',
    );
  }
  if (typeof b.version !== 'string') {
    throw new Error('El backup no incluye versión.');
  }

  const safeArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  return {
    version: b.version,
    exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : '—',
    counts: {
      routines: safeArray(b.routines).length,
      routineExercises: safeArray(b.routineExercises).length,
      workouts: safeArray(b.workouts).length,
      workoutSets: safeArray(b.workoutSets).length,
      bodyweightLogs: safeArray(b.bodyweightLogs).length,
      customExercises: safeArray(b.customExercises).length,
    },
  };
}

/**
 * Borra TODO el contenido del usuario (pero NO su cuenta ni su perfil)
 * en el orden correcto para respetar las FKs.
 */
async function wipeUserData(userId: string): Promise<void> {
  // 1. Recopilar IDs padre
  const [{ data: workouts }, { data: routines }] = await Promise.all([
    supabase.from('workouts').select('id').eq('user_id', userId),
    supabase.from('routines').select('id').eq('user_id', userId),
  ]);

  const workoutIds = (workouts ?? []).map((w) => w.id);
  const routineIds = (routines ?? []).map((r) => r.id);

  // 2. Borrar hijos primero
  if (workoutIds.length) {
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .in('workout_id', workoutIds);
    if (error) throw new Error(`Error borrando series: ${error.message}`);
  }
  if (routineIds.length) {
    const { error } = await supabase
      .from('routine_exercises')
      .delete()
      .in('routine_id', routineIds);
    if (error)
      throw new Error(
        `Error borrando ejercicios de rutina: ${error.message}`,
      );
  }

  // 3. Borrar padres
  {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(`Error borrando entrenos: ${error.message}`);
  }
  {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(`Error borrando rutinas: ${error.message}`);
  }
  {
    const { error } = await supabase
      .from('bodyweight_logs')
      .delete()
      .eq('user_id', userId);
    if (error)
      throw new Error(`Error borrando peso corporal: ${error.message}`);
  }
  {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('user_id', userId)
      .eq('is_public', false);
    if (error)
      throw new Error(
        `Error borrando ejercicios personalizados: ${error.message}`,
      );
  }
}

/**
 * Importa un backup JSON completo para el usuario indicado.
 *
 * - Valida el archivo (usando previewBackup).
 * - Borra los datos actuales del usuario (no la cuenta).
 * - Reinserta todo remapeando IDs para evitar colisiones.
 * - Devuelve los conteos finales.
 *
 * @param onProgress callback opcional para mostrar progreso en UI
 */
export async function importBackup(
  file: File,
  userId: string,
  onProgress?: (message: string) => void,
): Promise<ImportResult> {
  onProgress?.('Validando archivo…');
  // Esto lanza si el archivo no es válido
  await previewBackup(file);

  const text = await file.text();
  const parsed = JSON.parse(text) as BackupFile;

  const safeArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const routinesIn = safeArray(parsed.routines);
  const routineExIn = safeArray(parsed.routineExercises);
  const workoutsIn = safeArray(parsed.workouts);
  const workoutSetsIn = safeArray(parsed.workoutSets);
  const bodyweightIn = safeArray(parsed.bodyweightLogs);
  const customExIn = safeArray(parsed.customExercises);

  onProgress?.('Borrando datos actuales…');
  await wipeUserData(userId);

  // Mapa de IDs antiguos -> nuevos para respetar FKs
  const exerciseIdMap = new Map<string, string>();
  const routineIdMap = new Map<string, string>();
  const workoutIdMap = new Map<string, string>();

  // ---- 1) Ejercicios personalizados ----
  if (customExIn.length) {
    onProgress?.(`Importando ${customExIn.length} ejercicios personalizados…`);
    const newRows: Record<string, unknown>[] = customExIn.map(
      (raw): Record<string, unknown> => {
        const r = raw as Record<string, unknown>;
        const oldId = String(r.id);
        const newId = crypto.randomUUID();
        exerciseIdMap.set(oldId, newId);
        return {
          ...r,
          id: newId,
          user_id: userId,
          is_public: false,
        };
      },
    );
    const { error } = await supabase.from('exercises').insert(newRows);
    if (error) throw new Error(`Error importando ejercicios: ${error.message}`);
  }

  // ---- 2) Rutinas ----
  if (routinesIn.length) {
    onProgress?.(`Importando ${routinesIn.length} rutinas…`);
    const newRows: Record<string, unknown>[] = routinesIn.map(
      (raw): Record<string, unknown> => {
        const r = raw as Record<string, unknown>;
        const oldId = String(r.id);
        const newId = crypto.randomUUID();
        routineIdMap.set(oldId, newId);
        return { ...r, id: newId, user_id: userId };
      },
    );
    const { error } = await supabase.from('routines').insert(newRows);
    if (error) throw new Error(`Error importando rutinas: ${error.message}`);
  }

  // ---- 3) Ejercicios de rutina ----
  if (routineExIn.length) {
    onProgress?.(`Importando ${routineExIn.length} ejercicios de rutina…`);
    const newRows: Record<string, unknown>[] = routineExIn
      .map((raw): Record<string, unknown> | null => {
        const r = raw as Record<string, unknown>;
        const oldRoutineId = String(r.routine_id);
        const newRoutineId = routineIdMap.get(oldRoutineId);
        if (!newRoutineId) return null;
        const oldExId = String(r.exercise_id);
        // Si es un ejercicio custom, remapeamos; si es público, dejamos el mismo ID
        const newExId = exerciseIdMap.get(oldExId) ?? oldExId;
        return {
          ...r,
          id: crypto.randomUUID(),
          routine_id: newRoutineId,
          exercise_id: newExId,
        };
      })
      .filter((x): x is Record<string, unknown> => x !== null);

    if (newRows.length) {
      const { error } = await supabase
        .from('routine_exercises')
        .insert(newRows);
      if (error)
        throw new Error(
          `Error importando series de rutina: ${error.message}`,
        );
    }
  }

  // ---- 4) Entrenamientos ----
  if (workoutsIn.length) {
    onProgress?.(`Importando ${workoutsIn.length} entrenos…`);
    const newRows: Record<string, unknown>[] = workoutsIn.map(
      (raw): Record<string, unknown> => {
        const r = raw as Record<string, unknown>;
        const oldId = String(r.id);
        const newId = crypto.randomUUID();
        workoutIdMap.set(oldId, newId);
        // Remapear routine_id si existe
        const oldRoutineId =
          r.routine_id != null ? String(r.routine_id) : null;
        const newRoutineId = oldRoutineId
          ? (routineIdMap.get(oldRoutineId) ?? null)
          : null;
        return {
          ...r,
          id: newId,
          user_id: userId,
          routine_id: newRoutineId,
        };
      },
    );
    const { error } = await supabase.from('workouts').insert(newRows);
    if (error) throw new Error(`Error importando entrenos: ${error.message}`);
  }

  // ---- 5) Series de entrenamiento ----
  if (workoutSetsIn.length) {
    onProgress?.(`Importando ${workoutSetsIn.length} series…`);
    const newRows: Record<string, unknown>[] = workoutSetsIn
      .map((raw): Record<string, unknown> | null => {
        const r = raw as Record<string, unknown>;
        const oldWorkoutId = String(r.workout_id);
        const newWorkoutId = workoutIdMap.get(oldWorkoutId);
        if (!newWorkoutId) return null;
        const oldExId = String(r.exercise_id);
        const newExId = exerciseIdMap.get(oldExId) ?? oldExId;
        return {
          ...r,
          id: crypto.randomUUID(),
          workout_id: newWorkoutId,
          exercise_id: newExId,
        };
      })
      .filter((x): x is Record<string, unknown> => x !== null);

    if (newRows.length) {
      // Insertar en lotes para no superar límites de payload
      const BATCH = 500;
      for (let i = 0; i < newRows.length; i += BATCH) {
        const chunk = newRows.slice(i, i + BATCH);
        const { error } = await supabase.from('workout_sets').insert(chunk);
        if (error)
          throw new Error(`Error importando series: ${error.message}`);
      }
    }
  }

  // ---- 6) Peso corporal ----
  if (bodyweightIn.length) {
    onProgress?.(`Importando ${bodyweightIn.length} registros de peso…`);
    const newRows: Record<string, unknown>[] = bodyweightIn.map(
      (raw): Record<string, unknown> => {
        const r = raw as Record<string, unknown>;
        return { ...r, id: crypto.randomUUID(), user_id: userId };
      },
    );
    const { error } = await supabase.from('bodyweight_logs').insert(newRows);
    if (error)
      throw new Error(`Error importando peso corporal: ${error.message}`);
  }

  // ---- 7) Perfil (solo campos de preferencias, no email) ----
  if (parsed.profile) {
    onProgress?.('Aplicando preferencias de perfil…');
    // El perfil exportado tiene columnas snake_case (viene de select('*')),
    // aunque el tipo Profile sea camelCase. Forzamos Record<string, unknown>
    // pasando por unknown para acceder a los nombres reales de la BD.
    const p = parsed.profile as unknown as Record<string, unknown>;
    const { error } = await supabase
      .from('profiles')
      .update({
        age: p.age ?? null,
        gender: p.gender ?? null,
        weight_kg: p.weight_kg ?? null,
        height_cm: p.height_cm ?? null,
        activity_level: p.activity_level ?? null,
        available_equipment: p.available_equipment ?? [],
        preferred_types: p.preferred_types ?? [],
        training_mode: p.training_mode ?? 'simple',
        enabled_techniques: p.enabled_techniques ?? [],
        show_technique_hints: p.show_technique_hints ?? true,
        show_volume_panel: p.show_volume_panel ?? true,
      })
      .eq('id', userId);
    if (error) throw new Error(`Error actualizando perfil: ${error.message}`);
  }

  onProgress?.('¡Importación completada!');

  return {
    routines: routinesIn.length,
    routineExercises: routineExIn.length,
    workouts: workoutsIn.length,
    workoutSets: workoutSetsIn.length,
    bodyweightLogs: bodyweightIn.length,
    customExercises: customExIn.length,
  };
}

// ===========================================================================
// GDPR
// ===========================================================================
export async function deleteAllMyData(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}