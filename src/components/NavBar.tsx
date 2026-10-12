import { Dumbbell, ClipboardList, Activity, BarChart2, User } from 'lucide-react';

export type Tab = 'train' | 'routines' | 'activity' | 'progress' | 'profile';

const ITEMS: { id: Tab; label: string; Icon: typeof Dumbbell }[] = [
  { id: 'train', label: 'Entrenar', Icon: Dumbbell },
  { id: 'routines', label: 'Rutinas', Icon: ClipboardList },
  { id: 'activity', label: 'Actividad', Icon: Activity },
  { id: 'progress', label: 'Progreso', Icon: BarChart2 },
  { id: 'profile', label: 'Perfil', Icon: User },
];

export function NavBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-40
        border-t border-zinc-800/40
        bg-zinc-950/80 backdrop-blur-xl backdrop-saturate-150
      "
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      {/* Degradado superior sutil para separar del contenido */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-zinc-950/80 to-transparent"
      />

      <ul className="relative mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="relative flex-1">
              <button
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px]
                  transition-colors duration-200
                  ${isActive ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}
                `}
              >
                {/* Indicador superior con glow */}
                {isActive && (
                  <span
                    aria-hidden
                    className="
                      absolute -top-0.5 h-0.5 w-8 rounded-full
                      bg-grad-brand
                      shadow-[0_0_12px_rgba(34,211,238,0.8)]
                      animate-fade-in
                    "
                  />
                )}

                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 2}
                  className="transition-transform duration-200"
                />
                <span className={isActive ? 'font-semibold' : 'font-medium'}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}