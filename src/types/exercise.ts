export type MuscleGroup =
  | 'Pectoral'
  | 'Dorsal'
  | 'Trapecio'
  | 'Deltoides Anterior'
  | 'Deltoides Lateral'
  | 'Deltoides Posterior'
  | 'Bíceps'
  | 'Tríceps'
  | 'Antebrazos'
  | 'Cuádriceps'
  | 'Isquiosurales'
  | 'Glúteos'
  | 'Gemelos'
  | 'Core'
  | 'Cardiovascular';

export type Equipment =
  | 'Barra'
  | 'Mancuernas'
  | 'Multipower (Smith)'
  | 'Máquina'
  | 'Polea'
  | 'Peso Corporal'
  | 'Kettlebell'
  | 'Cardio';

export type ExerciseCategory = 'Fuerza' | 'Hipertrofia' | 'Cardio';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primary_muscle: MuscleGroup;
  secondary_muscles: MuscleGroup[];
  equipment: Equipment;
  instructions: string;
  is_public: boolean;
  user_id: string | null;
  created_at: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Pectoral',
  'Dorsal',
  'Trapecio',
  'Deltoides Anterior',
  'Deltoides Lateral',
  'Deltoides Posterior',
  'Bíceps',
  'Tríceps',
  'Antebrazos',
  'Cuádriceps',
  'Isquiosurales',
  'Glúteos',
  'Gemelos',
  'Core',
  'Cardiovascular',
];

export const EQUIPMENT_LIST: Equipment[] = [
  'Barra',
  'Mancuernas',
  'Multipower (Smith)',
  'Máquina',
  'Polea',
  'Peso Corporal',
  'Kettlebell',
  'Cardio',
];

export const CATEGORIES: ExerciseCategory[] = ['Fuerza', 'Hipertrofia', 'Cardio'];
