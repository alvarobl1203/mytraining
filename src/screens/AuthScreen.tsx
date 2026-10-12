import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(
        msg.includes('Invalid login')
          ? 'Email o contraseña incorrectos.'
          : msg.includes('already registered')
            ? 'Ese email ya está registrado.'
            : msg.includes('Password should be')
              ? 'La contraseña debe tener al menos 6 caracteres.'
              : msg
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-xl shadow-blue-500/20">
            <Zap size={26} strokeWidth={2.5} />
          </span>
          <h1 className="text-2xl font-bold">
            My{' '}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Training
            </span>
          </h1>
          <p className="text-sm text-zinc-500">Tu progreso, medido de verdad.</p>
        </div>

        <div className="mb-4 flex rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-1">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                mode === m
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow'
                  : 'text-zinc-400'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm placeholder-zinc-500 outline-none focus:border-blue-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm placeholder-zinc-500 outline-none focus:border-blue-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
          >
            {busy && <Loader2 className="animate-spin" size={16} />}
            {mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>
      </div>
    </div>
  );
}