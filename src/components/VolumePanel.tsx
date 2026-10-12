import { useMemo } from 'react';
import {
  VOLUME_RECOMMENDATIONS,
  getVolumeStatus,
  VOLUME_STATUS_COLOR,
  VOLUME_STATUS_LABEL,
} from '../lib/volumeRecommendations';
import type { MuscleGroup } from '../types';

export function VolumePanel({
  setsPerMuscle,
}: {
  setsPerMuscle: Map<MuscleGroup, number>;
}) {
  const rows = useMemo(
    () =>
      VOLUME_RECOMMENDATIONS.map((rec) => {
        const current = setsPerMuscle.get(rec.muscle) ?? 0;
        const status = getVolumeStatus(current, rec);
        return { rec, current, status };
      }).sort((a, b) => {
        const order = ['Bajo el MEV', 'Sobre el MRV', 'MRV-Z', 'MEV-VA', 'MAV', 'Sin datos'];
        return order.indexOf(a.status) - order.indexOf(b.status);
      }),
    [setsPerMuscle]
  );

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-grad-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Volumen semanal óptimo
        </p>
        <span className="text-[10px] text-zinc-600">MEV · MAV · MRV</span>
      </div>

      <div className="space-y-2">
        {rows.map(({ rec, current, status }) => {
          const max = rec.mrv * 1.1 || 1;
          const pctCurrent = Math.min(100, (current / max) * 100);
          const pctMev = (rec.mev / max) * 100;
          const pctMavMin = (rec.mavMin / max) * 100;
          const pctMavMax = (rec.mavMax / max) * 100;

          return (
            <div
              key={rec.muscle}
              className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-2.5"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-zinc-200">
                  {rec.muscle}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${VOLUME_STATUS_COLOR[status]}`}
                >
                  {VOLUME_STATUS_LABEL[status]}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="absolute top-0 h-full bg-emerald-500/30"
                  style={{
                    left: `${pctMavMin}%`,
                    width: `${pctMavMax - pctMavMin}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-full bg-orange-500/20"
                  style={{
                    left: `${pctMavMax}%`,
                    width: `${(rec.mrv / max) * 100 - pctMavMax}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-full bg-cyan-400"
                  style={{ left: 0, width: `${pctCurrent}%` }}
                />
                <div
                  className="absolute top-0 h-full w-px bg-yellow-400/70"
                  style={{ left: `${pctMev}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                <span>
                  Actual:{' '}
                  <span className="text-zinc-300">{current.toFixed(1)}</span>
                </span>
                <span>
                  MEV {rec.mev} · MAV {rec.mavMin}-{rec.mavMax} · MRV {rec.mrv}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}