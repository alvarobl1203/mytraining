import type { Workout, WorkoutSet } from '../types';

export type DeloadLevel = 'ok' | 'warning' | 'recommended' | 'mandatory';

export interface DeloadSignals {
  consecutiveHardWeeks: number;
  weeklyVolumeTrend: number[]; // últimas 4 semanas
  avgRirTrend: number[]; // últimas 4 semanas
  plateauCount: number;
  fatigueScore: number; // 0-100
  level: DeloadLevel;
  recommendation: string;
}

const WEEK_MS = 7 * 24 * 3600 * 1000;

export function computeDeload(
  workouts: Workout[],
  sets: WorkoutSet[],
  plateauCount: number
): DeloadSignals {
  const now = Date.now();

  // Buckets de las últimas 4 semanas (0 = más antigua, 3 = actual)
  const volumeByWeek = [0, 0, 0, 0];
  const rirSumByWeek = [0, 0, 0, 0];
  const rirCountByWeek = [0, 0, 0, 0];
  const workoutsByWeek = [0, 0, 0, 0];

  const finishedWorkouts = workouts.filter((w) => w.finishedAt);
  const workoutsById = new Map(finishedWorkouts.map((w) => [w.id, w]));

  sets.forEach((s) => {
    if (!s.completed) return;
    const w = workoutsById.get(s.workoutId);
    if (!w?.finishedAt) return;
    const t = new Date(w.finishedAt).getTime();
    const ageWeeks = Math.floor((now - t) / WEEK_MS);
    if (ageWeeks > 3) return;
    const idx = 3 - ageWeeks;

    const vol = (s.weightKg ?? 0) * (s.reps ?? 0);
    volumeByWeek[idx] += vol;

    if (s.rir !== null) {
      rirSumByWeek[idx] += s.rir;
      rirCountByWeek[idx] += 1;
    }
  });

  finishedWorkouts.forEach((w) => {
    if (!w.finishedAt) return;
    const t = new Date(w.finishedAt).getTime();
    const ageWeeks = Math.floor((now - t) / WEEK_MS);
    if (ageWeeks > 3) return;
    workoutsByWeek[3 - ageWeeks] += 1;
  });

  const avgRirTrend = rirSumByWeek.map((sum, i) =>
    rirCountByWeek[i] > 0 ? sum / rirCountByWeek[i] : 0
  );

  // Semanas consecutivas "duras": volumen por encima de la media Y RIR bajo (<1.5)
  let consecutiveHardWeeks = 0;
  for (let i = 3; i >= 0; i--) {
    const isHard = workoutsByWeek[i] >= 3 && avgRirTrend[i] > 0 && avgRirTrend[i] < 1.5;
    if (isHard) consecutiveHardWeeks++;
    else break;
  }

  // Score de fatiga (0-100)
  let fatigue = 0;
  fatigue += Math.min(40, consecutiveHardWeeks * 15);
  fatigue += Math.min(25, plateauCount * 12);

  // Tendencia de volumen decreciente + RIR bajando = fatiga
  const volTrend =
    volumeByWeek[0] > 0
      ? (volumeByWeek[3] - volumeByWeek[0]) / volumeByWeek[0]
      : 0;
  if (volTrend < -0.15) fatigue += 15;

  const rirTrend =
    avgRirTrend[0] > 0 ? avgRirTrend[3] - avgRirTrend[0] : 0;
  if (rirTrend < -0.5) fatigue += 20;

  fatigue = Math.max(0, Math.min(100, fatigue));

  let level: DeloadLevel = 'ok';
  if (fatigue >= 75) level = 'mandatory';
  else if (fatigue >= 55) level = 'recommended';
  else if (fatigue >= 35) level = 'warning';

  const recommendation =
    level === 'mandatory'
      ? 'Llevas varias semanas acumulando fatiga. Haz una semana de descarga al 50% del volumen (mismas cargas, mitad de series) o reduce la intensidad al 70%.'
      : level === 'recommended'
        ? 'Señales claras de fatiga acumulada. Considera una semana de descarga: reduce el volumen un 40-50% y trabaja en RIR 3-4.'
        : level === 'warning'
          ? 'Empieza a vigilar la fatiga. Si la próxima semana sigues con RIR bajo, planifica un deload.'
          : 'Vas bien. Mantén el ritmo.';

  return {
    consecutiveHardWeeks,
    weeklyVolumeTrend: volumeByWeek,
    avgRirTrend,
    plateauCount,
    fatigueScore: Math.round(fatigue),
    level,
    recommendation,
  };
}