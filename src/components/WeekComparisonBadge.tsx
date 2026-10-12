import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeekComparison } from '../hooks/useWeekComparison';

export function WeekComparisonBadge({ userId }: { userId: string }) {
  const { currentTonnage, previousTonnage, deltaPercent, loading } =
    useWeekComparison(userId);

  if (loading) return null;

  // No mostrar si no hay datos suficientes en ninguna de las dos semanas
  if (currentTonnage < 50 && previousTonnage < 50) return null;
  if (previousTonnage < 50 || deltaPercent === null) return null;

  // Ignorar variaciones absurdas
  if (!isFinite(deltaPercent) || Math.abs(deltaPercent) > 500) return null;

  const up = deltaPercent > 2;
  const down = deltaPercent < -2;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const color = up ? 'text-cyan-400' : down ? 'text-red-400' : 'text-zinc-500';

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
      <Icon size={11} className={color} />
      <span className={`text-[11px] font-semibold tabular-nums ${color}`}>
        {deltaPercent > 0 ? '+' : ''}
        {deltaPercent.toFixed(0)}%
      </span>
      <span className="text-[10px] text-zinc-500">vs sem. anterior</span>
    </div>
  );
}