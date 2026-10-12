import { EXERCISE_TYPES } from '../lib/exerciseCategories';
import type { ExerciseType } from '../types';

export function DisciplineFilterBar({
  active,
  onChange,
  counts,
}: {
  active: ExerciseType | 'all';
  onChange: (t: ExerciseType | 'all') => void;
  counts?: Partial<Record<ExerciseType, number>>;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-3 overflow-x-auto border-b border-zinc-800/60 bg-zinc-950/95 px-4 py-2 backdrop-blur">
      <div className="flex gap-1.5">
        <Tab
          label="Todas"
          icon="🎯"
          active={active === 'all'}
          onClick={() => onChange('all')}
        />
        {EXERCISE_TYPES.map((t) => (
          <Tab
            key={t.type}
            label={t.label}
            icon={t.icon}
            active={active === t.type}
            onClick={() => onChange(t.type)}
            count={counts?.[t.type]}
          />
        ))}
      </div>
    </div>
  );
}

function Tab({
  label, icon, active, onClick, count,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-0.5 rounded-full bg-zinc-800 px-1.5 text-[9px] text-zinc-500">
          {count}
        </span>
      )}
    </button>
  );
}