// ===========================================================================
// Tests — numeric.ts
// ===========================================================================
import { describe, it, expect } from 'vitest';
import {
  roundToStep,
  clamp,
  stepValue,
  safeParseNumber,
  safeParseInteger,
  isIntegerDraft,
  formatDisplay,
} from './numeric';

describe('roundToStep', () => {
  it('redondea a la precisión del step 0.5', () => {
    expect(roundToStep(50.5, 0.5)).toBe(50.5);
    expect(roundToStep(50.55, 0.5)).toBe(50.5);
    expect(roundToStep(50.6, 0.5)).toBe(50.5);
  });

  it('redondea a la precisión del step 1', () => {
    expect(roundToStep(8, 1)).toBe(8);
    expect(roundToStep(8.4, 1)).toBe(8);
    expect(roundToStep(8.5, 1)).toBe(9);
  });

  it('redondea a la precisión del step 0.1', () => {
    expect(roundToStep(50.55, 0.1)).toBe(50.6);
  });

  it('devuelve el valor original si step <= 0', () => {
    expect(roundToStep(50.5, 0)).toBe(50.5);
    expect(roundToStep(50.5, -1)).toBe(50.5);
  });

  it('devuelve el valor original si no es finito', () => {
    expect(roundToStep(NaN, 0.5)).toBeNaN();
  });

  it('evita el error clásico de coma flotante: 50.5 + 0.5 = 51', () => {
    const sum = 50.5 + 0.5;
    expect(roundToStep(sum, 0.5)).toBe(51);
  });

  it('evita deriva tras 100 incrementos: 0.5*100 = 50', () => {
    let v = 0;
    for (let i = 0; i < 100; i++) v += 0.5;
    expect(roundToStep(v, 0.5)).toBe(50);
  });
});

describe('clamp', () => {
  it('clampea por abajo', () => expect(clamp(-5, 0, 100)).toBe(0));
  it('clampea por arriba', () => expect(clamp(200, 0, 100)).toBe(100));
  it('devuelve el mismo valor si está dentro', () =>
    expect(clamp(50, 0, 100)).toBe(50));
  it('devuelve min si no es finito', () =>
    expect(clamp(NaN, 10, 100)).toBe(10));
});

describe('stepValue', () => {
  it('sube en pasos de 0.5', () => {
    expect(stepValue(50, 0.5, 1, 0, 500)).toBe(50.5);
    expect(stepValue(50.5, 0.5, 1, 0, 500)).toBe(51);
  });

  it('baja en pasos de 0.5', () => {
    expect(stepValue(50, 0.5, -1, 0, 500)).toBe(49.5);
    expect(stepValue(50.5, 0.5, -1, 0, 500)).toBe(50);
  });

  it('56.5 + 0.5 = 57 (no 60)', () => {
    expect(stepValue(56.5, 0.5, 1, 0, 999)).toBe(57);
  });

  it('56.5 - 0.5 = 56 (no 55)', () => {
    expect(stepValue(56.5, 0.5, -1, 0, 999)).toBe(56);
  });

  it('13.6 + 1.5 = 15.1 (no snap al grid si se desvía)', () => {
    expect(stepValue(13.6, 1.5, 1, 0, 999)).toBeCloseTo(15.1, 2);
  });

  it('13.6 - 1.5 = 12.1 (no snap)', () => {
    expect(stepValue(13.6, 1.5, -1, 0, 999)).toBeCloseTo(12.1, 2);
  });

  it('no baja del mínimo', () => {
    expect(stepValue(0, 0.5, -1, 0, 500)).toBe(0);
    expect(stepValue(0.5, 0.5, -1, 0, 500)).toBe(0);
  });

  it('no sube del máximo', () => {
    expect(stepValue(500, 0.5, 1, 0, 500)).toBe(500);
  });

  it('paso 1 en reps', () => {
    expect(stepValue(8, 1, 1, 1, 100)).toBe(9);
    expect(stepValue(8, 1, -1, 1, 100)).toBe(7);
  });

  it('no baja del mínimo de reps (1)', () => {
    expect(stepValue(1, 1, -1, 1, 100)).toBe(1);
  });

  it('no permite RIR negativo', () => {
    expect(stepValue(0, 1, -1, 0, 10)).toBe(0);
  });

  it('evita deriva al acumular 100 pasos de 0.5 desde 0', () => {
    let v = 0;
    for (let i = 0; i < 100; i++) v = stepValue(v, 0.5, 1, 0, 500);
    expect(v).toBe(50);
  });
});

describe('safeParseNumber', () => {
  it('parsea enteros', () => expect(safeParseNumber('50', 0)).toBe(50));
  it('parsea decimales con punto', () =>
    expect(safeParseNumber('50.5', 0)).toBe(50.5));
  it('parsea decimales con coma', () =>
    expect(safeParseNumber('50,5', 0)).toBe(50.5));
  it('devuelve fallback con string vacío', () =>
    expect(safeParseNumber('', 10)).toBe(10));
  it('devuelve fallback con texto', () =>
    expect(safeParseNumber('abc', 10)).toBe(10));
  it('parsea negativos', () => expect(safeParseNumber('-5', 0)).toBe(-5));
});

describe('safeParseInteger', () => {
  it('parsea enteros válidos', () => {
    expect(safeParseInteger('8', 0)).toBe(8);
    expect(safeParseInteger('99', 0)).toBe(99);
  });

  it('redondea decimales con punto', () => {
    expect(safeParseInteger('8.4', 0)).toBe(8);
    expect(safeParseInteger('8.5', 0)).toBe(9);
    expect(safeParseInteger('8.9', 0)).toBe(9);
  });

  it('redondea decimales con coma', () => {
    expect(safeParseInteger('1,3', 0)).toBe(1);
    expect(safeParseInteger('1,6', 0)).toBe(2);
  });

  it('limpia caracteres no numéricos', () => {
    expect(safeParseInteger('8abc', 0)).toBe(8);
    expect(safeParseInteger('abc8', 0)).toBe(8);
    expect(safeParseInteger('8,5kg', 0)).toBe(9);
  });

  it('devuelve fallback con string vacío', () =>
    expect(safeParseInteger('', 10)).toBe(10));
  it('devuelve fallback con guion suelto', () =>
    expect(safeParseInteger('-', 10)).toBe(10));
  it('parsea negativos', () => expect(safeParseInteger('-5', 0)).toBe(-5));
});

describe('isIntegerDraft', () => {
  it('acepta vacío', () => expect(isIntegerDraft('')).toBe(true));
  it('acepta guion suelto', () => expect(isIntegerDraft('-')).toBe(true));
  it('acepta enteros', () => {
    expect(isIntegerDraft('8')).toBe(true);
    expect(isIntegerDraft('0')).toBe(true);
  });
  it('acepta negativos', () => expect(isIntegerDraft('-5')).toBe(true));
  it('rechaza decimales con punto', () =>
    expect(isIntegerDraft('8.5')).toBe(false));
  it('rechaza decimales con coma', () =>
    expect(isIntegerDraft('8,5')).toBe(false));
  it('rechaza letras', () => expect(isIntegerDraft('abc')).toBe(false));
});

describe('formatDisplay', () => {
  it('enteros sin decimal', () => {
    expect(formatDisplay(50, false)).toBe('50');
    expect(formatDisplay(0, false)).toBe('0');
  });

  it('decimales con PUNTO (no coma)', () => {
    expect(formatDisplay(56.5, false)).toBe('56.5');
    expect(formatDisplay(13.6, false)).toBe('13.6');
    expect(formatDisplay(15.1, false)).toBe('15.1');
  });

  it('redondea a 2 decimales para limpiar ruido de float', () => {
    expect(formatDisplay(13.6000001, false)).toBe('13.6');
    expect(formatDisplay(56.499999999, false)).toBe('56.5');
  });

  it('integerOnly fuerza entero', () => {
    expect(formatDisplay(8.7, true)).toBe('9');
    expect(formatDisplay(8.4, true)).toBe('8');
  });
});