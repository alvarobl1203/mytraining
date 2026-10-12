import type { Exercise, Workout, WorkoutSet } from '../types';
import { estimateOneRm } from './calculations';

export interface PlateauAlert {
  exercise: Exercise;
  best1RmByWeek: number[];
  recommendation: string;
}

const BIG_LIFTS = [
  'Press banca con barra',
  'Sentadilla con barra',
  'Peso muerto convencional con barra',
];

export function detectPlateaus(
  exercises: Exercise[],
  workouts: Workout[],
  sets: WorkoutSet[]
): PlateauAlert[] {
  const workoutsById = new Map(workouts.map((w) => [w.id, w]));
  const now = Date.now();
  const threeWeeksAgo = now - 21 * 24 * 3600 * 1000;

  const alerts: PlateauAlert[] = [];

  for (const name of BIG_LIFTS) {
    const ex = exercises.find((e) => e.name === name);
    if (!ex) continue;

    const bestPerWeek = new Map<number, number>();

    sets
      .filter((s) => s.exerciseId === ex.id && s.completed && s.weightKg && s.reps)
      .forEach((s) => {
        const w = workoutsById.get(s.workoutId);
        if (!w?.finishedAt) return;
        const t = new Date(w.finishedAt).getTime();
        if (t < threeWeeksAgo) return;
        const weekIdx = Math.min(
          2,
          Math.floor((t - threeWeeksAgo) / (7 * 24 * 3600 * 1000))
        );
        const rir = s.rir ?? 0;
        const rm = estimateOneRm(s.weightKg!, s.reps!, rir);
        const prev = bestPerWeek.get(weekIdx) ?? 0;
        if (rm > prev) bestPerWeek.set(weekIdx, rm);
      });

    const series = [0, 1, 2].map((i) => bestPerWeek.get(i) ?? 0);
    const nonZero = series.filter((v) => v > 0);
    if (nonZero.length < 3) continue;

    const maxAll = Math.max(...series);
    const minAll = Math.min(...nonZero);
    if (maxAll > 0 && (maxAll - minAll) / maxAll < 0.01) {
      alerts.push({
        exercise: ex,
        best1RmByWeek: series,
        recommendation:
          'Haz una semana de descarga al 50% del volumen, cambia el rango de reps (ej. de 5 a 8-10) o cambia de material (barra → mancuernas / multipower).',
      });
    }
  }

  return alerts;
}