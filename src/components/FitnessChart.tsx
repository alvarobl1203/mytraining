import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { computeFitness } from '../lib/fitness';
import type { Workout, WorkoutSet } from '../types';

const AXIS = { stroke: '#52525b', fontSize: 10 };
const GRID = { stroke: '#3f3f46', strokeDasharray: '3 3' };
const TOOLTIP = {
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  fontSize: 12,
};

export function FitnessChart({
  workouts,
  sets,
}: {
  workouts: Workout[];
  sets: WorkoutSet[];
}) {
  const data = useMemo(
    () =>
      computeFitness(workouts, sets, 84).map((p) => ({
        date: new Date(p.date).toLocaleDateString('es', {
          day: '2-digit',
          month: 'short',
        }),
        Forma: p.ctl,
        Fatiga: p.atl,
        Balance: p.tsb,
      })),
    [workouts, sets]
  );

  const hasData = data.some((d) => d.Forma > 0);
  if (!hasData) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-2xl border border-zinc-800/50 bg-grad-card">
        <p className="text-xs text-zinc-500">
          Registra sesiones para ver tu curva de forma y fatiga.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Curva de forma y fatiga (12 semanas)
      </p>
      <p className="mb-3 text-xs text-zinc-500">
        Basado en el modelo CTL/ATL/TSB de TrainingPeaks. Balance &gt; 0 sugiere
        que estás fresco; muy negativo indica fatiga acumulada.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="date" {...AXIS} interval="preserveStartEnd" />
          <YAxis {...AXIS} width={40} />
          <Tooltip contentStyle={TOOLTIP} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
            iconType="line"
          />
          <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="Forma"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Fatiga"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Balance"
            stroke="#a855f7"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}