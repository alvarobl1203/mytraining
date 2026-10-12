import type {
  MuscleGroup, VolumeRecommendation, VolumeStatus,
} from '../types';

export const VOLUME_RECOMMENDATIONS: VolumeRecommendation[] = [
  { muscle: 'Pectoral Superior', mev: 6, mavMin: 10, mavMax: 16, mrv: 22, frequencyMin: 2, frequencyMax: 3, notes: 'Priorizar en press inclinado.' },
  { muscle: 'Pectoral Medio', mev: 6, mavMin: 10, mavMax: 16, mrv: 22, frequencyMin: 2, frequencyMax: 3, notes: 'Press banca plano.' },
  { muscle: 'Pectoral Inferior', mev: 4, mavMin: 6, mavMax: 12, mrv: 16, frequencyMin: 1, frequencyMax: 2, notes: 'Fondos y declinado.' },
  { muscle: 'Dorsal Ancho', mev: 8, mavMin: 12, mavMax: 20, mrv: 26, frequencyMin: 2, frequencyMax: 4, notes: 'Dominadas, jalón, remo.' },
  { muscle: 'Romboides', mev: 4, mavMin: 8, mavMax: 14, mrv: 20, frequencyMin: 2, frequencyMax: 3, notes: 'Remo horizontal.' },
  { muscle: 'Trapecio Superior', mev: 4, mavMin: 8, mavMax: 12, mrv: 18, frequencyMin: 2, frequencyMax: 3, notes: 'Encogimientos.' },
  { muscle: 'Trapecio Medio', mev: 4, mavMin: 6, mavMax: 12, mrv: 18, frequencyMin: 2, frequencyMax: 3, notes: 'Face pulls, remo.' },
  { muscle: 'Trapecio Inferior', mev: 4, mavMin: 6, mavMax: 10, mrv: 16, frequencyMin: 2, frequencyMax: 3, notes: 'Y-raises.' },
  { muscle: 'Erector Espinal', mev: 4, mavMin: 6, mavMax: 12, mrv: 18, frequencyMin: 2, frequencyMax: 3, notes: 'Peso muerto.' },
  { muscle: 'Infraespinoso', mev: 4, mavMin: 6, mavMax: 12, mrv: 18, frequencyMin: 2, frequencyMax: 3, notes: 'Rotaciones externas.' },
  { muscle: 'Deltoides Anterior', mev: 6, mavMin: 10, mavMax: 14, mrv: 20, frequencyMin: 2, frequencyMax: 3, notes: 'Press militar.' },
  { muscle: 'Deltoides Lateral', mev: 8, mavMin: 12, mavMax: 20, mrv: 26, frequencyMin: 2, frequencyMax: 4, notes: 'Elevaciones laterales.' },
  { muscle: 'Deltoides Posterior', mev: 6, mavMin: 10, mavMax: 16, mrv: 22, frequencyMin: 2, frequencyMax: 4, notes: 'Pájaros, face pulls.' },
  { muscle: 'Bíceps', mev: 6, mavMin: 8, mavMax: 14, mrv: 20, frequencyMin: 2, frequencyMax: 3, notes: 'Curls variados.' },
  { muscle: 'Braquial', mev: 4, mavMin: 6, mavMax: 10, mrv: 14, frequencyMin: 2, frequencyMax: 3, notes: 'Curl martillo.' },
  { muscle: 'Tríceps', mev: 6, mavMin: 10, mavMax: 16, mrv: 22, frequencyMin: 2, frequencyMax: 4, notes: 'Extensión polea, fondos.' },
  { muscle: 'Antebrazos', mev: 2, mavMin: 4, mavMax: 8, mrv: 12, frequencyMin: 2, frequencyMax: 3, notes: 'Curl inverso.' },
  { muscle: 'Cuádriceps', mev: 8, mavMin: 12, mavMax: 20, mrv: 26, frequencyMin: 2, frequencyMax: 3, notes: 'Sentadilla, prensa.' },
  { muscle: 'Isquiosurales', mev: 6, mavMin: 10, mavMax: 16, mrv: 22, frequencyMin: 2, frequencyMax: 3, notes: 'Peso muerto rumano.' },
  { muscle: 'Glúteos', mev: 4, mavMin: 8, mavMax: 16, mrv: 24, frequencyMin: 2, frequencyMax: 4, notes: 'Hip thrust.' },
  { muscle: 'Aductores', mev: 0, mavMin: 4, mavMax: 8, mrv: 12, frequencyMin: 1, frequencyMax: 2, notes: 'Sentadilla profunda.' },
  { muscle: 'Abductores', mev: 0, mavMin: 4, mavMax: 8, mrv: 12, frequencyMin: 1, frequencyMax: 2, notes: 'Monoarticulares.' },
  { muscle: 'Gemelos', mev: 6, mavMin: 10, mavMax: 16, mrv: 22, frequencyMin: 2, frequencyMax: 4, notes: 'Elevación talones.' },
  { muscle: 'Tibial Anterior', mev: 2, mavMin: 4, mavMax: 8, mrv: 12, frequencyMin: 2, frequencyMax: 3, notes: 'Elevación puntas.' },
  { muscle: 'Recto Abdominal', mev: 0, mavMin: 6, mavMax: 12, mrv: 18, frequencyMin: 2, frequencyMax: 3, notes: 'Flexión con carga.' },
  { muscle: 'Oblicuos', mev: 0, mavMin: 4, mavMax: 10, mrv: 16, frequencyMin: 2, frequencyMax: 3, notes: 'Rotaciones.' },
  { muscle: 'Transverso Abdominal', mev: 0, mavMin: 2, mavMax: 6, mrv: 10, frequencyMin: 3, frequencyMax: 5, notes: 'Planchas.' },
  { muscle: 'Cardiovascular', mev: 0, mavMin: 120, mavMax: 240, mrv: 480, frequencyMin: 3, frequencyMax: 6, notes: 'Minutos Z2-Z4/semana.' },
];

export function getRecommendation(
  muscle: MuscleGroup
): VolumeRecommendation | undefined {
  return VOLUME_RECOMMENDATIONS.find((r) => r.muscle === muscle);
}

export function getVolumeStatus(
  weeklySets: number, rec: VolumeRecommendation
): VolumeStatus {
  if (weeklySets <= 0) return 'Sin datos';
  if (weeklySets < rec.mev) return 'Bajo el MEV';
  if (weeklySets < rec.mavMin) return 'MEV-VA';
  if (weeklySets <= rec.mavMax) return 'MAV';
  if (weeklySets <= rec.mrv) return 'MRV-Z';
  return 'Sobre el MRV';
}

export const VOLUME_STATUS_COLOR: Record<VolumeStatus, string> = {
  'Sin datos': 'text-zinc-500 border-zinc-700 bg-zinc-800/40',
  'Bajo el MEV': 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  'MEV-VA': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
  'MAV': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  'MRV-Z': 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  'Sobre el MRV': 'text-red-400 border-red-500/30 bg-red-500/5',
};

export const VOLUME_STATUS_LABEL: Record<VolumeStatus, string> = {
  'Sin datos': 'Sin datos',
  'Bajo el MEV': 'Bajo el mínimo efectivo',
  'MEV-VA': 'Crecimiento mínimo',
  'MAV': 'Rango óptimo',
  'MRV-Z': 'Cerca del límite',
  'Sobre el MRV': 'Sobre el recuperable',
};