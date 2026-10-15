// ===========================================================================
// MyTraining — Generación de CSV para Excel / Google Sheets
// ===========================================================================
// Formato:
//   - Separador ";" (Excel español por defecto)
//   - BOM UTF-8 (\uFEFF) al inicio para que Excel detecte acentos
//   - Coma decimal (126,7) para que Excel interprete números
//   - Salto de línea \r\n (estándar CSV)
// ===========================================================================

import type { Workout, WorkoutSet, Exercise } from '../types';
import type { ExportScope } from './exporters';
import { DAY_LABELS } from './constants';
import { downloadBlob } from './fileActions';

// ===========================================================================
// Helpers
// ===========================================================================

/**
 * Escapa un valor para CSV.
 * - Null/undefined → cadena vacía.
 * - Si contiene ; " \n o \r → se envuelve en comillas y se duplican las comillas.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (
    s.includes(';') ||
    s.includes('"') ||
    s.includes('\n') ||
    s.includes('\r')
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Une una fila con separador ";" */
function csvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(';');
}

/** Número con coma decimal (para Excel español). */
function fmtNum(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '';
  if (!Number.isFinite(value)) return '';
  return value.toFixed(decimals).replace('.', ',');
}

/** Entero redondeado, o vacío si es null. */
function fmtInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (!Number.isFinite(value)) return '';
  return String(Math.round(value));
}

/**
 * Descarga un CSV con BOM UTF-8 para que Excel detecte los acentos
 * correctamente al abrirlo con doble clic.
 */
export async function downloadCsv(
  content: string,
  filename: string
): Promise<void> {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], {
    type: 'text/csv;charset=utf-8',
  });
  await downloadBlob(blob, filename);
}

/**
 * Fecha de inicio según el scope. Idéntico al usado en ExportSheet.tsx
 * para que el CSV coincida exactamente con lo que ve el usuario en pantalla.
 */
function getScopeStartDate(scope: ExportScope['kind']): Date {
  const now = new Date();
  switch (scope) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'range': {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d;
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case 'all':
    case 'analytics':
    default:
      return new Date(0);
  }
}

// ===========================================================================
// ANALYTICS CSV — una fila por serie
// ===========================================================================

const ANALYTICS_HEADERS = [
  'Fecha',
  'Hora',
  'Ejercicio',
  'Tipo',
  'Músculo primario',
  'Serie',
  'Peso (kg)',
  'Reps',
  'RIR',
  'Técnica',
  '1RM est. (kg)',
  'PR',
  'Duración (s)',
  'Distancia (km)',
  'Kcal',
  'Volumen (kg)',
  'Notas',
];

export function buildAnalyticsCsv(
  workouts: Workout[],
  sets: WorkoutSet[],
  exercises: Exercise[],
  scope: ExportScope,
): string {
  const startDate = getScopeStartDate(scope.kind);

  const scopedWorkouts = workouts.filter(
    (w) => new Date(w.startedAt) >= startDate,
  );
  const workoutById = new Map(scopedWorkouts.map((w) => [w.id, w]));
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const scopedSets = sets
    .filter((s) => workoutById.has(s.workoutId))
    .filter((s) => !scope.exerciseId || s.exerciseId === scope.exerciseId);

  const lines: string[] = [csvRow(ANALYTICS_HEADERS)];

  // Orden: fecha asc → ejercicio → nº de serie
  const sorted = [...scopedSets].sort((a, b) => {
    const wa = workoutById.get(a.workoutId);
    const wb = workoutById.get(b.workoutId);
    const ta = wa ? new Date(wa.startedAt).getTime() : 0;
    const tb = wb ? new Date(wb.startedAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    if (a.exerciseId !== b.exerciseId)
      return a.exerciseId.localeCompare(b.exerciseId);
    return a.setNumber - b.setNumber;
  });

  sorted.forEach((s) => {
    const w = workoutById.get(s.workoutId);
    const ex = exerciseById.get(s.exerciseId);
    const startedAt = w ? new Date(w.startedAt) : null;
    const fecha = startedAt
      ? startedAt.toISOString().slice(0, 10)
      : '';
    const hora = startedAt ? startedAt.toTimeString().slice(0, 5) : '';

    const peso = s.weightKg;
    const reps = s.reps;
    const volumen =
      peso !== null && reps !== null ? peso * reps : null;

    lines.push(
      csvRow([
        fecha,
        hora,
        ex?.name ?? '—',
        ex?.exerciseType ?? '',
        ex?.primaryMuscle ?? '',
        s.setNumber,
        fmtNum(peso, 2),
        fmtInt(reps),
        fmtInt(s.rir),
        s.technique,
        fmtNum(s.estimated1Rm, 2),
        s.isPr ? 'Sí' : 'No',
        fmtInt(s.cardioSeconds),
        fmtNum(s.cardioKm, 2),
        fmtInt(s.cardioKcal),
        fmtNum(volumen, 2),
        s.notes ?? '',
      ]),
    );
  });

  return lines.join('\r\n');
}

// ===========================================================================
// PLAN CSV — una fila por ejercicio asignado
// ===========================================================================

const PLAN_HEADERS = [
  'Día',
  'Sesión',
  'Descanso',
  'Ejercicio',
  'Músculo primario',
  'Músculos secundarios',
  'Series',
  'Reps min',
  'Reps max',
  'RIR',
  'Descanso (s)',
];

/**
 * Shape mínimo que necesita el generador de CSV de planes.
 * Se acepta estructuralmente cualquier `RoutineWithExercises[]`.
 */
interface PlanCsvExercise {
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir: number;
  restSeconds: number;
  exercise?: {
    name: string;
    primaryMuscle?: string;
    secondaryMuscles?: string[];
  } | null;
}

interface PlanCsvRoutine {
  dayOfWeek: number | null;
  dayLabel: string | null;
  planName: string | null;
  isRest: boolean;
  exercises: PlanCsvExercise[];
}

export function buildPlanCsv(
  routines: PlanCsvRoutine[],
  planName: string,
): string {
  const ordered = [...routines].sort((a, b) => {
    const A = a.dayOfWeek ?? 99;
    const B = b.dayOfWeek ?? 99;
    return A - B;
  });

  const lines: string[] = [csvRow(PLAN_HEADERS)];

  ordered.forEach((r) => {
    const dayName =
      r.dayOfWeek !== null ? DAY_LABELS[r.dayOfWeek] : 'Sin día';
    const label = r.isRest
      ? r.dayLabel && r.dayLabel !== planName
        ? r.dayLabel
        : 'Descanso'
      : r.dayLabel && r.dayLabel !== planName
        ? r.dayLabel
        : 'Sesión';

    if (r.isRest || r.exercises.length === 0) {
      // Fila única indicando descanso / sin ejercicios
      lines.push(
        csvRow([
          dayName,
          label,
          r.isRest ? 'Sí' : 'No',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ]),
      );
      return;
    }

    r.exercises.forEach((re) => {
      lines.push(
        csvRow([
          dayName,
          label,
          'No',
          re.exercise?.name ?? '—',
          re.exercise?.primaryMuscle ?? '',
          (re.exercise?.secondaryMuscles ?? []).join(', '),
          re.targetSets,
          re.targetRepsMin,
          re.targetRepsMax,
          re.targetRir,
          re.restSeconds,
        ]),
      );
    });
  });

  return lines.join('\r\n');
}