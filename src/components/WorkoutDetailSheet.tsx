import { useMemo, useState } from 'react';
import { X, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import type { Workout, WorkoutSet, Exercise } from '../types';

export function WorkoutDetailSheet({
  workout,
  sets,
  exercises,
  onClose,
}: {
  workout: Workout;
  sets: WorkoutSet[];
  exercises: Exercise[];
  onClose: () => void;
}) {
  const exMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    exercises.forEach((e) => m.set(e.id, e));
    return m;
  }, [exercises]);

  const rowsByExercise = useMemo(() => {
    const m = new Map<string, WorkoutSet[]>();
    sets.forEach((s) => {
      const arr = m.get(s.exerciseId) ?? [];
      arr.push(s);
      m.set(s.exerciseId, arr);
    });
    // Ordenar cada grupo por número de serie
    m.forEach((arr) => arr.sort((a, b) => a.setNumber - b.setNumber));
    return m;
  }, [sets]);

  const [openExercises, setOpenExercises] = useState<Set<string>>(
    new Set(rowsByExercise.keys())
  );

  const totalVolume = sets.reduce(
    (a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0),
    0
  );
  const totalReps = sets.reduce((a, s) => a + (s.reps ?? 0), 0);
  const totalCardioMin = sets.reduce(
    (a, s) => a + (s.cardioSeconds ?? 0) / 60,
    0
  );
  const prCount = sets.filter((s) => s.isPr).length;
  const durationMin = workout.finishedAt
    ? Math.round(
        (new Date(workout.finishedAt).getTime() -
          new Date(workout.startedAt).getTime()) /
          60000
      )
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-zinc-500">
              {new Date(workout.finishedAt ?? workout.startedAt).toLocaleDateString(
                'es-ES',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}
            </p>
            <h2 className="mt-0.5 text-base font-bold">
              {workout.notes ?? 'Entrenamiento'}
            </h2>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {/* Resumen */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <Stat label="Volumen" value={`${Math.round(totalVolume)} kg`} />
          <Stat label="Series" value={sets.length} />
          <Stat label="Reps" value={totalReps} />
          <Stat label="Duración" value={`${durationMin} min`} />
        </div>

        {/* Bloque cardio */}
        {totalCardioMin > 0 && (
          <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-cyan-300">
              Cardio total
            </p>
            <p className="text-sm font-semibold text-zinc-100">
              {totalCardioMin.toFixed(1)} min
            </p>
          </div>
        )}

        {/* Bloque PRs */}
        {prCount > 0 && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              <p className="text-[11px] uppercase tracking-wide text-amber-300">
                {prCount} {prCount === 1 ? 'PR' : 'PRs'} conseguidos
              </p>
            </div>
          </div>
        )}

        {/* Ejercicios */}
        <div className="space-y-3">
          {Array.from(rowsByExercise.entries()).map(([exId, exSets]) => {
            const ex = exMap.get(exId);
            if (!ex) return null;
            const isOpen = openExercises.has(exId);
            const volume = exSets.reduce(
              (a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0),
              0
            );
            const maxWeight = exSets.reduce(
              (a, s) => Math.max(a, s.weightKg ?? 0),
              0
            );
            const hasCardio = exSets.some((s) => s.cardioSeconds !== null);

            return (
              <div
                key={exId}
                className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/60"
              >
                <button
                  onClick={() => {
                    const next = new Set(openExercises);
                    if (isOpen) next.delete(exId);
                    else next.add(exId);
                    setOpenExercises(next);
                  }}
                  className="flex w-full items-center justify-between gap-2 p-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {ex.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {exSets.length} series ·{' '}
                      {hasCardio
                        ? `${(exSets.reduce((a, s) => a + (s.cardioSeconds ?? 0), 0) / 60).toFixed(1)} min`
                        : `${Math.round(volume)} kg movidos · máx ${maxWeight} kg`}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={14} className="shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronDown size={14} className="shrink-0 text-zinc-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-zinc-800/60">
                    <table className="w-full text-[11px]">
                      <thead className="bg-zinc-950/60 text-zinc-500">
                        <tr>
                          <th className="px-2 py-1.5 text-left">#</th>
                          <th className="px-2 py-1.5 text-right">Peso</th>
                          <th className="px-2 py-1.5 text-right">Reps</th>
                          <th className="px-2 py-1.5 text-right">RIR</th>
                          <th className="px-2 py-1.5 text-right">1RM</th>
                          <th className="px-2 py-1.5 text-center">Téc</th>
                          <th className="px-2 py-1.5 text-center">PR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exSets.map((s) => (
                          <tr
                            key={s.id}
                            className="border-t border-zinc-800/40"
                          >
                            <td className="px-2 py-1.5 text-zinc-500">
                              {s.setNumber}
                            </td>
                            <td className="px-2 py-1.5 text-right text-zinc-200">
                              {s.weightKg !== null ? `${s.weightKg} kg` : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right text-zinc-200">
                              {s.reps ?? '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right text-zinc-400">
                              {s.rir ?? '—'}
                            </td>
                            <td className="px-2 py-1.5 text-right text-cyan-300 tabular-nums">
                              {s.estimated1Rm !== null
                                ? s.estimated1Rm.toFixed(1)
                                : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-center text-[10px] text-zinc-500">
                              {s.technique !== 'Normal' ? s.technique : '—'}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              {s.isPr ? (
                                <Trophy
                                  size={11}
                                  className="inline text-amber-400"
                                />
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {exSets.some((s) => s.notes) && (
                      <div className="border-t border-zinc-800/40 p-2.5">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
                          Notas
                        </p>
                        <ul className="space-y-0.5">
                          {exSets
                            .filter((s) => s.notes)
                            .map((s) => (
                              <li
                                key={s.id}
                                className="text-[11px] text-zinc-400"
                              >
                                <span className="text-zinc-500">
                                  #{s.setNumber}:
                                </span>{' '}
                                {s.notes}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-2 text-center">
      <p className="truncate text-sm font-bold tabular-nums text-zinc-100">
        {value}
      </p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}