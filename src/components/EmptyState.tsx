import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800/70 bg-zinc-900/30 px-6 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-grad-brand-soft text-cyan-400 shadow-glow-soft">
        <Icon size={22} strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold text-zinc-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}