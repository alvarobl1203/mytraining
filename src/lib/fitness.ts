import type { Workout, WorkoutSet } from '../types';

export interface FitnessPoint {
  date: string;   // YYYY-MM-DD
  load: number;   // carga del día (tonnage)
  ctl: number;    // forma (42 días)
  atl: number;    // fatiga (7 días)
  tsb: number;    // balance = CTL - ATL
}

const DAY_MS = 24 * 3600 * 1000;

/**
 * Modelo exponencial:
 *   CTL_hoy = CTL_ayer + (load_hoy - CTL_ayer) / 42
 *   ATL_hoy = ATL_ayer + (load_hoy - ATL_ayer) / 7
 *   TSB_hoy = CTL_ayer - ATL_ayer
 */
export function computeFitness(
  workouts: Workout[],
  sets: WorkoutSet[],
  days = 90
): FitnessPoint[] {
  const now = new Date();
  const start = new Date(now.getTime() - days * DAY_MS);

  // 1. Load diario
  const loadByDate = new Map<string, number>();
  const workoutsById = new Map(workouts.map((w) => [w.id, w]));

  sets.forEach((s) => {
    if (!s.completed || !s.weightKg || !s.reps) return;
    const w = workoutsById.get(s.workoutId);
    if (!w?.finishedAt) return;
    const d = new Date(w.finishedAt);
    if (d < start) return;
    const key = d.toISOString().slice(0, 10);
    loadByDate.set(key, (loadByDate.get(key) ?? 0) + s.weightKg * s.reps);
  });

  // 2. Iteración día a día
  const out: FitnessPoint[] = [];
  let ctl = 0;
  let atl = 0;
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const load = loadByDate.get(key) ?? 0;

    const prevCtl = ctl;
    const prevAtl = atl;
    ctl = ctl + (load - ctl) / 42;
    atl = atl + (load - atl) / 7;

    out.push({
      date: key,
      load,
      ctl: +ctl.toFixed(1),
      atl: +atl.toFixed(1),
      tsb: +(prevCtl - prevAtl).toFixed(1),
    });
  }

  return out;
}