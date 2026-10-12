import { AlertTriangle } from 'lucide-react';
import type { PlateauAlert } from '../lib/plateau';

export function PlateauCard({ alerts }: { alerts: PlateauAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {alerts.map((a) => (
        <div
          key={a.exercise.id}
          className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-400" />
            <p className="text-sm font-semibold text-red-300">Plateau detectado</p>
          </div>
          <p className="text-sm font-medium text-zinc-100">{a.exercise.name}</p>
          <p className="mt-1 text-[11px] text-zinc-400">
            1RM estimado últimas 3 semanas: {a.best1RmByWeek.map((v) => `${v}kg`).join(' → ')}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-300">
            {a.recommendation}
          </p>
        </div>
      ))}
    </div>
  );
}