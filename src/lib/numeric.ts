// ===========================================================================
// MyTraining — Utilidades numéricas para steppers (+/-)
// ===========================================================================
// Funciones puras, sin dependencias, 100% testeables.
// ===========================================================================

const SNAP_EPSILON = 0.001;

function decimalsOf(n: number): number {
  const s = String(n);
  if (!s.includes('.')) return 0;
  if (s.includes('e-')) {
    const [, exp] = s.split('e-');
    return Number(exp);
  }
  return s.split('.')[1].length;
}

/**
 * Snap de un valor al múltiplo de `step` más cercano.
 * Ej.: roundToStep(50.55, 0.5) → 50.5 ; roundToStep(50.55, 0.1) → 50.6.
 *
 * Estrategia: pre-escalado decimal para hacer el snap en el espacio entero
 * (inmune al ruido de coma flotante como 505.49999999999994).
 */
export function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return value;
  }

  const decimals = decimalsOf(step);
  const factor = Math.pow(10, decimals);

  const vScaled = Math.round(value * factor);
  const sScaled = Math.round(step * factor);

  if (sScaled === 0) return value;

  const snappedScaled = Math.round(vScaled / sScaled) * sScaled;

  return snappedScaled / factor;
}

/** Aplica un límite inferior/superior inclusivo. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Aplica un paso y devuelve el nuevo valor clamped.
 *
 * Estrategia:
 *  1. Suma raw = current ± step.
 *  2. Calcula el snap al grid del step.
 *  3. Solo usa el snap si raw está a menos de 0.001 del grid (evita el
 *     drift acumulado en 0.5 + 0.5 + ... sin forzar snap si el usuario
 *     tenía un valor intermedio como 13.6).
 *
 * Ejemplos:
 *   13.6 + 1.5  → 15.1   (no está cerca del grid → no snap)
 *   50.0 + 0.5  → 50.5   (está en el grid → snap, sin drift)
 *   tras 100 pasos de 0.5 desde 0 → 50 (limpio, sin 50.0000000001)
 */
export function stepValue(
  current: number,
  step: number,
  direction: 1 | -1,
  min: number,
  max: number
): number {
  const raw = current + step * direction;
  const snapped = roundToStep(raw, step);
  const useSnap = Math.abs(raw - snapped) < SNAP_EPSILON;
  const result = useSnap ? snapped : raw;
  return clamp(result, min, max);
}

/** Parsea un string a número decimal, aceptando coma o punto. */
export function safeParseNumber(raw: string, fallback: number): number {
  const cleaned = raw.replace(',', '.').trim();
  if (
    cleaned === '' ||
    cleaned === '-' ||
    cleaned === '.' ||
    cleaned === '-.'
  ) {
    return fallback;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parsea un string a entero. Extrae el primer número válido del string
 * (con o sin separador decimal), lo redondea y lo devuelve como entero.
 */
export function safeParseInteger(raw: string, fallback: number): number {
  const trimmed = raw.trim();
  if (
    trimmed === '' ||
    trimmed === '-' ||
    trimmed === '.' ||
    trimmed === ','
  ) {
    return fallback;
  }
  const normalized = trimmed.replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const n = Number(match[0]);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n);
}

/** Devuelve true si el string es válido como borrador de entero. */
export function isIntegerDraft(raw: string): boolean {
  if (raw === '' || raw === '-') return true;
  return /^-?\d+$/.test(raw);
}

/**
 * Formatea un número para el input:
 *  - `integerOnly` → redondea a entero
 *  - si no → usa **punto** como separador decimal (no coma).
 */
export function formatDisplay(n: number, integerOnly: boolean): string {
  if (!Number.isFinite(n)) return '0';
  if (integerOnly) return String(Math.round(n));
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}