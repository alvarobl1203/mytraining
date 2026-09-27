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

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string;
  day_of_week: DayOfWeek;
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
  created_at: string;
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercises: Exercise;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSetWithExercise[];
}
