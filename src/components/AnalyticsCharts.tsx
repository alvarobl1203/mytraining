import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { MUSCLE_REGIONS, REGION_OF } from '../lib/constants';
import type { MuscleGroup } from '../types';

const AXIS = { stroke: '#52525b', fontSize: 10 };
const GRID = { stroke: '#3f3f46', strokeDasharray: '3 3' };
const TOOLTIP = {
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  fontSize: 12,
};

// ----------------------------------------------------------------------
// Radar de balance muscular por REGIÓN anatómica
// ----------------------------------------------------------------------
const RADAR_REGIONS = ['Pecho', 'Hombro', 'Espalda', 'Brazos', 'Pierna', 'Core'];

export function MuscleRadar({
  setsPerMuscle,
}: {
  setsPerMuscle: Map<MuscleGroup, number>;
}) {
  const data = RADAR_REGIONS.map((region) => {
    const muscles = MUSCLE_REGIONS[region] ?? [];
    const total = muscles.reduce(
      (acc, m) => acc + (setsPerMuscle.get(m) ?? 0),
      0
    );
    return { region, sets: Math.round(total * 10) / 10 };
  });

  const total = data.reduce((a, d) => a + d.sets, 0);
  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl border border-zinc-800/50 bg-grad-card">
        <p className="text-xs text-zinc-500">Sin datos aún</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Balance muscular por región (7 días)
      </p>
      <p className="mb-3 text-xs text-zinc-500">
        Detecta desequilibrios entre grupos grandes.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} outerRadius={90}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis
            dataKey="region"
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
          />
          <PolarRadiusAxis tick={{ fill: '#52525b', fontSize: 9 }} />
          <Radar
            name="Series"
            dataKey="sets"
            stroke="#22d3ee"
            fill="#3b82f6"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip contentStyle={TOOLTIP} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Tendencia de volumen semanal
// ----------------------------------------------------------------------
export function WeeklyVolumeTrend({
  workouts,
  sets,
}: {
  workouts: { id: string; finishedAt: string | null }[];
  sets: {
    workoutId: string;
    completed: boolean;
    weightKg: number | null;
    reps: number | null;
  }[];
}) {
  const data = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const end = Date.now() - i * 7 * 24 * 3600 * 1000;
      return { start: end - 7 * 24 * 3600 * 1000, end, volume: 0, sets: 0 };
    }).reverse();

    sets.forEach((s) => {
      if (!s.completed) return;
      const w = workouts.find((x) => x.id === s.workoutId);
      if (!w?.finishedAt) return;
      const t = new Date(w.finishedAt).getTime();
      const bucket = weeks.find((wk) => t >= wk.start && t < wk.end);
      if (!bucket) return;
      bucket.volume += (s.weightKg ?? 0) * (s.reps ?? 0);
      bucket.sets += 1;
    });

    return weeks.map((w, i) => ({
      label: `S${i + 1 - 8}`,
      volumen: Math.round(w.volume),
      series: w.sets,
    }));
  }, [workouts, sets]);

  const hasData = data.some((d) => d.volumen > 0);
  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-zinc-800/50 bg-grad-card">
        <p className="text-xs text-zinc-500">Sin datos de volumen</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Volumen semanal (8 semanas)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} width={40} />
          <Tooltip contentStyle={TOOLTIP} />
          <Area
            type="monotone"
            dataKey="volumen"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#volGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Progresión de RIR medio por semana (fatiga)
// ----------------------------------------------------------------------
export function RirProgression({
  workouts,
  sets,
}: {
  workouts: { id: string; finishedAt: string | null }[];
  sets: { workoutId: string; completed: boolean; rir: number | null }[];
}) {
  const data = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const end = Date.now() - i * 7 * 24 * 3600 * 1000;
      return { start: end - 7 * 24 * 3600 * 1000, end, sum: 0, count: 0 };
    }).reverse();

    sets.forEach((s) => {
      if (!s.completed || s.rir === null) return;
      const w = workouts.find((x) => x.id === s.workoutId);
      if (!w?.finishedAt) return;
      const t = new Date(w.finishedAt).getTime();
      const bucket = weeks.find((wk) => t >= wk.start && t < wk.end);
      if (!bucket) return;
      bucket.sum += s.rir;
      bucket.count += 1;
    });

    return weeks.map((w, i) => ({
      label: `S${i + 1 - 8}`,
      rir: w.count > 0 ? +(w.sum / w.count).toFixed(2) : 0,
    }));
  }, [workouts, sets]);

  const hasData = data.some((d) => d.rir > 0);
  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-zinc-800/50 bg-grad-card">
        <p className="text-xs text-zinc-500">Sin datos de RIR</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        RIR medio por semana
      </p>
      <p className="mb-3 text-xs text-zinc-500">
        RIR bajo = cerca del fallo. Si baja mucho durante 2-3 semanas, considera deload.
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" {...AXIS} />
          <YAxis {...AXIS} width={32} domain={[0, 4]} />
          <Tooltip contentStyle={TOOLTIP} />
          <Line
            type="monotone"
            dataKey="rir"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Frecuencia por REGIÓN muscular (últimos 30 días)
// ----------------------------------------------------------------------
export function MuscleFrequency({
  frequencyByMuscle,
}: {
  frequencyByMuscle: Map<MuscleGroup, number>;
}) {
  const data = useMemo(() => {
    // Agrupa por región anatómica sumando la frecuencia de sus sub-regiones
    const byRegion = new Map<string, number>();
    frequencyByMuscle.forEach((count, muscle) => {
      const region = REGION_OF[muscle];
      if (!region) return;
      byRegion.set(region, (byRegion.get(region) ?? 0) + count);
    });

    return Array.from(byRegion.entries())
      .map(([region, count]) => ({ region, dias: count }))
      .filter((d) => d.dias > 0)
      .sort((a, b) => b.dias - a.dias);
  }, [frequencyByMuscle]);

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl border border-zinc-800/50 bg-grad-card">
        <p className="text-xs text-zinc-500">Sin datos de frecuencia</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Frecuencia por región (30 días)
      </p>
      <p className="mb-3 text-xs text-zinc-500">
        Ideal: 2 veces por semana cada grupo principal.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid {...GRID} horizontal={false} />
          <XAxis type="number" {...AXIS} />
          <YAxis
            type="category"
            dataKey="region"
            {...AXIS}
            width={100}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
          />
          <Tooltip contentStyle={TOOLTIP} />
          <Bar dataKey="dias" fill="#3b82f6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Volumen por REGIÓN muscular (7 días)
// ----------------------------------------------------------------------
export function MuscleVolumeBars({
  setsPerMuscle,
}: {
  setsPerMuscle: Map<MuscleGroup, number>;
}) {
  const data = useMemo(() => {
    const byRegion = new Map<string, number>();
    setsPerMuscle.forEach((sets, muscle) => {
      const region = REGION_OF[muscle];
      if (!region) return;
      byRegion.set(region, (byRegion.get(region) ?? 0) + sets);
    });

    return Array.from(byRegion.entries())
      .map(([region, sets]) => ({
        region,
        series: Math.round(sets * 10) / 10,
      }))
      .sort((a, b) => b.series - a.series);
  }, [setsPerMuscle]);

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl border border-zinc-800/50 bg-grad-card">
        <p className="text-xs text-zinc-500">Sin datos de volumen</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Series por región (7 días)
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid {...GRID} horizontal={false} />
          <XAxis type="number" {...AXIS} />
          <YAxis
            type="category"
            dataKey="region"
            {...AXIS}
            width={110}
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
          />
          <Tooltip contentStyle={TOOLTIP} />
          <Bar dataKey="series" fill="#22d3ee" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}