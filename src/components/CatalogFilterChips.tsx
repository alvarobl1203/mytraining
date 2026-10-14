// ===========================================================================
// MyTraining — Chips multi-selección reutilizables para filtros
// ===========================================================================

import type { FilterOption } from '../lib/catalogFilters';

export function CatalogFilterChips({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              aria-pressed={on}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                on
                  ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}