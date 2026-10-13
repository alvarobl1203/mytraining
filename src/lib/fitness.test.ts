// ===========================================================================
// Tests — fitness.ts
// ===========================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeFitness } from './fitness';
import type { Workout, WorkoutSet } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function mkWorkout(id: string, finishedDaysAgo: number): Workout {
  const now = Date.now();
  const finished = new Date(now - finishedDaysAgo * 24 * 3600 * 1000);
  return {
    id,
    userId: 'u1',
    routineId: null,
    startedAt: new Date(finished.getTime() - 3600_000).toISOString(),
    finishedAt: finished.toISOString(),
    notes: null,
  };
}

function mkSet(
  id: string,
  workoutId: string,
  weightKg: number,
  reps: number,
): WorkoutSet {
  return {
    id,
    workoutId,
    exerciseId: 'e1',
    setNumber: 1,
    weightKg,
    reps,
    rir: 2,
    technique: 'Normal',
    cardioSeconds: null,
    cardioKm: null,
    cardioKcal: null,
    notes: null,
    estimated1Rm: null,
    isPr: false,
    completed: true,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('computeFitness', () => {
  it('sin entrenos → array de longitud days+1, todo 0', () => {
    const points = computeFitness([], [], 30);
    expect(points).toHaveLength(31);
    points.forEach((p) => {
      expect(p.load).toBe(0);
      expect(p.ctl).toBe(0);
      expect(p.atl).toBe(0);
      expect(p.tsb).toBe(0);
    });
  });

  it('un entreno hoy sube CTL y ATL, y ATL > CTL (pico agudo)', () => {
    const w = mkWorkout('w1', 0);
    const s = mkSet('s1', 'w1', 100, 10);

    const points = computeFitness([w], [s], 30);
    const last = points[points.length - 1];

    expect(last.load).toBeGreaterThan(0);
    expect(last.ctl).toBeGreaterThan(0);
    expect(last.atl).toBeGreaterThan(0);
    // Con carga hoy, ATL pica más que CTL (constante 7 vs 42)
    expect(last.atl).toBeGreaterThan(last.ctl);
  });

  it('un entreno hace 30 días → CTL > ATL (ATL decae más rápido)', () => {
    const w = mkWorkout('w1', 30);
    const s = mkSet('s1', 'w1', 100, 10);

    const points = computeFitness([w], [s], 30);
    const last = points[points.length - 1];

    expect(last.ctl).toBeGreaterThan(last.atl);
  });

  it('CTL crece con entrenos recurrentes', () => {
    const workouts: Workout[] = [];
    const sets: WorkoutSet[] = [];
    for (let i = 0; i < 14; i++) {
      const id = `w${i}`;
      workouts.push(mkWorkout(id, i));
      sets.push(mkSet(`s${i}`, id, 100, 8));
    }

    const points = computeFitness(workouts, sets, 30);
    const first = points[0];
    const last = points[points.length - 1];

    expect(last.ctl).toBeGreaterThan(first.ctl);
  });

  it('ignora sets no completados', () => {
    const w = mkWorkout('w1', 0);
    const s: WorkoutSet = { ...mkSet('s1', 'w1', 100, 8), completed: false };

    const points = computeFitness([w], [s], 30);
    const last = points[points.length - 1];
    expect(last.load).toBe(0);
  });

  it('ignora sets sin peso o sin reps', () => {
    const w = mkWorkout('w1', 0);
    const s1: WorkoutSet = { ...mkSet('s1', 'w1', 100, 8), weightKg: null };
    const s2: WorkoutSet = { ...mkSet('s2', 'w1', 100, 8), reps: null };

    const points = computeFitness([w], [s1, s2], 30);
    const last = points[points.length - 1];
    expect(last.load).toBe(0);
  });

  it('el tonnage diario se acumula correctamente', () => {
    const w = mkWorkout('w1', 0);
    const sets: WorkoutSet[] = [
      mkSet('s1', 'w1', 100, 8),
      mkSet('s2', 'w1', 100, 8),
      mkSet('s3', 'w1', 80, 10),
    ];

    const points = computeFitness([w], sets, 30);
    const last = points[points.length - 1];
    expect(last.load).toBe(2400);
  });
});