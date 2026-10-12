import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  SkipForward,
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
const DEFAULT_TARGET_SETS = 3;

export function ImmersiveWorkoutScreen({
  exercises,
  sets,
  targetSetsByExercise,
  onLogSet,
  onFinish,
  onClose,
}: {
  exercises: Exercise[];
  sets: ActiveSet[];
  targetSetsByExercise?: Map<string, number>;
  onLogSet: (s: Omit<ActiveSet, 'localId'>) => void;
  onFinish: () => void;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(8);
  const [rir, setRir] = useState<number>(2);

  // Timer
  const [restDurationSec, setRestDurationSec] = useState(DEFAULT_REST_SEC);
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const restActive = restEndTime !== null;

  // Notificaciones
  const notificationsReadyRef = useRef(false);

  useWakeLock(true);

  // Pedir permiso de notificaciones al abrir
  useEffect(() => {
    (async () => {
      const ok = await requestNotificationPermission();
      notificationsReadyRef.current = ok;
    })();
  }, []);

  const currentExercise = exercises[currentIdx];

  const currentSets = useMemo(
    () => sets.filter((s) => s.exerciseId === currentExercise?.id),
    [sets, currentExercise]
  );

  const nextSetNumber = currentSets.length + 1;
  const targetSets =
    currentExercise && targetSetsByExercise?.get(currentExercise.id)
      ? targetSetsByExercise.get(currentExercise.id)!
      : DEFAULT_TARGET_SETS;

  const isLastExercise = currentIdx >= exercises.length - 1;

  const estimated1Rm =
    weight > 0 && reps > 0 ? estimateOneRm(weight, reps, rir) : 0;

  // Precargar peso/reps/RIR desde la última serie del mismo ejercicio
  useEffect(() => {
    const last = currentSets[currentSets.length - 1];
    if (last) {
      if (last.weightKg !== null) setWeight(last.weightKg);
      if (last.reps !== null) setReps(last.reps);
      if (last.rir !== null) setRir(last.rir);
    }
  }, [currentExercise?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer basado en endTime — funciona en background
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
  }, [restEndTime, currentExercise?.id, nextSetNumber]);

  function startRest(seconds: number) {
    setRestDurationSec(seconds);
    setRestEndTime(Date.now() + seconds * 1000);
  }

  function adjustRest(deltaSec: number) {
    if (!restEndTime) {
      // Si no hay descanso activo, ajustamos la duración por defecto
      setRestDurationSec((d) =>
        Math.max(15, Math.min(600, d + deltaSec))
      );
      return;
    }
    const next = restEndTime + deltaSec * 1000;
    const minEnd = Date.now() + 5 * 1000; // como mínimo 5s
    setRestEndTime(Math.max(minEnd, next));
  }

  function skipRest() {
    setRestEndTime(null);
    setRestRemaining(0);
  }

  function handleCheck() {
    if (!currentExercise) return;
    if (restActive) {
      // Si hay descanso activo, el botón central actúa como "saltar descanso"
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

    // ¿Hemos alcanzado el objetivo de series de este ejercicio?
    const willBeCompleted = nextSetNumber >= targetSets;
    if (willBeCompleted && !isLastExercise) {
      // Auto-avanzar al siguiente ejercicio tras breve descanso
      startRest(restDurationSec);
      // Saltar al siguiente ejercicio tras un pequeño delay para que el usuario vea el check
      setTimeout(() => {
        setCurrentIdx((i) => Math.min(exercises.length - 1, i + 1));
      }, 600);
    } else {
      startRest(restDurationSec);
    }
  }

  function handleNext() {
    if (isLastExercise) return;
    setCurrentIdx((i) => i + 1);
    skipRest();
  }

  function handlePrev() {
    if (currentIdx === 0) return;
    setCurrentIdx((i) => i - 1);
    skipRest();
  }

  function handleFinish() {
    // Confirmación para evitar toques accidentales
    if (
      window.confirm(
        '¿Finalizar el entrenamiento? Se guardarán todas las series registradas.'
      )
    ) {
      onFinish();
    }
  }

  // Progreso total
  const totalLoggedSets = sets.length;
  const targetTotal = exercises.reduce(
    (a, e) => a + (targetSetsByExercise?.get(e.id) ?? DEFAULT_TARGET_SETS),
    0
  );
  const progressPct =
    targetTotal > 0 ? Math.min(1, totalLoggedSets / targetTotal) : 0;

  const pctRest =
    restDurationSec > 0
      ? 1 - restRemaining / restDurationSec
      : 0;
  const radius = 90;
  const circ = 2 * Math.PI * radius;

  const minutes = Math.floor(restRemaining / 60);
  const seconds = restRemaining % 60;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
        >
          <X size={20} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            {exercises.length > 0
              ? `Ejercicio ${currentIdx + 1} de ${exercises.length}`
              : 'Sin ejercicios'}
          </p>
          <p className="text-sm font-semibold text-zinc-200">
            {currentExercise ? currentExercise.name : 'Entrenamiento libre'}
          </p>
        </div>
        {/* Botón Terminar GRANDE y visible */}
        <button
          onClick={handleFinish}
          className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95"
        >
          Terminar
        </button>
      </div>

      {/* Barra de progreso total */}
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

      {/* Contenido central */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentExercise ? (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-extrabold leading-tight text-zinc-100">
                {currentExercise.name}
              </h1>
              <div className="mt-3 flex justify-center">
                <MuscleBadges
                  primary={currentExercise.primaryMuscle}
                  secondary={currentExercise.secondaryMuscles}
                />
              </div>
            </div>

            {/* Indicador de serie objetivo */}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                    Serie
                  </p>
                  <p className="text-lg font-bold tabular-nums text-cyan-400">
                    {Math.min(nextSetNumber, targetSets)}
                    <span className="text-xs font-normal text-zinc-500">
                      /{targetSets}
                    </span>
                  </p>
                </div>
                <span className="h-8 w-px bg-zinc-800" />
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500">
                    Completadas
                  </p>
                  <p className="text-lg font-bold tabular-nums text-zinc-200">
                    {currentSets.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel de inputs editables */}
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
                  Series registradas
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
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">
              Sin ejercicios. Añade uno para empezar.
            </p>
          </div>
        )}
      </div>

      {/* Zona inferior: timer + navegación */}
      <div className="border-t border-zinc-800/60 bg-zinc-950/95 px-4 pt-3 pb-6 backdrop-blur">
        {/* Controles de ajuste del descanso */}
        <div className="mb-3 flex items-center justify-center gap-2">
          <button
            onClick={() => adjustRest(-REST_STEP_SEC)}
            className="flex h-8 items-center gap-1 rounded-xl border border-zinc-800 px-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
          >
            <Minus size={12} /> 15s
          </button>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500">
              Descanso
            </p>
            <p className="text-sm font-bold tabular-nums text-zinc-200">
              {restDurationSec}s
            </p>
          </div>
          <button
            onClick={() => adjustRest(REST_STEP_SEC)}
            className="flex h-8 items-center gap-1 rounded-xl border border-zinc-800 px-3 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-700"
          >
            15s <Plus size={12} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Botón central con anillo de timer */}
          <button
            onClick={handleCheck}
            disabled={!currentExercise}
            className="relative flex h-40 w-40 items-center justify-center disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 -rotate-90"
            >
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
                  <Check size={40} className="text-white" />
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-300">
                    Guardar serie
                  </p>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleNext}
            disabled={isLastExercise}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 text-zinc-400 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Botones secundarios */}
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
      </div>
    </div>
  );
}

// ===========================================================================
// Input editable grande (reemplaza los botones +/-)
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

  // Sincroniza el draft cuando el value externo cambia y no estamos editando
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