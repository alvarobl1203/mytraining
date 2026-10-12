import type { MuscleInvolvement } from '../types';

const FRONT_PATHS: Record<string, string> = {
  'Pectoral Superior': 'M 42,32 L 58,32 L 58,40 L 42,40 Z',
  'Pectoral Medio': 'M 42,41 L 58,41 L 58,49 L 42,49 Z',
  'Pectoral Inferior': 'M 42,50 L 58,50 L 58,56 L 42,56 Z',
  'Deltoides Anterior': 'M 30,32 Q 28,40 30,48 L 40,48 L 40,32 Z',
  'Deltoides Lateral': 'M 24,32 Q 20,40 22,50 L 28,50 L 30,32 Z',
  'Bíceps': 'M 24,52 Q 22,60 24,70 L 30,70 L 32,52 Z',
  'Antebrazos': 'M 24,72 Q 22,82 24,92 L 30,92 L 32,72 Z',
  'Recto Abdominal': 'M 44,58 L 56,58 L 56,80 L 44,80 Z',
  'Oblicuos': 'M 36,58 L 42,58 L 42,80 L 36,80 Z',
  'Cuádriceps': 'M 40,96 L 50,96 L 50,130 L 40,130 Z',
  'Aductores': 'M 50,96 L 56,96 L 56,130 L 50,130 Z',
  'Abductores': 'M 34,96 L 40,96 L 40,130 L 34,130 Z',
  'Tibial Anterior': 'M 42,134 L 48,134 L 48,150 L 42,150 Z',
};

const BACK_PATHS: Record<string, string> = {
  'Trapecio Superior': 'M 40,28 Q 50,26 60,28 L 60,36 L 40,36 Z',
  'Trapecio Medio': 'M 44,38 L 56,38 L 56,48 L 44,48 Z',
  'Trapecio Inferior': 'M 44,50 L 56,50 L 56,58 L 44,58 Z',
  'Romboides': 'M 40,40 L 44,40 L 44,52 L 40,52 Z',
  'Infraespinoso': 'M 32,38 L 38,38 L 38,48 L 32,48 Z',
  'Deltoides Posterior': 'M 24,32 Q 20,40 22,50 L 28,50 L 30,32 Z',
  'Dorsal Ancho': 'M 34,52 Q 30,70 32,88 L 60,88 Q 62,70 58,52 Z',
  'Erector Espinal': 'M 48,58 L 52,58 L 52,88 L 48,88 Z',
  'Tríceps': 'M 24,52 Q 22,60 24,70 L 30,70 L 32,52 Z',
  'Antebrazos': 'M 24,72 Q 22,82 24,92 L 30,92 L 32,72 Z',
  'Glúteos': 'M 36,90 Q 30,96 32,104 L 60,104 Q 62,96 56,90 Z',
  'Isquiosurales': 'M 40,106 L 50,106 L 50,130 L 40,130 Z',
  'Gemelos': 'M 42,134 L 48,134 L 48,150 L 42,150 Z',
};

export function MiniMuscleMap({
  involvement,
  size = 48,
}: {
  involvement: MuscleInvolvement;
  size?: number;
}) {
  const allPaths = { ...FRONT_PATHS, ...BACK_PATHS };
  const muscles = Object.keys(allPaths);

  return (
    <svg
      viewBox="0 0 100 160"
      width={size}
      height={size * 1.6}
      className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/60"
    >
      <g fill="none" stroke="#27272a" strokeWidth="0.6">
        <ellipse cx="50" cy="14" rx="7" ry="8" />
        <rect x="43" y="22" width="14" height="6" rx="2" />
        <path d="M 30,30 Q 50,26 70,30 L 72,90 L 28,90 Z" />
        <path d="M 28,32 L 22,92" />
        <path d="M 72,32 L 78,92" />
        <rect x="38" y="92" width="10" height="42" rx="3" />
        <rect x="52" y="92" width="10" height="42" rx="3" />
        <rect x="38" y="134" width="10" height="20" rx="3" />
        <rect x="52" y="134" width="10" height="20" rx="3" />
      </g>
      {muscles.map((m) => {
        const intensity = involvement[m as keyof MuscleInvolvement] ?? 0;
        if (intensity <= 0) return null;
        const opacity = 0.25 + intensity * 0.75;
        const color =
          intensity >= 0.75 ? '#f43f5e'
          : intensity >= 0.5 ? '#a855f7'
          : '#3b82f6';
        const d = allPaths[m];
        if (!d) return null;
        return (
          <path
            key={m}
            d={d}
            fill={color}
            fillOpacity={opacity}
            stroke="#0a0a0a"
            strokeWidth="0.4"
          />
        );
      })}
    </svg>
  );
}