import { AlertTriangle, Moon, ShieldCheck, Info } from 'lucide-react';
import type { DeloadSignals } from '../lib/deload';

export function DeloadCard({ deload }: { deload: DeloadSignals }) {
  const config = {
    mandatory: {
      Icon: AlertTriangle,
      title: 'Descarga obligatoria',
      ring: 'border-red-500/40 bg-red-500/5',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      bar: 'bg-red-500',
    },
    recommended: {
      Icon: Moon,
      title: 'Descarga recomendada',
      ring: 'border-amber-500/40 bg-amber-500/5',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      bar: 'bg-amber-500',
    },
    warning: {
      Icon: ShieldCheck,
      title: 'Vigila tu fatiga',
      ring: 'border-zinc-700/60 bg-zinc-900/60',
      iconColor: 'text-zinc-400',
      titleColor: 'text-zinc-300',
      bar: 'bg-zinc-500',
    },
    ok: {
      Icon: ShieldCheck,
      title: 'Fatiga bajo control',
      ring: 'border-zinc-800/60 bg-zinc-900/40',
      iconColor: 'text-cyan-400',
      titleColor: 'text-zinc-200',
      bar: 'bg-cyan-500',
    },
  }[deload.level];

  return (
    <div className={`rounded-2xl border p-4 shadow-card ${config.ring}`}>
      {/* Cabecera */}
      <div className="mb-3 flex items-center gap-2">
        <config.Icon size={16} className={config.iconColor} />
        <p className={`text-sm font-semibold ${config.titleColor}`}>
          {config.title}
        </p>
        <span className="ml-auto text-[11px] font-bold tabular-nums text-zinc-400">
          Score {deload.fatigueScore}/100
        </span>
      </div>

      {/* Barra de fatiga */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full ${config.bar} transition-all duration-500`}
          style={{ width: `${deload.fatigueScore}%` }}
        />
      </div>

      {/* Desglose del cálculo */}
      <div className="mb-3 rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Info size={11} className="text-zinc-500" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Cómo se calcula
          </p>
        </div>
        <ul className="space-y-1 text-[11px] text-zinc-400">
          <li className="flex justify-between">
            <span>Semanas consecutivas duras</span>
            <span className="font-semibold text-zinc-200">
              +{Math.min(40, deload.consecutiveHardWeeks * 15)}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Plateaus detectados</span>
            <span className="font-semibold text-zinc-200">
              +{Math.min(25, deload.plateauCount * 12)}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Tendencia de volumen</span>
            <span className="font-semibold text-zinc-200">
              +{deload.weeklyVolumeTrend[0] > 0 &&
              (deload.weeklyVolumeTrend[3] - deload.weeklyVolumeTrend[0]) /
                deload.weeklyVolumeTrend[0] <
                -0.15
                ? 15
                : 0}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Tendencia de RIR (fatiga)</span>
            <span className="font-semibold text-zinc-200">
              +{deload.avgRirTrend[0] > 0 &&
              deload.avgRirTrend[3] - deload.avgRirTrend[0] < -0.5
                ? 20
                : 0}
            </span>
          </li>
        </ul>
      </div>

      {/* Indicadores */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-[11px]">
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

      {/* Recomendación */}
      <p className="text-xs leading-relaxed text-zinc-300">
        {deload.recommendation}
      </p>
    </div>
  );
}