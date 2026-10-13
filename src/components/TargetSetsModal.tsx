import { useEffect, useState } from 'react';
import { X, Minus, Plus, Layers } from 'lucide-react';
import type { Exercise } from '../types';

/**
 * Modal para elegir cuántas series quiere hacer el usuario en un ejercicio.
 * - Por defecto: 3
 * - Mínimo: 1 (nunca 0 ni negativos)
 * - Máximo: 20
 *
 * Se usa en:
 *   - LiveWorkoutScreen  (al añadir un ejercicio al entreno)
 *   - RoutinesScreen     (al añadir/editar un ejercicio a una rutina)
 */
export function TargetSetsModal({
  exercise,
  initialSets = 3,
  onConfirm,
  onCancel,
}: {
  exercise: Exercise;
  initialSets?: number;
  onConfirm: (sets: number) => void;
  onCancel: () => void;
}) {
  const [sets, setSets] = useState(() =>
    Math.max(1, Math.min(20, initialSets))
  );

  // Si el modal se reutiliza con otro ejercicio, resetea el valor
  useEffect(() => {
    setSets(Math.max(1, Math.min(20, initialSets)));
  }, [exercise.id, initialSets]);

  const clamp = (n: number) => Math.max(1, Math.min(20, n));

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md animate-scale-in rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        {/* Cabecera */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">
              Configurar ejercicio
            </p>
            <h2 className="mt-0.5 truncate text-base font-bold text-zinc-100">
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 rounded-lg p-1 text-zinc-500 hover:text-zinc-300"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pregunta */}
        <div className="mb-4 flex items-center gap-2">
          <Layers size={14} className="text-cyan-400" />
          <p className="text-xs text-zinc-400">
            ¿Cuántas series quieres hacer en este ejercicio?
          </p>
        </div>

        {/* Stepper grande */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setSets((s) => clamp(s - 1))}
            disabled={sets <= 1}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 transition active:scale-95 disabled:opacity-30"
            aria-label="Menos series"
          >
            <Minus size={20} />
          </button>

          <div className="min-w-[110px] rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-center">
            <p className="text-4xl font-extrabold tabular-nums leading-none text-cyan-300">
              {sets}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-cyan-400/70">
              {sets === 1 ? 'serie' : 'series'}
            </p>
          </div>

          <button
            onClick={() => setSets((s) => clamp(s + 1))}
            disabled={sets >= 20}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 transition active:scale-95 disabled:opacity-30"
            aria-label="Más series"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Atajos rápidos */}
        <div className="mb-5 flex flex-wrap justify-center gap-1.5">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setSets(n)}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                sets === n
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-3 text-sm font-semibold text-zinc-300 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(sets)}
            className="flex-1 rounded-2xl bg-grad-brand py-3 text-sm font-bold text-white shadow-cta active:scale-[0.98]"
          >
            Añadir al entreno
          </button>
        </div>
      </div>
    </div>
  );
}