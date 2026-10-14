import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Pencil,
  Trash2,
  X,
  GripVertical,
  Plus,
  Sparkles,
  ClipboardList,
  Moon,
  Sun,
  Share2,
} from 'lucide-react';
import { useRoutines, type RoutineWithExercises } from '../hooks/useRoutines';
import { useExercises } from '../hooks/useExercises';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { DAY_LABELS } from '../lib/constants';
import { ROUTINE_TEMPLATES } from '../lib/templates';
import { CatalogScreen } from './CatalogScreen';
import { ListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { WeekComparisonBadge } from '../components/WeekComparisonBadge';
import { PlanExportSheet } from '../components/PlanExportSheet';
import { TargetSetsModal } from '../components/TargetSetsModal';
import { weekdayIndex } from '../lib/date';
import { supabase } from '../lib/supabase';
import type { Exercise } from '../types';

type Props = {
  userId: string;
  onStartWorkout: (routineId: string) => void;
};

interface PlanGroup {
  name: string;
  days: RoutineWithExercises[];
}

const DEFAULT_TARGET_SETS = 3;

export function RoutinesScreen({ userId, onStartWorkout }: Props) {
  const {
    routines,
    loading,
    create,
    update,
    remove,
    removePlan,
    removeRoutineExercise,
    reorder,
    installTemplate,
  } = useRoutines(userId);
  const { exercises } = useExercises();
  const { preferences } = useUserPreferences(userId);

  const [tab, setTab] = useState<'plans' | 'days'>('plans');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [catalogFor, setCatalogFor] = useState<string | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [addingDayFor, setAddingDayFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [exporting, setExporting] = useState<{ planName: string } | null>(null);

  // Modal de series objetivo al añadir un ejercicio a una rutina
  const [pendingRoutineExercise, setPendingRoutineExercise] = useState<{
    routineId: string;
    exercise: Exercise;
  } | null>(null);

  // Modal de series objetivo al editar un ejercicio ya añadido
  const [editingRoutineExercise, setEditingRoutineExercise] = useState<{
    routineId: string;
    routineExerciseId: string;
    exercise: Exercise;
    currentTargetSets: number;
  } | null>(null);

  const plans = useMemo<PlanGroup[]>(() => {
    const map = new Map<string, RoutineWithExercises[]>();
    routines.forEach((r) => {
      const key = r.planName ?? r.name;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    const out = Array.from(map.entries()).map(([name, days]) => ({
      name,
      days: days
        .slice()
        .sort((a, b) => (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99)),
    }));
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [routines]);

  const todayIdx = weekdayIndex(new Date());

  // ---------------------------------------------------------------------------
  // Helpers de rutina_exercise
  // ---------------------------------------------------------------------------
  async function reloadDay(routineId: string): Promise<void> {
    // Truco: usar reorder con los ids actuales fuerza re-fetch en el hook
    const { data } = await supabase
      .from('routine_exercises')
      .select('id')
      .eq('routine_id', routineId)
      .order('position', { ascending: true });
    if (data && data.length > 0) {
      await reorder(
        routineId,
        data.map((r) => r.id as string)
      );
    }
  }

  async function addExerciseWithTarget(
    routineId: string,
    exerciseId: string,
    targetSets: number
  ): Promise<void> {
    const safe = Math.max(1, Math.min(20, targetSets));

    // Calcular la siguiente posición al final
    const { data: maxPos } = await supabase
      .from('routine_exercises')
      .select('position')
      .eq('routine_id', routineId)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos =
      ((maxPos?.[0]?.position as number | undefined) ?? -1) + 1;

    // Insertar con target
    const { error } = await supabase.from('routine_exercises').insert({
      routine_id: routineId,
      exercise_id: exerciseId,
      position: nextPos,
      target_sets: safe,
      target_reps_min: 8,
      target_reps_max: 12,
      target_rir: 2,
      rest_seconds: preferences.restDefaultSec,
    });
    if (error) throw error;

    // Refrescar
    await reloadDay(routineId);
  }

  async function updateRoutineExerciseTarget(
    routineId: string,
    routineExerciseId: string,
    targetSets: number
  ): Promise<void> {
    const safe = Math.max(1, Math.min(20, targetSets));
    const { error } = await supabase
      .from('routine_exercises')
      .update({ target_sets: safe })
      .eq('id', routineExerciseId);
    if (error) throw error;

    await reloadDay(routineId);
  }

  // ---------------------------------------------------------------------------
  // Catálogo
  // ---------------------------------------------------------------------------
  if (catalogFor) {
    return (
      <CatalogScreen
        userId={userId}
        onBack={() => setCatalogFor(null)}
        onPick={(ex) => {
          // NO añadimos directo: abrimos modal para elegir series objetivo
          setPendingRoutineExercise({ routineId: catalogFor, exercise: ex });
          setCatalogFor(null);
        }}
      />
    );
  }

  async function handleCreatePlan(name: string, firstDay: number | null) {
    if (!name.trim()) return;
    try {
      await create({
        planName: name.trim(),
        dayOfWeek: firstDay,
        dayLabel: null,
      });
    } catch (e) {
      console.error('[handleCreatePlan] error:', e);
      alert('No se pudo crear el plan.');
      return;
    }
    setCreatingPlan(false);
  }

  async function handleAddDay(
    planName: string,
    dayOfWeek: number,
    label: string | null,
    isRest: boolean
  ) {
    const conflicts = routines.filter(
      (r) =>
        (r.planName ?? r.name) === planName && r.dayOfWeek === dayOfWeek
    );

    if (conflicts.length > 0) {
      const prev = conflicts[0];
      const prevKind = prev.isRest
        ? 'descanso'
        : `sesión${prev.dayLabel ? ` "${prev.dayLabel}"` : ''}`;
      const newKind = isRest
        ? 'descanso'
        : `sesión${label ? ` "${label}"` : ''}`;

      const ok = window.confirm(
        `Ya tienes un ${prevKind} el mismo día en este plan.\n\n¿Quieres reemplazarlo por ${newKind}?`
      );
      if (!ok) return;

      try {
        for (const c of conflicts) {
          await remove(c.id);
        }
      } catch (e) {
        console.error('[handleAddDay] error borrando conflicto:', e);
        alert('No se pudo reemplazar el día. Revisa tu conexión.');
        return;
      }
    }

    try {
      await create({ planName, dayOfWeek, dayLabel: label, isRest });
    } catch (e) {
      console.error('[handleAddDay] error creando:', e);
      alert('No se pudo añadir el día.');
      return;
    }
    setAddingDayFor(null);
  }

  async function handleInstallTemplate(tplId: string) {
    const tpl = ROUTINE_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    const lookup = new Map(exercises.map((e) => [e.name, e.id]));
    await installTemplate(tpl, lookup);
    setShowTemplates(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-extrabold tracking-tight">
            Mis Rutinas
          </h1>
          <WeekComparisonBadge userId={userId} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition-all duration-200 hover:border-zinc-700 active:scale-[0.97]"
          >
            <Sparkles size={13} /> Plantillas
          </button>
          <button
            onClick={() => setCreatingPlan(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-grad-brand px-3.5 py-2 text-xs font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.97]"
          >
            <Plus size={14} /> Nuevo plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-1">
        <button
          onClick={() => setTab('plans')}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-200 ${
            tab === 'plans'
              ? 'bg-grad-brand text-white shadow-cta'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Por plan
        </button>
        <button
          onClick={() => setTab('days')}
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-200 ${
            tab === 'days'
              ? 'bg-grad-brand text-white shadow-cta'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Por día
        </button>
      </div>

      {/* Contenido */}
      {loading ? (
        <ListSkeleton count={3} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aún no tienes planes"
          description="Crea un plan semanal (ej. Rutina Alvaro) o instala una plantilla."
        />
      ) : tab === 'plans' ? (
        <div className="space-y-3">
          {plans.map((plan) => {
            const isOpen = expandedPlan === plan.name;
            const totalExercises = plan.days.reduce(
              (a, d) => a + d.exercises.length,
              0
            );
            const restCount = plan.days.filter((d) => d.isRest).length;

            return (
              <div
                key={plan.name}
                className="rounded-2xl border border-zinc-800/70 bg-grad-card shadow-card"
              >
                <button
                  onClick={() => setExpandedPlan(isOpen ? null : plan.name)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {plan.days.length} días · {totalExercises} ejercicios
                      {restCount > 0 && ` · ${restCount} descanso`}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-zinc-500" />
                  ) : (
                    <ChevronDown size={16} className="text-zinc-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="animate-fade-in space-y-1.5 border-t border-zinc-800/60 px-3 py-3">
                    {plan.days.map((day) => {
                      const dow = day.dayOfWeek ?? -1;
                      const isToday = dow === todayIdx;
                      const isDayOpen = expandedDay === day.id;
                      const label = day.dayLabel ?? day.name;
                      const dayName = dow >= 0 ? DAY_LABELS[dow] : '—';

                      return (
                        <div
                          key={day.id}
                          className={`rounded-xl border ${
                            day.isRest
                              ? 'border-zinc-800/60 bg-zinc-950/40'
                              : 'border-zinc-800/60 bg-zinc-950/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 px-2.5 py-2">
                            <button
                              onClick={() =>
                                setExpandedDay(isDayOpen ? null : day.id)
                              }
                              className="flex flex-1 items-center gap-2 text-left"
                            >
                              <span className="w-16 shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                                {dayName}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs font-medium">
                                {day.isRest ? (
                                  <>
                                    <Moon size={11} className="text-zinc-500" />
                                    <span className="text-zinc-400">
                                      {label && label !== plan.name
                                        ? label
                                        : 'Descanso'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Sun size={11} className="text-cyan-400" />
                                    <span className="text-zinc-100">
                                      {label !== plan.name ? label : 'Sesión'}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">
                                      ({day.exercises.length})
                                    </span>
                                  </>
                                )}
                              </span>
                              {isToday && (
                                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-cyan-400">
                                  HOY
                                </span>
                              )}
                            </button>

                            {!day.isRest && day.exercises.length > 0 && (
                              <button
                                onClick={() => onStartWorkout(day.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 transition-colors hover:bg-blue-500/25"
                              >
                                <Play size={12} fill="currentColor" />
                              </button>
                            )}
                            <button
                              onClick={() => setRenaming(day.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => remove(day.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {isDayOpen && !day.isRest && (
                            <div className="animate-fade-in space-y-1.5 border-t border-zinc-800/60 px-2 py-2">
                              {day.exercises.map((re, idx) => (
                                <div
                                  key={re.id}
                                  draggable
                                  onDragStart={(e) =>
                                    e.dataTransfer.setData('text/plain', re.id)
                                  }
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const draggedId =
                                      e.dataTransfer.getData('text/plain');
                                    if (!draggedId || draggedId === re.id)
                                      return;
                                    const ids = day.exercises.map((x) => x.id);
                                    const from = ids.indexOf(draggedId);
                                    const to = ids.indexOf(re.id);
                                    if (from === -1 || to === -1) return;
                                    ids.splice(from, 1);
                                    ids.splice(to, 0, draggedId);
                                    void reorder(day.id, ids);
                                  }}
                                  className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-2 py-1.5"
                                >
                                  <GripVertical
                                    size={11}
                                    className="cursor-grab text-zinc-600"
                                  />
                                  <span className="w-4 text-[10px] text-zinc-500">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-medium">
                                      {re.exercise?.name ?? '—'}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                      {re.targetSets}×{re.targetRepsMin}-
                                      {re.targetRepsMax} · RIR {re.targetRir} ·{' '}
                                      {re.restSeconds}s
                                    </p>
                                  </div>
                                  {/* Editar series objetivo */}
                                  <button
                                    onClick={() => {
                                      if (!re.exercise) return;
                                      setEditingRoutineExercise({
                                        routineId: day.id,
                                        routineExerciseId: re.id,
                                        exercise: re.exercise,
                                        currentTargetSets: re.targetSets,
                                      });
                                    }}
                                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 hover:text-cyan-400"
                                    aria-label="Editar series objetivo"
                                  >
                                    <Pencil size={10} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      removeRoutineExercise(re.id)
                                    }
                                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 hover:text-red-400"
                                    aria-label="Eliminar ejercicio"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}

                              <button
                                onClick={() => setCatalogFor(day.id)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-800 py-2 text-[11px] text-zinc-500 transition-colors hover:border-blue-500 hover:text-blue-400"
                              >
                                <Plus size={11} /> Añadir ejercicio
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => setAddingDayFor(plan.name)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 py-2.5 text-[11px] text-zinc-400 transition-colors hover:border-blue-500 hover:text-blue-400"
                      >
                        <Plus size={11} /> Añadir día
                      </button>
                      <button
                        onClick={() => setExporting({ planName: plan.name })}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2.5 text-[11px] text-cyan-400 transition-colors hover:bg-cyan-500/10"
                      >
                        <Share2 size={11} /> Exportar
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Eliminar el plan "${plan.name}" completo?`
                            )
                          ) {
                            void removePlan(plan.name);
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-[11px] text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 size={11} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {DAY_LABELS.map((label, i) => {
            const daysOfWeek = routines.filter((r) => r.dayOfWeek === i);
            const isToday = i === todayIdx;
            const allRest =
              daysOfWeek.length > 0 && daysOfWeek.every((d) => d.isRest);
            return (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800/70 bg-grad-card p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {allRest ? (
                      <Moon size={14} className="text-zinc-500" />
                    ) : (
                      <Sun size={14} className="text-cyan-400" />
                    )}
                    <span className="text-sm font-semibold">{label}</span>
                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400">
                        HOY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {daysOfWeek.length}{' '}
                    {daysOfWeek.length === 1 ? 'plan' : 'planes'}
                  </span>
                </div>
                {daysOfWeek.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {daysOfWeek.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-zinc-400">
                          {d.planName ?? d.name}
                          {d.dayLabel && d.dayLabel !== d.planName && (
                            <span className="ml-1 text-zinc-500">
                              · {d.dayLabel}
                            </span>
                          )}
                        </span>
                        <span className="text-zinc-500">
                          {d.isRest ? 'Descanso' : `${d.exercises.length} ej.`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modales existentes */}
      {creatingPlan && (
        <NewPlanModal
          onClose={() => setCreatingPlan(false)}
          onCreate={handleCreatePlan}
        />
      )}

      {addingDayFor && (
        <AddDayModal
          planName={addingDayFor}
          occupiedDays={routines
            .filter(
              (r) =>
                (r.planName ?? r.name) === addingDayFor &&
                r.dayOfWeek !== null
            )
            .map((r) => r.dayOfWeek as number)}
          onClose={() => setAddingDayFor(null)}
          onCreate={handleAddDay}
        />
      )}

      {renaming && (
        <RenameDayModal
          routine={routines.find((r) => r.id === renaming)!}
          onClose={() => setRenaming(null)}
          onSave={async (patch) => {
            const current = routines.find((r) => r.id === renaming);
            if (!current) {
              setRenaming(null);
              return;
            }

            if (
              patch.dayOfWeek !== undefined &&
              patch.dayOfWeek !== null &&
              patch.dayOfWeek !== current.dayOfWeek
            ) {
              const planKey = current.planName ?? current.name;
              const conflicts = routines.filter(
                (r) =>
                  r.id !== current.id &&
                  (r.planName ?? r.name) === planKey &&
                  r.dayOfWeek === patch.dayOfWeek
              );

              if (conflicts.length > 0) {
                const nextLabel = patch.dayLabel ?? current.dayLabel ?? '';
                const nextIsRest =
                  patch.isRest !== undefined ? patch.isRest : current.isRest;
                const kind = nextIsRest ? 'descanso' : `sesión "${nextLabel}"`;
                const dayName =
                  patch.dayOfWeek >= 0 ? DAY_LABELS[patch.dayOfWeek] : '—';

                const ok = window.confirm(
                  `El ${dayName} ya tiene una entrada en este plan.\n\n¿Quieres reemplazarla por ${kind}?`
                );
                if (!ok) return;

                try {
                  for (const c of conflicts) {
                    await remove(c.id);
                  }
                } catch (e) {
                  console.error(
                    '[RenameDayModal] error borrando conflicto:',
                    e
                  );
                  alert('No se pudo reemplazar el día.');
                  return;
                }
              }
            }

            await update(renaming, patch);
            setRenaming(null);
          }}
        />
      )}

      {showTemplates && (
        <TemplateDrawer
          onClose={() => setShowTemplates(false)}
          onInstall={handleInstallTemplate}
        />
      )}

      {exporting && (
        <PlanExportSheet
          routines={
            plans.find((p) => p.name === exporting.planName)?.days ?? []
          }
          planName={exporting.planName}
          onClose={() => setExporting(null)}
        />
      )}

      {/* Modal series objetivo: al añadir un ejercicio nuevo */}
      {pendingRoutineExercise && (
        <TargetSetsModal
          exercise={pendingRoutineExercise.exercise}
          initialSets={DEFAULT_TARGET_SETS}
          onCancel={() => setPendingRoutineExercise(null)}
          onConfirm={async (n) => {
            const { routineId, exercise } = pendingRoutineExercise;
            setPendingRoutineExercise(null);
            try {
              await addExerciseWithTarget(routineId, exercise.id, n);
            } catch (e) {
              console.error('[addExerciseWithTarget] error:', e);
              alert('No se pudo añadir el ejercicio.');
            }
          }}
        />
      )}

      {/* Modal series objetivo: al editar un ejercicio existente */}
      {editingRoutineExercise && (
        <TargetSetsModal
          exercise={editingRoutineExercise.exercise}
          initialSets={editingRoutineExercise.currentTargetSets}
          onCancel={() => setEditingRoutineExercise(null)}
          onConfirm={async (n) => {
            const { routineId, routineExerciseId } = editingRoutineExercise;
            setEditingRoutineExercise(null);
            try {
              await updateRoutineExerciseTarget(
                routineId,
                routineExerciseId,
                n
              );
            } catch (e) {
              console.error('[updateRoutineExerciseTarget] error:', e);
              alert('No se pudo actualizar las series.');
            }
          }}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Modales auxiliares (sin cambios)
// ===========================================================================

function NewPlanModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, firstDay: number | null) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [firstDay, setFirstDay] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate(name.trim(), firstDay);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full animate-scale-in rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo plan semanal</h2>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Rutina Alvaro"
          className="mb-3 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500"
        />
        <p className="mb-1.5 text-xs text-zinc-400">Primer día del plan</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFirstDay(null)}
            className={`rounded-full border px-3 py-1 text-xs ${
              firstDay === null
                ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                : 'border-zinc-800 text-zinc-400'
            }`}
          >
            Sin día
          </button>
          {DAY_LABELS.map((l, i) => (
            <button
              key={i}
              onClick={() => setFirstDay(i)}
              className={`rounded-full border px-3 py-1 text-xs ${
                firstDay === i
                  ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                  : 'border-zinc-800 text-zinc-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={busy || !name.trim()}
          className="w-full rounded-2xl bg-grad-brand py-3 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Creando…' : 'Crear plan'}
        </button>
      </div>
    </div>
  );
}

function AddDayModal({
  planName,
  occupiedDays,
  onClose,
  onCreate,
}: {
  planName: string;
  occupiedDays: number[];
  onClose: () => void;
  onCreate: (
    planName: string,
    dayOfWeek: number,
    label: string | null,
    isRest: boolean
  ) => Promise<void>;
}) {
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [label, setLabel] = useState('');
  const [isRest, setIsRest] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onCreate(planName, dayOfWeek, label.trim() || null, isRest);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full animate-scale-in rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Añadir día</h2>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>
        <p className="mb-4 text-xs text-zinc-500">Plan: {planName}</p>

        <p className="mb-1.5 text-xs text-zinc-400">Día de la semana</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {DAY_LABELS.map((l, i) => {
            const occupied = occupiedDays.includes(i);
            const selected = dayOfWeek === i;
            return (
              <button
                key={i}
                onClick={() => setDayOfWeek(i)}
                className={`relative rounded-full border px-3 py-1 text-xs transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                    : occupied
                      ? 'border-amber-500/40 bg-amber-500/5 text-amber-300'
                      : 'border-zinc-800 text-zinc-400'
                }`}
                title={occupied ? 'Este día ya tiene una entrada' : undefined}
              >
                {l}
                {occupied && !selected && (
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
        {occupiedDays.includes(dayOfWeek) && (
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] leading-relaxed text-amber-300">
            ⚠️ Este día ya tiene una entrada en el plan. Al guardar, se
            reemplazará.
          </p>
        )}

        <button
          onClick={() => setIsRest((v) => !v)}
          className={`mb-3 flex w-full items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition-all ${
            isRest
              ? 'border-zinc-600 bg-zinc-800/60 text-zinc-200'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
          }`}
        >
          <Moon size={14} />
          <span className="font-medium">
            {isRest ? 'Este día es descanso' : 'Marcar como descanso'}
          </span>
        </button>

        {!isRest && (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej. Espalda, Pecho, Piernas…"
            className="mb-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-2xl bg-grad-brand py-3 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Añadiendo…' : 'Añadir día'}
        </button>
      </div>
    </div>
  );
}

function RenameDayModal({
  routine,
  onClose,
  onSave,
}: {
  routine: RoutineWithExercises;
  onClose: () => void;
  onSave: (patch: {
    dayLabel?: string | null;
    isRest?: boolean;
    dayOfWeek?: number | null;
  }) => Promise<void>;
}) {
  const [label, setLabel] = useState(routine.dayLabel ?? '');
  const [isRest, setIsRest] = useState(routine.isRest);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(routine.dayOfWeek);
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full animate-scale-in rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Editar día</h2>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <p className="mb-1.5 text-xs text-zinc-400">Día de la semana</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {DAY_LABELS.map((l, i) => (
            <button
              key={i}
              onClick={() => setDayOfWeek(i)}
              className={`rounded-full border px-3 py-1 text-xs ${
                dayOfWeek === i
                  ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                  : 'border-zinc-800 text-zinc-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsRest((v) => !v)}
          className={`mb-3 flex w-full items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition-all ${
            isRest
              ? 'border-zinc-600 bg-zinc-800/60 text-zinc-200'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
          }`}
        >
          <Moon size={14} />
          <span className="font-medium">
            {isRest ? 'Día de descanso' : 'Día de entrenamiento'}
          </span>
        </button>

        {!isRest && (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej. Espalda"
            className="mb-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        )}

        <button
          onClick={async () => {
            setBusy(true);
            try {
              await onSave({
                dayLabel: label.trim() || null,
                isRest,
                dayOfWeek,
              });
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="w-full rounded-2xl bg-grad-brand py-3 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

const GOAL_COLORS: Record<string, string> = {
  Principiante: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  Fuerza: 'border-red-500/30 bg-red-500/10 text-red-300',
  Hipertrofia: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Volumen: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  Casa: 'border-zinc-600/60 bg-zinc-800/60 text-zinc-300',
  Mujer: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
};

function TemplateDrawer({
  onClose,
  onInstall,
}: {
  onClose: () => void;
  onInstall: (id: string) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Plantillas</h2>
            <p className="text-[11px] text-zinc-500">
              {ROUTINE_TEMPLATES.length} rutinas preparadas
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <div className="space-y-2.5">
          {ROUTINE_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-zinc-800/70 bg-grad-card p-4 shadow-card"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{t.name}</h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    GOAL_COLORS[t.goal] ??
                    'border-zinc-700 bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {t.goal}
                </span>
              </div>
              <p className="text-xs text-zinc-500">{t.description}</p>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                {t.exercises.length} ejercicios · {t.daysPerWeek}×/semana
              </p>
              <button
                onClick={() => onInstall(t.id)}
                className="mt-3 w-full rounded-xl bg-grad-brand py-2.5 text-xs font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.98]"
              >
                Instalar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}