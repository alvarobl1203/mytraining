import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useExercises } from '../hooks/useExercises';
import { useProfile } from '../hooks/useProfile';
import { useDebounced } from '../hooks/useDebounced';
import { ExerciseCard } from '../components/ExerciseCard';
import { CreateExerciseModal } from '../components/CreateExerciseModal';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { DisciplinePicker } from '../components/DisciplinePicker';
import { MuscleFilterSection } from '../components/MuscleFilterSection';
import { CatalogFilterChips } from '../components/CatalogFilterChips';
import { ListSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  getFiltersForDiscipline,
  exercisePassesFilters,
} from '../lib/catalogFilters';
import { EXERCISE_TYPES } from '../lib/exerciseCategories';
import { searchExercises } from '../lib/search';
import type {
  Exercise,
  ExerciseType,
  MuscleGroup,
} from '../types';

type Props = {
  onBack: () => void;
  userId?: string;
  onPick?: (exercise: Exercise) => void;
};

const DISCIPLINE_STORAGE_KEY = 'mytraining:catalog:discipline';

type ViewMode = 'picker' | 'list';

function loadStoredDiscipline(): ExerciseType | 'all' {
  try {
    const raw = sessionStorage.getItem(DISCIPLINE_STORAGE_KEY);
    if (raw === 'gym' || raw === 'calistenia' || raw === 'cardio') {
      return raw;
    }
    return 'all';
  } catch {
    return 'all';
  }
}

const VISIBLE_MUSCLE_REGIONS = [
  'Pecho',
  'Espalda',
  'Hombro',
  'Brazos',
  'Pierna',
  'Core',
];

export function CatalogScreen({ onBack, userId, onPick }: Props) {
  const { exercises, loading, reload, createCustom } = useExercises();
  const { profile } = useProfile(userId ?? null);

  const preferredTypes: ExerciseType[] =
    profile?.preferredTypes ?? ['gym', 'calistenia', 'cardio'];

  // ----- Vista y disciplina activa -----
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (onPick) return 'picker';
    try {
      const stored = sessionStorage.getItem(DISCIPLINE_STORAGE_KEY);
      return stored ? 'list' : 'picker';
    } catch {
      return 'picker';
    }
  });
  const [activeDiscipline, setActiveDiscipline] = useState<ExerciseType | 'all'>(
    () => loadStoredDiscipline(),
  );

  // ----- Filtros -----
  const [query, setQuery] = useState('');
  const dq = useDebounced(query, 300);
  const [showFilters, setShowFilters] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);

  // ----- Validar disciplina activa contra preferencias -----
  useEffect(() => {
    if (
      activeDiscipline !== 'all' &&
      !preferredTypes.includes(activeDiscipline)
    ) {
      setActiveDiscipline('all');
      setViewMode('picker');
      try {
        sessionStorage.removeItem(DISCIPLINE_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [preferredTypes, activeDiscipline]);

  // ----- Persistir vista/disciplina -----
  useEffect(() => {
    try {
      if (viewMode === 'list') {
        sessionStorage.setItem(DISCIPLINE_STORAGE_KEY, activeDiscipline);
      } else {
        sessionStorage.removeItem(DISCIPLINE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [viewMode, activeDiscipline]);

  // ----- Reset de filtros al cambiar de disciplina -----
  useEffect(() => {
    setSelections({});
    setQuery('');
  }, [activeDiscipline]);

  // ----- Filtros disponibles para la disciplina activa -----
  const availableFilters = useMemo(
    () => getFiltersForDiscipline(activeDiscipline),
    [activeDiscipline],
  );

  // ----- Lista filtrada -----
  const base = useMemo(() => {
    return exercises.filter((e) => {
      const exType = e.exerciseType;

      // 1. Disciplina
      if (activeDiscipline !== 'all') {
        if (exType !== activeDiscipline) return false;
      } else {
        if (!exType || !preferredTypes.includes(exType)) {
          return false;
        }
      }

      // 2. Filtros configurados
      if (!exercisePassesFilters(e, availableFilters, selections)) {
        return false;
      }

      return true;
    });
  }, [exercises, activeDiscipline, preferredTypes, availableFilters, selections]);

  const filtered = useMemo(
    () => (dq.trim() ? searchExercises(base, dq) : base),
    [base, dq],
  );

  // ----- Contadores para el picker -----
  const counts = useMemo(() => {
    const c: Partial<Record<ExerciseType | 'all', number>> = {
      all: 0,
      gym: 0,
      calistenia: 0,
      cardio: 0,
    };
    exercises.forEach((e) => {
      const exType = e.exerciseType;
      if (exType && preferredTypes.includes(exType)) {
        c.all = (c.all ?? 0) + 1;
        if (c[exType] !== undefined) {
          c[exType] = (c[exType] ?? 0) + 1;
        }
      }
    });
    return c;
  }, [exercises, preferredTypes]);

  // ----- Número total de filtros activos (suma de todos los chips) -----
  const activeFilterCount = useMemo(
    () =>
      Object.values(selections).reduce(
        (acc, arr) => acc + (arr?.length ?? 0),
        0,
      ),
    [selections],
  );

  const activeDisciplineLabel = useMemo(() => {
    if (activeDiscipline === 'all') return 'Tus disciplinas';
    return (
      EXERCISE_TYPES.find((t) => t.type === activeDiscipline)?.label ??
      activeDiscipline
    );
  }, [activeDiscipline]);

  // ----- Helpers de filtros -----
  function toggleFilterValue(filterId: string, value: string) {
    setSelections((prev) => {
      const cur = prev[filterId] ?? [];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...prev, [filterId]: next };
    });
  }

  function setMuscleGroup(groupMuscles: MuscleGroup[], select: boolean) {
    setSelections((prev) => {
      const cur = prev.muscle ?? [];
      const withoutGroup = cur.filter(
        (x) => !groupMuscles.includes(x as MuscleGroup),
      );
      const next = select ? [...withoutGroup, ...groupMuscles] : withoutGroup;
      return { ...prev, muscle: next };
    });
  }

  function clearAllFilters() {
    setSelections({});
  }

  // =========================================================================
  // VISTA PICKER
  // =========================================================================
  if (viewMode === 'picker') {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} /> Volver
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold tracking-tight">
            Catálogo
          </h1>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-grad-brand px-3.5 py-2 text-xs font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.97]"
          >
            <Plus size={14} /> Crear
          </button>
        </div>

        {loading ? (
          <ListSkeleton count={4} />
        ) : (
          <DisciplinePicker
            preferredTypes={preferredTypes}
            counts={counts}
            onSelect={(d) => {
              setActiveDiscipline(d);
              setViewMode('list');
            }}
          />
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
      </div>
    );
  }

  // =========================================================================
  // VISTA LISTA
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setViewMode('picker')}
          className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} /> Disciplinas
        </button>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-grad-brand px-3.5 py-2 text-xs font-semibold text-white shadow-cta transition-all duration-200 hover:shadow-cta-hover active:scale-[0.97]"
        >
          <Plus size={14} /> Crear
        </button>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Disciplina
        </p>
        <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight">
          {activeDisciplineLabel}
        </h1>
      </div>

      {/* Chip-row: Ver todo + disciplinas activas */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-1.5">
          <DisciplineChip
            label="Ver todo"
            active={activeDiscipline === 'all'}
            onClick={() => setActiveDiscipline('all')}
          />
          {EXERCISE_TYPES.filter((t) => preferredTypes.includes(t.type)).map(
            (t) => (
              <DisciplineChip
                key={t.type}
                label={`${t.icon} ${t.label}`}
                active={activeDiscipline === t.type}
                onClick={() => setActiveDiscipline(t.type)}
              />
            ),
          )}
        </div>
      </div>

      {/* Búsqueda + filtros */}
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
            activeFilterCount > 0
              ? 'border-blue-500 bg-blue-500/10 text-blue-300'
              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
          }`}
          aria-label="Filtros"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={14} />
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-blue-500 px-1.5 text-[10px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel de filtros contextual */}
      {showFilters && (
        <div className="animate-fade-in space-y-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3">
          {availableFilters.map((filter) => {
            if (filter.grouped && filter.id === 'muscle') {
              return (
                <MuscleFilterSection
                  key={filter.id}
                  selected={(selections.muscle ?? []) as MuscleGroup[]}
                  onToggle={(m) => toggleFilterValue('muscle', m)}
                  onSetGroup={setMuscleGroup}
                  visibleRegions={VISIBLE_MUSCLE_REGIONS}
                />
              );
            }
            return (
              <CatalogFilterChips
                key={filter.id}
                title={filter.title}
                options={filter.options}
                selected={selections[filter.id] ?? []}
                onToggle={(v) => toggleFilterValue(filter.id, v)}
              />
            );
          })}

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
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

// ===========================================================================
// Sub-componentes
// ===========================================================================
function DisciplineChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
      }`}
    >
      {label}
    </button>
  );
}