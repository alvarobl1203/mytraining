import { useMemo } from 'react';
import { MUSCLE_REGIONS } from '../lib/constants';
import type { MuscleGroup } from '../types';

// Cada lado del hexágono representa una REGIÓN anatómica.
// Reutilizamos MUSCLE_REGIONS para no duplicar la lista de músculos.
const HEX_SIDES: { label: string; region: string }[] = [
  { label: 'Pecho', region: 'Pecho' },
  { label: 'Hombro', region: 'Hombro' },
  { label: 'Espalda', region: 'Espalda' },
  { label: 'Brazos', region: 'Brazos' },
  { label: 'Pierna', region: 'Pierna' },
  { label: 'Core', region: 'Core' },
];

const TARGET_TOTAL = 90;

export function VolumeHexagon({
  setsPerMuscle,
}: {
  setsPerMuscle: Map<MuscleGroup, number>;
}) {
  const perSide = useMemo(
    () =>
      HEX_SIDES.map((s) => {
        const muscles = MUSCLE_REGIONS[s.region] ?? [];
        const total = muscles.reduce(
          (acc, m) => acc + (setsPerMuscle.get(m) ?? 0),
          0
        );
        return { label: s.label, sets: total };
      }),
    [setsPerMuscle]
  );

  const total = perSide.reduce((a, s) => a + s.sets, 0);
  const pct = Math.min(1, total / TARGET_TOTAL);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;

  const angles = HEX_SIDES.map((_, i) => (Math.PI / 3) * i - Math.PI / 2);
  const outer = angles.map((a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  const max = Math.max(1, ...perSide.map((p) => p.sets));
  const inner = angles.map((a, i) => {
    const k = perSide[i].sets / max;
    return [cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)];
  });

  const poly = (pts: number[][]) => pts.map((p) => p.join(',')).join(' ');

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Volumen semanal ({Math.round(total * 10) / 10} / {TARGET_TOTAL} series)
      </p>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-[220px] w-auto">
          <defs>
            <radialGradient id="hexCore">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
          </defs>
          <polygon
            points={poly(outer)}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1.5"
          />
          {outer.map((p, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p[0]}
              y2={p[1]}
              stroke="#27272a"
              strokeWidth="1"
            />
          ))}
          <polygon
            points={poly(inner)}
            fill="url(#hexCore)"
            fillOpacity="0.35"
            stroke="#22d3ee"
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r="20"
            fill="#0a0a0a"
            stroke="#22d3ee"
            strokeWidth="1.5"
          />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fill="#e4e4e7"
            fontSize="14"
            fontWeight="700"
          >
            {Math.round(pct * 100)}%
          </text>
          <text
            x={cx}
            y={cy + 11}
            textAnchor="middle"
            fill="#71717a"
            fontSize="8"
          >
            completado
          </text>
          {outer.map((p, i) => {
            const dx = (p[0] - cx) * 0.28;
            const dy = (p[1] - cy) * 0.28;
            return (
              <text
                key={i}
                x={p[0] + dx}
                y={p[1] + dy}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="9"
                fontWeight="500"
              >
                {perSide[i].label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Bar label="Empuje" value={perSide[0].sets + perSide[1].sets} max={30} />
        <Bar label="Jalón" value={perSide[2].sets} max={30} />
        <Bar label="Piernas" value={perSide[4].sets} max={30} />
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = Math.min(1, value / max);
  const color =
    pct >= 0.85
      ? 'bg-red-500'
      : pct >= 0.5
        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
        : 'bg-zinc-600';
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] text-zinc-400">{label}</span>
        <span className="text-[10px] text-zinc-500">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}