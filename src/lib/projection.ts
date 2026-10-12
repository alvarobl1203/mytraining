import { estimateOneRm } from './calculations';
import type { Workout, WorkoutSet } from '../types';

export interface RegressionPoint {
  x: number;
  y: number;
  date: string;
}

export interface Projection {
  points: RegressionPoint[];
  slope: number;
  intercept: number;
  weeksToTarget: number | null;
  target: number;
  confidence: 'low' | 'medium' | 'high';
}

export function projectToTarget(
  exerciseId: string,
  workouts: Workout[],
  sets: WorkoutSet[],
  target: number
): Projection | null {
  const bestByWorkout = new Map<string, number>();
  sets
    .filter(
      (s) => s.exerciseId === exerciseId && s.completed && s.weightKg && s.reps
    )
    .forEach((s) => {
      const rm = estimateOneRm(s.weightKg!, s.reps!, s.rir ?? 0);
      const prev = bestByWorkout.get(s.workoutId) ?? 0;
      if (rm > prev) bestByWorkout.set(s.workoutId, rm);
    });

  const ordered: RegressionPoint[] = [];
  workouts
    .filter((w) => bestByWorkout.has(w.id) && w.finishedAt)
    .sort(
      (a, b) =>
        new Date(a.finishedAt!).getTime() - new Date(b.finishedAt!).getTime()
    )
    .forEach((w, idx) => {
      ordered.push({
        x: idx,
        y: bestByWorkout.get(w.id)!,
        date: w.finishedAt!,
      });
    });

  if (ordered.length < 3) return null;

  const n = ordered.length;
  const sumX = ordered.reduce((a, p) => a + p.x, 0);
  const sumY = ordered.reduce((a, p) => a + p.y, 0);
  const sumXY = ordered.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = ordered.reduce((a, p) => a + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  let weeksToTarget: number | null = null;
  if (slope > 0.05 && target > 0) {
    const xTarget = (target - intercept) / slope;
    const sessionsRemaining = xTarget - (n - 1);
    const sessionsPerWeek = 2;
    const w = Math.ceil(sessionsRemaining / sessionsPerWeek);
    weeksToTarget = w >= 0 && w <= 200 ? w : null;
  }

  const predicted = ordered.map((p) => slope * p.x + intercept);
  const residuals = ordered.map((p, i) => p.y - predicted[i]);
  const rmse = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / n);
  const avg = sumY / n;
  const cv = avg > 0 ? rmse / avg : 1;

  const confidence: Projection['confidence'] =
    cv < 0.02 && n >= 6 ? 'high' : cv < 0.05 && n >= 4 ? 'medium' : 'low';

  return {
    points: ordered,
    slope,
    intercept,
    weeksToTarget,
    target,
    confidence,
  };
}