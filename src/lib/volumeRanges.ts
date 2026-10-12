import type { MuscleGroup } from '../types';

export interface VolumeRange {
  min: number;
  max: number;
}

export const OPTIMAL_RANGES: Record<MuscleGroup, VolumeRange | null> = {
  // Pecho
  'Pectoral Superior': { min: 8, max: 16 },
  'Pectoral Medio': { min: 8, max: 16 },
  'Pectoral Inferior': { min: 6, max: 12 },
  // Espalda
  'Dorsal Ancho': { min: 10, max: 20 },
  Romboides: { min: 8, max: 14 },
  'Trapecio Superior': { min: 8, max: 14 },
  'Trapecio Medio': { min: 8, max: 14 },
  'Trapecio Inferior': { min: 6, max: 12 },
  'Erector Espinal': { min: 6, max: 12 },
  Infraespinoso: { min: 6, max: 12 },
  // Hombro
  'Deltoides Anterior': { min: 6, max: 10 },
  'Deltoides Lateral': { min: 16, max: 25 },
  'Deltoides Posterior': { min: 16, max: 25 },
  // Brazos
  Bíceps: { min: 8, max: 14 },
  Braquial: { min: 6, max: 12 },
  Tríceps: { min: 8, max: 14 },
  Antebrazos: { min: 6, max: 12 },
  // Pierna
  Cuádriceps: { min: 10, max: 20 },
  Isquiosurales: { min: 10, max: 20 },
  Glúteos: { min: 10, max: 20 },
  Aductores: { min: 6, max: 12 },
  Abductores: { min: 6, max: 12 },
  Gemelos: { min: 14, max: 25 },
  'Tibial Anterior': { min: 6, max: 12 },
  // Core
  'Recto Abdominal': { min: 8, max: 16 },
  Oblicuos: { min: 6, max: 12 },
  'Transverso Abdominal': { min: 6, max: 12 },
  // Cardio
  Cardiovascular: null,
};

export type VolumeStatus = 'low' | 'optimal' | 'high';

export function statusForVolume(m: MuscleGroup, sets: number): VolumeStatus {
  const r = OPTIMAL_RANGES[m];
  if (!r) return 'optimal';
  if (sets < r.min) return 'low';
  if (sets > r.max) return 'high';
  return 'optimal';
}

export function colorForStatus(s: VolumeStatus): string {
  if (s === 'low') return 'text-zinc-400';
  if (s === 'optimal') return 'text-cyan-400';
  return 'text-red-400';
}