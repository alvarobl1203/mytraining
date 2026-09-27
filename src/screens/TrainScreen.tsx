import { useState, useEffect, useRef } from 'react';
import {
  Play,
  X,
  Loader2,
  Timer,
  Dumbbell,
  Trash2,
  Check,
  ChevronDown,
  AlertTriangle,
  Square,
  Plus,
  Search,
  Target,
} from 'lucide-react';
import { useWorkout, type SessionWithSets } from '@/hooks/useWorkout';
import { useRoutines, type RoutineWithExercises } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import type { Exercise } from '@/types/exercise';
import type { Technique, DayOfWeek } from '@/types/routine';
import { REST_OPTIONS, TECHNIQUES, DAYS_OF_WEEK } from '@/types/routine';

interface TrainScreenProps {
  preselectedRoutineId?: string | null;
  preselectedRoutineName?: string | null;
  onClearPreselect?: () => void;
}

export default function TrainScreen({
  preselectedRoutineId,
  preselectedRoutineName,
  onClearPreselect,
}: TrainScreenProps) {
  const { activeSession, startSession, addSet, deleteSet, finishSession, cancelSession } = useWorkout();
  const { routines } = useRoutines();
  const [showStartModal, setShowStartModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (preselectedRoutineId && !activeSession) {
      setSelectedRoutineId(preselectedRoutineId);
      setSessionName(preselectedRoutineName || '');
      setShowStartModal(true);
    }
  }, [preselectedRoutineId, preselectedRoutineName, activeSession]);

  async function handleStart() {
    setStarting(true);
    try {
      await startSession(selectedRoutineId, sessionName || 'Entrenamiento');
      setShowStartModal(false);
      setSessionName('');
      setSelectedRoutineId(null);
      onClearPreselect?.();
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  }

  if (activeSession) {
    return (
      <ActiveWorkout
        session={activeSession}
        onAddSet={addSet}
        onDeleteSet={deleteSet}
        onFinish={() => finishSession(activeSession.id)}
        onCancel={() => cancelSession(activeSession.id)}
      />
    );
  }

  return (
    <div className="pt-2 space-y-4">
      <h2 className="text-xl font-bold text-white">Entrenar</h2>

      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 text-center">
        <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-glow mx-auto mb-4">
          <Dumbbell size={28} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Sin entrenamiento activo</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Inicia una sesión para registrar tus series, peso, repeticiones y descansos.
        </p>
        <button
          onClick={() => setShowStartModal(true)}
          className="inline-flex items-center gap-2 gradient-brand text-white font-semibold px-6 py-3 rounded-2xl shadow-glow hover:opacity-90 transition-all"
        >
          <Play size={18} fill="currentColor" /> Empezar entrenamiento
        </button>
      </div>

      {/* Today's routine highlight */}
      {(() => {
        const todayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7] as DayOfWeek;
        const todayRoutines = routines.filter((r) => r.day_of_week === todayName && r.routine_exercises.length > 0);
        if (todayRoutines.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-blue-500/15 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-300 mb-3">Hoy · {todayName}</p>
            <div className="space-y-2">
              {todayRoutines.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRoutineId(r.id);
                    setSessionName(r.name);
                    setShowStartModal(true);
                  }}
                  className="w-full flex items-center justify-between bg-zinc-950/50 border border-zinc-800/30 rounded-xl px-3 py-3 hover:border-blue-500/30 transition-all"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{r.name}</p>
                    <p className="text-[10px] text-zinc-400">{r.routine_exercises.length} ejercicios</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Play size={14} fill="currentColor" /> Empezar
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {routines.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
          <p className="text-xs font-medium text-zinc-400 mb-3">Rutinas disponibles</p>
          <div className="space-y-1.5">
            {routines.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRoutineId(r.id);
                  setSessionName(r.name);
                  setShowStartModal(true);
                }}
                className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-800/30 rounded-xl px-3 py-2.5 hover:border-blue-500/30 transition-all"
              >
                <div className="text-left">
                  <p className="text-xs font-medium text-white">{r.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    {r.day_of_week} · {r.routine_exercises.length} ejercicios
                  </p>
                </div>
                <Play size={14} className="text-cyan-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center safe-bottom">
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nueva sesión</h3>
              <button
                onClick={() => setShowStartModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Nombre (opcional)</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ej. Push - Lunes"
                className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Rutina (opcional)</label>
              <select
                value={selectedRoutineId || ''}
                onChange={(e) => setSelectedRoutineId(e.target.value || null)}
                className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
              >
                <option value="">Entrenamiento libre</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.day_of_week})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full gradient-brand text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40"
            >
              {starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActiveWorkoutProps {
  session: SessionWithSets;
  onAddSet: (
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    weightKg: number,
    reps: number,
    rir: number,
    technique: Technique,
    restSeconds: number
  ) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  onFinish: () => Promise<void>;
  onCancel: () => Promise<void>;
}

function ActiveWorkout({ session, onAddSet, onDeleteSet, onFinish, onCancel }: ActiveWorkoutProps) {
  const { routines } = useRoutines();
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);

  const linkedRoutine = session.routine_id
    ? routines.find((r) => r.id === session.routine_id) as RoutineWithExercises | undefined
    : undefined;
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('0');
  const [technique, setTechnique] = useState<Technique>('Normal');
  const [restSeconds, setRestSeconds] = useState(90);
  const [saving, setSaving] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    sessionStartRef.current = Date.now();
    const interval = setInterval(() => {
      setSessionMinutes(Math.floor((Date.now() - sessionStartRef.current) / 60000));
    }, 30000);
    return () => clearInterval(interval);
  }, [session.id]);

  // Rest timer effect
  useEffect(() => {
    if (restTimer === null || restTimer === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setElapsed(0);
    const target = restTimer;
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const remaining = target - Math.floor((Date.now() - startTime) / 1000);
      if (remaining <= 0) {
        setRestTimer(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setRestTimer(remaining);
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 250);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [restTotal]);

  // Group sets by exercise
  const setsByExercise = session.workout_sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) acc[set.exercise_id] = [];
    acc[set.exercise_id].push(set);
    return acc;
  }, {} as Record<string, typeof session.workout_sets>);

  async function handleAddSet() {
    if (!activeExercise) return;
    setSaving(true);
    try {
      const existingSets = setsByExercise[activeExercise.id] || [];
      const setNumber = existingSets.length + 1;
      await onAddSet(
        session.id,
        activeExercise.id,
        setNumber,
        parseFloat(weight) || 0,
        parseInt(reps) || 0,
        parseInt(rir) || 0,
        technique,
        restSeconds
      );
      setRestTimer(restSeconds);
      setRestTotal(restSeconds);
      setWeight('');
      setReps('');
      setRir('0');
      setTechnique('Normal');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pt-2 space-y-4">
      {/* Active session header */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-white">{session.name || 'Entrenamiento'}</h2>
            <p className="text-[10px] text-zinc-500">
              {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl gradient-brand text-white shadow-glow hover:opacity-90 transition-all"
          >
            <Check size={14} /> Finalizar
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Timer size={11} /> {sessionMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell size={11} /> {session.workout_sets.length} series
          </span>
        </div>
      </div>

      {/* Rest timer */}
      {restTimer !== null && restTimer > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-cyan-300 mb-1">Descanso</p>
          <p className="text-4xl font-bold text-white tabular-nums">
            {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
          </p>
          <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="gradient-brand h-full rounded-full transition-all duration-300"
              style={{ width: `${(elapsed / restTotal) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setRestTimer(null)}
            className="mt-2 text-[10px] text-zinc-500 hover:text-white transition-colors"
          >
            Saltar descanso
          </button>
        </div>
      )}

      {restTimer === 0 && (
        <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl p-3 text-center animate-pulse-glow">
          <p className="text-sm font-semibold text-cyan-300">¡Descanso terminado!</p>
          <button
            onClick={() => setRestTimer(null)}
            className="mt-1 text-[10px] text-zinc-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Routine guidance */}
      {linkedRoutine && linkedRoutine.routine_exercises.length > 0 && showGuidance && (
        <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Plan de la rutina</h3>
            </div>
            <button
              onClick={() => setShowGuidance(false)}
              className="text-[10px] text-zinc-500 hover:text-white transition-colors"
            >
              Ocultar
            </button>
          </div>
          <div className="space-y-1.5">
            {linkedRoutine.routine_exercises.map((re, idx) => {
              const loggedCount = (setsByExercise[re.exercise_id] || []).length;
              const isDone = loggedCount >= re.target_sets;
              return (
                <div
                  key={re.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                    isDone
                      ? 'bg-green-950/30 border border-green-800/30'
                      : loggedCount > 0
                      ? 'bg-blue-950/30 border border-blue-800/30'
                      : 'bg-zinc-950/50 border border-zinc-800/30'
                  }`}
                >
                  <span className="text-[10px] font-bold text-zinc-600 w-5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{re.exercises.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {re.target_sets}x{re.target_reps} · RIR {re.target_rir} · {re.rest_seconds}s
                      {re.technique !== 'Normal' && ` · ${re.technique}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold shrink-0 ${
                    isDone ? 'text-green-400' : loggedCount > 0 ? 'text-cyan-400' : 'text-zinc-600'
                  }`}>
                    {loggedCount}/{re.target_sets}
                  </span>
                  {!isDone && loggedCount === 0 && (
                    <button
                      onClick={() => {
                        setActiveExercise(re.exercises);
                        setShowAddExercise(false);
                      }}
                      className="p-1 rounded text-cyan-400 hover:bg-cyan-500/10 transition-colors shrink-0"
                      title="Registrar este ejercicio"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logged sets grouped by exercise */}
      {Object.entries(setsByExercise).length > 0 && (
        <div className="space-y-3">
          {Object.entries(setsByExercise).map(([exerciseId, sets]) => (
            <div key={exerciseId} className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3">
              <h3 className="text-sm font-bold text-white mb-2">{sets[0].exercises.name}</h3>
              <div className="space-y-1">
                {sets.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2 bg-zinc-950/50 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-bold text-zinc-600 w-5">{idx + 1}</span>
                    <span className="text-xs font-semibold text-white flex-1">
                      {s.weight_kg} kg x {s.reps} reps
                    </span>
                    {s.rir > 0 && <span className="text-[10px] text-zinc-500">RIR {s.rir}</span>}
                    {s.technique !== 'Normal' && (
                      <span className="text-[10px] text-blue-400">{s.technique}</span>
                    )}
                    <button
                      onClick={() => onDeleteSet(s.id)}
                      className="p-0.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add set form */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Registrar serie</h3>
          <button
            onClick={() => setShowAddExercise(!showAddExercise)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors"
          >
            <ChevronDown size={12} className={showAddExercise ? 'rotate-180' : ''} />
            {activeExercise ? 'Cambiar ejercicio' : 'Seleccionar ejercicio'}
          </button>
        </div>

        {showAddExercise && (
          <ExercisePicker onPick={(ex) => { setActiveExercise(ex); setShowAddExercise(false); }} />
        )}

        {activeExercise && (
          <>
            <div className="bg-zinc-950/50 border border-zinc-800/30 rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-white">{activeExercise.name}</p>
              <p className="text-[10px] text-zinc-500">{activeExercise.primary_muscle} · {activeExercise.equipment}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Peso (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0"
                  step="0.5"
                  className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 mb-1 block">RIR</label>
                <input
                  type="number"
                  value={rir}
                  onChange={(e) => setRir(e.target.value)}
                  placeholder="0"
                  min={0}
                  max={5}
                  className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Descanso</label>
                <select
                  value={restSeconds}
                  onChange={(e) => setRestSeconds(parseInt(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  {REST_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r < 60 ? `${r}s` : `${r / 60}min`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Técnica</label>
              <div className="grid grid-cols-3 gap-1.5">
                {TECHNIQUES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTechnique(t)}
                    className={`py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                      technique === t
                        ? 'gradient-brand text-white'
                        : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {technique !== 'Normal' && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1">
                <AlertTriangle size={11} />
                {technique} en ejercicios multiarticulares con barra libre requiere precaucion.
              </p>
            )}

            <button
              onClick={handleAddSet}
              disabled={!activeExercise || !reps || saving}
              className="w-full gradient-brand text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Registrar serie
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setShowFinishConfirm(true)}
        className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-400 hover:bg-red-950/30 transition-all"
      >
        <Square size={16} /> Cancelar entrenamiento
      </button>

      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">¿Finalizar entrenamiento?</h3>
            <p className="text-sm text-zinc-400">
              Se guardaran {session.workout_sets.length} series registradas.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-3 rounded-xl text-sm hover:bg-zinc-700 transition-all"
              >
                Seguir entrenando
              </button>
              <button
                onClick={async () => { await onFinish(); setShowFinishConfirm(false); }}
                className="flex-1 gradient-brand text-white font-semibold py-3 rounded-xl text-sm shadow-glow hover:opacity-90 transition-all"
              >
                Finalizar
              </button>
            </div>
            <button
              onClick={async () => { await onCancel(); setShowFinishConfirm(false); }}
              className="w-full text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Cancelar y descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExercisePicker({ onPick }: { onPick: (ex: Exercise) => void }) {
  const [search, setSearch] = useState('');
  const { exercises, loading } = useExercises(search, [], [], []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="w-full text-left bg-zinc-950 border border-zinc-800/30 rounded-lg px-3 py-2 hover:border-blue-500/30 transition-all"
            >
              <p className="text-xs font-medium text-white">{ex.name}</p>
              <p className="text-[10px] text-zinc-500">{ex.primary_muscle} · {ex.equipment}</p>
            </button>
          ))}
          {exercises.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-3">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}
