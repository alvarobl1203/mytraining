import type { ReactNode } from 'react';

interface PlaceholderProps {
  title: string;
  message: string;
  icon?: ReactNode;
}

export default function Placeholder({ title, message, icon }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      {icon && (
        <div className="mb-4 h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-zinc-400 max-w-xs">{message}</p>
    </div>
  );
}
