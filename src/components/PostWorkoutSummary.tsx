import { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Clock,
  Layers,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLatestBodyweight } from '../hooks/useLatestBodyweight';
import type { Exercise, WorkoutSet } from '../types';

interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  isBodyweight: boolean;
  sets: WorkoutSet[];
  totalVolume: number;
  maxExtra: number;
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

interface WorkoutInfo {
  startedAt: string;
  finishedAt: string | null;
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
  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /** Peso corporal efectivo. NUNCA se expone en la UI. */
  const bodyweightKg = useLatestBodyweight(userId);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: cur } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workoutId);

      setSets(
        (cur ?? []).map((r: Record<string, unknown>) => ({
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

      const { data: w } = await supabase
        .from('workouts')
        .select('started_at, finished_at')
        .eq('id', workoutId)
        .maybeSingle();
      if (w) {
        setWorkout({
          startedAt: w.started_at as string,
          finishedAt: (w.finished_at as string | null) ?? null,
        });
      }

      const { data: prevWorkouts } = await supabase
        .from('workouts')
        .select('id')
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
            cardioKcal:
              r.cardio_kcal !== null ? Number(r.cardio_kcal) : null,
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

  const durationMin = useMemo(() => {
    if (!workout?.finishedAt) return 0;
    const ms =
      new Date(workout.finishedAt).getTime() -
      new Date(workout.startedAt).getTime();
    return Math.max(0, Math.round(ms / 60000));
  }, [workout]);

  const summaryByExercise = useMemo<ExerciseSummary[]>(() => {
    const exMap = new Map(exercises.map((e) => [e.id, e]));
    const byEx = new Map<string, WorkoutSet[]>();
    sets.forEach((s) => {
      const arr = byEx.get(s.exerciseId) ?? [];
      arr.push(s);
      byEx.set(s.exerciseId, arr);
    });

    return Array.from(byEx.entries())
      .map(([exId, exSets]) => {
        const exercise = exMap.get(exId);
        const isBodyweight = exercise?.equipment === 'Peso Corporal';

        const totalVolume = exSets.reduce((a, s) => {
          const reps = s.reps ?? 0;
          const extra = s.weightKg ?? 0;
          if (isBodyweight && bodyweightKg) {
            return a + (bodyweightKg + extra) * reps;
          }
          return a + extra * reps;
        }, 0);

        const maxExtra = exSets.reduce(
          (a, s) => Math.max(a, s.weightKg ?? 0),
          0
        );
        const best1Rm = exSets.reduce(
          (a, s) => Math.max(a, s.estimated1Rm ?? 0),
          0
        );
        const totalReps = exSets.reduce((a, s) => a + (s.reps ?? 0), 0);
        const prCount = exSets.filter((s) => s.isPr).length;

        return {
          exerciseId: exId,
          exerciseName: exercise?.name ?? '—',
          isBodyweight,
          sets: exSets,
          totalVolume,
          maxExtra,
          best1Rm,
          totalReps,
          prCount,
        };
      })
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [sets, exercises, bodyweightKg]);

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
          prevMaxWeight > 0 ? cur.maxExtra - prevMaxWeight : 0,
        prevBest1Rm,
        delta1Rm: prevBest1Rm > 0 ? cur.best1Rm - prevBest1Rm : 0,
      });
    });
    return m;
  }, [summaryByExercise, prevSets]);

  const totalVolume = summaryByExercise.reduce(
    (a, e) => a + e.totalVolume,
    0
  );
  const totalReps = sets.reduce((a, s) => a + (s.reps ?? 0), 0);
  const prCount = sets.filter((s) => s.isPr).length;
  const hasBodyweightExercises = summaryByExercise.some(
    (e) => e.isBodyweight
  );

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

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Kpi
            label="Duración"
            value={durationMin > 0 ? String(durationMin) : '—'}
            unit={durationMin > 0 ? 'min' : undefined}
            icon={<Clock size={12} className="text-cyan-400" />}
          />
          <Kpi
            label="Volumen"
            value={`${Math.round(totalVolume).toLocaleString('es-ES')}`}
            unit="kg"
            icon={<TrendingUp size={12} className="text-blue-400" />}
          />
          <Kpi
            label="Series"
            value={sets.length.toString()}
            icon={<Layers size={12} className="text-zinc-400" />}
          />
          <Kpi
            label="PRs"
            value={prCount.toString()}
            icon={<Trophy size={12} className="text-amber-400" />}
          />
        </div>

        <p className="mb-4 text-center text-[11px] text-zinc-500">
          {totalReps} repeticiones totales
        </p>

        {prCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
            <Trophy size={16} className="shrink-0 text-amber-400" />
            <p className="text-sm font-semibold text-amber-200">
              {prCount}{' '}
              {prCount === 1 ? 'récord personal' : 'récords personales'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {summaryByExercise.map((ex) => {
            const cmp = comparisonByExercise.get(ex.exerciseId);

            return (
              <div
                key={ex.exerciseId}
                className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {ex.exerciseName}
                    </p>
                    {ex.isBodyweight && (
                      <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-cyan-300">
                        Peso corporal
                      </span>
                    )}
                  </div>
                  {ex.prCount > 0 && (
                    <Trophy
                      size={12}
                      className="shrink-0 text-amber-400"
                    />
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
                    label={ex.isBodyweight ? 'Lastre máx' : 'Peso máx'}
                    value={
                      ex.isBodyweight
                        ? ex.maxExtra > 0
                          ? `+${ex.maxExtra} kg`
                          : 'Sin lastre'
                        : ex.maxExtra > 0
                          ? `${ex.maxExtra} kg`
                          : '—'
                    }
                    delta={cmp?.deltaMaxWeight}
                    unit="kg"
                  />
                  <MetricRow
                    label="1RM est."
                    value={
                      ex.best1Rm > 0
                        ? `${ex.best1Rm.toFixed(1)} kg`
                        : '—'
                    }
                    delta={cmp?.delta1Rm}
                    unit="kg"
                  />
                </div>

                {/* Detalle por serie — SOLO peso corporal, sin exponer el bodyweight */}
                {ex.isBodyweight && ex.sets.length > 0 && (
                  <div className="mt-2 space-y-0.5 border-t border-zinc-800/60 pt-2">
                    {[...ex.sets]
                      .sort((a, b) => a.setNumber - b.setNumber)
                      .map((s) => {
                        const extra = s.weightKg ?? 0;
                        const reps = s.reps ?? 0;
                        const label =
                          extra > 0
                            ? `Peso corporal + ${extra} kg · ${reps} reps`
                            : `Peso corporal · ${reps} reps`;
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-[10px] text-zinc-500"
                          >
                            <span>#{s.setNumber}</span>
                            <span className="tabular-nums">{label}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasBodyweightExercises && (
          <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-500">
            {bodyweightKg != null
              ? 'El volumen de peso corporal se calcula internamente con tu peso registrado.'
              : 'Registra tu peso en Perfil para calcular el volumen de peso corporal.'}
          </p>
        )}

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
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3 text-center">
      <div className="mb-1 flex items-center justify-center gap-1">
        {icon}
        <p className="text-[9px] uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      </div>
      <p className="text-lg font-extrabold tabular-nums text-zinc-100">
        {value}
        {unit && (
          <span className="ml-0.5 text-xs font-medium text-zinc-500">
            {unit}
          </span>
        )}
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
  const Icon = !delta ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const color = !delta
    ? 'text-zinc-500'
    : delta > 0
      ? 'text-emerald-400'
      : 'text-red-400';

  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
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