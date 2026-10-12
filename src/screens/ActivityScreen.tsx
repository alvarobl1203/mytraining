import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Moon,
  Dumbbell,
  Trash2,
  ChevronRight as ChevronRightIcon,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRestDays } from '../hooks/useRestDays';
import { useExercises } from '../hooks/useExercises';
import { WorkoutDetailSheet } from '../components/WorkoutDetailSheet';
import { localIsoDate, todayLocalIso } from '../lib/date';
import type { Workout, WorkoutSet } from '../types';

type Props = { userId: string };

interface SessionBrief {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  sets: number;
  tonnage: number;
  minutes: number;
  routineName: string | null;
}

export function ActivityScreen({ userId }: Props) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [sessions, setSessions] = useState<SessionBrief[]>([]);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [scheduledRestDays, setScheduledRestDays] = useState<Set<string>>(
    new Set()
  );
  const [detailWorkout, setDetailWorkout] = useState<Workout | null>(null);
  const [detailSets, setDetailSets] = useState<WorkoutSet[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const { exercises } = useExercises();

  // ✅ Memoizado: se recrea solo cuando cambia monthOffset, no en cada render
  const monthAnchor = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthLabel = useMemo(
    () =>
      monthAnchor.toLocaleDateString('es', {
        month: 'long',
        year: 'numeric',
      }),
    [monthAnchor]
  );

  const { restDays, toggle: toggleRest } = useRestDays(userId, monthAnchor);

  // Cargar sesiones (una sola vez)
  useEffect(() => {
    (async () => {
      const { data: ws } = await supabase
        .from('workouts')
        .select('id, started_at, finished_at, routines(name)')
        .eq('user_id', userId)
        .not('finished_at', 'is', null);

      const ids = (ws ?? []).map(
        (w: Record<string, unknown>) => w.id as string
      );
      const { data: sets } = ids.length
        ? await supabase.from('workout_sets').select('*').in('workout_id', ids)
        : { data: [] as unknown[] };

      const briefs: SessionBrief[] = (ws ?? []).map(
        (w: Record<string, unknown>) => {
          const mine = (sets ?? []).filter(
            (s: Record<string, unknown>) =>
              s.workout_id === w.id && s.completed === true
          );
          const tonnage = mine.reduce(
            (a: number, s: Record<string, unknown>) => {
              const weight = Number(s.weight_kg ?? 0);
              const reps = Number(s.reps ?? 0);
              return a + weight * reps;
            },
            0
          );
          const routineRel = w.routines as { name?: string } | null;
          const minutes = w.finished_at
            ? Math.round(
                (new Date(w.finished_at as string).getTime() -
                  new Date(w.started_at as string).getTime()) /
                  60000
              )
            : 0;
          return {
            id: w.id as string,
            startedAt: w.started_at as string,
            finishedAt: (w.finished_at as string | null) ?? null,
            sets: mine.length,
            tonnage: Math.round(tonnage),
            minutes,
            routineName: routineRel?.name ?? null,
          };
        }
      );
      setSessions(briefs);
    })();
  }, [userId]);

  // Cargar descansos programados (del plan)
  useEffect(() => {
    (async () => {
      const first = new Date(
        monthAnchor.getFullYear(),
        monthAnchor.getMonth(),
        1
      );
      const last = new Date(
        monthAnchor.getFullYear(),
        monthAnchor.getMonth() + 1,
        0
      );
      const { data } = await supabase
        .from('routines')
        .select('day_of_week, is_rest')
        .eq('user_id', userId)
        .eq('is_rest', true);

      const set = new Set<string>();
      (data ?? []).forEach((r: Record<string, unknown>) => {
        const dow = r.day_of_week as number | null;
        if (dow === null) return;
        const cursor = new Date(first);
        while (cursor <= last) {
          const idx = (cursor.getDay() + 6) % 7;
          if (idx === dow) set.add(localIsoDate(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
      });
      setScheduledRestDays(set);
    })();
  }, [userId, monthAnchor]);

  const daysGrid = useMemo(() => {
    const firstWeekday = (monthAnchor.getDay() + 6) % 7;
    const daysInMonth = new Date(
      monthAnchor.getFullYear(),
      monthAnchor.getMonth() + 1,
      0
    ).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [monthAnchor]);

  const byDay = useMemo(() => {
    const map = new Map<string, SessionBrief[]>();
    sessions.forEach((s) => {
      const key = localIsoDate(new Date(s.startedAt));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    });
    return map;
  }, [sessions]);

  const manualRestSet = useMemo(
    () => new Set(restDays.map((r) => r.day)),
    [restDays]
  );

  const weeklyTonnage = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return sessions
      .filter((s) => new Date(s.startedAt).getTime() >= weekAgo)
      .reduce((a, s) => a + s.tonnage, 0);
  }, [sessions]);

  const weeklyMinutes = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    return sessions
      .filter((s) => new Date(s.startedAt).getTime() >= weekAgo)
      .reduce((a, s) => a + s.minutes, 0);
  }, [sessions]);

  const todayIso = todayLocalIso();

  async function toggleRestDay(iso: string) {
    await toggleRest(iso);
  }

  async function deleteWorkout(id: string) {
    if (
      !confirm(
        '¿Eliminar este entrenamiento? Se borrarán todas las series registradas. Esta acción no se puede deshacer.'
      )
    )
      return;
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      alert('No se pudo eliminar el entrenamiento.');
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (detailWorkout?.id === id) {
      setDetailWorkout(null);
      setDetailSets([]);
    }
  }

  async function openWorkoutDetail(sessionId: string) {
    setDetailLoading(true);
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const { data: rawSets, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', sessionId);

      if (error) throw error;

      const parsed: WorkoutSet[] = (rawSets ?? []).map(
        (r: Record<string, unknown>) => ({
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
            r.estimated_1rm !== null && r.estimated_1rm !== undefined
              ? Number(r.estimated_1rm)
              : null,
          isPr: Boolean(r.is_pr),
          completed: Boolean(r.completed),
        })
      );

      const detail: Workout = {
        id: session.id,
        userId,
        routineId: null,
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        notes: session.routineName,
      };

      setDetailSets(parsed);
      setDetailWorkout(detail);
    } catch (e) {
      console.error(e);
      alert('No se pudo cargar el detalle del entrenamiento.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-extrabold tracking-tight">Actividad</h1>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sesiones" value={sessions.length} />
        <Stat label="Min/sem" value={weeklyMinutes} />
        <Stat label="kg/sem" value={weeklyTonnage} />
      </div>

      {/* Calendario */}
      <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ChevronLeft size={14} />
          </button>
          <p className="text-sm font-semibold capitalize">{monthLabel}</p>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {daysGrid.map((d, i) => {
            if (d === null) return <span key={i} />;
            const cellDate = new Date(
              monthAnchor.getFullYear(),
              monthAnchor.getMonth(),
              d
            );
            const iso = localIsoDate(cellDate);
            const count = byDay.get(iso)?.length ?? 0;
            const isToday = iso === todayIso;
            const isManualRest = manualRestSet.has(iso);
            const isScheduledRest = scheduledRestDays.has(iso);
            const isRest = isManualRest || isScheduledRest;

            let cls = 'text-zinc-500 hover:bg-zinc-800/40';
            if (count > 0) {
              cls = 'bg-grad-brand font-semibold text-white shadow-glow-blue';
            } else if (isManualRest) {
              cls = 'border border-zinc-600 bg-zinc-800/60 text-zinc-300';
            } else if (isScheduledRest) {
              cls = 'border border-dashed border-zinc-700 text-zinc-400';
            }
            if (isToday && count === 0) {
              cls += ' ring-1 ring-cyan-400/60';
            }

            return (
              <button
                key={i}
                onClick={() => setOpenDay(iso)}
                className={`relative flex h-9 items-center justify-center rounded-lg text-xs transition-all duration-150 ${cls}`}
              >
                {d}
                {count > 1 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-950 px-1 text-[9px] font-bold text-cyan-400">
                    {count}
                  </span>
                )}
                {isRest && count === 0 && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-zinc-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-zinc-500">
          <LegendDot className="bg-grad-brand" label="Entreno" />
          <LegendDot
            className="border border-zinc-600 bg-zinc-800/60"
            label="Descanso marcado"
          />
          <LegendDot
            className="border border-dashed border-zinc-700"
            label="Descanso del plan"
          />
        </div>
      </div>

      {/* Historial */}
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Historial reciente
        </h3>
        <div className="space-y-2">
          {sessions
            .slice()
            .reverse()
            .slice(0, 10)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => void openWorkoutDetail(s.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800/50 bg-grad-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {s.routineName ?? 'Entrenamiento'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {s.sets} series · {s.minutes} min · {s.tonnage} kg
                  </p>
                </div>
                <p className="shrink-0 text-[11px] text-zinc-500">
                  {new Date(s.startedAt).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </p>
                <ChevronRightIcon
                  size={14}
                  className="shrink-0 text-zinc-600"
                />
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteWorkout(s.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      void deleteWorkout(s.id);
                    }
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Eliminar entrenamiento"
                >
                  <Trash2 size={13} />
                </span>
              </button>
            ))}
          {sessions.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              Aún no hay sesiones registradas.
            </p>
          )}
        </div>
      </section>

      {/* Drawer de día */}
      {openDay && (
        <DayDrawer
          iso={openDay}
          sessions={byDay.get(openDay) ?? []}
          isManualRest={manualRestSet.has(openDay)}
          isScheduledRest={scheduledRestDays.has(openDay)}
          onToggleRest={() => toggleRestDay(openDay)}
          onOpenWorkout={(id) => {
            setOpenDay(null);
            void openWorkoutDetail(id);
          }}
          onDeleteWorkout={deleteWorkout}
          onClose={() => setOpenDay(null)}
        />
      )}

      {/* Detail sheet */}
      {detailWorkout && !detailLoading && (
        <WorkoutDetailSheet
          workout={detailWorkout}
          sets={detailSets}
          exercises={exercises}
          onClose={() => {
            setDetailWorkout(null);
            setDetailSets([]);
          }}
        />
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Loader2 className="animate-spin text-cyan-400" size={28} />
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// DayDrawer
// ===========================================================================
function DayDrawer({
  iso,
  sessions,
  isManualRest,
  isScheduledRest,
  onToggleRest,
  onOpenWorkout,
  onDeleteWorkout,
  onClose,
}: {
  iso: string;
  sessions: SessionBrief[];
  isManualRest: boolean;
  isScheduledRest: boolean;
  onToggleRest: () => void | Promise<void>;
  onOpenWorkout: (id: string) => void;
  onDeleteWorkout: (id: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    try {
      await onToggleRest();
    } catch (e) {
      console.error('[DayDrawer] toggle rest failed:', e);
      alert('No se pudo actualizar el descanso. Revisa tu conexión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[75vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold capitalize">
            {new Date(iso).toLocaleDateString('es', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {sessions.length > 0 ? (
          <div className="mb-4 space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-zinc-800/70 bg-grad-card shadow-card"
              >
                <button
                  onClick={() => onOpenWorkout(s.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Dumbbell size={14} className="shrink-0 text-cyan-400" />
                      <p className="truncate text-sm font-semibold">
                        {s.routineName ?? 'Entrenamiento'}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {s.sets} series · {s.minutes} min · {s.tonnage} kg
                    </p>
                  </div>
                  <ChevronRightIcon
                    size={14}
                    className="mt-1 shrink-0 text-zinc-600"
                  />
                </button>
                <div className="flex items-center justify-end gap-1 border-t border-zinc-800/60 px-2 py-1">
                  <button
                    onClick={async () => {
                      setDeletingId(s.id);
                      try {
                        await onDeleteWorkout(s.id);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === s.id}
                    className="flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={11} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-center text-sm text-zinc-500">
            Sin entrenamiento registrado.
          </p>
        )}

        <button
          onClick={handleToggle}
          disabled={busy || (isScheduledRest && !isManualRest)}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
            isManualRest
              ? 'border-zinc-700 bg-zinc-800/60 text-zinc-200'
              : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
          }`}
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Moon size={14} />
          )}
          {busy
            ? 'Guardando…'
            : isManualRest
              ? 'Quitar marca de descanso'
              : isScheduledRest
                ? 'Día de descanso (desde plan)'
                : 'Marcar como día de descanso'}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// Sub-componentes
// ===========================================================================
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-3 text-center shadow-card">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}