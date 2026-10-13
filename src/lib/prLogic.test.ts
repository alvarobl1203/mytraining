// ===========================================================================
// Tests — prLogic.ts
// ===========================================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('./supabase', () => ({
  supabase: { from: mockFrom },
}));

import { checkIsPR } from './prLogic';

// ---------------------------------------------------------------------------
// Helpers de mock: cada uno simula un chain completo de supabase-js
// ---------------------------------------------------------------------------
function chainWorkouts(data: { id: string }[] | null) {
  return {
    select: () => ({
      eq: () => ({
        not: () => Promise.resolve({ data, error: null }),
      }),
    }),
  };
}

function chainSets(data: Record<string, unknown>[] | null) {
  return {
    select: () => ({
      in: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data, error: null }),
        }),
      }),
    }),
  };
}

describe('checkIsPR', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('weightKg null → no PR y no baseline', async () => {
    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: null,
      reps: 5,
      rir: 2,
    });
    expect(r.isPR).toBe(false);
    expect(r.isBaseline).toBe(false);
    expect(r.previousBest).toBeNull();
    expect(r.currentEstimate).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('reps 0 → no PR y no baseline', async () => {
    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 100,
      reps: 0,
      rir: 2,
    });
    expect(r.isPR).toBe(false);
    expect(r.isBaseline).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('sin workouts previos → baseline (isBaseline=true, isPR=false)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') return chainWorkouts([]);
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 100,
      reps: 5,
      rir: 2,
    });
    expect(r.isBaseline).toBe(true);
    expect(r.isPR).toBe(false);
    expect(r.previousBest).toBeNull();
    expect(r.currentEstimate).toBeGreaterThan(0);
  });

  it('sin series previas de ese ejercicio → baseline', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') return chainWorkouts([{ id: 'w1' }]);
      if (table === 'workout_sets') return chainSets([]);
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 100,
      reps: 5,
      rir: 2,
    });
    expect(r.isBaseline).toBe(true);
    expect(r.isPR).toBe(false);
  });

  it('supera el baseline → isPR=true', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') return chainWorkouts([{ id: 'w1' }]);
      if (table === 'workout_sets')
        return chainSets([{ weight_kg: 100, reps: 5, rir: 2 }]);
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 110,
      reps: 5,
      rir: 2,
    });
    expect(r.isPR).toBe(true);
    expect(r.isBaseline).toBe(false);
    expect(r.previousBest).toBeGreaterThan(100);
    expect(r.currentEstimate).toBeGreaterThan(r.previousBest!);
  });

  it('no supera el baseline → isPR=false', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') return chainWorkouts([{ id: 'w1' }]);
      if (table === 'workout_sets')
        return chainSets([{ weight_kg: 100, reps: 5, rir: 2 }]);
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 80,
      reps: 5,
      rir: 2,
    });
    expect(r.isPR).toBe(false);
    expect(r.isBaseline).toBe(false);
    expect(r.previousBest).not.toBeNull();
  });

    it('toma el MEJOR 1RM de varias series previas y lo supera → PR', async () => {
    // Sets previos (con RIR 2):
    //   100x5  → eff=7  → 1RM ≈ 120.0
    //   90x8   → eff=10 → 1RM ≈ 120.0
    //   80x10  → eff=12 → 1RM ≈ 115.2
    // Baseline = 120.0 (el mejor de los tres)
    // Actual: 110x5 RIR2 → eff=7 → 1RM ≈ 132.0 > 120.0 → PR
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') return chainWorkouts([{ id: 'w1' }]);
      if (table === 'workout_sets')
        return chainSets([
          { weight_kg: 100, reps: 5, rir: 2 },
          { weight_kg: 90, reps: 8, rir: 2 },
          { weight_kg: 80, reps: 10, rir: 2 },
        ]);
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 110,
      reps: 5,
      rir: 2,
    });
    expect(r.isPR).toBe(true);
    expect(r.previousBest).toBeGreaterThan(115);
    expect(r.currentEstimate).toBeGreaterThan(r.previousBest!);
  });

  it('si el baseline es el mejor de varios sets, y no lo superas → no PR', async () => {
    // Mismo baseline (120.0), pero con una serie que NO lo supera.
    // Actual: 80x5 RIR2 → eff=7 → 1RM ≈ 96.0 < 120.0 → no PR
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') return chainWorkouts([{ id: 'w1' }]);
      if (table === 'workout_sets')
        return chainSets([
          { weight_kg: 100, reps: 5, rir: 2 },
          { weight_kg: 90, reps: 8, rir: 2 },
          { weight_kg: 80, reps: 10, rir: 2 },
        ]);
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const r = await checkIsPR({
      userId: 'u1',
      exerciseId: 'e1',
      weightKg: 80,
      reps: 5,
      rir: 2,
    });
    expect(r.isPR).toBe(false);
    expect(r.previousBest).toBeGreaterThan(115);
  });
});