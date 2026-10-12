import type { MuscleGroup } from '../types';

export function MuscleBadges({
  primary,
  secondary,
  size = 'md',
}: {
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  size?: 'sm' | 'md';
}) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={`
          inline-flex items-center rounded-full
          border border-blue-500/40
          bg-grad-brand-soft
          font-semibold text-blue-300
          shadow-[0_0_12px_-4px_rgba(59,130,246,0.6)]
          transition-all duration-200
          ${padding}
        `}
      >
        {primary}
      </span>
      {secondary.map((m) => (
        <span
          key={m}
          className={`
            inline-flex items-center rounded-full
            border border-zinc-700/50
            bg-zinc-800/60
            text-zinc-400
            ${padding}
          `}
        >
          {m}
        </span>
      ))}
    </div>
  );
}