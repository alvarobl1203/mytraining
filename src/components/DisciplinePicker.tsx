import {
  GymIcon,
  CalisteniaIcon,
  CardioIcon,
  AllIcon,
} from './icons/DisciplineIcons';
import type { ExerciseType } from '../types';
import type { ComponentType, SVGProps } from 'react';

type DisciplineIcon = ComponentType<
  Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }
>;

interface DisciplineMeta {
  id: ExerciseType;
  label: string;
  description: string;
  Icon: DisciplineIcon;
  border: string;
  bg: string;
  iconBg: string;
  iconShadow: string;
  labelColor: string;
}

const DISCIPLINES: DisciplineMeta[] = [
  {
    id: 'gym',
    label: 'Gym',
    description: 'Barra, mancuernas, máquinas…',
    Icon: GymIcon,
    border: 'border-cyan-500/30',
    bg: 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-zinc-950',
    iconBg: 'bg-gradient-to-br from-blue-600 to-cyan-400',
    iconShadow: 'shadow-blue-500/20',
    labelColor: 'text-cyan-300',
  },
  {
    id: 'calistenia',
    label: 'Calistenia',
    description: 'Peso corporal y control',
    Icon: CalisteniaIcon,
    border: 'border-blue-500/30',
    bg: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-zinc-950',
    iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-500',
    iconShadow: 'shadow-blue-500/20',
    labelColor: 'text-blue-300',
  },
  {
    id: 'cardio',
    label: 'Cardio',
    description: 'Correr, bicicleta, remo…',
    Icon: CardioIcon,
    border: 'border-purple-500/30',
    bg: 'bg-gradient-to-br from-purple-500/10 via-rose-500/5 to-zinc-950',
    iconBg: 'bg-gradient-to-br from-purple-600 to-rose-500',
    iconShadow: 'shadow-purple-500/20',
    labelColor: 'text-purple-300',
  },
];

export function DisciplinePicker({
  preferredTypes,
  counts,
  onSelect,
}: {
  preferredTypes: ExerciseType[];
  counts: Partial<Record<ExerciseType | 'all', number>>;
  onSelect: (d: ExerciseType | 'all') => void;
}) {
  const activeDisciplines = DISCIPLINES.filter((d) =>
    preferredTypes.includes(d.id),
  );
  const totalCount = counts.all ?? 0;
  const hasAny = activeDisciplines.length > 0;

  return (
    <div className="space-y-3">
      {/* ---------- Tarjeta "Todas" (destacada) ---------- */}
      <button
        onClick={() => onSelect('all')}
        disabled={!hasAny}
        className="group relative w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-blue-500/5 to-zinc-950 p-4 text-left transition-all active:scale-[0.99] disabled:opacity-60"
      >
        <AllIcon
          size={160}
          strokeWidth={1}
          className="pointer-events-none absolute -right-8 -top-10 text-white opacity-[0.05]"
        />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/30">
            <AllIcon size={26} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-cyan-300">
              Tu catálogo activo
            </p>
            <p className="text-2xl font-extrabold leading-tight text-zinc-100">
              Tus disciplinas
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {hasAny
                ? 'Explora el catálogo completo'
                : 'Sin disciplinas activas en Preferencias'}
            </p>
          </div>
          <div className="relative shrink-0 text-right">
            <p className="text-2xl font-extrabold tabular-nums leading-none text-zinc-100">
              {totalCount}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-500">
              ejercicios
            </p>
          </div>
        </div>
      </button>

      {/* ---------- Tarjetas individuales por disciplina ---------- */}
      {activeDisciplines.map((d) => {
        const Icon = d.Icon;
        const count = counts[d.id] ?? 0;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`group relative w-full overflow-hidden rounded-2xl border ${d.border} ${d.bg} p-4 text-left transition-all active:scale-[0.99]`}
          >
            <Icon
              size={140}
              strokeWidth={1}
              className="pointer-events-none absolute -right-6 -top-8 text-white opacity-[0.05]"
            />
            <div className="relative flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${d.iconBg} text-white shadow-lg ${d.iconShadow}`}
              >
                <Icon size={26} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[10px] uppercase tracking-widest ${d.labelColor}`}
                >
                  Disciplina
                </p>
                <p className="text-2xl font-extrabold leading-tight text-zinc-100">
                  {d.label}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                  {d.description}
                </p>
              </div>
              <div className="relative shrink-0 text-right">
                <p className="text-2xl font-extrabold tabular-nums leading-none text-zinc-100">
                  {count}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-500">
                  ejercicios
                </p>
              </div>
            </div>
          </button>
        );
      })}

      {/* ---------- Aviso cuando no hay disciplinas activas ---------- */}
      {!hasAny && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-[11px] leading-relaxed text-amber-200">
            No tienes disciplinas activas. Actívalas en{' '}
            <span className="font-semibold">Perfil → Preferencias</span> para
            ver sus ejercicios.
          </p>
        </div>
      )}
    </div>
  );
}