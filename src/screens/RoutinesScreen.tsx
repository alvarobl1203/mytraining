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
  Copy,
  Edit3,
  ArrowUp,
  ArrowDown,
  GripVertical,
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

type ScreenView = 'routines' | 'catalog';
type RoutineListView = 'byDay' | 'all';

export default function RoutinesScreen({ onStartWorkout }: RoutinesScreenProps) {
  const {
    routines,
    loading,
    createRoutine,
    updateRoutine,
    duplicateRoutine,
    deleteRoutine,
    addExerciseToRoutine,
    updateRoutineExercise,
    removeExerciseFromRoutine,
    reorderExercises,
  } = useRoutines();

  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);
  const [view, setView] = useState<ScreenView>('routines');
  const [listView, setListView] = useState<RoutineListView>('byDay');
  const [showCreate, setShowCreate] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineWithExercises | null>(null);
  const [addExerciseToRoutineId, setAddExerciseToRoutineId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const todayName = DAYS_OF_WEEK[(new Date().getDay() + 6) % 7] as DayOfWeek;

  useEffect(() => {
    if (!loading && routines.length > 0) {
      const todayHasRoutines = routines.some((r) =>
        (r.days_of_week || []).includes(todayName)
      );
      if (todayHasRoutines) setExpandedDay(todayName);
    }
  }, [loading, routines, todayName]);

  function flashSaved() {
    const id = crypto.randomUUID();
    setSavedFlash(id);
    setTimeout(() => setSavedFlash(null), 1500);
  }

  const routinesByDay = DAYS_OF_WEEK.map((day) => ({
    day,
    routines: routines.filter((r) => (r.days_of_week || []).includes(day)),
  }));

  const flexibleRoutines = routines.filter(
    (r) => (r.days_of_week || []).length === 0 ||
      (r.days_of_week || []).every((d) => d === 'Flexible')
  );

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

      {/* View toggle */}
      <div className="flex gap-1.5 bg-zinc-900 border border-zinc-800/50 rounded-xl p-1">
        <button
          onClick={() => setListView('byDay')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            listView === 'byDay'
              ? 'gradient-brand text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar size={12} /> Por día
        </button>
        <button
          onClick={() => setListView('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            listView === 'all'
              ? 'gradient-brand text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Library size={12} /> Todas
        </button>
      </div>

      {/* Today highlight */}
      {!loading && routines.some((r) => (r.days_of_week || []).includes(todayName)) && (
        <div className="bg-gradient-to-r from-blue-500/15 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-300">Hoy · {todayName}</span>
          </div>
          <div className="space-y-1.5">
            {routines.filter((r) => (r.days_of_week || []).includes(todayName)).map((r) => (
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

      {/* Saved flash */}
      {savedFlash && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-500/20 border border-blue-500/40 rounded-xl px-4 py-2 flex items-center gap-2 animate-pulse-glow">
          <Check size={14} className="text-cyan-300" />
          <span className="text-xs font-medium text-cyan-300">Guardado</span>
        </div>
      )}

      {showCreate && (
        <CreateRoutineForm
          onCreate={async (name, days, desc) => {
            await createRoutine(name, days, desc);
            setShowCreate(false);
            flashSaved();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editingRoutine && (
        <EditRoutineForm
          routine={editingRoutine}
          onUpdate={async (id, updates) => {
            await updateRoutine(id, updates);
            setEditingRoutine(null);
            flashSaved();
          }}
          onCancel={() => setEditingRoutine(null)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-cyan-400" />
        </div>
      ) : listView === 'byDay' ? (
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
                  {day === todayName && (
                    <span className="text-[9px] font-bold uppercase text-cyan-400">Hoy</span>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {hasRoutines ? (
                      dayRoutines.map((routine) => (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          onDelete={deleteRoutine}
                          onDuplicate={duplicateRoutine}
                          onEdit={setEditingRoutine}
                          onAddExercise={(rid) => setAddExerciseToRoutineId(rid)}
                          onRemoveExercise={async (reId) => {
                            await removeExerciseFromRoutine(reId);
                            flashSaved();
                          }}
                          onUpdateExercise={async (reId, opts) => {
                            await updateRoutineExercise(reId, opts);
                            flashSaved();
                          }}
                          onReorder={async (rid, orderedIds) => {
                            await reorderExercises(rid, orderedIds);
                          }}
                          onStartWorkout={onStartWorkout}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 py-2 text-center">
                        Sin rutinas para {day}.
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
                      onDuplicate={duplicateRoutine}
                      onEdit={setEditingRoutine}
                      onAddExercise={(rid) => setAddExerciseToRoutineId(rid)}
                      onRemoveExercise={async (reId) => {
                        await removeExerciseFromRoutine(reId);
                        flashSaved();
                      }}
                      onUpdateExercise={async (reId, opts) => {
                        await updateRoutineExercise(reId, opts);
                        flashSaved();
                      }}
                      onReorder={async (rid, orderedIds) => {
                        await reorderExercises(rid, orderedIds);
                      }}
                      onStartWorkout={onStartWorkout}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <AllRoutinesList
          routines={routines}
          onDelete={deleteRoutine}
          onDuplicate={duplicateRoutine}
          onEdit={setEditingRoutine}
          onAddExercise={(rid) => setAddExerciseToRoutineId(rid)}
          onRemoveExercise={async (reId) => {
            await removeExerciseFromRoutine(reId);
            flashSaved();
          }}
          onUpdateExercise={async (reId, opts) => {
            await updateRoutineExercise(reId, opts);
            flashSaved();
          }}
          onReorder={reorderExercises}
          onStartWorkout={onStartWorkout}
        />
      )}

      {addExerciseToRoutineId && (
        <AddExerciseModal
          routineId={addExerciseToRoutineId}
          onAdd={addExerciseToRoutine}
          onClose={() => setAddExerciseToRoutineId(null)}
          onAdded={flashSaved}
        />
      )}
    </div>
  );
}

/* ---------- Create Routine Form ---------- */
function CreateRoutineForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, days: DayOfWeek[], desc: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), selectedDays.length > 0 ? selectedDays : (['Flexible'] as DayOfWeek[]), desc.trim());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Nueva rutina</h3>
        <button onClick={onCancel} className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Push - Pecho y Tríceps"
          className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">
          Días de la semana <span className="text-zinc-600">(selecciona varios si quieres)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedDays.includes(d)
                  ? 'gradient-brand text-white shadow-glow'
                  : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
          <button
            onClick={() => setSelectedDays(['Flexible' as DayOfWeek])}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDays.includes('Flexible' as DayOfWeek)
                ? 'gradient-brand text-white shadow-glow'
                : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
            }`}
          >
            Flexible
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Descripción (opcional)</label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Ej. Volumen en pectoral, 4 ejercicios"
          className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={!name.trim() || saving}
        className="w-full gradient-brand text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        Crear rutina
      </button>
    </div>
  );
}

/* ---------- Edit Routine Form ---------- */
function EditRoutineForm({
  routine,
  onUpdate,
  onCancel,
}: {
  routine: RoutineWithExercises;
  onUpdate: (id: string, updates: { name?: string; description?: string; days_of_week?: DayOfWeek[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(routine.name);
  const [desc, setDesc] = useState(routine.description);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(routine.days_of_week || []);
  const [saving, setSaving] = useState(false);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(routine.id, {
        name: name.trim(),
        description: desc.trim(),
        days_of_week: selectedDays.length > 0 ? selectedDays : (['Flexible'] as DayOfWeek[]),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Editar rutina</h3>
        <button onClick={onCancel} className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Días asignados</label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedDays.includes(d)
                  ? 'gradient-brand text-white shadow-glow'
                  : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
          <button
            onClick={() => toggleDay('Flexible' as DayOfWeek)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDays.includes('Flexible' as DayOfWeek)
                ? 'gradient-brand text-white shadow-glow'
                : 'bg-zinc-950 border border-zinc-800/50 text-zinc-400'
            }`}
          >
            Flexible
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block">Descripción</label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full gradient-brand text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        Guardar cambios
      </button>
    </div>
  );
}

/* ---------- All Routines List ---------- */
function AllRoutinesList({
  routines,
  onDelete,
  onDuplicate,
  onEdit,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onReorder,
  onStartWorkout,
}: {
  routines: RoutineWithExercises[];
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onEdit: (routine: RoutineWithExercises) => void;
  onAddExercise: (routineId: string) => void;
  onRemoveExercise: (routineExerciseId: string) => Promise<void>;
  onUpdateExercise: (reId: string, opts: {
    target_sets?: number; target_reps?: string; target_rir?: number; rest_seconds?: number; technique?: Technique;
  }) => Promise<void>;
  onReorder: (routineId: string, orderedIds: string[]) => Promise<void>;
  onStartWorkout?: (routineId: string, routineName: string) => void;
}) {
  if (routines.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-8 text-center">
        <p className="text-sm text-zinc-500">No tienes rutinas creadas todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {routines.map((routine) => (
        <RoutineCard
          key={routine.id}
          routine={routine}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onEdit={onEdit}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onUpdateExercise={onUpdateExercise}
          onReorder={onReorder}
          onStartWorkout={onStartWorkout}
          showDays
        />
      ))}
    </div>
  );
}

/* ---------- Routine Card ---------- */
function RoutineCard({
  routine,
  onDelete,
  onDuplicate,
  onEdit,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onReorder,
  onStartWorkout,
  showDays,
}: {
  routine: RoutineWithExercises;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onEdit: (routine: RoutineWithExercises) => void;
  onAddExercise: (routineId: string) => void;
  onRemoveExercise: (routineExerciseId: string) => Promise<void>;
  onUpdateExercise: (reId: string, opts: {
    target_sets?: number; target_reps?: string; target_rir?: number; rest_seconds?: number; technique?: Technique;
  }) => Promise<void>;
  onReorder: (routineId: string, orderedIds: string[]) => Promise<void>;
  onStartWorkout?: (routineId: string, routineName: string) => void;
  showDays?: boolean;
}) {
  const [showExercises, setShowExercises] = useState(true);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function moveExercise(idx: number, dir: -1 | 1) {
    const exercises = routine.routine_exercises;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    const ordered = [...exercises];
    [ordered[idx], ordered[newIdx]] = [ordered[newIdx], ordered[idx]];
    onReorder(routine.id, ordered.map((e) => e.id));
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800/30 rounded-xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{routine.name}</h3>
          {routine.description && (
            <p className="text-[11px] text-zinc-500 mt-0.5">{routine.description}</p>
          )}
          {showDays && (routine.days_of_week || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(routine.days_of_week || []).map((d) => (
                <span key={d} className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-cyan-400">
                  {d.slice(0, 3)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
            onClick={() => onEdit(routine)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
            title="Editar rutina"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDuplicate(routine.id)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors"
            title="Duplicar rutina"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            title="Eliminar rutina"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-red-300">¿Eliminar esta rutina?</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onDelete(routine.id); setConfirmDelete(false); }}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-900/80 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

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
                <div key={re.id}>
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/30 rounded-lg px-2.5 py-2">
                    <GripVertical size={12} className="text-zinc-700 shrink-0" />
                    <span className="text-[10px] font-bold text-zinc-600 w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{re.exercises.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {re.target_sets}x{re.target_reps} · RIR {re.target_rir} · {re.rest_seconds}s
                        {re.technique !== 'Normal' && ` · ${re.technique}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => moveExercise(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded text-zinc-600 hover:text-cyan-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Subir"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => moveExercise(idx, 1)}
                        disabled={idx === routine.routine_exercises.length - 1}
                        className="p-1 rounded text-zinc-600 hover:text-cyan-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Bajar"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        onClick={() => setEditingExerciseId(editingExerciseId === re.id ? null : re.id)}
                        className="p-1 rounded text-zinc-600 hover:text-cyan-400 transition-colors"
                        title="Editar parámetros"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => onRemoveExercise(re.id)}
                        className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                        title="Quitar de la rutina"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {editingExerciseId === re.id && (
                    <EditExerciseInline
                      re={re}
                      onUpdate={async (opts) => {
                        await onUpdateExercise(re.id, opts);
                        setEditingExerciseId(null);
                      }}
                      onCancel={() => setEditingExerciseId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onAddExercise(routine.id)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-cyan-400 bg-zinc-900/50 border border-zinc-800/30 rounded-lg py-2 transition-all"
      >
        <Plus size={12} /> Añadir ejercicio
      </button>
    </div>
  );
}

/* ---------- Edit Exercise Inline ---------- */
function EditExerciseInline({
  re,
  onUpdate,
  onCancel,
}: {
  re: RoutineExercise & { exercises: Exercise };
  onUpdate: (opts: {
    target_sets: number; target_reps: string; target_rir: number; rest_seconds: number; technique: Technique;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [targetSets, setTargetSets] = useState(re.target_sets);
  const [targetReps, setTargetReps] = useState(re.target_reps);
  const [targetRir, setTargetRir] = useState(re.target_rir);
  const [restSeconds, setRestSeconds] = useState(re.rest_seconds);
  const [technique, setTechnique] = useState<Technique>(re.technique);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate({ target_sets: targetSets, target_reps: targetReps, target_rir: targetRir, rest_seconds: restSeconds, technique });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-1 bg-zinc-950 border border-zinc-800/50 rounded-lg p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Series</label>
          <input
            type="number"
            value={targetSets}
            onChange={(e) => setTargetSets(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={10}
            className="w-full bg-zinc-900 border border-zinc-800/50 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Reps</label>
          <input
            type="text"
            value={targetReps}
            onChange={(e) => setTargetReps(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800/50 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-zinc-400 mb-1 block">RIR</label>
          <input
            type="number"
            value={targetRir}
            onChange={(e) => setTargetRir(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
            max={5}
            className="w-full bg-zinc-900 border border-zinc-800/50 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Descanso</label>
          <select
            value={restSeconds}
            onChange={(e) => setRestSeconds(parseInt(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-800/50 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
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
        <div className="grid grid-cols-3 gap-1">
          {TECHNIQUES.map((t) => (
            <button
              key={t}
              onClick={() => setTechnique(t)}
              className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                technique === t
                  ? 'gradient-brand text-white'
                  : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 text-[11px] font-medium py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 gradient-brand text-white text-[11px] font-semibold py-2 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-all disabled:opacity-40"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ---------- Add Exercise Modal ---------- */
function AddExerciseModal({
  routineId,
  onAdd,
  onClose,
  onAdded,
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
  onAdded: () => void;
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
      onAdded();
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
