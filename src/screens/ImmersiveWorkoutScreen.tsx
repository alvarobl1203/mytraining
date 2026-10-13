import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  SkipForward,
  Circle,
  AlertTriangle
} from 'lucide-react';
import { MuscleBadges } from '../components/MuscleBadges';
import { estimateOneRm } from '../lib/calculations';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  notifyRestComplete,
  playBeep,
  requestNotificationPermission,
  vibrate,
} from '../lib/notifications';
import type { ActiveSet } from '../hooks/useWorkouts';
import type { Exercise } from '../types';

const DEFAULT_REST_SEC = 90;
const REST_STEP_SEC = 15;
const REST_MIN_SEC = 5;
const REST_MAX_SEC = 900;
const DEFAULT_TARGET_SETS = 3;
const AUTO_ADVANCE_MS = 900;

export function ImmersiveWorkoutScreen({
  exercises,
  sets,
  targets,
  onChangeTarget,
  onLogSet,
  onFinish,
  onClose,
  onAddExercise,
  initialExerciseId,
  onConsumeInitialExercise,
}: {
  exercises: Exercise[];
  sets: ActiveSet[];
  targets: Map<string, number>;
  onChangeTarget: (exerciseId: string, sets: number) => void;
  onLogSet: (
    s: Omit<ActiveSet, 'localId' | 'remoteId' | 'syncStatus'>
  ) => void;
  onFinish: () => void;
  onClose: () => void;
  onAddExercise?: () => void;
  initialExerciseId?: string;
  onConsumeInitialExercise?: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(8);
  const [rir, setRir] = useState<number>(2);

  // Descanso
  const [restDurationSec, setRestDurationSec] = useState(DEFAULT_REST_SEC);
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restInputDraft, setRestInputDraft] = useState<string>(
    String(DEFAULT_REST_SEC)
  );
  const restActive = restEndTime !== null;

  // Flags
  const [justCompletedExercise, setJustCompletedExercise] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  // Marca: cuando el descanso actual termine (natural o saltado), finalizar
  const [pendingAutoFinish, setPendingAutoFinish] = useState(false);

  const notificationsReadyRef = useRef(false);

  useWakeLock(true);

  // Permiso de notificaciones
  useEffect(() => {
    (async () => {
      const ok = await requestNotificationPermission();
      notificationsReadyRef.current = ok;
    })();
  }, []);

  // Salto inicial a un ejercicio concreto
  useEffect(() => {
    if (!initialExerciseId) return;
    const idx = exercises.findIndex((e) => e.id === initialExerciseId);
    if (idx >= 0) {
      setCurrentIdx(idx);
      setRestEndTime(null);
      setRestRemaining(0);
    }
    onConsumeInitialExercise?.();
  }, [initialExerciseId, exercises, onConsumeInitialExercise]);

  const currentExercise = exercises[currentIdx];
  const currentSets = useMemo(
    () => sets.filter((s) => s.exerciseId === currentExercise?.id),
    [sets, currentExercise]
  );

  const nextSetNumber = currentSets.length + 1;

  const getTargetFor = (exerciseId: string): number =>
    targets.get(exerciseId) ?? DEFAULT_TARGET_SETS;

  const targetSets = currentExercise
    ? getTargetFor(currentExercise.id)
    : DEFAULT_TARGET_SETS;

  const isLastExercise = currentIdx >= exercises.length - 1;
  const targetReached =
    !!currentExercise && currentSets.length >= targetSets;

  const estimated1Rm =
    weight > 0 && reps > 0 ? estimateOneRm(weight, reps, rir) : 0;

  // Precargar peso/reps/RIR al cambiar de ejercicio
  useEffect(() => {
    const last = currentSets[currentSets.length - 1];
    if (last) {
      if (last.weightKg !== null) setWeight(last.weightKg);
      if (last.reps !== null) setReps(last.reps);
      if (last.rir !== null) setRir(last.rir);
    }
  }, [currentExercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincroniza draft de descanso
  useEffect(() => {
    setRestInputDraft(String(restDurationSec));
  }, [restDurationSec]);

  // Timer + auto-finish
  useEffect(() => {
    if (!restEndTime) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((restEndTime - Date.now()) / 1000)
      );
      setRestRemaining(remaining);

      if (remaining === 0) {
        setRestEndTime(null);
        playBeep();
        vibrate([200, 100, 200]);
        if (currentExercise) {
          notifyRestComplete(currentExercise.name, nextSetNumber);
        }
        // Si toca auto-finalizar (última serie del último ejercicio), lo hacemos
        if (pendingAutoFinish) {
          setPendingAutoFinish(false);
          onFinish();
        }
      }
    };

    tick();
    const id = setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restEndTime, currentExercise?.id, nextSetNumber, pendingAutoFinish]);

  // ---------------------------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------------------------
  function startRest(seconds: number) {
    const safe = Math.max(REST_MIN_SEC, Math.min(REST_MAX_SEC, seconds));
    setRestDurationSec(safe);
    setRestEndTime(Date.now() + safe * 1000);
  }

  function adjustRest(deltaSec: number) {
    if (!restEndTime) {
      setRestDurationSec((d) =>
        Math.max(REST_MIN_SEC, Math.min(REST_MAX_SEC, d + deltaSec))
      );
      return;
    }
    const next = restEndTime + deltaSec * 1000;
    const minEnd = Date.now() + 5 * 1000;
    setRestEndTime(Math.max(minEnd, next));
  }

  function commitRestInput(raw: string) {
    const v = Number(raw);
    if (isNaN(v) || v < REST_MIN_SEC || v > REST_MAX_SEC) {
      setRestInputDraft(String(restDurationSec));
      return;
    }
    const rounded = Math.round(v);
    setRestDurationSec(rounded);
    if (restEndTime) {
      const elapsed = restDurationSec - restRemaining;
      const newRemaining = Math.max(REST_MIN_SEC, rounded - elapsed);
      setRestEndTime(Date.now() + newRemaining * 1000);
    }
  }

  function skipRest() {
    setRestEndTime(null);
    setRestRemaining(0);
    // Si toca auto-finalizar (última serie del último ejercicio), lo hacemos
    if (pendingAutoFinish) {
      setPendingAutoFinish(false);
      onFinish();
    }
  }

  function extendTarget() {
    if (!currentExercise) return;
    // Si el usuario amplía, cancelamos cualquier auto-finish pendiente
    setPendingAutoFinish(false);
    onChangeTarget(currentExercise.id, getTargetFor(currentExercise.id) + 1);
  }

  function jumpToExercise(idx: number) {
    if (idx < 0 || idx >= exercises.length || idx === currentIdx) return;
    setPendingAutoFinish(false);
    setCurrentIdx(idx);
    skipRest();
  }

  function advanceToNext() {
    if (isLastExercise) return;
    setCurrentIdx((i) => Math.min(exercises.length - 1, i + 1));
    skipRest();
  }

  function handleCheck() {
    if (!currentExercise) return;
    if (restActive) {
      skipRest();
      return;
    }

    onLogSet({
      exerciseId: currentExercise.id,
      setNumber: nextSetNumber,
      weightKg: weight || null,
      reps: reps || null,
      rir,
      technique: 'Normal',
      cardioSeconds: null,
      cardioKm: null,
      cardioKcal: null,
      notes: null,
      estimated1Rm: estimated1Rm > 0 ? estimated1Rm : null,
      completed: true,
    });

    const reachedNow = currentSets.length + 1 >= targetSets;

    if (reachedNow && isLastExercise) {
      // Última serie del último ejercicio → descanso y auto-finalizar al acabar
      setPendingAutoFinish(true);
      startRest(restDurationSec);
    } else if (reachedNow && !isLastExercise) {
      // Última serie de un ejercicio intermedio → flash + auto-avance
      setJustCompletedExercise(true);
      startRest(restDurationSec);
      setTimeout(() => {
        setJustCompletedExercise(false);
        setCurrentIdx((i) => Math.min(exercises.length - 1, i + 1));
      }, AUTO_ADVANCE_MS);
    } else {
      startRest(restDurationSec);
    }
  }

  function handleFinish() {
    setShowFinishConfirm(true);
  }

  function confirmFinish() {
    setShowFinishConfirm(false);
    setPendingAutoFinish(false);
    onFinish();
  }

  // ---------------------------------------------------------------------------
  // Derivados
  // ---------------------------------------------------------------------------
  const totalLoggedSets = sets.length;
  const targetTotal = exercises.reduce((a, e) => a + getTargetFor(e.id), 0);
  const progressPct =
    targetTotal > 0 ? Math.min(1, totalLoggedSets / targetTotal) : 0;

  const pctRest =
    restDurationSec > 0
      ? Math.max(0, Math.min(1, 1 - restRemaining / restDurationSec))
      : 0;
  const radius = 90;
  const circ = 2 * Math.PI * radius;

  const minutes = Math.floor(restRemaining / 60);
  const seconds = restRemaining % 60;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Flash de ejercicio completado */}
      {justCompletedExercise && (
        <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center">
          <div className="flex animate-scale-in items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-3 backdrop-blur">
            <p className="text-sm font-bold text-emerald-100">
              Ejercicio completado
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          aria-label="Cerrar modo inmersivo"
        >
          <X size={20} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            {exercises.length > 0
              ? `Ejercicio ${currentIdx + 1} / ${exercises.length}`
              : 'Sin ejercicios'}
          </p>
          <p className="truncate text-sm font-semibold text-zinc-200">
            {currentExercise ? currentExercise.name : 'Entrenamiento libre'}
          </p>
        </div>
        <button
          onClick={handleFinish}
          className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95"
        >
          Terminar
        </button>
      </div>

      {/* Progreso global */}
      <div className="px-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPct * 100}%` }}
          />
        </div>
        <p className="mt-1 text-center text-[10px] tabular-nums text-zinc-500">
          {totalLoggedSets} / {targetTotal} series registradas
        </p>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {currentExercise ? (
          <>
            <div className="text-center">
              <h1 className="text-[28px] font-extrabold leading-tight text-zinc-100">
                {currentExercise.name}
              </h1>
              <div className="mt-3 flex justify-center">
                <MuscleBadges
                  primary={currentExercise.primaryMuscle}
                  secondary={currentExercise.secondaryMuscles}
                />
              </div>
            </div>

            {/* Indicador de series */}
            <div className="mt-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-2.5">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                    Serie
                  </p>
                  <p className="text-xl font-extrabold tabular-nums text-cyan-400">
                    {Math.min(nextSetNumber, targetSets)}
                    <span className="text-xs font-normal text-zinc-500">
                      /{targetSets}
                    </span>
                  </p>
                </div>
                <span className="h-9 w-px bg-zinc-800" />
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                    Completadas
                  </p>
                  <p className="text-xl font-extrabold tabular-nums text-zinc-200">
                    {currentSets.length}
                  </p>
                </div>
              </div>

              {/* Barra segmentada */}
              <div className="flex items-center gap-1.5">
                {Array.from({
                  length: Math.max(targetSets, currentSets.length),
                }).map((_, i) => {
                  const done = i < currentSets.length;
                  const isNext = i === currentSets.length;
                  return (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        done
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          : isNext
                            ? 'bg-zinc-700'
                            : 'bg-zinc-800'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Botones de gestión */}
              {currentSets.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={extendTarget}
                    className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    <Plus size={11} /> Una serie más
                  </button>
                  {targetReached && (
                    <button
                      onClick={isLastExercise ? handleFinish : advanceToNext}
                      className="flex items-center gap-1 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20"
                    >
                      {isLastExercise
                        ? 'Terminar entreno'
                        : 'Siguiente ejercicio'}
                      <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Inputs editables */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <BigEditableInput
                label="Peso"
                value={weight}
                onChange={setWeight}
                step={2.5}
                unit="kg"
                min={0}
              />
              <BigEditableInput
                label="Reps"
                value={reps}
                onChange={setReps}
                step={1}
                unit=""
                min={0}
              />
              <BigEditableInput
                label="RIR"
                value={rir}
                onChange={setRir}
                step={1}
                unit=""
                min={0}
                max={4}
              />
            </div>

            {estimated1Rm > 0 && (
              <p className="mt-3 text-center text-[11px] text-cyan-400">
                1RM estimado: {estimated1Rm.toFixed(1)} kg
              </p>
            )}

            {/* Series registradas */}
            {currentSets.length > 0 && (
              <div className="mt-5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Series de este ejercicio
                </p>
                {currentSets.map((s) => (
                  <div
                    key={s.localId}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs"
                  >
                    <span className="text-zinc-500">#{s.setNumber}</span>
                    <span className="font-medium tabular-nums text-zinc-200">
                      {s.weightKg} kg × {s.reps}
                    </span>
                    <span className="text-zinc-500">RIR {s.rir}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de ejercicios del entreno */}
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
                Ejercicios del entreno
              </p>
              <div className="space-y-1">
                {exercises.map((ex, i) => {
                  const exSets = sets.filter((s) => s.exerciseId === ex.id);
                  const t = getTargetFor(ex.id);
                  const done = exSets.length >= t;
                  const isCurrent = i === currentIdx;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => jumpToExercise(i)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                        isCurrent
                          ? 'border-cyan-500/40 bg-cyan-500/10'
                          : done
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700'
                      }`}
                    >
                      {done ? (
                        <Check
                          size={14}
                          className="shrink-0 text-emerald-400"
                        />
                      ) : (
                        <Circle
                          size={14}
                          className="shrink-0 text-zinc-600"
                        />
                      )}
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          done
                            ? 'text-zinc-500 line-through'
                            : isCurrent
                              ? 'font-semibold text-cyan-200'
                              : 'text-zinc-200'
                        }`}
                      >
                        {ex.name}
                      </span>
                      <span className="tabular-nums text-[10px] text-zinc-500">
                        {exSets.length}/{t}
                      </span>
                    </button>
                  );
                })}
              </div>

              {onAddExercise && (
                <button
                  onClick={onAddExercise}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-800 py-2 text-[11px] text-zinc-500 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
                >
                  <Plus size={11} /> Añadir ejercicio
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-zinc-500">
              Sin ejercicios. Añade uno para empezar.
            </p>
            {onAddExercise && (
              <button
                onClick={onAddExercise}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-800 px-4 py-2 text-xs text-zinc-500 hover:border-cyan-500/40 hover:text-cyan-400"
              >
                <Plus size={12} /> Añadir ejercicio
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zona inferior */}
      <div className="border-t border-zinc-800/60 bg-zinc-950/95 px-4 pt-3 pb-6 backdrop-blur">
        {/* Descanso */}
        <div className="mb-3 flex items-center justify-center gap-2">
          <button
            onClick={() => adjustRest(-REST_STEP_SEC)}
            className="flex h-8 items-center gap-1 rounded-xl border border-zinc-800 px-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            aria-label="Restar 15 segundos"
          >
            <Minus size={12} /> 15s
          </button>

          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500">
              Descanso
            </p>
            <input
              type="number"
              inputMode="numeric"
              min={REST_MIN_SEC}
              max={REST_MAX_SEC}
              value={restInputDraft}
              onChange={(e) => setRestInputDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => commitRestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-14 bg-transparent text-center text-sm font-bold tabular-nums text-zinc-200 outline-none"
              aria-label="Segundos de descanso"
            />
            <span className="text-sm font-bold text-zinc-200">s</span>
          </div>

          <button
            onClick={() => adjustRest(REST_STEP_SEC)}
            className="flex h-8 items-center gap-1 rounded-xl border border-zinc-800 px-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            aria-label="Sumar 15 segundos"
          >
            15s <Plus size={12} />
          </button>
        </div>

        {/* Navegación + botón central */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => jumpToExercise(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 disabled:opacity-30"
            aria-label="Ejercicio anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={handleCheck}
            disabled={!currentExercise}
            className="relative flex h-40 w-40 items-center justify-center transition-transform active:scale-[0.98] disabled:opacity-40"
            aria-label={restActive ? 'Saltar descanso' : 'Guardar serie'}
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#18181b"
                strokeWidth="10"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#immGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pctRest)}
                style={{ transition: 'stroke-dashoffset 0.25s linear' }}
              />
              <defs>
                <linearGradient id="immGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative flex flex-col items-center">
              {restActive ? (
                <>
                  <p className="text-3xl font-extrabold tabular-nums text-cyan-400">
                    {minutes}:{String(seconds).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Descanso · pulsa para saltar
                  </p>
                </>
              ) : (
                <>
                  <Check size={44} className="text-white" />
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-300">
                    Guardar serie
                  </p>
                </>
              )}
            </div>
          </button>

          <button
            onClick={() => jumpToExercise(currentIdx + 1)}
            disabled={isLastExercise}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 disabled:opacity-30"
            aria-label="Siguiente ejercicio"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Botones secundarios durante el descanso */}
        {restActive && (
          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={skipRest}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            >
              <SkipForward size={12} /> Saltar descanso
            </button>
            <button
              onClick={() => {
                const next = restEndTime
                  ? restEndTime + 30 * 1000
                  : Date.now() + 30 * 1000;
                setRestEndTime(next);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            >
              <Plus size={12} /> 30s
            </button>
          </div>
        )}

        {/* Aviso de auto-finish pendiente */}
        {pendingAutoFinish && (
          <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-emerald-400">
            Al terminar el descanso, se cerrará el entrenamiento
          </p>
        )}
      </div>

      {/* Modal de confirmación */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md animate-scale-in rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">
                ¿Finalizar el entrenamiento?
              </h2>
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="text-zinc-500"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <p className="text-[11px] leading-relaxed text-amber-200">
                  Se guardarán las {totalLoggedSets}{' '}
                  {totalLoggedSets === 1
                    ? 'serie registrada'
                    : 'series registradas'}{' '}
                  y el entrenamiento quedará cerrado.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-sm font-semibold text-zinc-300"
              >
                Seguir entrenando
              </button>
              <button
                onClick={confirmFinish}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// BigEditableInput
// ===========================================================================
function BigEditableInput({
  label,
  value,
  onChange,
  step,
  unit,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  unit: string;
  min?: number;
  max?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function commit(raw: string) {
    const n = Number(raw);
    if (isNaN(n)) {
      setDraft(String(value));
      return;
    }
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onChange(v);
    setDraft(String(v));
  }

  return (
    <div
      className={`rounded-2xl border p-2.5 text-center transition-colors ${
        focused
          ? 'border-cyan-500/60 bg-cyan-500/5'
          : 'border-zinc-800 bg-zinc-900/60'
      }`}
    >
      <p className="text-[9px] uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <div className="mt-1 flex items-center justify-center gap-0.5">
        <input
          type="number"
          inputMode="decimal"
          value={draft}
          step={step}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onBlur={(e) => {
            setFocused(false);
            commit(e.target.value);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-center text-2xl font-extrabold tabular-nums text-zinc-100 outline-none"
        />
        {unit && (
          <span className="text-xs font-medium text-zinc-500">{unit}</span>
        )}
      </div>
    </div>
  );
}