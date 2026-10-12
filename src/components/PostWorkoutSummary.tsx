import { useEffect, useMemo, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Exercise, WorkoutSet } from '../types';

interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  totalVolume: number;
  maxWeight: number;
  best1Rm: number;
  totalReps: number;
  prCount: number;
}

interface Comparison {
  prevVolume: number;
  deltaVolume: number;
  prevMaxWeight: number;
  deltaMaxWeight: number;
  prevBest1Rm: number;
  delta1Rm: number;
}

export function PostWorkoutSummary({
  workoutId,
  userId,
  routineName,
  exercises,
  onClose,
}: {
  workoutId: string;
  userId: string;
  routineName: string;
  exercises: Exercise[];
  onClose: () => void;
}) {
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [prevSets, setPrevSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: cur } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workoutId);

      const parsed: WorkoutSet[] = (cur ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        workoutId: r.workout_id as string,
        exerciseId: r.exercise_id as string,
        setNumber: r.set_number as number,
        weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
        reps: r.reps !== null ? Number(r.reps) : null,
        rir: r.rir !== null ? Number(r.rir) : null,
        technique: (r.technique as WorkoutSet['technique']) ?? 'Normal',
        cardioSeconds: r.cardio_seconds !== null ? Number(r.cardio_seconds) : null,
        cardioKm: r.cardio_km !== null ? Number(r.cardio_km) : null,
        cardioKcal: r.cardio_kcal !== null ? Number(r.cardio_kcal) : null,
        notes: (r.notes as string | null) ?? null,
        estimated1Rm: r.estimated_1rm !== null ? Number(r.estimated_1rm) : null,
        isPr: Boolean(r.is_pr),
        completed: Boolean(r.completed),
      }));
      setSets(parsed);

      // Traer el workout previo del mismo usuario (excluyendo el actual)
      const { data: prevWorkouts } = await supabase
        .from('workouts')
        .select('id, finished_at')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .neq('id', workoutId)
        .order('finished_at', { ascending: false })
        .limit(1);

      const prevId = prevWorkouts?.[0]?.id;
      if (prevId) {
        const { data: prev } = await supabase
          .from('workout_sets')
          .select('*')
          .eq('workout_id', prevId);
        setPrevSets(
          (prev ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            workoutId: r.workout_id as string,
            exerciseId: r.exercise_id as string,
            setNumber: r.set_number as number,
            weightKg: r.weight_kg !== null ? Number(r.weight_kg) : null,
            reps: r.reps !== null ? Number(r.reps) : null,
            rir: r.rir !== null ? Number(r.rir) : null,
            technique: (r.technique as WorkoutSet['technique']) ?? 'Normal',
            cardioSeconds:
              r.cardio_seconds !== null ? Number(r.cardio_seconds) : null,
            cardioKm: r.cardio_km !== null ? Number(r.cardio_km) : null,
            cardioKcal: r.cardio_kcal !== null ? Number(r.cardio_kcal) : null,
            notes: (r.notes as string | null) ?? null,
            estimated1Rm:
              r.estimated_1rm !== null ? Number(r.estimated_1rm) : null,
            isPr: Boolean(r.is_pr),
            completed: Boolean(r.completed),
          }))
        );
      }
      setLoading(false);
    })();
  }, [workoutId, userId]);

  const summaryByExercise = useMemo<ExerciseSummary[]>(() => {
    const exMap = new Map(exercises.map((e) => [e.id, e]));
    const byEx = new Map<string, WorkoutSet[]>();
    sets.forEach((s) => {
      const arr = byEx.get(s.exerciseId) ?? [];
      arr.push(s);
      byEx.set(s.exerciseId, arr);
    });

    return Array.from(byEx.entries())
      .map(([exId, exSets]) => ({
        exerciseId: exId,
        exerciseName: exMap.get(exId)?.name ?? '—',
        sets: exSets,
        totalVolume: exSets.reduce(
          (a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0),
          0
        ),
        maxWeight: exSets.reduce(
          (a, s) => Math.max(a, s.weightKg ?? 0),
          0
        ),
        best1Rm: exSets.reduce(
          (a, s) => Math.max(a, s.estimated1Rm ?? 0),
          0
        ),
        totalReps: exSets.reduce((a, s) => a + (s.reps ?? 0), 0),
        prCount: exSets.filter((s) => s.isPr).length,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [sets, exercises]);

  const comparisonByExercise = useMemo(() => {
    const m = new Map<string, Comparison>();
    const prevByEx = new Map<string, WorkoutSet[]>();
    prevSets.forEach((s) => {
      const arr = prevByEx.get(s.exerciseId) ?? [];
      arr.push(s);
      prevByEx.set(s.exerciseId, arr);
    });

    summaryByExercise.forEach((cur) => {
      const prev = prevByEx.get(cur.exerciseId) ?? [];
      const prevVolume = prev.reduce(
        (a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0),
        0
      );
      const prevMaxWeight = prev.reduce(
        (a, s) => Math.max(a, s.weightKg ?? 0),
        0
      );
      const prevBest1Rm = prev.reduce(
        (a, s) => Math.max(a, s.estimated1Rm ?? 0),
        0
      );
      m.set(cur.exerciseId, {
        prevVolume,
        deltaVolume: prevVolume > 0 ? cur.totalVolume - prevVolume : 0,
        prevMaxWeight,
        deltaMaxWeight:
          prevMaxWeight > 0 ? cur.maxWeight - prevMaxWeight : 0,
        prevBest1Rm,
        delta1Rm: prevBest1Rm > 0 ? cur.best1Rm - prevBest1Rm : 0,
      });
    });
    return m;
  }, [summaryByExercise, prevSets]);

  const totalVolume = sets.reduce(
    (a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0),
    0
  );
  const totalReps = sets.reduce((a, s) => a + (s.reps ?? 0), 0);
  const prCount = sets.filter((s) => s.isPr).length;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
        <p className="text-sm text-zinc-400">Calculando resumen…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-cyan-400">
              Entrenamiento completado
            </p>
            <h2 className="mt-0.5 text-lg font-bold">{routineName}</h2>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <Kpi
            label="Volumen"
            value={`${Math.round(totalVolume)}`}
            unit="kg"
          />
          <Kpi label="Series" value={sets.length.toString()} />
          <Kpi label="Reps" value={totalReps.toString()} />
        </div>

        {prCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
            <Trophy size={16} className="shrink-0 text-amber-400" />
            <p className="text-sm font-semibold text-amber-200">
              {prCount} {prCount === 1 ? 'récord personal' : 'récords personales'}
            </p>
          </div>
        )}

        {/* Desglose por ejercicio */}
        <div className="space-y-2">
          {summaryByExercise.map((ex) => {
            const cmp = comparisonByExercise.get(ex.exerciseId);
            return (
              <div
                key={ex.exerciseId}
                className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {ex.exerciseName}
                  </p>
                  {ex.prCount > 0 && (
                    <Trophy size={12} className="shrink-0 text-amber-400" />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <MetricRow
                    label="Volumen"
                    value={`${Math.round(ex.totalVolume)} kg`}
                    delta={cmp?.deltaVolume}
                    unit="kg"
                  />
                  <MetricRow
                    label="Peso máx"
                    value={`${ex.maxWeight} kg`}
                    delta={cmp?.deltaMaxWeight}
                    unit="kg"
                  />
                  <MetricRow
                    label="1RM est."
                    value={`${ex.best1Rm.toFixed(1)} kg`}
                    delta={cmp?.delta1Rm}
                    unit="kg"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-grad-brand py-3 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.98]"
        >
          Cerrar resumen
        </button>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3 text-center">
      <p className="text-xl font-extrabold tabular-nums text-zinc-100">
        {value}
        {unit && (
          <span className="ml-0.5 text-xs font-medium text-zinc-500">
            {unit}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  delta,
  unit,
}: {
  label: string;
  value: string;
  delta?: number;
  unit: string;
}) {
  const Icon = !delta
    ? Minus
    : delta > 0
      ? TrendingUp
      : TrendingDown;
  const color = !delta
    ? 'text-zinc-500'
    : delta > 0
      ? 'text-emerald-400'
      : 'text-red-400';

  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-zinc-200">{value}</p>
      {delta !== undefined && delta !== 0 && (
        <p className={`mt-0.5 flex items-center gap-0.5 text-[10px] ${color}`}>
          <Icon size={10} />
          {delta > 0 ? '+' : ''}
          {delta.toFixed(0)} {unit}
        </p>
      )}
    </div>
  );
}