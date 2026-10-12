export interface TechniqueMeta {
  id: string;
  name: string;
  description: string;
  evidence: string;
  fatigueCost: 'Baja' | 'Media' | 'Alta';
  protocol: string;
  category: 'Intensidad' | 'Volumen' | 'Tempo' | 'Descanso';
}

export const TECHNIQUES: TechniqueMeta[] = [
  {
    id: 'drop-set',
    name: 'Drop-Set',
    description:
      'Al llegar al fallo técnico, reduce el peso un 20-30% y continúa sin descanso.',
    evidence: 'Schoenfeld 2017 — similar hipertrofia que series tradicionales.',
    fatigueCost: 'Alta',
    protocol: '2-3 reducciones por serie · solo última serie del ejercicio',
    category: 'Intensidad',
  },
  {
    id: 'rest-pause',
    name: 'Rest-Pause',
    description:
      'Fallo → 15-20s descanso → más reps → repetir 2-3 veces.',
    evidence: 'Korakakis 2017 — aumenta volumen efectivo con menor tiempo total.',
    fatigueCost: 'Alta',
    protocol: '3 bloques de reps · últimas series',
    category: 'Intensidad',
  },
  {
    id: 'myo-reps',
    name: 'Myo-Reps',
    description:
      'Serie activadora al fallo, luego mini-series de 3-5 reps con 5s de descanso.',
    evidence: 'Borge 2017 — alta eficiencia en tiempo.',
    fatigueCost: 'Alta',
    protocol: '1 activadora + 3-5 mini-series · aislados',
    category: 'Volumen',
  },
  {
    id: 'cluster-set',
    name: 'Cluster Set',
    description: 'Series con micro-descansos (15-30s) para mantener calidad.',
    evidence: 'Tufano 2017 — más volumen con menos fatiga.',
    fatigueCost: 'Media',
    protocol: 'Básicos de fuerza · 3-5 clusters por serie',
    category: 'Descanso',
  },
  {
    id: 'tempo-3-1-3',
    name: 'Tempo 3-1-3',
    description: '3s excéntrica · 1s pausa · 3s concéntrica.',
    evidence: 'Schoenfeld 2015 — TUT alto promueve hipertrofia.',
    fatigueCost: 'Media',
    protocol: 'Aislados o básicos ligeros',
    category: 'Tempo',
  },
  {
    id: 'tempo-explosive',
    name: 'Fase concéntrica explosiva',
    description: 'Excéntrica controlada 2s + concéntrica explosiva.',
    evidence: 'Pareja-Blanco 2017 — mejor para fuerza.',
    fatigueCost: 'Baja',
    protocol: 'Básicos de fuerza',
    category: 'Tempo',
  },
  {
    id: 'partial-reps',
    name: 'Reps parciales',
    description: 'Rango parcial tras el fallo en la porción estirada.',
    evidence: 'Goto 2019 — mayor hipertrofia en el punto de estiramiento.',
    fatigueCost: 'Media',
    protocol: 'Última serie · aislados',
    category: 'Intensidad',
  },
  {
    id: '21s',
    name: 'Curl 21s',
    description: '7 reps medias + 7 altas + 7 completas.',
    evidence: 'Clásico culturismo, soporte anecdótico.',
    fatigueCost: 'Alta',
    protocol: 'Bíceps · 1 serie final',
    category: 'Volumen',
  },
  {
    id: 'super-set',
    name: 'Superserie',
    description: 'Dos ejercicios consecutivos sin descanso.',
    evidence: 'Robbins 2017 — mismo estímulo, menos tiempo.',
    fatigueCost: 'Media',
    protocol: 'Antagonistas o mismo grupo',
    category: 'Descanso',
  },
  {
    id: 'giant-set',
    name: 'Giant Set',
    description: '3-4 ejercicios consecutivos sin descanso.',
    evidence: 'Alta densidad, fatiga elevada.',
    fatigueCost: 'Alta',
    protocol: 'Aislados · última fase del entrenamiento',
    category: 'Volumen',
  },
];

export const TECHNIQUE_BY_ID: Record<string, TechniqueMeta> = Object.fromEntries(
  TECHNIQUES.map((t) => [t.id, t])
);

/**
 * Devuelve las técnicas seguras/sugeridas para un ejercicio concreto.
 * Básicos multiarticulares → solo tempo/cluster/superserie con antagonista.
 * Aislados → todas.
 */
export function getTechniquesForExercise(exerciseName: string): TechniqueMeta[] {
  const isCompoundFree = /sentadilla|peso muerto|press banca|press militar|remo con barra/i.test(
    exerciseName
  );

  if (isCompoundFree) {
    return TECHNIQUES.filter((t) =>
      ['cluster-set', 'tempo-3-1-3', 'tempo-explosive', 'super-set'].includes(
        t.id
      )
    );
  }
  return TECHNIQUES;
}

/**
 * Devuelve las técnicas a evitar para un ejercicio concreto (avisos).
 */
export function getTechniquesToAvoid(exerciseName: string): TechniqueMeta[] {
  const isCompoundFree = /sentadilla|peso muerto|press banca|press militar/i.test(
    exerciseName
  );
  if (!isCompoundFree) return [];
  return TECHNIQUES.filter((t) =>
    ['drop-set', 'rest-pause', 'myo-reps', 'partial-reps', '21s', 'giant-set'].includes(
      t.id
    )
  );
}