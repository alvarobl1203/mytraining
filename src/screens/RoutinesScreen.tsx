import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  Check,
  Calendar,
  Play,
  Search,
  Library,
} from 'lucide-react';
import { useRoutines, type RoutineWithExercises } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import ExerciseCatalog from '@/components/ExerciseCatalog';
import {
  type DayOfWeek,
  type Technique,
  DAYS_OF_WEEK,
  TECHNIQUES,
  REST_OPTIONS,
} from '@/types/routine';
import type { Exercise } from '@/types/exercise';

interface RoutinesScreenProps {
  onStartWorkout?: (routineId: string, routineName: string) => void;
}

export default function RoutinesScreen({ onStartWorkout }: RoutinesScreenProps) {
  const {
    routines,
    loading,
    createRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    removeExerciseFromRoutine,
  } = useRoutines();

  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);
  const [view, setView] = useState<'routines' | 'catalog'>('routines');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDay, setNewDay] = useState<DayOfWeek>('Lunes');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [addExerciseToRoutineId, setAddExerciseToRoutineId] = useState<string | null>(null);

  const routinesByDay = DAYS_OF_WEEK.map((day) => ({
    day,
    routines: routines.filter((r) => r.day_of_week === day),
  }));

  const flexibleRoutines = routines.filter((r) => r.day_of_week === 'Flexible');

  const todayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7] as DayOfWeek;

  useEffect(() => {
    if (!loading && routines.length > 0) {
      const todayHasRoutines = routines.some((r) => r.day_of_week === todayName);
      if (todayHasRoutines) setExpandedDay(todayName);
    }
  }, [loading, routines, todayName]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createRoutine(newName.trim(), newDay, newDesc.trim());
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      setExpandedDay(newDay);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (view === 'catalog') {
    return (
      <div className="pt-2">
        <button
          onClick={() => setView('routines')}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
        >
          <ChevronRight size={16} className="rotate-180" /> Volver a rutinas
        </button>
        <ExerciseCatalog />
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Mis Rutinas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('catalog')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition-all"
          >
            <Library size={14} /> Catálogo
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl gradient-brand text-white shadow-glow hover:opacity-90 transition-all"
          >
            <Plus size={14} /> Nueva
          </button>
        </div>
      </div>

      {/* Today highlight */}
      {!loading && routines.some((r) => r.day_of_week === todayName) && (
        <div className="bg-gradient-to-r from-blue-500/15 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-300">Hoy · {todayName}</span>
          </div>
          <div className="space-y-1.5">
            {routines.filter((r) => r.day_of_week === todayName).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{r.name}</p>
                  <p className="text-[10px] text-zinc-400">{r.routine_exercises.length} ejercicios</p>
                </div>
                {onStartWorkout && r.routine_exercises.length > 0 && (
                  <button
                    onClick={() => onStartWorkout(r.id, r.name)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl gradient-brand text-white shadow-glow hover:opacity-90 transition-all shrink-0"
                  >
                    <Play size={12} fill="currentColor" /> Empezar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Nombre</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Push - Pecho y Tríceps"
              className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Día de la semana</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  onClick={() => setNewDay(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    newDay === d
                      ? 'gradient-brand text-white shadow-glow'
                      : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Descripción (opcional)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Ej. Volumen en pectoral, 4 ejercicios"
              className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
            className="w-full gradient-brand text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Crear rutina
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {routinesByDay.map(({ day, routines: dayRoutines }) => {
            const isExpanded = expandedDay === day;
            const hasRoutines = dayRoutines.length > 0;
            return (
              <div key={day} className="bg-zinc-900 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-800/30"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-zinc-500" />
                    ) : (
                      <ChevronRight size={16} className="text-zinc-500" />
                    )}
                    <span className="text-sm font-semibold text-white">{day}</span>
                    {hasRoutines && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-cyan-300">
                        {dayRoutines.length}
                      </span>
                    )}
                  </div>
                  <Calendar size={14} className="text-zinc-600" />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {hasRoutines ? (
                      dayRoutines.map((routine) => (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          onDelete={deleteRoutine}
                          onAddExercise={(rid) => setAddExerciseToRoutineId(rid)}
                          onRemoveExercise={removeExerciseFromRoutine}
                          onStartWorkout={onStartWorkout}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 py-2 text-center">
                        Sin rutinas para {day}. Crea una arriba.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {flexibleRoutines.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedDay(expandedDay === ('Flexible' as DayOfWeek) ? null : ('Flexible' as DayOfWeek))}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-800/30"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    size={16}
                    className={`text-zinc-500 transition-transform ${expandedDay === ('Flexible' as DayOfWeek) ? 'rotate-90' : ''}`}
                  />
                  <span className="text-sm font-semibold text-white">Flexible</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-cyan-300">
                    {flexibleRoutines.length}
                  </span>
                </div>
              </button>
              {expandedDay === ('Flexible' as DayOfWeek) && (
                <div className="px-4 pb-4 space-y-3">
                  {flexibleRoutines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      onDelete={deleteRoutine}
                      onAddExercise={(rid) => setAddExerciseToRoutineId(rid)}
                      onRemoveExercise={removeExerciseFromRoutine}
                      onStartWorkout={onStartWorkout}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {addExerciseToRoutineId && (
        <AddExerciseModal
          routineId={addExerciseToRoutineId}
          onAdd={addExerciseToRoutine}
          onClose={() => setAddExerciseToRoutineId(null)}
        />
      )}
    </div>
  );
}

function RoutineCard({
  routine,
  onDelete,
  onAddExercise,
  onRemoveExercise,
  onStartWorkout,
}: {
  routine: RoutineWithExercises;
  onDelete: (id: string) => Promise<void>;
  onAddExercise: (routineId: string) => void;
  onRemoveExercise: (routineExerciseId: string) => Promise<void>;
  onStartWorkout?: (routineId: string, routineName: string) => void;
}) {
  const [showExercises, setShowExercises] = useState(true);

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/30 rounded-xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{routine.name}</h3>
          {routine.description && (
            <p className="text-[11px] text-zinc-500 mt-0.5">{routine.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onStartWorkout && routine.routine_exercises.length > 0 && (
            <button
              onClick={() => onStartWorkout(routine.id, routine.name)}
              className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-cyan-300 hover:bg-blue-500/25 transition-all"
              title="Empezar entrenamiento"
            >
              <Play size={14} fill="currentColor" />
            </button>
          )}
          <button
            onClick={() => onAddExercise(routine.id)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
            title="Añadir ejercicio"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onDelete(routine.id)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            title="Eliminar rutina"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {routine.routine_exercises.length > 0 && (
        <div>
          <button
            onClick={() => setShowExercises(!showExercises)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            {showExercises ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {routine.routine_exercises.length} ejercicio{routine.routine_exercises.length !== 1 ? 's' : ''}
          </button>

          {showExercises && (
            <div className="mt-2 space-y-1.5">
              {routine.routine_exercises.map((re, idx) => (
                <div
                  key={re.id}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/30 rounded-lg px-3 py-2"
                >
                  <span className="text-[10px] font-bold text-zinc-600 w-5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{re.exercises.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {re.target_sets}x{re.target_reps} · RIR {re.target_rir} · {re.rest_seconds}s
                      {re.technique !== 'Normal' && ` · ${re.technique}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveExercise(re.id)}
                    className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddExerciseModal({
  routineId,
  onAdd,
  onClose,
}: {
  routineId: string;
  onAdd: (
    routineId: string,
    exerciseId: string,
    opts: {
      target_sets: number;
      target_reps: string;
      target_rir: number;
      rest_seconds: number;
      technique: Technique;
    }
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState('8-12');
  const [targetRir, setTargetRir] = useState(2);
  const [restSeconds, setRestSeconds] = useState(90);
  const [technique, setTechnique] = useState<Technique>('Normal');
  const [saving, setSaving] = useState(false);

  const { exercises, loading: exLoading } = useExercises(search, [], [], []);

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    try {
      await onAdd(routineId, selected.id, {
        target_sets: targetSets,
        target_reps: targetReps,
        target_rir: targetRir,
        rest_seconds: restSeconds,
        technique,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center safe-bottom">
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
          <h3 className="text-base font-bold text-white">Añadir Ejercicio</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {!selected ? (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ejercicio..."
                  className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
              {exLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-cyan-400" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {exercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setSelected(ex)}
                      className="w-full text-left bg-zinc-950 border border-zinc-800/30 rounded-xl px-3 py-2.5 hover:border-blue-500/30 transition-all"
                    >
                      <p className="text-xs font-medium text-white">{ex.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {ex.primary_muscle} · {ex.equipment}
                      </p>
                    </button>
                  ))}
                  {exercises.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-4">Sin resultados</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-zinc-950 border border-zinc-800/30 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{selected.name}</p>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {selected.primary_muscle} · {selected.equipment}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 mb-1.5 block">Series</label>
                  <input
                    type="number"
                    value={targetSets}
                    onChange={(e) => setTargetSets(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={10}
                    className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 mb-1.5 block">Repeticiones</label>
                  <input
                    type="text"
                    value={targetReps}
                    onChange={(e) => setTargetReps(e.target.value)}
                    placeholder="8-12"
                    className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 mb-1.5 block">RIR objetivo</label>
                  <input
                    type="number"
                    value={targetRir}
                    onChange={(e) => setTargetRir(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    max={5}
                    className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 mb-1.5 block">Descanso (s)</label>
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
                <label className="text-[10px] font-medium text-zinc-400 mb-1.5 block">Técnica</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TECHNIQUES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTechnique(t)}
                      className={`py-2 rounded-xl text-[10px] font-medium transition-all ${
                        technique === t
                          ? 'gradient-brand text-white shadow-glow'
                          : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={saving}
                className="w-full gradient-brand text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Añadir a la rutina
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
