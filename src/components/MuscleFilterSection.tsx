import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MUSCLE_REGIONS } from '../lib/constants';
import { REGION_ICONS } from './icons/MuscleIcons';
import type { MuscleGroup } from '../types';

const REGION_COLORS: Record<string, string> = {
  Pecho: 'text-rose-400',
  Espalda: 'text-cyan-400',
  Hombro: 'text-amber-400',
  Brazos: 'text-blue-400',
  Pierna: 'text-emerald-400',
  Core: 'text-purple-400',
};

/** Comparador alfabético en español (case-insensitive, acentos ordenados). */
function compareEs(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base' });
}

export function MuscleFilterSection({
  selected,
  onToggle,
  onSetGroup,
  visibleRegions,
}: {
  selected: MuscleGroup[];
  onToggle: (m: MuscleGroup) => void;
  onSetGroup: (muscles: MuscleGroup[], select: boolean) => void;
  visibleRegions: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Ordena alfabéticamente las regiones visibles.
  const sortedRegions = [...visibleRegions].sort(compareEs);

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Músculo
      </p>
      <div className="space-y-2">
        {sortedRegions.map((region) => {
          const Icon = REGION_ICONS[region as keyof typeof REGION_ICONS];
          if (!Icon) return null;

          const color = REGION_COLORS[region] ?? 'text-zinc-400';

          // Ordena alfabéticamente los músculos dentro de la región.
          const rawMuscles = MUSCLE_REGIONS[region] ?? [];
          const muscles = [...rawMuscles].sort(compareEs);
          if (muscles.length === 0) return null;

          const selectedInGroup = muscles.filter((m) =>
            selected.includes(m),
          );
          const totalCount = muscles.length;
          const selectedCount = selectedInGroup.length;
          const allSelected = selectedCount === totalCount;
          const someSelected = selectedCount > 0 && !allSelected;
          const isOpen = expanded === region;

          return (
            <div
              key={region}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isOpen
                  ? 'border-zinc-700 bg-zinc-900/60'
                  : someSelected || allSelected
                    ? 'border-blue-500/30 bg-zinc-900/40'
                    : 'border-zinc-800/60 bg-zinc-950/40'
              }`}
            >
              <div className="flex items-stretch">
                {/* Botón principal: expandir / contraer */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : region)}
                  aria-expanded={isOpen}
                  aria-controls={`muscle-group-${region}`}
                  className="flex flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
                >
                  <Icon
                    size={20}
                    strokeWidth={1.6}
                    className={`shrink-0 ${color}`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-medium text-zinc-200">
                      {region}
                    </span>
                    <span
                      className={`text-[10px] tabular-nums ${
                        selectedCount > 0
                          ? 'text-blue-300'
                          : 'text-zinc-500'
                      }`}
                    >
                      {selectedCount} de {totalCount} seleccionados
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-zinc-500 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Botón circular: seleccionar todo / deseleccionar todo */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetGroup(muscles, !allSelected);
                  }}
                  className={`m-1.5 ml-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                    allSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : someSelected
                        ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                  aria-label={
                    allSelected
                      ? `Quitar selección de ${region}`
                      : `Seleccionar todo ${region}`
                  }
                >
                  {allSelected && (
                    <svg
                      viewBox="0 0 16 16"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3 8.5 L6.5 12 L13 4" />
                    </svg>
                  )}
                  {someSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              </div>

              {isOpen && (
                <div
                  id={`muscle-group-${region}`}
                  className="flex flex-wrap gap-1.5 border-t border-zinc-800/60 px-3 py-2.5"
                >
                  {muscles.map((m) => {
                    const on = selected.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onToggle(m)}
                        aria-pressed={on}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          on
                            ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}