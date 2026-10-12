export type Category = 'Fuerza' | 'Hipertrofia' | 'Cardio';

export type MuscleGroup =
  | 'Pectoral Superior' | 'Pectoral Medio' | 'Pectoral Inferior'
  | 'Dorsal Ancho' | 'Romboides'
  | 'Trapecio Superior' | 'Trapecio Medio' | 'Trapecio Inferior'
  | 'Erector Espinal' | 'Infraespinoso'
  | 'Deltoides Anterior' | 'Deltoides Lateral' | 'Deltoides Posterior'
  | 'Bíceps' | 'Braquial' | 'Tríceps' | 'Antebrazos'
  | 'Cuádriceps' | 'Isquiosurales' | 'Glúteos'
  | 'Aductores' | 'Abductores' | 'Gemelos' | 'Tibial Anterior'
  | 'Recto Abdominal' | 'Oblicuos' | 'Transverso Abdominal'
  | 'Cardiovascular';

export type Equipment =
  | 'Barra' | 'Mancuernas' | 'Multipower (Smith)' | 'Máquina'
  | 'Polea' | 'Peso Corporal' | 'Kettlebell' | 'Cardio';

export type ActivityLevel =
  | 'Sedentario' | 'Ligero' | 'Moderado' | 'Activo' | 'Muy Activo';

export type Gender = 'Hombre' | 'Mujer' | 'Otro';

export type BiomechanicalType =
  | 'Empuje' | 'Jalón' | 'Pierna' | 'Core' | 'Cardio' | 'Otro';

export type ExerciseType =
  | 'gym' | 'calistenia' | 'hyrox' | 'crossfit' | 'cardio';

export type TrainingMode = 'simple' | 'assisted' | 'mixed';

export type Technique = 'Normal' | 'Drop-Set' | 'Rest-Pause';

export type Difficulty = 'Principiante' | 'Intermedio' | 'Avanzado';

export type MovementPattern =
  | 'Push' | 'Pull' | 'Squat' | 'Hinge' | 'Lunge'
  | 'Carry' | 'Rotation' | 'Isolation' | 'Cardio' | 'Olympic';

export type MuscleInvolvement = Partial<Record<MuscleGroup, number>>;

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  primaryMuscle: MuscleGroup;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions: string;
  isPublic: boolean;
  userId: string | null;
  isCustom?: boolean;
  imageUrl?: string | null;
  biomechanicalType?: BiomechanicalType | null;
  exerciseType?: ExerciseType | null;
  difficulty?: Difficulty | null;
  jointStress?: string[];
  muscleInvolvement?: MuscleInvolvement;
  timeUnderTension?: number | null;
  restSuggested?: number | null;
  isCompound?: boolean;
  movementPattern?: MovementPattern | null;
}

export interface Profile {
  id: string;
  email: string | null;
  age: number | null;
  gender: Gender | null;
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  availableEquipment: Equipment[];
  onboardingCompleted: boolean;
  preferredTypes: ExerciseType[];
  trainingMode: TrainingMode;
  enabledTechniques: string[];
  showTechniqueHints: boolean;
  showVolumePanel: boolean;
}

export interface Routine {
  id: string;
  userId: string;
  name: string;
  planName: string | null;
  dayLabel: string | null;
  isRest: boolean;
  dayOfWeek: number | null;
  createdAt: string;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir: number;
  restSeconds: number;
}

export interface Workout {
  id: string;
  userId: string;
  routineId: string | null;
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  technique: Technique;
  cardioSeconds: number | null;
  cardioKm: number | null;
  cardioKcal: number | null;
  notes: string | null;
  estimated1Rm: number | null;
  isPr: boolean;
  completed: boolean;
}

export interface VolumeRecommendation {
  muscle: MuscleGroup;
  mev: number;
  mavMin: number;
  mavMax: number;
  mrv: number;
  frequencyMin: number;
  frequencyMax: number;
  notes: string;
}

export type VolumeStatus =
  | 'Bajo el MEV'
  | 'MEV-VA'
  | 'MAV'
  | 'MRV-Z'
  | 'Sobre el MRV'
  | 'Sin datos';