import { useState } from 'react';
import NavBar, { type TabId } from '@/components/NavBar';
import Logo from '@/components/Logo';
import TrainScreen from '@/screens/TrainScreen';
import RoutinesScreen from '@/screens/RoutinesScreen';
import ActivityScreen from '@/screens/ActivityScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AuthScreen from '@/screens/AuthScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [tab, setTab] = useState<TabId>('train');
  const [preselectedRoutineId, setPreselectedRoutineId] = useState<string | null>(null);
  const [preselectedRoutineName, setPreselectedRoutineName] = useState<string | null>(null);
  const { session, profile, loading, needsOnboarding, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={refreshProfile} />;
  }

  if (needsOnboarding || !profile?.onboarding_completed) {
    return (
      <OnboardingScreen
        userId={session.user.id}
        onComplete={refreshProfile}
      />
    );
  }

  function handleStartWorkout(routineId: string, routineName: string) {
    setPreselectedRoutineId(routineId);
    setPreselectedRoutineName(routineName);
    setTab('train');
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 safe-top">
        <div className="mx-auto max-w-md px-5 py-3 flex items-center justify-between">
          <Logo />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-md px-5 pb-24">
        {tab === 'train' && (
          <TrainScreen
            preselectedRoutineId={preselectedRoutineId}
            preselectedRoutineName={preselectedRoutineName}
            onClearPreselect={() => {
              setPreselectedRoutineId(null);
              setPreselectedRoutineName(null);
            }}
          />
        )}
        {tab === 'routines' && <RoutinesScreen onStartWorkout={handleStartWorkout} />}
        {tab === 'activity' && <ActivityScreen />}
        {tab === 'progress' && <ProgressScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </main>

      <NavBar active={tab} onChange={setTab} />
    </div>
  );
}
