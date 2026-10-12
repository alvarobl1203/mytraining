import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Plus, ArrowLeft, X } from 'lucide-react';
import { useExercises } from '../hooks/useExercises';
import { useProfile } from '../hooks/useProfile';
import { useDebounced } from '../hooks/useDebounced';
import { ExerciseCard } from '../components/ExerciseCard';
import { CreateExerciseModal } from '../components/CreateExerciseModal';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { DisciplineFilterBar } from '../components/DisciplineFilterBar';
import { ListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { MUSCLE_GROUPS, EQUIPMENT_LIST } from '../lib/constants';
import { searchExercises } from '../lib/search';
import type {
  Category,
  Equipment,
  Exercise,
  ExerciseType,
  MuscleGroup,
} from '../types';

type Props = {
  onBack: () => void;
  userId?: string;
  onPick?: (exercise: Exercise) => void;
};

export function CatalogScreen({ onBack, userId, onPick }: Props) {
  const { exercises, loading, reload, createCustom } = useExercises();
  const { profile } = useProfile(userId ?? null);

  const [query, setQuery] = useState('');
  const dq = useDebounced(query, 300);
  const [showFilters, setShowFilters] = useState(false);
  const [discipline, setDiscipline] = useState<ExerciseType | 'all'>('all');
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [equip, setEquip] = useState<Equipment[]>([]);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);

  const preferredTypes = profile?.preferredTypes ?? null;

  const base = useMemo(() => {
    return exercises.filter((e) => {
      // Disciplina preferida del usuario
      if (preferredTypes && e.exerciseType) {
        if (!preferredTypes.includes(e.exerciseType)) return false;
      }
      // Disciplina activa en el tab
      if (discipline !== 'all' && e.exerciseType !== discipline) return false;
      // Filtros avanzados
      if (muscles.length) {
        const hit = muscles.some(
          (m) =>
            e.primaryMuscles.includes(m) || e.secondaryMuscles.includes(m)
        );
        if (!hit) return false;
      }
      if (cats.length && !cats.includes(e.category)) return false;
      if (equip.length && !equip.includes(e.equipment)) return false;
      return true;
    });
  }, [exercises, preferredTypes, discipline, muscles, cats, equip]);

  const filtered = useMemo(
    () => (dq.trim() ? searchExercises(base, dq) : base),
    [base, dq]
  );

  const counts = useMemo(() => {
    const c: Partial<Record<ExerciseType, number>> = {};
    exercises.forEach((e) => {
      if (!e.exerciseType) return;
      if (preferredTypes && !preferredTypes.includes(e.exerciseType)) return;
      c[e.exerciseType] = (c[e.exerciseType] ?? 0) + 1;
    });
    return c;
  }, [exercises, preferredTypes]);

  const activeFilters = muscles.length + cats.length + equip.length;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        <ArrowLeft size={14} /> Volver
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight">Catálogo</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-grad-brand px-3.5 py-2 text-xs font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.97]"
        >
          <Plus size={14} /> Crear
        </button>
      </div>

      <DisciplineFilterBar
        active={discipline}
        onChange={setDiscipline}
        counts={counts}
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ejercicio…"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm placeholder-zinc-500 outline-none transition-colors focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`relative flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition-all duration-200 ${
            activeFilters > 0
              ? 'border-blue-500 bg-blue-500/10 text-blue-300'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal size={14} />
          {activeFilters > 0 && (
            <span className="rounded-full bg-blue-500 px-1.5 text-[10px] text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="animate-fade-in space-y-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3">
          <FilterBlock
            title="Músculo"
            items={MUSCLE_GROUPS}
            selected={muscles}
            onToggle={(m) =>
              setMuscles((p) =>
                p.includes(m) ? p.filter((x) => x !== m) : [...p, m]
              )
            }
          />
          <FilterBlock
            title="Categoría"
            items={['Fuerza', 'Hipertrofia', 'Cardio'] as const}
            selected={cats}
            onToggle={(c) =>
              setCats((p) =>
                p.includes(c) ? p.filter((x) => x !== c) : [...p, c]
              )
            }
          />
          <FilterBlock
            title="Material"
            items={EQUIPMENT_LIST}
            selected={equip}
            onToggle={(eq) =>
              setEquip((p) =>
                p.includes(eq) ? p.filter((x) => x !== eq) : [...p, eq]
              )
            }
          />
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setMuscles([]);
                setCats([]);
                setEquip([]);
              }}
              className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-zinc-500">{filtered.length} ejercicios</p>
      )}

      {loading ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="Prueba a cambiar los filtros o busca otro ejercicio."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => (
            <ExerciseCard
              key={e.id}
              exercise={e}
              query={dq}
              onClick={() => (onPick ? onPick(e) : setDetail(e))}
            />
          ))}
        </div>
      )}

      {creating && (
        <CreateExerciseModal
          onClose={() => setCreating(false)}
          onCreate={async (payload) => {
            await createCustom(payload);
            await reload();
            setCreating(false);
          }}
        />
      )}

      {detail && (
        <ExerciseDetailModal
          exercise={detail}
          userId={userId}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function FilterBlock<T extends string>({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const on = selected.includes(it);
          return (
            <button
              key={it}
              onClick={() => onToggle(it)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-all duration-150 ${
                on
                  ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {it}
            </button>
          );
        })}
      </div>
    </div>
  );
}