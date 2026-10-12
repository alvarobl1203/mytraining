import { useEffect, useState } from 'react';
import { Play, Dumbbell, ChevronRight } from 'lucide-react';
import { useRoutines } from '../hooks/useRoutines';
import { LiveWorkoutScreen } from './LiveWorkoutScreen';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

export function TrainScreen({
  userId,
  initialRoutineId,
}: {
  userId: string;
  initialRoutineId?: string | null;
}) {
  const { routines } = useRoutines(userId);
  const [active, setActive] = useState<{ routineId: string | null } | null>(
    initialRoutineId ? { routineId: initialRoutineId } : null
  );

  useEffect(() => {
    if (initialRoutineId) setActive({ routineId: initialRoutineId });
  }, [initialRoutineId]);

  if (active) {
    return (
      <LiveWorkoutScreen
        userId={userId}
        routineId={active.routineId}
        onClose={() => setActive(null)}
      />
    );
  }

  const available = routines.filter((r) => r.exercises.length > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-extrabold tracking-tight">Entrenar</h1>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-grad-card p-6 text-center shadow-card">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-grad-radial"
        />

        <div className="relative">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-grad-brand text-white shadow-glow-blue">
            <Dumbbell size={26} />
          </span>
          <h2 className="text-base font-semibold">Sin entrenamiento activo</h2>
          <p className="mx-auto mt-1 max-w-[240px] text-xs leading-relaxed text-zinc-500">
            Inicia una sesión para registrar tus series, peso, repeticiones y descansos.
          </p>

          <div className="mt-5">
            <Button
              size="lg"
              icon={<Play size={14} fill="white" />}
              onClick={() => setActive({ routineId: null })}
            >
              Empezar entrenamiento
            </Button>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Rutinas disponibles
        </h3>

        {available.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Aún no tienes rutinas"
            description="Crea una en la pestaña Rutinas o descubre una plantilla."
          />
        ) : (
          <div className="space-y-2">
            {available.map((r) => (
              <button
                key={r.id}
                onClick={() => setActive({ routineId: r.id })}
                className="group flex w-full items-center justify-between rounded-2xl border border-zinc-800/50 bg-grad-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700/80 hover:shadow-card-hover active:translate-y-0 active:scale-[0.985]"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-100 transition-colors group-hover:text-white">
                    {r.name}
                  </p>
                  <p className="text-xs text-zinc-500">{r.exercises.length} ejercicios</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-blue-400 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}