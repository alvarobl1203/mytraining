import type { MuscleGroup } from '../types';

// Grupos que clasifican como "empuje" (push)
const PUSH_MUSCLES: MuscleGroup[] = [
  'Pectoral Superior',
  'Pectoral Medio',
  'Pectoral Inferior',
  'Deltoides Anterior',
  'Tríceps',
];

// Grupos que clasifican como "jalón / tirón" (pull)
const PULL_MUSCLES: MuscleGroup[] = [
  'Dorsal Ancho',
  'Trapecio Superior',
  'Trapecio Medio',
  'Trapecio Inferior',
  'Romboides',
  'Infraespinoso',
  'Deltoides Posterior',
  'Bíceps',
  'Braquial',
  'Antebrazos',
];

export interface ImbalanceResult {
  pushSets: number;
  pullSets: number;
  ratio: number;          // pull / push
  status: 'balanced' | 'push-dominant' | 'pull-dominant' | 'insufficient';
  message: string;
}

export function analyzeImbalance(
  setsPerMuscle: Map<MuscleGroup, number>
): ImbalanceResult {
  const pushSets = PUSH_MUSCLES.reduce(
    (a, m) => a + (setsPerMuscle.get(m) ?? 0),
    0
  );
  const pullSets = PULL_MUSCLES.reduce(
    (a, m) => a + (setsPerMuscle.get(m) ?? 0),
    0
  );

  const total = pushSets + pullSets;
  if (total < 8) {
    return {
      pushSets,
      pullSets,
      ratio: 0,
      status: 'insufficient',
      message: 'Registra más sesiones para analizar tu balance muscular.',
    };
  }

  const ratio = pullSets / Math.max(1, pushSets);

  if (ratio >= 0.8 && ratio <= 1.3) {
    return {
      pushSets,
      pullSets,
      ratio,
      status: 'balanced',
      message: `Balance correcto (empuje ${pushSets.toFixed(1)} vs jalón ${pullSets.toFixed(1)}).`,
    };
  }

  if (ratio < 0.8) {
    const deficit = (pushSets / Math.max(1, ratio) - pullSets).toFixed(0);
    return {
      pushSets,
      pullSets,
      ratio,
      status: 'push-dominant',
      message: `Estás haciendo ~${deficit} series más de empuje que de jalón esta semana. Añade remo, dominadas o face pulls para equilibrar la postura.`,
    };
  }

  return {
    pushSets,
    pullSets,
    ratio,
    status: 'pull-dominant',
    message:
      'Estás haciendo más jalón que empuje. Añade press banca, press militar o fondos para equilibrar.',
  };
}