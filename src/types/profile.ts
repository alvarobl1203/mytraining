export type Gender = 'masculino' | 'femenino';

export type ActivityLevel =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'activo'
  | 'muy_activo';

export type Equipment =
  | 'Barra'
  | 'Mancuernas'
  | 'Multipower (Smith)'
  | 'Máquina'
  | 'Polea'
  | 'Peso Corporal'
  | 'Kettlebell'
  | 'Cardio';

export interface Profile {
  id: string;
  user_id: string;
  age: number;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  tdee_maintenance: number;
  tdee_deficit: number;
  tdee_surplus: number;
  equipment: Equipment[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentario',
  ligero: 'Ligero',
  moderado: 'Moderado',
  activo: 'Activo',
  muy_activo: 'Muy Activo',
};

export const EQUIPMENT_OPTIONS: Equipment[] = [
  'Barra',
  'Mancuernas',
  'Multipower (Smith)',
  'Máquina',
  'Polea',
  'Peso Corporal',
  'Kettlebell',
  'Cardio',
];

export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): { maintenance: number; deficit: number; surplus: number } {
  const base =
    gender === 'masculino'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const factor = ACTIVITY_FACTORS[activityLevel];
  const maintenance = Math.round(base * factor);
  return {
    maintenance,
    deficit: maintenance - 500,
    surplus: maintenance + 300,
  };
}
