import { useState } from 'react';
import { Zap } from 'lucide-react';
import { NavBar, type Tab } from './NavBar';
import { TrainScreen } from '../screens/TrainScreen';
import { RoutinesScreen } from '../screens/RoutinesScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PreferencesScreen } from '../screens/PreferencesScreen';
import type { Profile } from '../types';

export function AppShell({
  profile,
  onSaveProfile,
}: {
  profile: Profile;
  onSaveProfile: (patch: Partial<Profile>) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('train');
  const [pendingRoutine, setPendingRoutine] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);

  // Si estamos en preferencias, mostramos pantalla completa con su propio botón "Volver"
  if (showPreferences) {
    return (
      <PreferencesScreen
        profile={profile}
        onSave={onSaveProfile}
        onBack={() => setShowPreferences(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="sticky top-0 z-30 border-b border-zinc-800/40 bg-zinc-950/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-grad-brand text-white shadow-glow-blue">
            <Zap size={18} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            My <span className="text-grad-brand">Training</span>
            <span className="ml-1 text-cyan-400">⚡</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        {tab === 'train' && (
          <TrainScreen userId={profile.id} initialRoutineId={pendingRoutine} />
        )}
        {tab === 'routines' && (
          <RoutinesScreen
            userId={profile.id}
            onStartWorkout={(rid) => {
              setPendingRoutine(rid);
              setTab('train');
            }}
          />
        )}
        {tab === 'activity' && <ActivityScreen userId={profile.id} />}
        {tab === 'progress' && <ProgressScreen userId={profile.id} />}
                {tab === 'profile' && (
          <ProfileScreen
            profile={profile}
            onOpenPreferences={() => setShowPreferences(true)}
            onSaveProfile={onSaveProfile}
          />
        )}
      </main>

      <NavBar
        active={tab}
        onChange={(t) => {
          // Por si el usuario vuelve desde preferencias sin pulsar "Volver"
          setShowPreferences(false);
          setTab(t);
        }}
      />
    </div>
  );
}