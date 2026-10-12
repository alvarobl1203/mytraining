import type { ActivityLevel, Equipment, MuscleGroup } from '../types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  Sedentario: 1.2,
  Ligero: 1.375,
  Moderado: 1.55,
  Activo: 1.725,
  'Muy Activo': 1.9,
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  // Pecho
  'Pectoral Superior',
  'Pectoral Medio',
  'Pectoral Inferior',
  // Espalda
  'Dorsal Ancho',
  'Romboides',
  'Trapecio Superior',
  'Trapecio Medio',
  'Trapecio Inferior',
  'Erector Espinal',
  'Infraespinoso',
  // Hombro
  'Deltoides Anterior',
  'Deltoides Lateral',
  'Deltoides Posterior',
  // Brazos
  'Bíceps',
  'Braquial',
  'Tríceps',
  'Antebrazos',
  // Pierna
  'Cuádriceps',
  'Isquiosurales',
  'Glúteos',
  'Aductores',
  'Abductores',
  'Gemelos',
  'Tibial Anterior',
  // Core
  'Recto Abdominal',
  'Oblicuos',
  'Transverso Abdominal',
  // Cardio
  'Cardiovascular',
];

/** Agrupación anatómica de los músculos por región. Útil para gráficos y heatmaps. */
export const MUSCLE_REGIONS: Record<string, MuscleGroup[]> = {
  Pecho: ['Pectoral Superior', 'Pectoral Medio', 'Pectoral Inferior'],
  Espalda: [
    'Dorsal Ancho',
    'Romboides',
    'Trapecio Superior',
    'Trapecio Medio',
    'Trapecio Inferior',
    'Erector Espinal',
    'Infraespinoso',
  ],
  Hombro: [
    'Deltoides Anterior',
    'Deltoides Lateral',
    'Deltoides Posterior',
  ],
  Brazos: ['Bíceps', 'Braquial', 'Tríceps', 'Antebrazos'],
  Pierna: [
    'Cuádriceps',
    'Isquiosurales',
    'Glúteos',
    'Aductores',
    'Abductores',
    'Gemelos',
    'Tibial Anterior',
  ],
  Core: ['Recto Abdominal', 'Oblicuos', 'Transverso Abdominal'],
  Cardio: ['Cardiovascular'],
};

/** Región anatómica a la que pertenece cada músculo. */
export const REGION_OF: Record<MuscleGroup, string> = (() => {
  const out = {} as Record<MuscleGroup, string>;
  (Object.entries(MUSCLE_REGIONS) as [string, MuscleGroup[]][]).forEach(
    ([region, muscles]) => {
      muscles.forEach((m) => {
        out[m] = region;
      });
    }
  );
  return out;
})();

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

export const REST_OPTIONS_MIN = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export const DAY_LABELS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];