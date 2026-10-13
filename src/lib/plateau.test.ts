// ===========================================================================
// Tests — plateau.ts
// ===========================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectPlateaus } from './plateau';
import type { Exercise, Workout, WorkoutSet } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function mkExercise(name: string, id: string): Exercise {
  return {
    id,
    name,
    category: 'Fuerza',
    primaryMuscle: 'Pectoral Medio',
    primaryMuscles: ['Pectoral Medio'],
    secondaryMuscles: [],
    equipment: 'Barra',
    instructions: '',
    isPublic: true,
    userId: null,
  };
}

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
  exerciseId: string,
  weightKg: number,
  reps: number,
  rir = 2,
): WorkoutSet {
  return {
    id,
    workoutId,
    exerciseId,
    setNumber: 1,
    weightKg,
    reps,
    rir,
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
describe('detectPlateaus', () => {
  it('sin ejercicios pesados → array vacío', () => {
    const alerts = detectPlateaus([], [], []);
    expect(alerts).toEqual([]);
  });

  it('ejercicio pesado sin entrenos → array vacío', () => {
    const ex = mkExercise('Press banca con barra', 'ex-bench');
    const alerts = detectPlateaus([ex], [], []);
    expect(alerts).toEqual([]);
  });

  it('solo 2 semanas de datos → no alerta (necesita 3)', () => {
    const ex = mkExercise('Press banca con barra', 'ex-bench');
    const workouts = [mkWorkout('w1', 20), mkWorkout('w2', 7)];
    const sets = [
      mkSet('s1', 'w1', 'ex-bench', 100, 5),
      mkSet('s2', 'w2', 'ex-bench', 100, 5),
    ];
    const alerts = detectPlateaus([ex], workouts, sets);
    expect(alerts).toEqual([]);
  });

  it('3 semanas con 1RM idéntico → plateaus detectado', () => {
    const ex = mkExercise('Press banca con barra', 'ex-bench');
    const workouts = [
      mkWorkout('w1', 20),
      mkWorkout('w2', 14),
      mkWorkout('w3', 7),
    ];
    const sets = [
      mkSet('s1', 'w1', 'ex-bench', 100, 5),
      mkSet('s2', 'w2', 'ex-bench', 100, 5),
      mkSet('s3', 'w3', 'ex-bench', 100, 5),
    ];
    const alerts = detectPlateaus([ex], workouts, sets);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].exercise.name).toBe('Press banca con barra');
    expect(alerts[0].best1RmByWeek).toHaveLength(3);
    expect(alerts[0].recommendation).toContain('descarga');
  });

  it('3 semanas con progresión clara → NO plateaus', () => {
    const ex = mkExercise('Press banca con barra', 'ex-bench');
    const workouts = [
      mkWorkout('w1', 20),
      mkWorkout('w2', 14),
      mkWorkout('w3', 7),
    ];
    const sets = [
      mkSet('s1', 'w1', 'ex-bench', 80, 5),
      mkSet('s2', 'w2', 'ex-bench', 90, 5),
      mkSet('s3', 'w3', 'ex-bench', 100, 5),
    ];
    const alerts = detectPlateaus([ex], workouts, sets);
    expect(alerts).toEqual([]);
  });

  it('ignora ejercicios que no están en la lista de BIG_LIFTS', () => {
    const ex = mkExercise('Curl bíceps', 'ex-curl');
    const workouts = [
      mkWorkout('w1', 20),
      mkWorkout('w2', 14),
      mkWorkout('w3', 7),
    ];
    const sets = [
      mkSet('s1', 'w1', 'ex-curl', 30, 10),
      mkSet('s2', 'w2', 'ex-curl', 30, 10),
      mkSet('s3', 'w3', 'ex-curl', 30, 10),
    ];
    const alerts = detectPlateaus([ex], workouts, sets);
    expect(alerts).toEqual([]);
  });

  it('ignora sets no completados', () => {
    const ex = mkExercise('Press banca con barra', 'ex-bench');
    const workouts = [
      mkWorkout('w1', 20),
      mkWorkout('w2', 14),
      mkWorkout('w3', 7),
    ];
    const sets = [
      { ...mkSet('s1', 'w1', 'ex-bench', 100, 5), completed: false },
      mkSet('s2', 'w2', 'ex-bench', 100, 5),
      mkSet('s3', 'w3', 'ex-bench', 100, 5),
    ];
    const alerts = detectPlateaus([ex], workouts, sets);
    expect(alerts).toEqual([]);
  });
});