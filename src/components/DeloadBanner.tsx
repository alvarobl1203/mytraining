import { AlertTriangle, Moon, ShieldCheck, TrendingDown } from 'lucide-react';
import type { DeloadSignals } from '../lib/deload';

export function DeloadBanner({ deload }: { deload: DeloadSignals }) {
  if (deload.level === 'ok' || deload.level === 'warning') return null;

  const config = {
    mandatory: {
      Icon: AlertTriangle,
      title: 'Semana de descarga obligatoria',
      ring: 'border-red-500/40 bg-red-500/5',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      bar: 'bg-red-500',
    },
    recommended: {
      Icon: Moon,
      title: 'Semana de descarga recomendada',
      ring: 'border-amber-500/40 bg-amber-500/5',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      bar: 'bg-amber-500',
    },
    warning: {
      Icon: ShieldCheck,
      title: '',
      ring: '',
      iconColor: '',
      titleColor: '',
      bar: '',
    },
    ok: {
      Icon: ShieldCheck,
      title: '',
      ring: '',
      iconColor: '',
      titleColor: '',
      bar: '',
    },
  }[deload.level];

  return (
    <div className={`rounded-2xl border p-4 shadow-card ${config.ring}`}>
      <div className="mb-2 flex items-center gap-2">
        <config.Icon size={16} className={config.iconColor} />
        <p className={`text-sm font-semibold ${config.titleColor}`}>
          {config.title}
        </p>
        <span className="ml-auto text-[11px] font-bold tabular-nums text-zinc-400">
          Fatiga {deload.fatigueScore}/100
        </span>
      </div>

      {/* Barra de fatiga */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full ${config.bar} transition-all duration-500`}
          style={{ width: `${deload.fatigueScore}%` }}
        />
      </div>

      <p className="text-xs leading-relaxed text-zinc-300">
        {deload.recommendation}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-2 text-center">
          <p className="text-zinc-500">Semanas duras</p>
          <p className="mt-0.5 font-bold tabular-nums text-zinc-200">
            {deload.consecutiveHardWeeks}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-2 text-center">
          <p className="text-zinc-500">Plateaus</p>
          <p className="mt-0.5 font-bold tabular-nums text-zinc-200">
            {deload.plateauCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-2 text-center">
          <p className="text-zinc-500">RIR medio</p>
          <p className="mt-0.5 font-bold tabular-nums text-zinc-200">
            {deload.avgRirTrend[3] > 0 ? deload.avgRirTrend[3].toFixed(1) : '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
        <TrendingDown size={11} /> Tendencia semanal
      </div>
      <div className="mt-1.5 flex items-end gap-1">
        {deload.weeklyVolumeTrend.map((v, i) => {
          const max = Math.max(...deload.weeklyVolumeTrend, 1);
          const h = Math.max(4, (v / max) * 40);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t ${
                  i === 3
                    ? 'bg-grad-brand'
                    : 'bg-zinc-700/60'
                }`}
                style={{ height: `${h}px` }}
              />
              <span className="text-[9px] text-zinc-600">
                S{i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}