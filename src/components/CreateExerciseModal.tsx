import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  MUSCLE_REGIONS,
  EQUIPMENT_LIST,
} from '../lib/constants';
import type { Category, Equipment, MuscleGroup } from '../types';

type Payload = {
  name: string;
  category: Category;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions: string;
};

export function CreateExerciseModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: Payload) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Hipertrofia');
  const [primary, setPrimary] = useState<MuscleGroup>('Pectoral Medio');
  const [secondary, setSecondary] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment>('Barra');
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agrupa los músculos por región para mostrarlos categorizados
  const grouped = useMemo(() => {
    const out: { region: string; muscles: MuscleGroup[] }[] = [];
    Object.entries(MUSCLE_REGIONS).forEach(([region, muscles]) => {
      out.push({ region, muscles });
    });
    return out;
  }, []);

  async function submit() {
    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        category,
        primaryMuscle: primary,
        secondaryMuscles: secondary,
        equipment,
        instructions: instructions.trim(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Crear ejercicio personalizado</h2>
          <button onClick={onClose} className="text-zinc-500">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <Input label="Nombre" value={name} onChange={setName} />

          <Select<Category>
            label="Categoría"
            value={category}
            onChange={setCategory}
            options={['Fuerza', 'Hipertrofia', 'Cardio']}
          />

          <div>
            <p className="mb-1.5 text-xs text-zinc-400">Músculo primario</p>
            <select
              value={primary}
              onChange={(e) => setPrimary(e.target.value as MuscleGroup)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              {grouped.map(({ region, muscles }) => (
                <optgroup key={region} label={region}>
                  {muscles.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-zinc-400">
              Músculos secundarios{' '}
              <span className="text-zinc-600">
                ({secondary.length} seleccionados)
              </span>
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
              {grouped.map(({ region, muscles }) => (
                <div key={region}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    {region}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {muscles
                      .filter((m) => m !== primary)
                      .map((m) => {
                        const on = secondary.includes(m);
                        return (
                          <button
                            key={m}
                            onClick={() =>
                              setSecondary((p) =>
                                on ? p.filter((x) => x !== m) : [...p, m]
                              )
                            }
                            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                              on
                                ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Select<Equipment>
            label="Material"
            value={equipment}
            onChange={setEquipment}
            options={EQUIPMENT_LIST}
          />

          <div>
            <p className="mb-1.5 text-xs text-zinc-400">Instrucciones</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Describe la técnica…"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm placeholder-zinc-500 outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Guardar ejercicio'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-zinc-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-zinc-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}