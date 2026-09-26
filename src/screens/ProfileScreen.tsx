import { useState, useEffect } from 'react';
import { User, LogOut, Loader2, Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';
import { ACTIVITY_LABELS } from '@/types/profile';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data as Profile | null);
        setLoading(false);
      });
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <User size={28} className="text-cyan-400 mb-3" />
        <p className="text-sm text-zinc-400">No se encontró el perfil.</p>
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-4">
      {/* User card */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl gradient-brand flex items-center justify-center">
            <User size={24} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {session?.user?.email}
            </p>
            <p className="text-xs text-zinc-500">Perfil completo</p>
          </div>
        </div>

        {/* Biometrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-950/50 rounded-xl p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Edad</p>
            <p className="text-lg font-bold text-white">{profile.age} <span className="text-xs font-normal text-zinc-500">años</span></p>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Género</p>
            <p className="text-lg font-bold text-white">{profile.gender === 'masculino' ? 'Hombre' : 'Mujer'}</p>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Peso</p>
            <p className="text-lg font-bold text-white">{profile.weight_kg} <span className="text-xs font-normal text-zinc-500">kg</span></p>
          </div>
          <div className="bg-zinc-950/50 rounded-xl p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Altura</p>
            <p className="text-lg font-bold text-white">{profile.height_cm} <span className="text-xs font-normal text-zinc-500">cm</span></p>
          </div>
        </div>
      </div>

      {/* Activity level */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Nivel de actividad</p>
        <p className="text-base font-semibold text-white">{ACTIVITY_LABELS[profile.activity_level]}</p>
      </div>

      {/* TDEE */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Gasto calórico (TDEE)</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <Flame size={18} className="text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] text-zinc-500 mb-0.5">Mantenimiento</p>
            <p className="text-lg font-bold text-white">{profile.tdee_maintenance}</p>
            <p className="text-[10px] text-zinc-600">kcal</p>
          </div>
          <div className="text-center">
            <TrendingDown size={18} className="text-blue-400 mx-auto mb-1" />
            <p className="text-[10px] text-zinc-500 mb-0.5">Déficit</p>
            <p className="text-lg font-bold text-white">{profile.tdee_deficit}</p>
            <p className="text-[10px] text-zinc-600">kcal</p>
          </div>
          <div className="text-center">
            <TrendingUp size={18} className="text-cyan-400 mx-auto mb-1" />
            <p className="text-[10px] text-zinc-500 mb-0.5">Volumen</p>
            <p className="text-lg font-bold text-white">{profile.tdee_surplus}</p>
            <p className="text-[10px] text-zinc-600">kcal</p>
          </div>
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Material disponible</p>
        <div className="flex flex-wrap gap-2">
          {profile.equipment.map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-cyan-300"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-red-400 hover:bg-red-950/30 transition-all duration-200"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}
