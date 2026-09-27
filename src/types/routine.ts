import type { Exercise } from './exercise';

export type DayOfWeek =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo'
  | 'Flexible';

export type Technique = 'Normal' | 'Drop-Set' | 'Rest-Pause';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const TECHNIQUES: Technique[] = ['Normal', 'Drop-Set', 'Rest-Pause'];

export const REST_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

export const REST_OPTIONS_MINUTES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export const DANGER_EXERCISES = [
  'Sentadilla con Barra',
  'Sentadilla Frontal con Barra',
  'Peso Muerto Rumano con Barra',
  'Peso Muerto con Piernas Rectas con Barra',
  'Press Banca con Barra',
  'Press Banca Inclinado con Barra',
  'Press Banca Declinado con Barra',
  'Press Militar con Barra',
  'Good Morning con Barra',
  'Zancadas con Barra',
];

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string;
  day_of_week: DayOfWeek;
  days_of_week: DayOfWeek[];
  created_at: string;
  updated_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: string;
  target_rir: number;
  rest_seconds: number;
  technique: Technique;
  notes: string;
  created_at: string;
}

export interface RoutineWithExercises extends Routine {
  routine_exercises: (RoutineExercise & { exercises: Exercise })[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id: string | null;
  date: string;
  name: string;
  duration_minutes: number;
  completed: boolean;
  started_at: string;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number;
  technique: Technique;
  rest_seconds: number;
  completed: boolean;
  duration_min: number;
  distance_km: number;
  kcal: number;
  created_at: string;
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercises: Exercise;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSetWithExercise[];
}
