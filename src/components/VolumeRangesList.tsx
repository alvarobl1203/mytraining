import { colorForStatus, OPTIMAL_RANGES, statusForVolume } from '../lib/volumeRanges';
import type { MuscleGroup } from '../types';

export function VolumeRangesList({
  setsPerMuscle,
}: {
  setsPerMuscle: Map<MuscleGroup, number>;
}) {
  const rows = (Object.keys(OPTIMAL_RANGES) as MuscleGroup[])
    .filter((m) => OPTIMAL_RANGES[m] !== null)
    .map((m) => {
      const sets = Math.round((setsPerMuscle.get(m) ?? 0) * 10) / 10;
      const st = statusForVolume(m, sets);
      return { muscle: m, sets, range: OPTIMAL_RANGES[m]!, status: st };
    });

  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Volumen científico (últimos 7 días)
      </p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.muscle} className="flex items-center justify-between text-xs">
            <span className="text-zinc-300">{r.muscle}</span>
            <span className={`tabular-nums ${colorForStatus(r.status)}`}>
              {r.sets} / {r.range.min}–{r.range.max}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
        Puntúa +1 serie al músculo primario y +0.5 a los secundarios.
      </p>
    </div>
  );
}