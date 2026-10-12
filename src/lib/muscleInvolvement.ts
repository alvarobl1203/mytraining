import type { MuscleGroup, MuscleInvolvement } from '../types';

export const MUSCLE_INVOLVEMENT_MAP: Record<string, MuscleInvolvement> = {
  'Press banca con barra': {
    'Pectoral Medio': 1.0, 'Pectoral Superior': 0.5, 'Pectoral Inferior': 0.5,
    'Deltoides Anterior': 0.5, 'Tríceps': 0.5,
  },
  'Press banca inclinado': {
    'Pectoral Superior': 1.0, 'Pectoral Medio': 0.5,
    'Deltoides Anterior': 0.5, 'Tríceps': 0.5,
  },
  'Press militar con barra': {
    'Deltoides Anterior': 1.0, 'Deltoides Lateral': 0.5,
    'Tríceps': 0.5, 'Trapecio Superior': 0.25,
  },
  'Fondos en paralelas': {
    'Pectoral Inferior': 1.0, 'Tríceps': 0.75,
    'Deltoides Anterior': 0.5, 'Pectoral Medio': 0.25,
  },
  'Flexiones': {
    'Pectoral Medio': 1.0, 'Pectoral Inferior': 0.5, 'Tríceps': 0.5,
    'Deltoides Anterior': 0.5, 'Recto Abdominal': 0.25,
  },
  'Jalón al pecho': {
    'Dorsal Ancho': 1.0, 'Romboides': 0.5, 'Trapecio Medio': 0.5,
    'Bíceps': 0.5, 'Antebrazos': 0.25,
  },
  'Dominadas': {
    'Dorsal Ancho': 1.0, 'Romboides': 0.5, 'Trapecio Inferior': 0.5,
    'Bíceps': 0.75, 'Antebrazos': 0.5,
  },
  'Remo con barra': {
    'Dorsal Ancho': 1.0, 'Romboides': 0.75, 'Trapecio Medio': 0.5,
    'Trapecio Inferior': 0.5, 'Bíceps': 0.5, 'Erector Espinal': 0.25,
  },
  'Face pulls': {
    'Deltoides Posterior': 1.0, 'Trapecio Medio': 0.75,
    'Trapecio Inferior': 0.5, 'Infraespinoso': 0.5,
  },
  'Sentadilla con barra': {
    'Cuádriceps': 1.0, 'Glúteos': 0.75, 'Isquiosurales': 0.5,
    'Erector Espinal': 0.5, 'Aductores': 0.5, 'Gemelos': 0.25,
    'Recto Abdominal': 0.25,
  },
  'Peso muerto convencional': {
    'Erector Espinal': 1.0, 'Glúteos': 1.0, 'Isquiosurales': 1.0,
    'Dorsal Ancho': 0.5, 'Trapecio Superior': 0.5,
    'Antebrazos': 0.75, 'Cuádriceps': 0.5,
  },
  'Peso muerto rumano': {
    'Isquiosurales': 1.0, 'Glúteos': 0.75, 'Erector Espinal': 0.75,
    'Antebrazos': 0.5,
  },
  'Hip thrust': {
    'Glúteos': 1.0, 'Isquiosurales': 0.5, 'Cuádriceps': 0.25,
  },
  'Prensa de piernas (leg press)': {
    'Cuádriceps': 1.0, 'Glúteos': 0.5, 'Isquiosurales': 0.5,
  },
  'Zancadas búlgaras': {
    'Cuádriceps': 1.0, 'Glúteos': 0.75, 'Isquiosurales': 0.5, 'Aductores': 0.5,
  },
  'Curl de bíceps con mancuernas': {
    'Bíceps': 1.0, 'Braquial': 0.75, 'Antebrazos': 0.5,
  },
  'Curl martillo': {
    'Braquial': 1.0, 'Bíceps': 0.75, 'Antebrazos': 0.5,
  },
  'Extensión de tríceps en polea': {
    'Tríceps': 1.0, 'Antebrazos': 0.25,
  },
  'Press francés': {
    'Tríceps': 1.0, 'Antebrazos': 0.25,
  },
  'Elevaciones laterales': {
    'Deltoides Lateral': 1.0, 'Trapecio Superior': 0.5,
  },
  'Pájaros con mancuernas': {
    'Deltoides Posterior': 1.0, 'Trapecio Medio': 0.5, 'Romboides': 0.5,
  },
  'Pec deck (contractor)': {
    'Pectoral Medio': 1.0, 'Pectoral Superior': 0.25, 'Pectoral Inferior': 0.25,
  },
  'Aperturas con mancuernas': {
    'Pectoral Medio': 1.0, 'Pectoral Superior': 0.5, 'Deltoides Anterior': 0.25,
  },
  'Muscle-up': {
    'Dorsal Ancho': 1.0, 'Bíceps': 0.75, 'Tríceps': 0.75,
    'Pectoral Inferior': 0.5, 'Recto Abdominal': 0.5,
  },
  'Plancha abdominal': {
    'Recto Abdominal': 1.0, 'Transverso Abdominal': 1.0, 'Oblicuos': 0.5,
  },
  'Abdominales (crunch)': {
    'Recto Abdominal': 1.0, 'Oblicuos': 0.5,
  },
  'Toes-to-bar': {
    'Recto Abdominal': 1.0, 'Oblicuos': 0.75,
    'Dorsal Ancho': 0.5, 'Antebrazos': 0.5,
  },
  'Sled Push': {
    'Cuádriceps': 1.0, 'Glúteos': 0.75, 'Pectoral Medio': 0.5,
    'Deltoides Anterior': 0.5, 'Recto Abdominal': 0.5,
  },
  'Sled Pull': {
    'Dorsal Ancho': 1.0, 'Bíceps': 0.75, 'Isquiosurales': 0.75,
    'Glúteos': 0.5, 'Antebrazos': 0.5,
  },
  'Burpee Broad Jump': {
    'Cuádriceps': 1.0, 'Pectoral Medio': 0.5,
    'Glúteos': 0.5, 'Recto Abdominal': 0.5,
  },
  'Wall Balls': {
    'Cuádriceps': 1.0, 'Deltoides Anterior': 0.75,
    'Glúteos': 0.5, 'Recto Abdominal': 0.5,
  },
  'Farmers Carry': {
    'Antebrazos': 1.0, 'Trapecio Superior': 0.75,
    'Recto Abdominal': 0.75, 'Cuádriceps': 0.5,
  },
  'Rowing (remo ergómetro)': {
    'Dorsal Ancho': 1.0, 'Cuádriceps': 0.75, 'Isquiosurales': 0.75,
    'Bíceps': 0.5, 'Glúteos': 0.5,
  },
  'SkiErg': {
    'Dorsal Ancho': 1.0, 'Tríceps': 0.75,
    'Recto Abdominal': 0.5, 'Cuádriceps': 0.5,
  },
  'Snatch': {
    'Cuádriceps': 1.0, 'Glúteos': 1.0, 'Trapecio Superior': 1.0,
    'Deltoides Anterior': 0.75, 'Erector Espinal': 0.75, 'Isquiosurales': 0.5,
  },
  'Clean & Jerk': {
    'Cuádriceps': 1.0, 'Glúteos': 1.0, 'Trapecio Superior': 0.75,
    'Deltoides Anterior': 0.75, 'Tríceps': 0.5, 'Erector Espinal': 0.5,
  },
  'Thruster': {
    'Cuádriceps': 1.0, 'Glúteos': 0.75, 'Deltoides Anterior': 0.75,
    'Tríceps': 0.5, 'Recto Abdominal': 0.5,
  },
  'Kipping Pull-up': {
    'Dorsal Ancho': 1.0, 'Bíceps': 0.75,
    'Recto Abdominal': 0.5, 'Romboides': 0.5,
  },
  'Box Jump': {
    'Cuádriceps': 1.0, 'Glúteos': 0.75, 'Gemelos': 0.75, 'Isquiosurales': 0.5,
  },
  'Handstand Push-up': {
    'Deltoides Anterior': 1.0, 'Tríceps': 0.75,
    'Trapecio Superior': 0.5, 'Recto Abdominal': 0.5,
  },
  'Double-unders': {
    'Gemelos': 1.0, 'Tibial Anterior': 0.75,
    'Antebrazos': 0.5, 'Recto Abdominal': 0.25,
  },
} satisfies Record<string, MuscleInvolvement>;

export function getMuscleInvolvement(
  exerciseName: string,
  primaryMuscles: MuscleGroup[],
  secondaryMuscles: MuscleGroup[]
): MuscleInvolvement {
  const fromMap = MUSCLE_INVOLVEMENT_MAP[exerciseName];
  if (fromMap) return fromMap;

  const involvement: MuscleInvolvement = {};
  primaryMuscles.forEach((m) => { involvement[m] = 1.0; });
  secondaryMuscles.forEach((m) => {
    if (!involvement[m]) involvement[m] = 0.5;
  });
  return involvement;
}