import { supabase } from './supabase';
import type { Profile } from '../types';

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

/**
 * Descarga todos los datos del usuario como un archivo JSON.
 * Incluye perfil, rutinas, entrenamientos, series, peso corporal
 * y ejercicios personalizados.
 */
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
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `mytraining-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Borra TODOS los datos del usuario llamando a la RPC
 * `delete_my_account` creada en la migración SQL.
 *
 * Tras el borrado, cierra la sesión.
 */
export async function deleteAllMyData(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}