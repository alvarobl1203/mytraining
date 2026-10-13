// ===========================================================================
// Tests — calculations.ts
// ===========================================================================
import { describe, it, expect } from 'vitest';
import {
  mifflinStJeor,
  tdee,
  bmi,
  estimateOneRm,
  tonnage,
} from './calculations';

// ---------------------------------------------------------------------------
// mifflinStJeor
// ---------------------------------------------------------------------------
describe('mifflinStJeor', () => {
  it('calcula para hombre', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(mifflinStJeor(80, 180, 30, 'Hombre')).toBeCloseTo(1780, 0);
  });

  it('calcula para mujer', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 1345.25
    expect(mifflinStJeor(60, 165, 25, 'Mujer')).toBeCloseTo(1345.25, 1);
  });

  it('calcula para otro género (promedio)', () => {
    // 10*70 + 6.25*175 - 5*40 - 78 = 1515.75
    expect(mifflinStJeor(70, 175, 40, 'Otro')).toBeCloseTo(1515.75, 1);
  });

  it('devuelve valores positivos con datos realistas', () => {
    const v = mifflinStJeor(75, 175, 30, 'Hombre');
    expect(v).toBeGreaterThan(1000);
    expect(v).toBeLessThan(3000);
  });
});

// ---------------------------------------------------------------------------
// tdee
// ---------------------------------------------------------------------------
describe('tdee', () => {
  it('sedentario < moderado < muy activo para el mismo sujeto', () => {
    const sed = tdee(80, 180, 30, 'Hombre', 'Sedentario');
    const mod = tdee(80, 180, 30, 'Hombre', 'Moderado');
    const muy = tdee(80, 180, 30, 'Hombre', 'Muy Activo');
    expect(sed).toBeLessThan(mod);
    expect(mod).toBeLessThan(muy);
  });

  it('siempre mayor que la BMR', () => {
    const bmr = mifflinStJeor(80, 180, 30, 'Hombre');
    const total = tdee(80, 180, 30, 'Hombre', 'Sedentario');
    expect(total).toBeGreaterThan(bmr);
  });

  it('devuelve un entero redondeado', () => {
    const v = tdee(80, 180, 30, 'Hombre', 'Moderado');
    expect(Number.isInteger(v)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bmi
// ---------------------------------------------------------------------------
describe('bmi', () => {
  it('calcula IMC correctamente (80 kg, 180 cm = 24.7)', () => {
    expect(bmi(80, 180)).toBeCloseTo(24.7, 1);
  });

  it('calcula IMC correctamente (60 kg, 165 cm = 22.0)', () => {
    expect(bmi(60, 165)).toBeCloseTo(22.0, 1);
  });

  it('devuelve 1 decimal', () => {
    const v = bmi(75, 178);
    const decimals = (v.toString().split('.')[1] ?? '').length;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// estimateOneRm
// ---------------------------------------------------------------------------
describe('estimateOneRm', () => {
  it('reps=1 RIR=0 devuelve el peso', () => {
    // denom = 1.0278 - 0.0278 = 1.0
    expect(estimateOneRm(100, 1, 0)).toBeCloseTo(100, 1);
  });

  it('100 kg x 5 reps x 0 RIR ≈ 112.5', () => {
    // denom = 1.0278 - 0.0278*5 = 0.8888 → 100/0.8888 = 112.5
    expect(estimateOneRm(100, 5, 0)).toBeCloseTo(112.5, 1);
  });

  it('100 kg x 8 reps x 2 RIR ≈ 133.4', () => {
    // eff = 10 → denom = 0.7498 → 100/0.7498 = 133.4
    expect(estimateOneRm(100, 8, 2)).toBeCloseTo(133.4, 1);
  });

  it('reps=0 rir=0 devuelve el peso (protección división por cero)', () => {
    expect(estimateOneRm(100, 0, 0)).toBe(100);
  });

  it('peso 0 devuelve 0', () => {
    expect(estimateOneRm(0, 5, 2)).toBe(0);
  });

  it('a más reps, mayor 1RM estimado', () => {
    const a = estimateOneRm(100, 3, 0);
    const b = estimateOneRm(100, 10, 0);
    expect(b).toBeGreaterThan(a);
  });

   it('más RIR (más margen) → MAYOR 1RM potencial', () => {
    // La fórmula suma reps + rir: si hiciste 5 reps con RIR 3, en teoría
    // podrías haber hecho 8 al fallo. El 1RM estimado refleja ese potencial.
    const fallo = estimateOneRm(100, 5, 0);   // 5 reps efectivas → 112.5
    const margen = estimateOneRm(100, 5, 3);  // 8 reps efectivas → 124.2
    expect(margen).toBeGreaterThan(fallo);
  });
});

// ---------------------------------------------------------------------------
// tonnage
// ---------------------------------------------------------------------------
describe('tonnage', () => {
  it('100 kg × 8 reps × 3 series = 2400', () => {
    expect(tonnage(100, 8, 3)).toBe(2400);
  });

  it('peso null → 0', () => {
    expect(tonnage(null, 8, 3)).toBe(0);
  });

  it('reps null → 0', () => {
    expect(tonnage(100, null, 3)).toBe(0);
  });

  it('0 series → 0', () => {
    expect(tonnage(100, 8, 0)).toBe(0);
  });

  it('peso 0 → 0', () => {
    expect(tonnage(0, 8, 3)).toBe(0);
  });
});