import { Dumbbell, ClipboardList, Activity, BarChart2, User } from 'lucide-react';

export type TabId = 'train' | 'routines' | 'activity' | 'progress' | 'profile';

interface NavBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: typeof Dumbbell }[] = [
  { id: 'train', label: 'Entrenar', icon: Dumbbell },
  { id: 'routines', label: 'Rutinas', icon: ClipboardList },
  { id: 'activity', label: 'Actividad', icon: Activity },
  { id: 'progress', label: 'Progreso', icon: BarChart2 },
  { id: 'profile', label: 'Perfil', icon: User },
];

export default function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 safe-bottom">
      <div className="mx-auto max-w-md flex items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5 px-3 flex-1 transition-colors duration-200"
            >
              <Icon
                size={22}
                className={`transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]'
                    : 'text-zinc-500'
                }`}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-cyan-400' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-brand" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
