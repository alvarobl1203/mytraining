import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Plus, Loader2, Check, ArrowLeft } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import ExerciseCard from '@/components/ExerciseCard';
import {
  type MuscleGroup,
  type Equipment,
  type ExerciseCategory,
  MUSCLE_GROUPS,
  EQUIPMENT_LIST,
  CATEGORIES,
} from '@/types/exercise';
import type { Exercise } from '@/types/exercise';
import { supabase } from '@/lib/supabase';

type View = 'list' | 'detail' | 'create';

export default function ExerciseCatalog() {
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [muscleFilters, setMuscleFilters] = useState<MuscleGroup[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<ExerciseCategory[]>([]);
  const [equipmentFilters, setEquipmentFilters] = useState<Equipment[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);

  const { exercises, loading, createExercise } = useExercises(
    search,
    muscleFilters,
    categoryFilters,
    equipmentFilters
  );

  const activeFilterCount =
    muscleFilters.length + categoryFilters.length + equipmentFilters.length;

  function toggleMuscle(m: MuscleGroup) {
    setMuscleFilters((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  function toggleCategory(c: ExerciseCategory) {
    setCategoryFilters((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleEquipment(e: Equipment) {
    setEquipmentFilters((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  }

  function clearFilters() {
    setMuscleFilters([]);
    setCategoryFilters([]);
    setEquipmentFilters([]);
  }

  // Detail view
  if (view === 'detail' && selected) {
    return (
      <div className="pt-2 space-y-4">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-5">
          <h2 className="text-xl font-bold text-white mb-1">{selected.name}</h2>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400">
            {selected.category}
          </span>

          <div className="mt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Músculo Primario</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-cyan-300">
              {selected.primary_muscle}
            </span>
          </div>

          {selected.secondary_muscles.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Músculos Secundarios</p>
              <div className="flex flex-wrap gap-2">
                {selected.secondary_muscles.map((m) => (
                  <span
                    key={m}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Material</p>
            <p className="text-sm text-white">{selected.equipment}</p>
          </div>

          {selected.instructions && (
            <div className="mt-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Instrucciones</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{selected.instructions}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create view
  if (view === 'create') {
    return <CreateExerciseForm onCreate={createExercise} onBack={() => setView('list')} />;
  }

  // List view
  return (
    <div className="pt-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Catálogo de Ejercicios</h2>
        <button
          onClick={() => setView('create')}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl gradient-brand text-white shadow-glow hover:opacity-90 transition-all"
        >
          <Plus size={14} /> Crear
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl pl-11 pr-12 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-500 hover:text-cyan-400 transition-colors"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-brand text-[8px] font-bold text-white flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...muscleFilters, ...categoryFilters, ...equipmentFilters].map((f) => (
            <span
              key={f}
              className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-cyan-300 flex items-center gap-1"
            >
              {f}
              <button
                onClick={() => {
                  toggleMuscle(f as MuscleGroup);
                  toggleCategory(f as ExerciseCategory);
                  toggleEquipment(f as Equipment);
                }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <FilterChip
                  key={c}
                  label={c}
                  active={categoryFilters.includes(c)}
                  onClick={() => toggleCategory(c)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Músculo</p>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map((m) => (
                <FilterChip
                  key={m}
                  label={m}
                  active={muscleFilters.includes(m)}
                  onClick={() => toggleMuscle(m)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Material</p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_LIST.map((e) => (
                <FilterChip
                  key={e}
                  label={e}
                  active={equipmentFilters.includes(e)}
                  onClick={() => toggleEquipment(e)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-zinc-500">
        {loading ? 'Buscando...' : `${exercises.length} ejercicio${exercises.length !== 1 ? 's' : ''}`}
      </p>

      {/* Exercise list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-cyan-400" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-500">No se encontraron ejercicios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => {
                setSelected(ex);
                setView('detail');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
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
      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
        active
          ? 'gradient-brand text-white shadow-glow'
          : 'bg-zinc-800 border border-zinc-800/50 text-zinc-400'
      }`}
    >
      {active && <Check size={11} className="inline mr-1 -mt-0.5" />}
      {label}
    </button>
  );
}

function CreateExerciseForm({
  onCreate,
  onBack,
}: {
  onCreate: (data: Omit<Exercise, 'id' | 'created_at' | 'is_public' | 'user_id'>) => Promise<void>;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | ''>('');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup | ''>('');
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment | ''>('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const valid = name.trim() && category && primaryMuscle && equipment;

  function toggleSecondary(m: MuscleGroup) {
    if (m === primaryMuscle) return;
    setSecondaryMuscles((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  async function handleSubmit() {
    if (!valid || !primaryMuscle || !equipment || !category) return;
    setSaving(true);
    setError('');
    try {
      await onCreate({
        name: name.trim(),
        category,
        primary_muscle: primaryMuscle,
        secondary_muscles: secondaryMuscles,
        equipment,
        instructions: instructions.trim(),
      });
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pt-2 space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <h2 className="text-xl font-bold text-white">Crear Ejercicio Personalizado</h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 mb-2 block">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Press Militar con Kettlebell"
            className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-2 block">Categoría</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  category === c
                    ? 'gradient-brand text-white shadow-glow'
                    : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-2 block">Músculo Primario</label>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => setPrimaryMuscle(m)}
                disabled={secondaryMuscles.includes(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-30 ${
                  primaryMuscle === m
                    ? 'gradient-brand text-white shadow-glow'
                    : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-2 block">
            Músculos Secundarios (opcional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => toggleSecondary(m)}
                disabled={m === primaryMuscle}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-30 ${
                  secondaryMuscles.includes(m)
                    ? 'bg-blue-500/15 border border-blue-500/30 text-cyan-300'
                    : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                }`}
              >
                {secondaryMuscles.includes(m) && <Check size={11} className="inline mr-1 -mt-0.5" />}
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-2 block">Material</label>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT_LIST.map((e) => (
              <button
                key={e}
                onClick={() => setEquipment(e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  equipment === e
                    ? 'gradient-brand text-white shadow-glow'
                    : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-400 mb-2 block">
            Instrucciones (opcional)
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Describe cómo realizar el ejercicio..."
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!valid || saving}
          className="w-full gradient-brand text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Guardar ejercicio
        </button>
      </div>
    </div>
  );
}
