import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env');
}

if (!url.includes('lvelfstgeldnelyjjxal')) {
  console.error(
    '[MyTraining] VITE_SUPABASE_URL no apunta a lvelfstgeldnelyjjxal. Revisa .env e Integrations → Supabase en Bolt.'
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});