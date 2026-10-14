import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  SkipForward,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { MuscleBadges } from '../components/MuscleBadges';
import { estimateOneRm } from '../lib/calculations';
import {
  stepValue,
  safeParseNumber,
  safeParseInteger,
  isIntegerDraft,
  formatDisplay,
  clamp,
} from '../lib/numeric';
import {
  saveImmersiveRest,
  loadImmersiveRest,
} from '../lib/restPersistence';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  notifyRestComplete,
  playBeep,
  requestNotificationPermission,
  vibrate,
} from '../lib/notifications';
import type { ActiveSet } from '../hooks/useWorkouts';
import type { Exercise } from '../types';

const REST_STEP_SEC = 15;
const REST_MIN_SEC = 5;
const REST_MAX_SEC = 900;
const DEFAULT_TARGET_SETS = 3;
const AUTO_ADVANCE_MS = 900;

const DEFAULT_WEIGHT_KG = 50;
const DEFAULT_REPS = 8;
const DEFAULT_RIR = 1;
const WEIGHT_STEP = 0.5;
const WEIGHT_MIN = 0;
const WEIGHT_MAX = 999;
const REPS_MIN = 1;
const REPS_MAX = 999;
const RIR_MIN = 0;
const RIR_MAX = 10;

function useLongPress(
  onFire: () => void,
  { delayMs = 500, intervalMs = 80 }: { delayMs?: number; intervalMs?: number } = {}
) {
  const onFireRef = useRef(onFire);
  useEffect(() => {
    onFireRef.current = onFire;
  }, [onFire]);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    onFireRef.current();
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        onFireRef.current();
      }, intervalMs);
    }, delayMs);
  }, [delayMs, intervalMs]);

  useEffect(() => () => stop(), [stop]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}

function hapticTick() {
  try {
    if ('vibrate' in navigator) navigator.vibrate(8);
  } catch {
    // ignore
  }
}

export function ImmersiveWorkoutScreen({
  exercises,
  sets,
  targets,
  onChangeTarget,
  restSecondsForExercise,
  onChangeRestForExercise,
  onLogSet,
  onFinish,
  onClose,
  onAddExercise,
  initialExerciseId,
  onConsumeInitialExercise,
  userBodyweightKg,
}: {
  exercises: Exercise[];
  sets: ActiveSet[];
  targets: Map<string, number>;
  onChangeTarget: (exerciseId: string, sets: number) => void;
  restSecondsForExercise: (exerciseId: string) => number;
  onChangeRestForExercise?: (exerciseId: string, seconds: number) => void;
  onLogSet: (
    s: Omit<ActiveSet, 'localId' | 'remoteId' | 'syncStatus'>
  ) => void;
  onFinish: () => void;
  onClose: () => void;
  onAddExercise?: () => void;
  initialExerciseId?: string;
  onConsumeInitialExercise?: () => void;
  /** Peso corporal efectivo. NUNCA se muestra en la UI, solo para cálculos. */
  userBodyweightKg?: number | null;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [weight, setWeight] = useState<number>(DEFAULT_WEIGHT_KG);
  const [reps, setReps] = useState<number>(DEFAULT_REPS);
  const [rir, setRir] = useState<number>(DEFAULT_RIR);

  const [restDurationSec, setRestDurationSec] = useState(90);
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restInputDraft, setRestInputDraft] = useState<string>('90');
  const restActive = restEndTime !== null;

  const [justCompletedExercise, setJustCompletedExercise] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [pendingAutoFinish, setPendingAutoFinish] = useState(false);

  const notificationsReadyRef = useRef(false);
  const hydratedRestRef = useRef(false);

  useWakeLock(true);

  useEffect(() => {
    (async () => {
      const ok = await requestNotificationPermission();
      notificationsReadyRef.current = ok;
    })();
  }, []);

  useEffect(() => {
    const saved = loadImmersiveRest();
    if (saved) {
      setRestDurationSec(saved.durationSec);
      setRestEndTime(saved.endTime);
      setRestRemaining(
        Math.max(0, Math.ceil((saved.endTime - Date.now()) / 1000))
      );
    }
    hydratedRestRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRestRef.current) return;
    if (restEndTime) {
      saveImmersiveRest({
        endTime: restEndTime,
        durationSec: restDurationSec,
      });
    } else {
      saveImmersiveRest(null);
    }
  }, [restEndTime, restDurationSec]);

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
  const isBodyweight = currentExercise?.equipment === 'Peso Corporal';

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
  const targetReached = !!currentExercise && currentSets.length >= targetSets;

  /**
   * 1RM: para peso corporal sumamos el bodyweight internamente.
   * El resultado se muestra como un único número; nunca exponemos el
   * desglose (evita filtrar el peso del usuario).
   */
  const effectiveLoad =
    isBodyweight && userBodyweightKg != null
      ? userBodyweightKg + weight
      : weight;

  const estimated1Rm =
    effectiveLoad > 0 && reps > 0
      ? estimateOneRm(effectiveLoad, reps, rir)
      : 0;

  useEffect(() => {
    const last = currentSets[currentSets.length - 1];
    if (last) {
      if (last.weightKg !== null) setWeight(last.weightKg);
      if (last.reps !== null) setReps(last.reps);
      if (last.rir !== null) setRir(last.rir);
    } else {
      const bw = currentExercise?.equipment === 'Peso Corporal';
      setWeight(bw ? 0 : DEFAULT_WEIGHT_KG);
      setReps(DEFAULT_REPS);
      setRir(DEFAULT_RIR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise?.id]);

  useEffect(() => {
    if (!currentExercise) return;
    const s = restSecondsForExercise(currentExercise.id);
    const safe = Math.max(REST_MIN_SEC, Math.min(REST_MAX_SEC, Math.round(s)));
    setRestDurationSec(safe);
    setRestInputDraft(String(safe));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise?.id]);

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
        if (pendingAutoFinish) {
          setPendingAutoFinish(false);
          onFinish();
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restEndTime, currentExercise?.id, nextSetNumber, pendingAutoFinish]);

  function startRest(seconds: number) {
    const safe = Math.max(REST_MIN_SEC, Math.min(REST_MAX_SEC, seconds));
    setRestDurationSec(safe);
    setRestEndTime(Date.now() + safe * 1000);
  }

  function adjustRest(deltaSec: number) {
    if (!restEndTime) {
      setRestDurationSec((d) => {
        const next = Math.max(
          REST_MIN_SEC,
          Math.min(REST_MAX_SEC, d + deltaSec)
        );
        if (currentExercise) {
          onChangeRestForExercise?.(currentExercise.id, next);
        }
        return next;
      });
      return;
    }
    const next = restEndTime + deltaSec * 1000;
    const minEnd = Date.now() + 5 * 1000;
    setRestEndTime(Math.max(minEnd, next));
    if (currentExercise) {
      const newDuration = Math.max(
        REST_MIN_SEC,
        Math.min(REST_MAX_SEC, restDurationSec + deltaSec)
      );
      setRestDurationSec(newDuration);
      onChangeRestForExercise?.(currentExercise.id, newDuration);
    }
  }

  function commitRestInput(raw: string) {
    const v = Number(raw);
    if (isNaN(v) || v < REST_MIN_SEC || v > REST_MAX_SEC) {
      setRestInputDraft(String(restDurationSec));
      return;
    }
    const rounded = Math.round(v);
    setRestDurationSec(rounded);
    if (currentExercise) {
      onChangeRestForExercise?.(currentExercise.id, rounded);
    }
    if (restEndTime) {
      const elapsed = restDurationSec - restRemaining;
      const newRemaining = Math.max(REST_MIN_SEC, rounded - elapsed);
      setRestEndTime(Date.now() + newRemaining * 1000);
    }
  }

  function skipRest() {
    setRestEndTime(null);
    setRestRemaining(0);
    if (pendingAutoFinish) {
      setPendingAutoFinish(false);
      onFinish();
    }
  }

  function extendTarget() {
    if (!currentExercise) return;
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

    const weightForSave = weight > 0 ? weight : null;

    onLogSet({
      exerciseId: currentExercise.id,
      setNumber: nextSetNumber,
      weightKg: weightForSave,
      reps,
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
      setPendingAutoFinish(true);
      startRest(restDurationSec);
    } else if (reachedNow && !isLastExercise) {
      setJustCompletedExercise(true);
      startRest(restDurationSec);
      window.setTimeout(() => {
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
    saveImmersiveRest(null);
    onFinish();
  }

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {justCompletedExercise && (
        <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center">
          <div className="flex animate-scale-in items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-3 backdrop-blur">
            <p className="text-sm font-bold text-emerald-100">
              Ejercicio completado
            </p>
          </div>
        </div>
      )}

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

            <div className="mt-5 grid grid-cols-3 gap-2">
              <BigEditableInput
                label={isBodyweight ? 'Peso extra' : 'Peso'}
                value={weight}
                onChange={setWeight}
                step={WEIGHT_STEP}
                unit="kg"
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
              />
              <BigEditableInput
                label="Reps"
                value={reps}
                onChange={setReps}
                step={1}
                unit=""
                min={REPS_MIN}
                max={REPS_MAX}
                integerOnly
              />
              <BigEditableInput
                label="RIR"
                value={rir}
                onChange={setRir}
                step={1}
                unit=""
                min={RIR_MIN}
                max={RIR_MAX}
                integerOnly
              />
            </div>

            {/* Hint sin exponer el peso corporal del usuario */}
            {isBodyweight && (
              <p className="mt-2 text-center text-[10px] leading-relaxed text-zinc-500">
                {userBodyweightKg != null
                  ? 'Añade "Peso extra" solo si llevas lastre. El peso corporal se aplica internamente.'
                  : 'Registra tu peso en Perfil para calcular el volumen de forma privada.'}
              </p>
            )}

            {estimated1Rm > 0 && (
              <p className="mt-3 text-center text-[11px] text-cyan-400">
                1RM estimado: {estimated1Rm.toFixed(1)} kg
              </p>
            )}

            {currentSets.length > 0 && (
              <div className="mt-5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Series de este ejercicio
                </p>
                {currentSets.map((s) => {
                  const hasExtra = s.weightKg !== null && s.weightKg > 0;
                  const display = isBodyweight
                    ? hasExtra
                      ? `Peso corporal + ${s.weightKg} kg × ${s.reps ?? 0}`
                      : `Peso corporal × ${s.reps ?? 0}`
                    : `${s.weightKg ?? 0} kg × ${s.reps ?? 0}`;

                  return (
                    <div
                      key={s.localId}
                      className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs"
                    >
                      <span className="text-zinc-500">#{s.setNumber}</span>
                      <span className="font-medium tabular-nums text-zinc-200">
                        {display}
                      </span>
                      <span className="text-zinc-500">
                        RIR {s.rir ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

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

      <div className="border-t border-zinc-800/60 bg-zinc-950/95 px-4 pt-3 pb-6 backdrop-blur">
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
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#immGrad)"
                strokeWidth="8"
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
            <div className="relative flex flex-col items-center px-4 text-center">
              {restActive ? (
                <>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Descanso
                  </p>
                  <p className="mt-1 text-3xl font-extrabold tabular-nums text-cyan-400">
                    {minutes}:{String(seconds).padStart(2, '0')}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-300">
                    Toca para saltar
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

        {restActive && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={skipRest}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
            >
              <SkipForward size={12} /> Saltar descanso
            </button>
          </div>
        )}

        {pendingAutoFinish && (
          <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-emerald-400">
            Al terminar el descanso, se cerrará el entrenamiento
          </p>
        )}
      </div>

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
  integerOnly = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  unit: string;
  min?: number;
  max?: number;
  integerOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatDisplay(value, integerOnly));

  const safeMin = min ?? 0;
  const safeMax = max ?? Number.MAX_SAFE_INTEGER;

  useEffect(() => {
    if (!focused) setDraft(formatDisplay(value, integerOnly));
  }, [value, focused, integerOnly]);

  function commit(raw: string) {
    const n = integerOnly
      ? safeParseInteger(raw, value)
      : safeParseNumber(raw, value);
    const clamped = clamp(n, safeMin, safeMax);
    onChange(clamped);
    setDraft(formatDisplay(clamped, integerOnly));
  }

  function handleDraftChange(raw: string) {
    if (integerOnly) {
      if (isIntegerDraft(raw)) {
        setDraft(raw);
      }
      return;
    }
    setDraft(raw);
  }

  function decrement() {
    onChange(stepValue(value, step, -1, safeMin, safeMax));
    hapticTick();
  }

  function increment() {
    onChange(stepValue(value, step, 1, safeMin, safeMax));
    hapticTick();
  }

  const decHandlers = useLongPress(decrement);
  const incHandlers = useLongPress(increment);

  const canDec = value > safeMin;
  const canInc = value < safeMax;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-2xl border p-1.5 transition-colors ${
        focused
          ? 'border-cyan-500/60 bg-cyan-500/5'
          : 'border-zinc-800 bg-zinc-900/60'
      }`}
    >
      <button
        type="button"
        {...decHandlers}
        disabled={!canDec}
        aria-label={`Disminuir ${label} en ${step} ${unit}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 transition active:scale-[0.95] disabled:opacity-30"
      >
        <Minus size={16} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center">
        <p className="text-[9px] uppercase tracking-widest text-zinc-500">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline justify-center">
          {unit && (
            <span
              aria-hidden
              className="invisible shrink-0 text-[10px] font-medium"
            >
              {unit}
            </span>
          )}
          <input
            type="text"
            inputMode={integerOnly ? 'numeric' : 'decimal'}
            pattern={integerOnly ? '[0-9-]*' : undefined}
            value={draft}
            onFocus={(e) => {
              setFocused(true);
              e.target.select();
            }}
            onBlur={(e) => {
              setFocused(false);
              commit(e.target.value);
            }}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-14 min-w-0 bg-transparent text-center text-xl font-extrabold tabular-nums text-zinc-100 outline-none"
            aria-label={label}
          />
          {unit && (
            <span className="ml-0.5 shrink-0 text-[10px] font-medium text-zinc-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        {...incHandlers}
        disabled={!canInc}
        aria-label={`Aumentar ${label} en ${step} ${unit}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 transition active:scale-[0.95] disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}