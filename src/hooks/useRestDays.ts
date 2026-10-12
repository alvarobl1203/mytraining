import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { localIsoDate } from '../lib/date';

export interface RestDay {
  id: string;
  day: string;
  note: string | null;
}

export function useRestDays(userId: string | null, monthAnchor: Date) {
  const [restDays, setRestDays] = useState<RestDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Clave estable del mes ("YYYY-MM"). Aunque `monthAnchor` sea un objeto
  // nuevo en cada render, el string es idéntico si es el mismo mes →
  // evita que `reload` cambie de identidad en cada render.
  const yearMonth = `${monthAnchor.getFullYear()}-${String(
    monthAnchor.getMonth() + 1
  ).padStart(2, '0')}`;

  const reload = useCallback(async () => {
    if (!userId) {
      setRestDays([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [year, month] = yearMonth.split('-').map(Number);
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);

    const { data, error } = await supabase
      .from('rest_days')
      .select('*')
      .eq('user_id', userId)
      .gte('day', localIsoDate(first))
      .lte('day', localIsoDate(last));

    if (error) {
      console.error('[useRestDays] reload error:', error);
      setLoading(false);
      return;
    }
    setRestDays(
      (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        day: r.day as string,
        note: (r.note as string | null) ?? null,
      }))
    );
    setLoading(false);
  }, [userId, yearMonth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = useCallback(
    async (iso: string, note?: string) => {
      if (!userId) throw new Error('Sin sesión');

      // Comprobamos directamente en la BD para no depender del estado local
      // (evita races cuando el usuario pulsa varias veces rápido).
      const { data: existing, error: checkErr } = await supabase
        .from('rest_days')
        .select('id')
        .eq('user_id', userId)
        .eq('day', iso)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (existing) {
        const { error } = await supabase
          .from('rest_days')
          .delete()
          .eq('id', existing.id as string);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rest_days')
          .insert({ user_id: userId, day: iso, note: note ?? null });
        if (error) throw error;
      }

      await reload();
    },
    [userId, reload]
  );

  return { restDays, loading, toggle, reload };
}