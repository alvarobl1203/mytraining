import type { ExerciseType } from '../types';

export interface ExerciseTypeMeta {
  type: ExerciseType;
  label: string;
  icon: string;
  color: string;
}

export const EXERCISE_TYPES: ExerciseTypeMeta[] = [
  { type: 'gym', label: 'Gym', icon: '🏋️', color: 'cyan' },
  { type: 'calistenia', label: 'Calistenia', icon: '🤸', color: 'blue' },
  { type: 'hyrox', label: 'HYROX', icon: '🏃', color: 'amber' },
  { type: 'crossfit', label: 'CrossFit', icon: '⏱️', color: 'red' },
  { type: 'cardio', label: 'Cardio', icon: '❤️', color: 'purple' },
];