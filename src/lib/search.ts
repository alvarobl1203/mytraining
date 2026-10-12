import Fuse from 'fuse.js';
import type { Exercise } from '../types';

// Normaliza: quita acentos, minúsculas, espacios extra
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Sinónimos comunes en gimnasio
const SYNONYMS: Record<string, string[]> = {
  curl: ['flexion', 'biceps'],
  press: ['empuje', 'banca'],
  sentadilla: ['squat'],
  peso: ['deadlift', 'muerto'],
  remo: ['row'],
  dominada: ['pull', 'chin'],
  fondos: ['dip'],
  elevacion: ['raise'],
  extension: ['extension'],
  mancuerna: ['dumbbell'],
  barra: ['barbell'],
  polea: ['cable'],
  maquina: ['machine'],
  banco: ['bench'],
  lateral: ['side'],
  frontal: ['front'],
  inclinado: ['incline'],
  declinado: ['decline'],
  unilateral: ['one', 'single'],
  martillo: ['hammer'],
  predicador: ['preacher'],
  arana: ['spider'],
  bajo: ['low'],
  alto: ['high'],
  cuerda: ['rope'],
};

export function expandQuery(q: string): string[] {
  const n = normalize(q);
  const words = n.split(' ');
  const expanded = new Set<string>([n]);

  words.forEach((w) => {
    Object.entries(SYNONYMS).forEach(([key, alts]) => {
      if (key.includes(w) || alts.some((a) => a.includes(w))) {
        expanded.add(key);
        alts.forEach((a) => expanded.add(a));
      }
    });
  });

  return Array.from(expanded);
}

// Búsqueda con Fuse.js: tolera typos y ordena por relevancia
export function searchExercises(
  exercises: Exercise[],
  rawQuery: string
): Exercise[] {
  const query = rawQuery.trim();
  if (!query) return exercises;

  const fuse = new Fuse(
    exercises.map((e) => ({
      ...e,
      // Añadimos campos normalizados para búsqueda
      _name: normalize(e.name),
      _primary: normalize(e.primaryMuscle),
      _secondary: e.secondaryMuscles.map(normalize).join(' '),
      _equipment: normalize(e.equipment),
      _category: normalize(e.category),
    })),
    {
      includeScore: true,
      threshold: 0.35,
      distance: 100,
      minMatchCharLength: 2,
      keys: [
        { name: '_name', weight: 0.7 },
        { name: '_primary', weight: 0.15 },
        { name: '_secondary', weight: 0.08 },
        { name: '_equipment', weight: 0.05 },
        { name: '_category', weight: 0.02 },
      ],
    }
  );

  // Expandimos con sinónimos para ampliar la búsqueda
  const terms = expandQuery(query);
  const results = new Map<string, Exercise>();

  terms.forEach((term) => {
    fuse.search(term).forEach((r) => {
      // Mapeamos de vuelta al Exercise original
      const original = exercises.find((e) => e.id === r.item.id);
      if (original && !results.has(original.id)) {
        results.set(original.id, original);
      }
    });
  });

  // Fallback: si no hay resultados con fuzzy, hacemos includes manual
  if (results.size === 0) {
    const nq = normalize(query);
    return exercises.filter((e) =>
      normalize(e.name).includes(nq) ||
      normalize(e.primaryMuscle).includes(nq) ||
      e.secondaryMuscles.some((m) => normalize(m).includes(nq)) ||
      normalize(e.equipment).includes(nq)
    );
  }

  return Array.from(results.values());
}

// Resalta la parte coincidente en un texto
export function highlightMatch(text: string, query: string): {
  before: string;
  match: string;
  after: string;
} | null {
  if (!query.trim()) return null;
  const nText = normalize(text);
  const nQuery = normalize(query);
  const idx = nText.indexOf(nQuery);
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + nQuery.length),
    after: text.slice(idx + nQuery.length),
  };
}