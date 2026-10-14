import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const RECENT_DAYS = 7;

/**
 * Devuelve el peso corporal "efectivo" del usuario:
 *  1. bodyweight_logs de los últimos 7 días (más reciente)
 *  2. profiles.weight_kg (fallback)
 *  3. null si no hay ninguno
 *
 * Se usa para calcular el volumen de ejercicios de peso corporal
 * (dominadas, fondos, ab rollout, etc.) y para mostrar información
 * contextual en la pantalla de entreno.
 */
export function useLatestBodyweight(userId: string | null): number | null {
  const [bw, setBw] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setBw(null);
      return;
    }
    let cancelled = false;

    (async () => {
      // 1. Registro más reciente en los últimos 7 días
      const cutoffIso = new Date(Date.now() - RECENT_DAYS * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      const { data: log } = await supabase
        .from('bodyweight_logs')
        .select('weight_kg')
        .eq('user_id', userId)
        .gte('logged_at', cutoffIso)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (log?.weight_kg != null) {
        setBw(Number(log.weight_kg));
        return;
      }

      // 2. Fallback a profile.weight_kg
      const { data: prof } = await supabase
        .from('profiles')
        .select('weight_kg')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;
      if (prof?.weight_kg != null) {
        setBw(Number(prof.weight_kg));
      } else {
        setBw(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return bw;
}