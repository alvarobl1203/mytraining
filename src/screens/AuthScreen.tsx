import { useState, type FormEvent } from 'react';
import { Mail, Lock, Dumbbell, Zap, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

function translateError(message: string): string {
  if (message.includes('already registered') || message.includes('already been registered'))
    return 'Este email ya está registrado. Intenta iniciar sesión.';
  if (message.includes('Invalid login') || message.includes('invalid credentials'))
    return 'Email o contraseña incorrectos.';
  if (message.includes('Password should be') || message.includes('at least 6'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (message.includes('Unable to send') || message.includes('rate limit'))
    return 'Demasiados intentos. Espera unos minutos.';
  if (message.includes('Email not confirmed'))
    return 'Debes confirmar tu email antes de iniciar sesión.';
  return 'Ha ocurrido un error. Inténtalo de nuevo.';
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // signUp with email confirmation OFF → session is created immediately
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(translateError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 safe-top">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-glow mb-4">
            <Dumbbell size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-white">My</span>
            <span className="text-3xl font-extrabold tracking-tight gradient-brand-text">Training</span>
            <Zap size={18} className="text-cyan-400 fill-cyan-400" />
          </div>
          <p className="text-sm text-zinc-400 mt-2">Tu entrenamiento, con datos.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-zinc-900 rounded-2xl border border-zinc-800/50 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              mode === 'login'
                ? 'gradient-brand text-white shadow-glow'
                : 'text-zinc-400'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              mode === 'signup'
                ? 'gradient-brand text-white shadow-glow'
                : 'text-zinc-400'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-brand text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === 'login' ? (
              'Iniciar sesión'
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          {mode === 'login'
            ? '¿No tienes cuenta? Pulsa "Crear cuenta" arriba.'
            : '¿Ya tienes cuenta? Pulsa "Iniciar sesión" arriba.'}
        </p>
      </div>
    </div>
  );
}
