import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Trophy } from 'lucide-react';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { estimateOneRm } from '../lib/calculations';
import { projectToTarget } from '../lib/projection';
import type { Exercise } from '../types';

const AXIS = { stroke: '#52525b', fontSize: 10 };
const GRID = { stroke: '#3f3f46', strokeDasharray: '3 3' };
const TOOLTIP = {
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  fontSize: 12,
};

export function ExerciseStatsPanel({
  userId,
  exercise,
}: {
  userId: string;
  exercise: Exercise;
}) {
  const { workouts, sets, loading } = useExerciseHistory(userId, exercise.id);
  const [targetInput, setTargetInput] = useState('');

  const sessions = useMemo(() => {
    const byWorkout = new Map<
      string,
      { best: number; tonnage: number; date: string }
    >();

    sets.forEach((s) => {
      if (!s.weightKg || !s.reps) return;
      const w = workouts.find((x) => x.id === s.workoutId);
      if (!w?.finishedAt) return;
      const rm = estimateOneRm(s.weightKg, s.reps, s.rir ?? 0);
      const tonnage = s.weightKg * s.reps;
      const cur = byWorkout.get(s.workoutId) ?? {
        best: 0,
        tonnage: 0,
        date: w.finishedAt,
      };
      byWorkout.set(s.workoutId, {
        best: Math.max(cur.best, rm),
        tonnage: cur.tonnage + tonnage,
        date: w.finishedAt,
      });
    });

    return Array.from(byWorkout.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s, i) => ({
        index: i + 1,
        date: new Date(s.date).toLocaleDateString('es', {
          day: '2-digit',
          month: 'short',
        }),
        rm: +s.best.toFixed(1),
        tonnage: Math.round(s.tonnage),
      }));
  }, [workouts, sets]);

  const bestRm = useMemo(
    () => sessions.reduce((a, s) => Math.max(a, s.rm), 0),
    [sessions]
  );

  const projection = useMemo(() => {
    const target = Number(targetInput);
    if (!target || target <= bestRm) return null;
    return projectToTarget(exercise.id, workouts, sets, target);
  }, [targetInput, bestRm, exercise.id, workouts, sets]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
        <p className="text-center text-xs text-zinc-500">Cargando histórico…</p>
      </div>
    );
  }

  if (sessions.length < 2) {
    return (
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
        <p className="text-center text-xs text-zinc-500">
          Registra al menos 2 sesiones de este ejercicio para ver tu progreso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-3">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-cyan-400" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
            Récord personal
          </p>
        </div>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
          {bestRm.toFixed(1)} kg
        </p>
        <p className="text-[11px] text-zinc-400">
          {sessions.length} sesiones registradas
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Evolución del 1RM estimado
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={sessions}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="date" {...AXIS} />
            <YAxis {...AXIS} width={32} domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip contentStyle={TOOLTIP} />
            <Line
              type="monotone"
              dataKey="rm"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Tonelaje por sesión
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={sessions}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="date" {...AXIS} />
            <YAxis {...AXIS} width={40} />
            <Tooltip contentStyle={TOOLTIP} />
            <Bar dataKey="tonnage" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={13} className="text-cyan-400" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Proyección
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder={`Objetivo (kg). Actual: ${bestRm.toFixed(0)}`}
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {projection && projection.weeksToTarget !== null && (
          <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
            <p className="text-xs text-cyan-200">
              A este ritmo ({projection.slope >= 0 ? '+' : ''}
              {projection.slope.toFixed(2)} kg/sesión) alcanzarás los{' '}
              <span className="font-bold">{projection.target} kg</span> en{' '}
              <span className="font-bold">
                ~{projection.weeksToTarget} semanas
              </span>
              .
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
              Confianza{' '}
              {projection.confidence === 'high'
                ? 'alta'
                : projection.confidence === 'medium'
                  ? 'media'
                  : 'baja'}
            </p>
          </div>
        )}

        {projection && projection.weeksToTarget === null && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-200">
              Sin tendencia positiva clara. Prueba a subir peso o reps
              progresivamente.
            </p>
          </div>
        )}

        {targetInput && Number(targetInput) <= bestRm && (
          <p className="mt-2 text-[11px] text-zinc-500">
            Introduce un objetivo mayor que tu récord actual ({bestRm.toFixed(1)}{' '}
            kg).
          </p>
        )}
      </div>
    </div>
  );
}