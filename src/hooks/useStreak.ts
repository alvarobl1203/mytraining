import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface StreakData {
  /** Días consecutivos entrenando. */
  current: number;
  /** Máximo histórico (durante todo el uso de la app). */
  best: number;
  /** Total de días únicos entrenados. */
  totalDays: number;
  /** True si hoy ya se ha entrenado. */
  trainedToday: boolean;
  loading: boolean;
}

export function useStreak(userId: string | null): StreakData {
  const [state, setState] = useState<StreakData>({
    current: 0,
    best: 0,
    totalDays: 0,
    trainedToday: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState({
        current: 0,
        best: 0,
        totalDays: 0,
        trainedToday: false,
        loading: false,
      });
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('workouts')
        .select('finished_at')
        .eq('user_id', userId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false });

      const dates = new Set<string>();
      (data ?? []).forEach((r: { finished_at: string }) => {
        const d = new Date(r.finished_at);
        dates.add(localIso(d));
      });

      const today = new Date();
      const todayIso = localIso(today);

      // Racha actual: si no ha entrenado hoy, empezamos por ayer
      const cursor = new Date(today);
      const trainedToday = dates.has(todayIso);
      if (!trainedToday) {
        cursor.setDate(cursor.getDate() - 1);
      }

      let current = 0;
      while (dates.has(localIso(cursor))) {
        current++;
        cursor.setDate(cursor.getDate() - 1);
      }

      // Racha histórica: recorremos todas las fechas ordenadas
      const sortedDates = Array.from(dates).sort();
      let best = 0;
      let run = 0;
      let prev: Date | null = null;
      for (const iso of sortedDates) {
        const [y, m, d] = iso.split('-').map(Number);
        const cur = new Date(y, m - 1, d);
        if (prev) {
          const diffDays = Math.round(
            (cur.getTime() - prev.getTime()) / (24 * 3600 * 1000)
          );
          if (diffDays === 1) run++;
          else run = 1;
        } else {
          run = 1;
        }
        if (run > best) best = run;
        prev = cur;
      }

      setState({
        current,
        best,
        totalDays: dates.size,
        trainedToday,
        loading: false,
      });
    })();
  }, [userId]);

  return state;
}