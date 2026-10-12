import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AppShell } from './components/AppShell';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Button } from './components/Button';
import { supabase } from './lib/supabase';

export default function App() {
  const { user, session, loading: authLoading } = useAuth();
  const { profile, loading: profLoading, save, reload } = useProfile(
    user?.id ?? null
  );

  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const attemptedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      attemptedForUserRef.current &&
      attemptedForUserRef.current !== user?.id
    ) {
      attemptedForUserRef.current = null;
      setProfileError(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !session) return;
    if (profLoading) return;
    if (profile) return;
    if (creatingProfile) return;
    if (attemptedForUserRef.current === user.id) return;

    attemptedForUserRef.current = user.id;
    setCreatingProfile(true);
    setProfileError(null);

    (async () => {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            onboarding_completed: false,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

      if (upsertError) {
        console.error(upsertError);
        setProfileError(
          'No se pudo preparar tu perfil. Comprueba tu conexión e inténtalo de nuevo.'
        );
        setCreatingProfile(false);
        return;
      }

      await reload();
      setCreatingProfile(false);
    })();
  }, [authLoading, user, session, profLoading, profile, creatingProfile, reload]);

  if (authLoading || (user && (profLoading || creatingProfile))) {
    return <LoadingSpinner />;
  }

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-5">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="text-red-400" size={22} />
          </div>
          <h1 className="text-base font-semibold text-red-300">
            Algo ha ido mal
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            {profileError}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button
              fullWidth
              icon={<RotateCcw size={14} />}
              onClick={() => {
                setProfileError(null);
                attemptedForUserRef.current = null;
                void reload();
              }}
            >
              Reintentar
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => void supabase.auth.signOut()}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (!profile) return <LoadingSpinner />;
  if (!profile.onboardingCompleted) {
    return <OnboardingScreen profile={profile} onComplete={save} />;
  }
  return <AppShell profile={profile} onSaveProfile={save} />;
}