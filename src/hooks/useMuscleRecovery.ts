import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MUSCLE_GROUPS } from '../lib/constants';
import type { MuscleGroup } from '../types';

export type MuscleStatus = 'fresh' | 'recovering' | 'fatigued' | 'untrained';

export interface MuscleRecovery {
  muscle: MuscleGroup;
  hoursAgo: number | null;
  hoursAgoEffective: number | null;
  status: MuscleStatus;
}

export function useMuscleRecovery(userId: string | null) {
  const [data, setData] = useState<MuscleRecovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

      const { data: rows } = await supabase
        .from('muscle_last_hit')
        .select('muscle, finished_at, weight')
        .gte('finished_at', since)
        .eq('user_id', userId);

      type Hit = { ts: number; weight: number };
      const last = new Map<string, Hit>();

      (rows ?? []).forEach((r: Record<string, unknown>) => {
        const t = new Date(r.finished_at as string).getTime();
        const w = Number(r.weight ?? 1);
        const cur = last.get(r.muscle as string);
        if (!cur || t > cur.ts) {
          last.set(r.muscle as string, { ts: t, weight: w });
        }
      });

      const out: MuscleRecovery[] = MUSCLE_GROUPS.map((m) => {
        const hit = last.get(m);
        if (!hit) {
          return {
            muscle: m,
            hoursAgo: null,
            hoursAgoEffective: null,
            status: 'untrained',
          };
        }
        const hours = (Date.now() - hit.ts) / 3600000;
        const effective = hours / Math.max(0.1, hit.weight);

        let status: MuscleStatus;
        if (effective < 24) status = 'fatigued';
        else if (effective < 48) status = 'recovering';
        else status = 'fresh';

        return {
          muscle: m,
          hoursAgo: +hours.toFixed(1),
          hoursAgoEffective: +effective.toFixed(1),
          status,
        };
      });

      setData(out);
      setLoading(false);
    })();
  }, [userId]);

  const fatigued = data.filter((d) => d.status === 'fatigued').length;
  const recovering = data.filter((d) => d.status === 'recovering').length;
  const fresh = data.filter((d) => d.status === 'fresh').length;

  return { data, loading, fatigued, recovering, fresh };
}