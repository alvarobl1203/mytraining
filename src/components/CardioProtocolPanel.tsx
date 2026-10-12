import { Activity } from 'lucide-react';
import type { CardioProtocol } from '../lib/cardioTechniques';

const ZONE_COLORS: Record<string, string> = {
  Z1: 'text-zinc-400 border-zinc-700',
  Z2: 'text-emerald-400 border-emerald-500/40',
  Z3: 'text-yellow-400 border-yellow-500/40',
  Z4: 'text-orange-400 border-orange-500/40',
  Z5: 'text-red-400 border-red-500/40',
};

export function CardioProtocolPanel({
  protocols,
  selectedId,
  onSelect,
}: {
  protocols: CardioProtocol[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Activity size={12} className="text-cyan-400" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Protocolo de cardio
        </p>
      </div>

      <div className="space-y-1.5">
        {protocols.map((p) => {
          const on = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(on ? null : p.id)}
              className={`w-full rounded-xl border p-2.5 text-left transition ${
                on
                  ? 'border-cyan-500/50 bg-cyan-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p
                  className={`text-xs font-semibold ${
                    on ? 'text-cyan-200' : 'text-zinc-200'
                  }`}
                >
                  {p.name}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${
                    ZONE_COLORS[p.intensity] ?? 'text-zinc-400 border-zinc-700'
                  }`}
                >
                  {p.intensity}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-500">
                {p.description}
              </p>
              <p className="mt-1 text-[10px] tabular-nums text-zinc-400">
                {p.protocol} · {p.durationMin} min
              </p>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <button
          onClick={() => onSelect(null)}
          className="mt-2 w-full rounded-lg border border-dashed border-zinc-800 py-1.5 text-[10px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
        >
          Quitar protocolo
        </button>
      )}
    </div>
  );
}