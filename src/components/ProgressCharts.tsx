import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Exercise, Workout, WorkoutSet } from '../types';
import { estimateOneRm, tonnage } from '../lib/calculations';

const AXIS = { stroke: '#52525b', fontSize: 10 };
const GRAD = { stroke: '#3f3f46', strokeDasharray: '3 3' };
const TOOLTIP_STYLE = {
  background: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 12,
  fontSize: 12,
};

export function OneRmChart({
  exercise,
  workouts,
  sets,
}: {
  exercise: Exercise;
  workouts: Workout[];
  sets: WorkoutSet[];
}) {
  const data = useMemo(() => {
    const byWorkout = new Map<string, number>();
    sets
      .filter((s) => s.exerciseId === exercise.id && s.completed && s.weightKg && s.reps)
      .forEach((s) => {
        const rm = estimateOneRm(s.weightKg!, s.reps!, s.rir ?? 0);
        const prev = byWorkout.get(s.workoutId) ?? 0;
        if (rm > prev) byWorkout.set(s.workoutId, rm);
      });
    return workouts
      .filter((w) => byWorkout.has(w.id) && w.finishedAt)
      .map((w) => ({
        date: new Date(w.finishedAt!).toLocaleDateString('es', {
          day: '2-digit',
          month: '2-digit',
        }),
        rm: byWorkout.get(w.id)!,
      }))
      .slice(-15);
  }, [exercise, workouts, sets]);

  if (data.length === 0) return <EmptyChart label="Sin datos aún" />;

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        1RM estimado — {exercise.name}
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid {...GRAD} />
          <XAxis dataKey="date" {...AXIS} />
          <YAxis {...AXIS} width={32} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#a1a1aa' }} />
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
  );
}

export function TonnageChart({
  workouts,
  sets,
}: {
  workouts: Workout[];
  sets: WorkoutSet[];
}) {
  const data = useMemo(() => {
    const byWorkout = new Map<string, number>();
    sets.forEach((s) => {
      if (!s.completed) return;
      byWorkout.set(
        s.workoutId,
        (byWorkout.get(s.workoutId) ?? 0) + tonnage(s.weightKg, s.reps, 1)
      );
    });
    return workouts
      .filter((w) => byWorkout.has(w.id) && w.finishedAt)
      .map((w) => ({
        date: new Date(w.finishedAt!).toLocaleDateString('es', {
          day: '2-digit',
          month: '2-digit',
        }),
        tonnage: Math.round(byWorkout.get(w.id)!),
      }))
      .slice(-12);
  }, [workouts, sets]);

  if (data.length === 0) return <EmptyChart label="Sin series registradas" />;

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Tonelaje por sesión (kg)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <CartesianGrid {...GRAD} />
          <XAxis dataKey="date" {...AXIS} />
          <YAxis {...AXIS} width={40} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="tonnage" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BodyweightChart({
  logs,
}: {
  logs: { loggedAt: string; weightKg: number }[];
}) {
  const data = logs.map((l) => ({
    date: new Date(l.loggedAt).toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
    }),
    kg: l.weightKg,
  }));
  if (data.length === 0) return <EmptyChart label="Sin registros de peso" />;
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Evolución de peso corporal
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid {...GRAD} />
          <XAxis dataKey="date" {...AXIS} />
          <YAxis {...AXIS} width={32} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/60">
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}