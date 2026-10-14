import type { ExerciseType } from '../types';

export interface ExerciseTypeMeta {
  type: ExerciseType;
  label: string;
  icon: string;
  color: string;
}

/**
 * Disciplinas activas de MyTraining.
 * Solo Gym, Calistenia y Cardio.
 */
export const EXERCISE_TYPES: ExerciseTypeMeta[] = [
  { type: 'gym', label: 'Gym', icon: '🏋️', color: 'cyan' },
  { type: 'calistenia', label: 'Calistenia', icon: '🤸', color: 'blue' },
  { type: 'cardio', label: 'Cardio', icon: '❤️', color: 'purple' },
];