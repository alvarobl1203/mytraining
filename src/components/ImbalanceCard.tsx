import { Scale, Check, AlertTriangle } from 'lucide-react';
import type { ImbalanceResult } from '../lib/imbalance';

export function ImbalanceCard({ result }: { result: ImbalanceResult }) {
  if (result.status === 'insufficient') return null;

  const config = {
    balanced: {
      Icon: Check,
      ring: 'border-cyan-500/40 bg-cyan-500/5',
      icon: 'text-cyan-400',
      title: 'Balance muscular correcto',
      titleColor: 'text-cyan-300',
    },
    'push-dominant': {
      Icon: AlertTriangle,
      ring: 'border-amber-500/40 bg-amber-500/5',
      icon: 'text-amber-400',
      title: 'Predominancia de empuje',
      titleColor: 'text-amber-300',
    },
    'pull-dominant': {
      Icon: AlertTriangle,
      ring: 'border-amber-500/40 bg-amber-500/5',
      icon: 'text-amber-400',
      title: 'Predominancia de jalón',
      titleColor: 'text-amber-300',
    },
    insufficient: {
      Icon: Scale,
      ring: '',
      icon: '',
      title: '',
      titleColor: '',
    },
  }[result.status];

  const max = Math.max(result.pushSets, result.pullSets, 1);
  const pushPct = (result.pushSets / max) * 100;
  const pullPct = (result.pullSets / max) * 100;

  return (
    <div className={`rounded-2xl border p-4 shadow-card ${config.ring}`}>
      <div className="mb-3 flex items-center gap-2">
        <config.Icon size={15} className={config.icon} />
        <p className={`text-sm font-semibold ${config.titleColor}`}>
          {config.title}
        </p>
      </div>

      <div className="mb-3 space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-zinc-400">Empuje</span>
            <span className="tabular-nums text-zinc-300">
              {result.pushSets.toFixed(1)} series
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${pushPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-zinc-400">Jalón</span>
            <span className="tabular-nums text-zinc-300">
              {result.pullSets.toFixed(1)} series
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${pullPct}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-zinc-300">{result.message}</p>

      {result.status !== 'balanced' && (
        <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
          Ratio jalón/empuje: {result.ratio.toFixed(2)}
        </p>
      )}
    </div>
  );
}