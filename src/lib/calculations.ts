import { ACTIVITY_FACTORS } from './constants';
import type { ActivityLevel, Gender } from '../types';

export function mifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'Hombre') return base + 5;
  if (gender === 'Mujer') return base - 161;
  return base - 78;
}

export function tdee(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activity: ActivityLevel
): number {
  return Math.round(
    mifflinStJeor(weightKg, heightCm, age, gender) * ACTIVITY_FACTORS[activity]
  );
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return +(weightKg / (m * m)).toFixed(1);
}

export function estimateOneRm(weightKg: number, reps: number, rir: number): number {
  const effective = reps + rir;
  if (effective <= 0) return weightKg;
  const denom = 1.0278 - 0.0278 * effective;
  if (denom <= 0) return weightKg;
  return +(weightKg / denom).toFixed(1);
}

export function tonnage(
  weightKg: number | null,
  reps: number | null,
  sets: number
): number {
  if (!weightKg || !reps) return 0;
  return weightKg * reps * sets;
}