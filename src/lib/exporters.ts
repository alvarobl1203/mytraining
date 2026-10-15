import type { Workout, WorkoutSet, Exercise } from '../types';
import { downloadBlob } from './fileActions';

export interface ExportScope {
  kind: 'analytics' | 'week' | 'month' | 'range' | 'year' | 'all';
  from?: string;
  to?: string;
  exerciseId?: string;
}

export interface ExportContent {
  volume: boolean;
  prs: boolean;
  rir: boolean;
  bodyweight: boolean;
}

export function filterByScope(
  workouts: Workout[],
  sets: WorkoutSet[],
  scope: ExportScope
): { workouts: Workout[]; sets: WorkoutSet[] } {
  const now = new Date();
  let from: Date;
  let to: Date = now;

  switch (scope.kind) {
    case 'all':
      return { workouts, sets };
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      break;
    case 'range':
      from = new Date(scope.from ?? now);
      to = new Date(scope.to ?? now);
      break;
    default:
      from = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
  }

  const inRange = (iso: string) => {
    const d = new Date(iso);
    return d >= from && d <= to;
  };

  const filteredWorkouts = workouts.filter((w) =>
    w.finishedAt ? inRange(w.finishedAt) : false
  );
  const workoutIds = new Set(filteredWorkouts.map((w) => w.id));
  const filteredSets = sets.filter(
    (s) =>
      workoutIds.has(s.workoutId) &&
      (!scope.exerciseId || s.exerciseId === scope.exerciseId)
  );

  return { workouts: filteredWorkouts, sets: filteredSets };
}

export function buildDataset(
  workouts: Workout[],
  sets: WorkoutSet[],
  exercises: Exercise[],
  scope: ExportScope,
  content: ExportContent
) {
  const filtered = filterByScope(workouts, sets, scope);
  const exMap = new Map(exercises.map((e) => [e.id, e]));

  const totalVolume = filtered.sets.reduce(
    (a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0),
    0
  );
  const totalReps = filtered.sets.reduce((a, s) => a + (s.reps ?? 0), 0);
  const prs = filtered.sets.filter((s) => s.isPr);

  const byExercise = new Map<
    string,
    { name: string; sets: number; volume: number; best: number; prs: number }
  >();
  filtered.sets.forEach((s) => {
    const ex = exMap.get(s.exerciseId);
    if (!ex) return;
    const cur = byExercise.get(s.exerciseId) ?? {
      name: ex.name,
      sets: 0,
      volume: 0,
      best: 0,
      prs: 0,
    };
    cur.sets += 1;
    cur.volume += (s.weightKg ?? 0) * (s.reps ?? 0);
    cur.best = Math.max(cur.best, s.estimated1Rm ?? 0);
    if (s.isPr) cur.prs += 1;
    byExercise.set(s.exerciseId, cur);
  });

  return {
    generatedAt: new Date().toISOString(),
    app: 'MyTraining',
    version: '3.0.0',
    scope,
    content,
    summary: {
      totalWorkouts: filtered.workouts.length,
      totalSets: filtered.sets.length,
      totalReps,
      totalVolume: Math.round(totalVolume),
      totalPRs: prs.length,
    },
    exercises: Array.from(byExercise.values()).sort(
      (a, b) => b.volume - a.volume
    ),
    prs: content.prs
      ? prs.map((s) => ({
          exercise: exMap.get(s.exerciseId)?.name ?? '—',
          weightKg: s.weightKg,
          reps: s.reps,
          estimated1Rm: s.estimated1Rm,
          date: filtered.workouts.find((w) => w.id === s.workoutId)
            ?.finishedAt,
        }))
      : [],
  };
}

// ===========================================================================
// Exportadores simples por formato (JSON y TXT)
// ===========================================================================
export async function exportToJSON(
  data: unknown,
  filename: string
): Promise<void> {
  await downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    `${filename}.json`
  );
}

export async function exportToText(
  data: ReturnType<typeof buildDataset>,
  filename: string
): Promise<void> {
  const lines: string[] = [];
  lines.push(`MyTraining — Análisis exportado`);
  lines.push(`Fecha: ${new Date(data.generatedAt).toLocaleString('es-ES')}`);
  lines.push(`Alcance: ${data.scope.kind}`);
  lines.push('');
  lines.push('=== RESUMEN ===');
  lines.push(`Entrenamientos: ${data.summary.totalWorkouts}`);
  lines.push(`Series totales: ${data.summary.totalSets}`);
  lines.push(`Repeticiones totales: ${data.summary.totalReps}`);
  lines.push(`Volumen total: ${data.summary.totalVolume} kg`);
  lines.push(`PRs conseguidos: ${data.summary.totalPRs}`);
  lines.push('');
  lines.push('=== EJERCICIOS ===');
  data.exercises.forEach((e) => {
    lines.push(
      `${e.name}: ${e.sets} series · ${e.volume.toFixed(0)} kg · Mejor 1RM ${e.best.toFixed(1)} kg`
    );
  });
  if (data.prs.length > 0) {
    lines.push('');
    lines.push('=== PRs ===');
    data.prs.forEach((p) => {
      lines.push(
        `${p.exercise}: ${p.weightKg} kg × ${p.reps} (1RM ${p.estimated1Rm?.toFixed(1)})`
      );
    });
  }
  await downloadBlob(
    new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }),
    `${filename}.txt`
  );
}