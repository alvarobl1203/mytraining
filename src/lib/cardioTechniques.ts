export interface CardioProtocol {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  intensity: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  protocol: string;
}

export const CARDIO_PROTOCOLS: CardioProtocol[] = [
  {
    id: 'z2-continuous',
    name: 'Z2 Continuo',
    description: 'Base aeróbica · ideal para recuperación activa.',
    durationMin: 40,
    intensity: 'Z2',
    protocol: '40-60 min · FC 60-70%',
  },
  {
    id: 'threshold',
    name: 'Umbral',
    description: 'Mejora VO2max y capacidad de trabajo.',
    durationMin: 25,
    intensity: 'Z4',
    protocol: '3×8 min Z4 · 2 min Z2 entre bloques',
  },
  {
    id: 'hiit-30-30',
    name: 'HIIT 30/30',
    description: 'Intervalos cortos alta intensidad.',
    durationMin: 20,
    intensity: 'Z5',
    protocol: '12×(30s Z5 · 30s Z1)',
  },
  {
    id: 'tabata',
    name: 'Tabata',
    description: 'Máxima intensidad, 4 min.',
    durationMin: 4,
    intensity: 'Z5',
    protocol: '8×(20s all-out · 10s rest)',
  },
  {
    id: 'fartlek',
    name: 'Fartlek',
    description: 'Cambios libres de ritmo según sensación.',
    durationMin: 30,
    intensity: 'Z3',
    protocol: '30 min alternando Z2/Z3/Z4 según feeling',
  },
  {
    id: 'emom',
    name: 'EMOM',
    description: 'Every Minute On the Minute · trabajo + descanso.',
    durationMin: 15,
    intensity: 'Z4',
    protocol: '15 min · en cada minuto: 30-40s trabajo',
  },
  {
    id: 'long-slow',
    name: 'Long Slow Distance',
    description: 'Rodaje largo baja intensidad.',
    durationMin: 60,
    intensity: 'Z2',
    protocol: '60-90 min Z2 · ritmo conversacional',
  },
  {
    id: 'sprint-intervals',
    name: 'Intervalos de sprint',
    description: 'Sprints cortos con recuperación completa.',
    durationMin: 18,
    intensity: 'Z5',
    protocol: '8×(30s sprint · 90s caminar)',
  },
];

export interface HeartRateZone {
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  name: string;
  pctMin: number;
  pctMax: number;
  benefit: string;
}

export const HR_ZONES: HeartRateZone[] = [
  { zone: 'Z1', name: 'Recuperación', pctMin: 50, pctMax: 60, benefit: 'Vuelta a la calma' },
  { zone: 'Z2', name: 'Base aeróbica', pctMin: 60, pctMax: 70, benefit: 'Densidad mitocondrial' },
  { zone: 'Z3', name: 'Tempo', pctMin: 70, pctMax: 80, benefit: 'Eficiencia cardiovascular' },
  { zone: 'Z4', name: 'Umbral', pctMin: 80, pctMax: 90, benefit: 'VO2max' },
  { zone: 'Z5', name: 'Máximo', pctMin: 90, pctMax: 100, benefit: 'Capacidad anaeróbica' },
];