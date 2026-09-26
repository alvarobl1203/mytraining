import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Dumbbell,
  Calculator,
  Package,
  Flame,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  type Gender,
  type ActivityLevel,
  type Equipment,
  ACTIVITY_LABELS,
  EQUIPMENT_OPTIONS,
  calculateTDEE,
} from '@/types/profile';

interface OnboardingScreenProps {
  userId: string;
  onComplete: () => void;
}

const ACTIVITY_ORDER: ActivityLevel[] = [
  'sedentario',
  'ligero',
  'moderado',
  'activo',
  'muy_activo',
];

export default function OnboardingScreen({ userId, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Biometrics
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Objectives
  const [activity, setActivity] = useState<ActivityLevel | ''>('');

  // Equipment
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const tdee =
    age && gender && weight && height && activity
      ? calculateTDEE(
          parseFloat(weight),
          parseInt(height),
          parseInt(age),
          gender,
          activity
        )
      : null;

  const biometricsValid =
    age &&
    gender &&
    weight &&
    height &&
    parseInt(age) >= 13 &&
    parseInt(age) <= 100 &&
    parseFloat(weight) >= 30 &&
    parseFloat(weight) <= 300 &&
    parseInt(height) >= 120 &&
    parseInt(height) <= 250;

  function toggleEquipment(item: Equipment) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  async function handleFinish() {
    if (!tdee || !biometricsValid || !activity) return;
    setSaving(true);
    setError('');

    try {
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        age: parseInt(age),
        gender,
        weight_kg: parseFloat(weight),
        height_cm: parseInt(height),
        activity_level: activity,
        tdee_maintenance: tdee.maintenance,
        tdee_deficit: tdee.deficit,
        tdee_surplus: tdee.surplus,
        equipment,
        onboarding_completed: true,
      });

      if (error) throw error;
      onComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const canProceed =
    step === 0 ? biometricsValid : step === 1 ? !!activity : equipment.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex-1 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'gradient-brand' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500 font-medium">{step + 1}/3</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 px-5 pb-28 overflow-y-auto no-scrollbar">
        {/* Step 0: Biometrics */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center">
                <Dumbbell size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Biometría</h2>
                <p className="text-xs text-zinc-400">Cuéntanos sobre ti</p>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Género</label>
              <div className="grid grid-cols-2 gap-2">
                {(['masculino', 'femenino'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-2xl text-sm font-semibold capitalize transition-all duration-200 ${
                      gender === g
                        ? 'gradient-brand text-white shadow-glow'
                        : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                    }`}
                  >
                    {g === 'masculino' ? 'Hombre' : 'Mujer'}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-2 block">Edad (años)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ej. 28"
                min={13}
                max={100}
                className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Weight + Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Peso (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ej. 75"
                  min={30}
                  max={300}
                  step="0.1"
                  className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-2 block">Altura (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ej. 175"
                  min={120}
                  max={250}
                  className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Objectives */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center">
                <Calculator size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Objetivos</h2>
                <p className="text-xs text-zinc-400">Nivel de actividad</p>
              </div>
            </div>

            <div className="space-y-2">
              {ACTIVITY_ORDER.map((level) => (
                <button
                  key={level}
                  onClick={() => setActivity(level)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-sm font-semibold text-left transition-all duration-200 flex items-center justify-between ${
                    activity === level
                      ? 'gradient-brand text-white shadow-glow'
                      : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                  }`}
                >
                  {ACTIVITY_LABELS[level]}
                  {activity === level && <Check size={16} />}
                </button>
              ))}
            </div>

            {/* TDEE Results */}
            {tdee && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-medium text-zinc-400">
                  Gasto calórico estimado (TDEE)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
                    <Flame size={18} className="text-cyan-400 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-500 mb-1">Mantenimiento</p>
                    <p className="text-lg font-bold text-white">{tdee.maintenance}</p>
                    <p className="text-[10px] text-zinc-600">kcal/día</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
                    <TrendingDown size={18} className="text-blue-400 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-500 mb-1">Déficit</p>
                    <p className="text-lg font-bold text-white">{tdee.deficit}</p>
                    <p className="text-[10px] text-zinc-600">kcal/día</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800/50 rounded-2xl p-3 text-center">
                    <TrendingUp size={18} className="text-cyan-400 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-500 mb-1">Volumen</p>
                    <p className="text-lg font-bold text-white">{tdee.surplus}</p>
                    <p className="text-[10px] text-zinc-600">kcal/día</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Equipment */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center">
                <Package size={20} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Material disponible</h2>
                <p className="text-xs text-zinc-400">Selecciona lo que tienes acceso</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((item) => {
                const selected = equipment.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'gradient-brand text-white shadow-glow'
                        : 'bg-zinc-900 border border-zinc-800/50 text-zinc-400'
                    }`}
                  >
                    {selected && <Check size={14} className="inline mr-1.5 -mt-0.5" />}
                    {item}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer button */}
      <div className="fixed bottom-0 inset-x-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 px-5 py-4 safe-bottom">
        <div className="mx-auto max-w-md">
          {step < 2 ? (
            <button
              onClick={() => canProceed && setStep(step + 1)}
              disabled={!canProceed}
              className="w-full gradient-brand text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canProceed || saving}
              className="w-full gradient-brand text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Finalizar y empezar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
