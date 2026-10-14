// ===========================================================================
// MyTraining — Configuración de filtros de catálogo por disciplina
// ===========================================================================
// Como varias categorías del filtro no existen en BD (modalidad cardio,
// equipo calistenia, resistencia en gym), se derivan en código a partir de
// los campos existentes:
//   - equipment       (text)
//   - category        (text)
//   - difficulty      (text)
//   - movement_pattern (text)
//   - name            (keywords)
//
// Los filtros son multi-selección y se combinan con AND entre filtros y OR
// dentro de un mismo filtro.
// ===========================================================================

import type { Exercise, MuscleGroup } from '../types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface FilterOption {
  /** Valor interno usado para filtrar. */
  value: string;
  /** Texto visible en el chip. */
  label: string;
}

export interface CatalogFilterConfig {
  /** Identificador único del filtro. */
  id: string;
  /** Título visible ("Músculo", "Material", …). */
  title: string;
  /** Opciones disponibles. */
  options: FilterOption[];
  /** Devuelve true si el ejercicio pasa el filtro con la selección dada. */
  matches: (exercise: Exercise, selected: string[]) => boolean;
  /** Si true, se renderiza con el componente MuscleFilterSection (grupos). */
  grouped?: boolean;
}

// ---------------------------------------------------------------------------
// Dificultad — orden lógico (progresión), no alfabético
// ---------------------------------------------------------------------------
const DIFFICULTY_OPTIONS: FilterOption[] = [
  { value: 'Principiante', label: 'Principiante' },
  { value: 'Intermedio', label: 'Intermedio' },
  { value: 'Avanzado', label: 'Avanzado' },
];

function matchesDifficulty(exercise: Exercise, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return exercise.difficulty != null && selected.includes(exercise.difficulty);
}

// ---------------------------------------------------------------------------
// Músculo (agrupado por regiones; usa MuscleFilterSection)
// ---------------------------------------------------------------------------
function matchesMuscle(exercise: Exercise, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const sel = selected as MuscleGroup[];
  return sel.some(
    (m) =>
      exercise.primaryMuscles.includes(m) ||
      exercise.secondaryMuscles.includes(m),
  );
}

// ---------------------------------------------------------------------------
// GYM — Material (orden alfabético por label visible)
// ---------------------------------------------------------------------------
// El chip "Smith" se corresponde con `equipment = 'Multipower (Smith)'`.
// El chip "Peso corporal" se corresponde con `equipment = 'Peso Corporal'`.
const GYM_MATERIAL_OPTIONS: FilterOption[] = [
  { value: 'Barra', label: 'Barra' },
  { value: 'Kettlebell', label: 'Kettlebell' },
  { value: 'Mancuernas', label: 'Mancuernas' },
  { value: 'Máquina', label: 'Máquina' },
  { value: 'Polea', label: 'Polea' },
  { value: 'Multipower (Smith)', label: 'Smith' },
];

function matchesGymMaterial(exercise: Exercise, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.includes(exercise.equipment);
}

// ---------------------------------------------------------------------------
// GYM — Categoría (orden alfabético)
// ---------------------------------------------------------------------------
// `category` en BD solo tiene Fuerza / Hipertrofia / Cardio.
// "Resistencia" se deriva por `movement_pattern`:
//   Carry / Rotation / Olympic → Resistencia.
// Un mismo ejercicio puede coincidir con varias categorías.
function gymCategoriesOf(exercise: Exercise): string[] {
  const out: string[] = [];
  if (exercise.category === 'Fuerza') out.push('Fuerza');
  if (exercise.category === 'Hipertrofia') out.push('Hipertrofia');
  const mp = exercise.movementPattern;
  if (mp === 'Carry' || mp === 'Rotation' || mp === 'Olympic') {
    out.push('Resistencia');
  }
  return out;
}

const GYM_CATEGORY_OPTIONS: FilterOption[] = [
  { value: 'Fuerza', label: 'Fuerza' },
  { value: 'Hipertrofia', label: 'Hipertrofia' },
  { value: 'Resistencia', label: 'Resistencia' },
];

function matchesGymCategory(exercise: Exercise, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const cats = gymCategoriesOf(exercise);
  return selected.some((s) => cats.includes(s));
}

// ---------------------------------------------------------------------------
// CALISTENIA — Equipo (orden alfabético)
// ---------------------------------------------------------------------------
// Todo ejercicio de calistenia tiene `equipment = 'Peso Corporal'`.
// El equipo específico se deriva del nombre por keywords.
const CALISTENIA_EQUIPO_OPTIONS: FilterOption[] = [
  { value: 'Aros', label: 'Aros' },
  { value: 'Bandas', label: 'Bandas' },
  { value: 'Barras', label: 'Barras' },
  { value: 'Paralelas', label: 'Paralelas' },
  { value: 'Suelo', label: 'Suelo' },
];

function calisteniaEquipoOf(exercise: Exercise): string[] {
  const n = exercise.name.toLowerCase();
  const out: string[] = [];

  // Aros / anillas
  if (n.includes('aro') || n.includes('anilla')) out.push('Aros');
  // Paralelas (fondos en paralelas, L-sit, etc.)
  if (n.includes('paralela') || n.includes('fondos')) out.push('Paralelas');
  // Barras (dominadas, muscle-up, barra fija, front lever)
  if (
    n.includes('dominada') ||
    n.includes('muscle-up') ||
    n.includes('barra fija') ||
    n.includes('front lever') ||
    n.includes('back lever') ||
    n.includes('bar ') ||
    n.startsWith('bar ')
  ) {
    out.push('Barras');
  }
  // Bandas (band pull-apart, face pull con banda, etc.)
  if (n.includes('banda') || n.includes('band ')) out.push('Bandas');

  // Si no coincide con nada, es Suelo.
  if (out.length === 0) out.push('Suelo');

  return out;
}

function matchesCalisteniaEquipo(
  exercise: Exercise,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  const equipos = calisteniaEquipoOf(exercise);
  return selected.some((s) => equipos.includes(s));
}

// ---------------------------------------------------------------------------
// CARDIO — Modalidad (orden alfabético)
// ---------------------------------------------------------------------------
const CARDIO_MODALIDAD_OPTIONS: FilterOption[] = [
  { value: 'Bicicleta', label: 'Bicicleta' },
  { value: 'Box', label: 'Box' },
  { value: 'Cinta', label: 'Cinta' },
  { value: 'Correr', label: 'Correr' },
  { value: 'Cuerda', label: 'Cuerda' },
  { value: 'Elíptica', label: 'Elíptica' },
  { value: 'Escaladora', label: 'Escaladora' },
  { value: 'Remo', label: 'Remo' },
  { value: 'Saco', label: 'Saco' },
  { value: 'SkiErg', label: 'SkiErg' },
  { value: 'Trineo', label: 'Trineo' },
];

function cardioModalidadOf(exercise: Exercise): string[] {
  const n = exercise.name.toLowerCase();
  const out: string[] = [];

  if (n.includes('cinta') || n.includes('treadmill')) out.push('Cinta');
  if (
    n.includes('bicicleta') ||
    n.includes('bici') ||
    n.includes('bike') ||
    n.includes('spinning')
  )
    out.push('Bicicleta');
  if (n.includes('remo') || n.includes('rowing') || n.includes('ergómetro'))
    out.push('Remo');
  if (n.includes('skierg')) out.push('SkiErg');
  if (n.includes('elíptica') || n.includes('eliptica')) out.push('Elíptica');
  if (n.includes('escaladora') || n.includes('stairmaster'))
    out.push('Escaladora');
  if (n.includes('cuerda') || n.includes('comba')) out.push('Cuerda');
  if (n.includes('saco') || n.includes('boxeo') || n.includes('punching'))
    out.push('Saco');
  if (n.includes('box jump') || n.includes('cajón') || n.includes('cajon'))
    out.push('Box');
  if (n.includes('trineo') || n.includes('sled')) out.push('Trineo');
  if (
    n.includes('correr') ||
    n.includes('carrera') ||
    n.includes('run') ||
    n.includes('sprint') ||
    n.includes('trote')
  )
    out.push('Correr');

  // Si no matchea nada, asumimos Correr.
  if (out.length === 0) out.push('Correr');

  return out;
}

function matchesCardioModalidad(
  exercise: Exercise,
  selected: string[],
): boolean {
  if (selected.length === 0) return true;
  const mods = cardioModalidadOf(exercise);
  return selected.some((s) => mods.includes(s));
}

// ---------------------------------------------------------------------------
// CARDIO — Tipo (orden lógico: Estable → Intervalos → Circuito)
// ---------------------------------------------------------------------------
const CARDIO_TIPO_OPTIONS: FilterOption[] = [
  { value: 'Estable', label: 'Estable' },
  { value: 'Intervalos', label: 'Intervalos / HIIT' },
  { value: 'Circuito', label: 'Circuito' },
];

function cardioTipoOf(exercise: Exercise): string[] {
  const n = exercise.name.toLowerCase();
  const out: string[] = [];

  if (
    n.includes('hiit') ||
    n.includes('interval') ||
    n.includes('tabata') ||
    n.includes('sprint')
  )
    out.push('Intervalos');
  if (n.includes('circuito') || n.includes('circuit')) out.push('Circuito');

  // Por defecto, cardio estable.
  if (out.length === 0) out.push('Estable');

  return out;
}

function matchesCardioTipo(exercise: Exercise, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const tipos = cardioTipoOf(exercise);
  return selected.some((s) => tipos.includes(s));
}

// ---------------------------------------------------------------------------
// Fábrica de filtros por disciplina
// ---------------------------------------------------------------------------
export function getFiltersForDiscipline(
  discipline: 'all' | 'gym' | 'calistenia' | 'cardio',
): CatalogFilterConfig[] {
  const muscleFilter: CatalogFilterConfig = {
    id: 'muscle',
    title: 'Músculo',
    options: [], // se genera dinámicamente en el componente por región
    matches: matchesMuscle,
    grouped: true,
  };

  switch (discipline) {
    case 'gym':
      return [
        muscleFilter,
        {
          id: 'gym_material',
          title: 'Material',
          options: GYM_MATERIAL_OPTIONS,
          matches: matchesGymMaterial,
        },
        {
          id: 'gym_category',
          title: 'Categoría',
          options: GYM_CATEGORY_OPTIONS,
          matches: matchesGymCategory,
        },
      ];

    case 'calistenia':
      return [
        muscleFilter,
        {
          id: 'calistenia_equipo',
          title: 'Equipo',
          options: CALISTENIA_EQUIPO_OPTIONS,
          matches: matchesCalisteniaEquipo,
        },
        {
          id: 'difficulty',
          title: 'Dificultad',
          options: DIFFICULTY_OPTIONS,
          matches: matchesDifficulty,
        },
      ];

    case 'cardio':
      return [
        {
          id: 'cardio_modalidad',
          title: 'Modalidad',
          options: CARDIO_MODALIDAD_OPTIONS,
          matches: matchesCardioModalidad,
        },
        {
          id: 'cardio_tipo',
          title: 'Tipo',
          options: CARDIO_TIPO_OPTIONS,
          matches: matchesCardioTipo,
        },
        {
          id: 'difficulty',
          title: 'Dificultad',
          options: DIFFICULTY_OPTIONS,
          matches: matchesDifficulty,
        },
      ];

    case 'all':
    default:
      return [
        muscleFilter,
        {
          id: 'difficulty',
          title: 'Dificultad',
          options: DIFFICULTY_OPTIONS,
          matches: matchesDifficulty,
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// Aplica todos los filtros a un ejercicio
// ---------------------------------------------------------------------------
export function exercisePassesFilters(
  exercise: Exercise,
  filters: CatalogFilterConfig[],
  selections: Record<string, string[]>,
): boolean {
  return filters.every((f) => {
    const sel = selections[f.id] ?? [];
    return f.matches(exercise, sel);
  });
}