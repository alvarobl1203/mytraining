import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  Check,
  Trash2,
  AlertTriangle,
  Type,
  Copy,
  MessageSquare,
  Trophy,
  Maximize,
  Ban,
  CloudOff,
  Loader2,
} from 'lucide-react';
import { useWorkouts } from '../hooks/useWorkouts';
import { useRoutines } from '../hooks/useRoutines';
import { useExercises } from '../hooks/useExercises';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { CatalogScreen } from './CatalogScreen';
import { RestTimer } from '../components/RestTimer';
import { MuscleBadges } from '../components/MuscleBadges';
import { PostWorkoutSummary } from '../components/PostWorkoutSummary';
import { ImmersiveWorkoutScreen } from './ImmersiveWorkoutScreen';
import { CardioProtocolPanel } from '../components/CardioProtocolPanel';
import { TargetSetsModal } from '../components/TargetSetsModal';
import { estimateOneRm } from '../lib/calculations';
import { supabase } from '../lib/supabase';
import { CARDIO_PROTOCOLS } from '../lib/cardioTechniques';
import {
  getTechniquesForExercise,
  getTechniquesToAvoid,
  TECHNIQUE_BY_ID,
} from '../lib/techniques';
import type { Exercise, Technique } from '../types';

type Props = {
  userId: string;
  routineId: string | null;
  onClose: () => void;
};

const DEFAULT_TARGET_SETS = 3;

export function LiveWorkoutScreen({ userId, routineId, onClose }: Props) {
  const {
    activeWorkout,
    sets,
    startWorkout,
    logSet,
    removeSet,
    finishWorkout,
    cancelWorkout,
    pendingSyncCount,
  } = useWorkouts(userId);
  const { routines } = useRoutines(userId);
  const { exercises } = useExercises();
  const { preferences } = useUserPreferences(userId);

  const [started, setStarted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [gymMode, setGymMode] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [current, setCurrent] = useState<{
    exercise: Exercise;
    setNumber: number;
  } | null>(null);
  const [historicalBests, setHistoricalBests] = useState<Map<string, number>>(
    new Map()
  );
  const [showSummary, setShowSummary] = useState<string | null>(null);

  // Ejercicios añadidos en caliente (van al final)
  const [addedExerciseIds, setAddedExerciseIds] = useState<string[]>([]);
  // Targets personalizados del usuario (sobrescriben rutina/default)
  const [customTargets, setCustomTargets] = useState<Record<string, number>>({});
  // Ejercicio pendiente de configurar series (modal TargetSetsModal)
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null);
  // Flag: venimos del inmersivo a añadir un ejercicio
  const [returnToImmersive, setReturnToImmersive] = useState(false);
  // Ejercicio al que saltar al reabrir el inmersivo
  const [newExerciseId, setNewExerciseId] = useState<string | null>(null);

  const routine = useMemo(
    () => routines.find((r) => r.id === routineId) ?? null,
    [routines, routineId]
  );

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: ws } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .not('finished_at', 'is', null);

      const ids = (ws ?? []).map((w: { id: string }) => w.id);
      if (ids.length === 0) return;

      const { data: rows } = await supabase
        .from('workout_sets')
        .select('exercise_id, weight_kg, reps, rir')
        .in('workout_id', ids)
        .eq('completed', true);

      const bests = new Map<string, number>();
      (rows ?? []).forEach((r: Record<string, unknown>) => {
        const w = Number(r.weight_kg ?? 0);
        const reps = Number(r.reps ?? 0);
        if (!w || !reps) return;
        const rm = estimateOneRm(w, reps, Number(r.rir ?? 0));
        const cur = bests.get(r.exercise_id as string) ?? 0;
        if (rm > cur) bests.set(r.exercise_id as string, rm);
      });
      setHistoricalBests(bests);
    })();
  }, [userId]);

  useEffect(() => {
    if (!started && !activeWorkout) {
      setStarted(true);
      void startWorkout(routineId);
    }
  }, [started, activeWorkout, routineId, startWorkout]);

  // ---------------------------------------------------------------------------
  // Ejercicios del entreno, en orden:
  //   1. Primero los de la rutina (orden original)
  //   2. Después los añadidos en caliente (orden de adición)
  //   3. Por último cualquier huérfano con series (fallback)
  // ---------------------------------------------------------------------------
  const workoutExercises = useMemo(() => {
    const ordered: Exercise[] = [];
    const seen = new Set<string>();
    const byId = new Map(exercises.map((e) => [e.id, e]));

    // 1. Rutina
    if (routine) {
      routine.exercises.forEach((re) => {
        if (seen.has(re.exerciseId)) return;
        const ex = byId.get(re.exerciseId);
        if (ex) {
          ordered.push(ex);
          seen.add(re.exerciseId);
        }
      });
    }

    // 2. Añadidos en caliente (van al final)
    addedExerciseIds.forEach((id) => {
      if (seen.has(id)) return;
      const ex = byId.get(id);
      if (ex) {
        ordered.push(ex);
        seen.add(id);
      }
    });

    // 3. Fallback
    sets.forEach((s) => {
      if (seen.has(s.exerciseId)) return;
      const ex = byId.get(s.exerciseId);
      if (ex) {
        ordered.push(ex);
        seen.add(s.exerciseId);
      }
    });

    return ordered;
  }, [sets, routine, exercises, addedExerciseIds]);

  // Mapa de targets: rutina (base) + custom (override)
  const targetSetsByExercise = useMemo(() => {
    const map = new Map<string, number>();
    if (routine) {
      routine.exercises.forEach((re) => {
        map.set(re.exerciseId, re.targetSets);
      });
    }
    Object.entries(customTargets).forEach(([id, n]) => map.set(id, n));
    return map;
  }, [routine, customTargets]);

  function updateTarget(exerciseId: string, n: number) {
    const safe = Math.max(1, Math.min(20, n));
    setCustomTargets((prev) => ({ ...prev, [exerciseId]: safe }));
  }

  // ---------------------------------------------------------------------------
  // Picker (catálogo)
  // ---------------------------------------------------------------------------
  if (pickerOpen) {
    return (
      <CatalogScreen
        userId={userId}
        onBack={() => {
          setPickerOpen(false);
          if (returnToImmersive) {
            setReturnToImmersive(false);
            setImmersive(true);
          }
        }}
        onPick={(ex) => {
          // NO abrimos SetLogger. Abrimos el modal de series objetivo.
          setPendingExercise(ex);
          setPickerOpen(false);
        }}
      />
    );
  }

// Mostrar la pantalla aunque activeWorkout sea null si estamos mostrando el
// resumen final (acabamos de terminar el entreno y PostWorkoutSummary debe
// renderizarse por encima de este bloque).
if (!activeWorkout && !showSummary) {
  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-sm text-zinc-500">Preparando entrenamiento…</p>
    </div>
  );
}

  const isCardio = (e: Exercise) => e.category === 'Cardio';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={async () => {
            await cancelWorkout();
            onClose();
          }}
          className="text-zinc-500"
        >
          <X size={18} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold">
          {routine?.name ?? 'Entrenamiento libre'}
        </p>
        <button
          onClick={() => setGymMode((v) => !v)}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            gymMode
              ? 'bg-cyan-500/15 text-cyan-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Modo gym: fuente grande"
        >
          <Type size={16} />
        </button>
        <button
          onClick={() => setImmersive(true)}
          disabled={workoutExercises.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:text-cyan-400 disabled:opacity-40"
          title="Modo inmersivo"
        >
          <Maximize size={16} />
        </button>
        <button
          onClick={async () => {
            if (!activeWorkout) return;
            const id = activeWorkout.id;
            await finishWorkout();
            setShowSummary(id);
          }}
          className="rounded-xl bg-grad-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-cta"
        >
          Finalizar
        </button>
      </div>

      {pendingSyncCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <CloudOff size={14} className="shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-amber-200">
            {pendingSyncCount}{' '}
            {pendingSyncCount === 1 ? 'serie pendiente' : 'series pendientes'}{' '}
            de sincronizar. Se subirán automáticamente al recuperar conexión.
          </p>
        </div>
      )}

      {workoutExercises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-10 text-center">
          <p className="text-sm text-zinc-500">
            Añade un ejercicio para empezar
          </p>
        </div>
      )}

      {workoutExercises.map((ex) => {
        const exSets = sets.filter((s) => s.exerciseId === ex.id);
        const lastSet = exSets[exSets.length - 1] ?? null;
        const target = targetSetsByExercise.get(ex.id) ?? DEFAULT_TARGET_SETS;

        return (
          <div
            key={ex.id}
            className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4"
          >
            <div className="mb-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className={`min-w-0 flex-1 truncate font-semibold ${
                    gymMode ? 'text-lg' : 'text-sm'
                  }`}
                >
                  {ex.name}
                </h3>
                <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[10px] tabular-nums text-zinc-400">
                  {exSets.length}/{target}
                </span>
              </div>
              <div className="mt-2">
                <MuscleBadges
                  primary={ex.primaryMuscle}
                  secondary={ex.secondaryMuscles}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              {exSets.map((s) => (
                <div
                  key={s.localId}
                  className={`flex items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-2.5 py-2 ${
                    gymMode ? 'text-base' : 'text-xs'
                  }`}
                >
                  <span className="w-6 text-zinc-500">#{s.setNumber}</span>

                  {isCardio(ex) ? (
                    <span
                      className={`flex-1 text-zinc-300 ${
                        gymMode ? 'font-bold' : ''
                      }`}
                    >
                      {s.cardioSeconds
                        ? `${Math.round(s.cardioSeconds / 60)} min`
                        : ''}
                      {s.cardioKm ? ` · ${s.cardioKm} km` : ''}
                      {s.cardioKcal ? ` · ${s.cardioKcal} kcal` : ''}
                    </span>
                  ) : (
                    <span
                      className={`flex-1 text-zinc-300 ${
                        gymMode ? 'font-bold' : ''
                      }`}
                    >
                      {s.weightKg} kg × {s.reps} · RIR {s.rir}
                      {s.technique !== 'Normal' && (
                        <span className="ml-1.5 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] text-blue-300">
                          {s.technique}
                        </span>
                      )}
                    </span>
                  )}

                  {s.syncStatus === 'pending' && (
                    <Loader2
                      size={12}
                      className="shrink-0 animate-spin text-zinc-600"
                      aria-label="Guardando"
                    />
                  )}
                  {s.syncStatus === 'queued' && (
                    <CloudOff
                      size={12}
                      className="shrink-0 text-amber-400"
                      aria-label="Pendiente de sincronizar"
                    />
                  )}

                  {s.notes && (
                    <MessageSquare
                      size={12}
                      className="shrink-0 text-cyan-400"
                    />
                  )}

                  <button
                    onClick={() => removeSet(s.localId)}
                    className="text-zinc-600 hover:text-red-400"
                    aria-label="Borrar serie"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() =>
                  setCurrent({ exercise: ex, setNumber: exSets.length + 1 })
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-blue-500 hover:text-blue-400"
              >
                <Plus size={12} /> Serie {exSets.length + 1}
              </button>
              {lastSet && (
                <button
                  onClick={() =>
                    setCurrent({
                      exercise: ex,
                      setNumber: exSets.length + 1,
                    })
                  }
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-400 transition-colors hover:border-blue-500/50 hover:text-blue-300"
                  title="Copiar última serie"
                >
                  <Copy size={12} /> =
                </button>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-sm text-zinc-400"
      >
        <Plus size={14} /> Añadir ejercicio
      </button>

      {current && (
        <SetLogger
          exercise={current.exercise}
          setNumber={current.setNumber}
          previousSet={
            sets
              .filter((s) => s.exerciseId === current.exercise.id)
              .slice(-1)[0] ?? null
          }
          previousBest1Rm={historicalBests.get(current.exercise.id) ?? 0}
          gymMode={gymMode}
          trainingMode={preferences.trainingMode}
          enabledTechniques={preferences.enabledTechniques}
          onClose={() => setCurrent(null)}
          onSaved={(payload, useTimer) => {
            logSet(payload);
            setCurrent(null);
            if (useTimer) setTimerOpen(true);
          }}
        />
      )}

      {timerOpen && (
        <RestTimer
          onFinish={() => setTimerOpen(false)}
          onCancel={() => setTimerOpen(false)}
        />
      )}

      {/* Modal de series objetivo (tras elegir ejercicio del catálogo) */}
      {pendingExercise && (
        <TargetSetsModal
          exercise={pendingExercise}
          initialSets={
            targetSetsByExercise.get(pendingExercise.id) ?? DEFAULT_TARGET_SETS
          }
          onCancel={() => {
            setPendingExercise(null);
            if (returnToImmersive) {
              setReturnToImmersive(false);
              setImmersive(true);
            }
          }}
          onConfirm={(n) => {
            const ex = pendingExercise;
            setPendingExercise(null);

            // Añadir al final de la lista
            setAddedExerciseIds((prev) =>
              prev.includes(ex.id) ? prev : [...prev, ex.id]
            );
            // Guardar target
            updateTarget(ex.id, n);

            if (returnToImmersive) {
              setReturnToImmersive(false);
              setNewExerciseId(ex.id);
              setImmersive(true);
            }
          }}
        />
      )}

      {/* Modo inmersivo */}
   {immersive && (
  <ImmersiveWorkoutScreen
    exercises={workoutExercises}
    sets={sets}
    targets={targetSetsByExercise}
    onChangeTarget={updateTarget}
    onLogSet={logSet}
    onFinish={async () => {
      if (!activeWorkout) return;
      setImmersive(false);
      const id = activeWorkout.id;
      await finishWorkout();
      setShowSummary(id);
    }}
    onClose={() => setImmersive(false)}
    onAddExercise={() => {
      setReturnToImmersive(true);
      setImmersive(false);
      setPickerOpen(true);
    }}
    initialExerciseId={newExerciseId ?? undefined}
    onConsumeInitialExercise={() => setNewExerciseId(null)}
  />
)}

      {showSummary && (
        <PostWorkoutSummary
          workoutId={showSummary}
          userId={userId}
          routineName={routine?.name ?? 'Entrenamiento libre'}
          exercises={exercises}
          onClose={() => {
            setShowSummary(null);
            onClose();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SetLogger
// ---------------------------------------------------------------------------
function SetLogger({
  exercise,
  setNumber,
  previousSet,
  previousBest1Rm,
  gymMode,
  trainingMode,
  enabledTechniques,
  onClose,
  onSaved,
}: {
  exercise: Exercise;
  setNumber: number;
  previousSet: {
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
    technique: Technique;
  } | null;
  previousBest1Rm: number;
  gymMode: boolean;
  trainingMode: 'simple' | 'assisted' | 'mixed';
  enabledTechniques: string[];
  onClose: () => void;
  onSaved: (
    payload: {
      exerciseId: string;
      setNumber: number;
      weightKg: number | null;
      reps: number | null;
      rir: number | null;
      technique: Technique;
      cardioSeconds: number | null;
      cardioKm: number | null;
      cardioKcal: number | null;
      notes: string | null;
      estimated1Rm: number | null;
      completed: boolean;
    },
    useTimer: boolean
  ) => void;
}) {
  const isCardio = exercise.category === 'Cardio';
  const [weight, setWeight] = useState(previousSet?.weightKg?.toString() ?? '');
  const [reps, setReps] = useState(previousSet?.reps?.toString() ?? '');
  const [rir, setRir] = useState<number | 'Fallo'>(
    previousSet?.rir === 0 ? 'Fallo' : previousSet?.rir ?? 'Fallo'
  );
  const [technique, setTechnique] = useState<Technique>(
    previousSet?.technique ?? 'Normal'
  );
  const [cardioMinutes, setCardioMinutes] = useState('');
  const [cardioKm, setCardioKm] = useState('');
  const [cardioKcal, setCardioKcal] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const effectiveRir = rir === 'Fallo' ? 0 : rir;
  const weightNum = weight ? Number(weight) : 0;
  const repsNum = reps ? Number(reps) : 0;

  const estimatedRm =
    weightNum > 0 && repsNum > 0
      ? estimateOneRm(weightNum, repsNum, effectiveRir)
      : 0;

  const isPotentialPR = estimatedRm > 0 && estimatedRm > previousBest1Rm;

  const showTechniqueSection = trainingMode !== 'simple' && !isCardio;

  const suggestedTechniques = useMemo(() => {
    if (trainingMode !== 'assisted') return [];
    return getTechniquesForExercise(exercise.name).filter((t) =>
      enabledTechniques.includes(t.id)
    );
  }, [exercise.name, trainingMode, enabledTechniques]);

  const mixedTechniques = useMemo(() => {
    if (trainingMode !== 'mixed') return [];
    return getTechniquesForExercise(exercise.name).filter((t) =>
      enabledTechniques.includes(t.id)
    );
  }, [exercise.name, trainingMode, enabledTechniques]);

  const dangerousTechniques = useMemo(
    () => getTechniquesToAvoid(exercise.name),
    [exercise.name]
  );

  const selectedTechMeta =
    technique !== 'Normal'
      ? Object.values(TECHNIQUE_BY_ID).find((t) => t.name === technique)
      : null;

  const isFreeWeightMulti =
    /Sentadilla|Peso muerto|Press banca/i.test(exercise.name) &&
    exercise.equipment === 'Barra';

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500">Serie {setNumber}</p>
            <h2 className="text-base font-bold">{exercise.name}</h2>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {!isCardio && isPotentialPR && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <Trophy size={14} className="text-amber-400" />
            <p className="text-[11px] font-medium text-amber-200">
              Nuevo récord personal · {estimatedRm.toFixed(1)} kg (antes{' '}
              {previousBest1Rm.toFixed(1)} kg)
            </p>
          </div>
        )}

        {isCardio ? (
          <div className="space-y-3">
            <NumInput
              label="Minutos"
              value={cardioMinutes}
              onChange={setCardioMinutes}
              gymMode={gymMode}
            />
            <NumInput
              label="Kilómetros"
              value={cardioKm}
              onChange={setCardioKm}
              step="0.01"
              gymMode={gymMode}
            />
            <NumInput
              label="Kcal"
              value={cardioKcal}
              onChange={setCardioKcal}
              gymMode={gymMode}
            />

            <CardioProtocolPanel
              protocols={CARDIO_PROTOCOLS}
              selectedId={selectedProtocol}
              onSelect={setSelectedProtocol}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <NumInput
              label="Peso (kg)"
              value={weight}
              onChange={setWeight}
              step="0.5"
              gymMode={gymMode}
            />
            <NumInput
              label="Reps"
              value={reps}
              onChange={setReps}
              gymMode={gymMode}
            />

            <div>
              <p className="mb-1.5 text-xs text-zinc-400">RIR</p>
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 4].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRir(r)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      rir === r
                        ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => setRir('Fallo')}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    rir === 'Fallo'
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                      : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  Fallo
                </button>
              </div>
            </div>

            {showTechniqueSection ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">Técnica</p>
                  {trainingMode === 'assisted' && (
                    <span className="text-[9px] uppercase tracking-widest text-cyan-400">
                      Modo asistido
                    </span>
                  )}
                </div>

                {trainingMode === 'assisted' &&
                  suggestedTechniques.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {suggestedTechniques.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTechnique(t.name as Technique)}
                          className={`w-full rounded-xl border p-2.5 text-left transition ${
                            technique === t.name
                              ? 'border-cyan-500/50 bg-cyan-500/10'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-zinc-200">
                              {t.name}
                            </p>
                            <span
                              className={`text-[9px] uppercase ${
                                t.fatigueCost === 'Alta'
                                  ? 'text-red-400'
                                  : t.fatigueCost === 'Media'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                              }`}
                            >
                              Fatiga {t.fatigueCost}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-zinc-500">
                            {t.protocol}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                {trainingMode === 'mixed' && mixedTechniques.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTechnique('Normal')}
                      className={`rounded-xl border px-3 py-1.5 text-xs ${
                        technique === 'Normal'
                          ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                          : 'border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Normal
                    </button>
                    {mixedTechniques.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTechnique(t.name as Technique)}
                        className={`rounded-xl border px-3 py-1.5 text-xs ${
                          technique === t.name
                            ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}

                {trainingMode === 'assisted' &&
                  suggestedTechniques.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-800 p-3 text-center">
                      <p className="text-[11px] text-zinc-500">
                        No hay técnicas habilitadas para este ejercicio.
                      </p>
                    </div>
                  )}

                {selectedTechMeta && (
                  <div className="mt-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-cyan-300">
                      {selectedTechMeta.category}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
                      {selectedTechMeta.evidence}
                    </p>
                  </div>
                )}

                {dangerousTechniques.length > 0 && (
                  <div className="mt-2 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
                    <Ban size={14} className="mt-0.5 shrink-0 text-red-400" />
                    <p className="text-[11px] leading-relaxed text-red-300">
                      No recomendadas en {exercise.name.toLowerCase()}:{' '}
                      {dangerousTechniques.map((t) => t.name).join(', ')}.
                    </p>
                  </div>
                )}

                {isFreeWeightMulti && technique !== 'Normal' && (
                  <div className="mt-2 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-3">
                    <AlertTriangle
                      size={14}
                      className="mt-0.5 shrink-0 text-red-400"
                    />
                    <p className="text-[11px] leading-relaxed text-red-300">
                      Las Drop-Sets o el fallo técnico no se recomiendan en
                      barra libre multiarticular (ej. Sentadilla libre) por
                      riesgo de lesión.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-[11px] text-zinc-600">
                Modo simple · Técnicas avanzadas desactivadas
              </p>
            )}
          </div>
        )}

        <div className="mt-3">
          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800 py-2 text-xs text-zinc-500 hover:border-cyan-500/40 hover:text-cyan-400"
            >
              <MessageSquare size={11} /> Añadir nota
            </button>
          ) : (
            <div>
              <p className="mb-1.5 text-xs text-zinc-400">
                ¿Cómo te has sentido?
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej. hombro cargado, buena conexión…"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm text-zinc-300"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              const common = {
                exerciseId: exercise.id,
                setNumber,
                technique,
                notes: notes.trim() || null,
                completed: true,
              };
              if (isCardio) {
                onSaved(
                  {
                    ...common,
                    weightKg: null,
                    reps: null,
                    rir: null,
                    cardioSeconds: cardioMinutes
                      ? Number(cardioMinutes) * 60
                      : null,
                    cardioKm: cardioKm ? Number(cardioKm) : null,
                    cardioKcal: cardioKcal ? Number(cardioKcal) : null,
                    estimated1Rm: null,
                  },
                  false
                );
              } else {
                onSaved(
                  {
                    ...common,
                    weightKg: weight ? Number(weight) : null,
                    reps: reps ? Number(reps) : null,
                    rir: effectiveRir,
                    cardioSeconds: null,
                    cardioKm: null,
                    cardioKcal: null,
                    estimated1Rm: estimatedRm > 0 ? estimatedRm : null,
                  },
                  true
                );
              }
            }}
            className="flex-1 rounded-2xl bg-grad-brand py-3 text-sm font-semibold text-white shadow-cta transition-all duration-200"
          >
            <Check size={14} className="mr-1.5 inline" />
            Guardar {!isCardio && 'y descansar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  step,
  gymMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  gymMode: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-zinc-400">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-blue-500 ${
          gymMode
            ? 'text-center text-3xl font-extrabold tabular-nums'
            : 'text-sm'
        }`}
      />
    </label>
  );
}