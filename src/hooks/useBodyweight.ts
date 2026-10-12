import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface BodyweightLog {
  id: string;
  loggedAt: string;
  weightKg: number;
}

export function useBodyweight(userId: string | null) {
  const [logs, setLogs] = useState<BodyweightLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('bodyweight_logs')
      .select('*')
      .order('logged_at');
    setLogs(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        loggedAt: r.logged_at as string,
        weightKg: Number(r.weight_kg),
      }))
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(
    async (weightKg: number) => {
      if (!userId) throw new Error('Sin sesión');
      const { error } = await supabase
        .from('bodyweight_logs')
        .insert({ user_id: userId, weight_kg: weightKg });
      if (error) throw error;
      await reload();
    },
    [userId, reload]
  );

  return { logs, loading, add, reload };
}