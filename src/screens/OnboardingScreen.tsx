import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ActivityLevel, Equipment, Gender, Profile } from '../types';
import { ACTIVITY_FACTORS, EQUIPMENT_LIST } from '../lib/constants';
import { tdee } from '../lib/calculations';

type Props = {
  profile: Profile | null;
  onComplete: (patch: Partial<Profile>) => Promise<void>;
};

export function OnboardingScreen({ profile, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState(profile?.age ?? 25);
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'Hombre');
  const [weight, setWeight] = useState(profile?.weightKg ?? 75);
  const [height, setHeight] = useState(profile?.heightCm ?? 175);
  const [activity, setActivity] = useState<ActivityLevel>(
    profile?.activityLevel ?? 'Moderado'
  );
  const [equipment, setEquipment] = useState<Equipment[]>(
    profile?.availableEquipment ?? []
  );
  const [saving, setSaving] = useState(false);

  const kcal = tdee(weight, height, age, gender, activity);

  async function finish() {
    setSaving(true);
    try {
      await onComplete({
        age,
        gender,
        weightKg: weight,
        heightCm: height,
        activityLevel: activity,
        availableEquipment: equipment,
        onboardingCompleted: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Biometría</h2>
            <NumberField label="Edad" value={age} onChange={setAge} unit="años" />
            <div>
              <p className="mb-2 text-sm text-zinc-400">Género</p>
              <div className="grid grid-cols-3 gap-2">
                {(['Hombre', 'Mujer', 'Otro'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      gender === g
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <NumberField label="Peso" value={weight} onChange={setWeight} unit="kg" />
            <NumberField label="Altura" value={height} onChange={setHeight} unit="cm" />
            <PrimaryBtn onClick={() => setStep(2)}>Continuar</PrimaryBtn>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Objetivos</h2>
            <p className="text-sm text-zinc-400">Nivel de actividad</p>
            <div className="space-y-2">
              {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setActivity(a)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    activity === a
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-800 bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        activity === a ? 'text-blue-300' : 'text-zinc-200'
                      }`}
                    >
                      {a}
                    </span>
                    <span className="text-xs text-zinc-500">
                      ×{ACTIVITY_FACTORS[a]}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <KcalCard label="Mantenimiento" value={kcal} />
              <KcalCard label="Déficit" value={kcal - 500} />
              <KcalCard label="Volumen" value={kcal + 300} />
            </div>

            <div className="flex gap-2">
              <GhostBtn onClick={() => setStep(1)}>Atrás</GhostBtn>
              <PrimaryBtn onClick={() => setStep(3)}>Continuar</PrimaryBtn>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Material disponible</h2>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_LIST.map((eq) => {
                const on = equipment.includes(eq);
                return (
                  <button
                    key={eq}
                    onClick={() =>
                      setEquipment((prev) =>
                        on ? prev.filter((x) => x !== eq) : [...prev, eq]
                      )
                    }
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                      on
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {on && <Check size={12} />} {eq}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <GhostBtn onClick={() => setStep(2)}>Atrás</GhostBtn>
              <PrimaryBtn
                onClick={finish}
                disabled={saving || equipment.length === 0}
              >
                {saving ? 'Guardando…' : 'Finalizar'}
              </PrimaryBtn>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-zinc-400">
        {label} <span className="text-zinc-600">({unit})</span>
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function KcalCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3 text-center">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-100">{value}</p>
      <p className="text-[10px] text-zinc-600">kcal</p>
    </div>
  );
}

function PrimaryBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function GhostBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-3 text-sm text-zinc-300"
    >
      {children}
    </button>
  );
}