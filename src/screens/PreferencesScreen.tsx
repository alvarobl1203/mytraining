import { ArrowLeft, Check } from 'lucide-react';
import { EXERCISE_TYPES } from '../lib/exerciseCategories';
import { TECHNIQUES } from '../lib/techniques';
import type { ExerciseType, Profile, TrainingMode } from '../types';

const TRAINING_MODES: {
  id: TrainingMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'simple',
    label: 'Simple',
    description: 'Solo registras peso, reps y RIR. Sin técnicas avanzadas.',
  },
  {
    id: 'assisted',
    label: 'Asistido',
    description:
      'La app sugiere técnicas avanzadas (drop-set, rest-pause, etc.) para tus ejercicios.',
  },
  {
    id: 'mixed',
    label: 'Mixto',
    description:
      'Registro simple + acceso a técnicas cuando tú las actives manualmente.',
  },
];

export function PreferencesScreen({
  profile,
  onSave,
  onBack,
}: {
  profile: Profile;
  onSave: (patch: Partial<Profile>) => Promise<void>;
  onBack: () => void;
}) {
  async function toggleType(t: ExerciseType) {
    const has = profile.preferredTypes.includes(t);
    const next = has
      ? profile.preferredTypes.filter((x) => x !== t)
      : [...profile.preferredTypes, t];
    await onSave({ preferredTypes: next });
  }

  async function toggleTechnique(id: string) {
    const has = profile.enabledTechniques.includes(id);
    const next = has
      ? profile.enabledTechniques.filter((x) => x !== id)
      : [...profile.enabledTechniques, id];
    await onSave({ enabledTechniques: next });
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <header className="sticky top-0 z-30 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold">Preferencias</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        {/* Modo */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Modo de entrenamiento
          </p>
          {TRAINING_MODES.map((m) => {
            const active = profile.trainingMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSave({ trainingMode: m.id })}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                  active
                    ? 'border-cyan-500/60 bg-cyan-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-700'
                  }`}
                >
                  {active && <Check size={12} className="text-zinc-950" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      active ? 'text-cyan-200' : 'text-zinc-200'
                    }`}
                  >
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                    {m.description}
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {/* Disciplinas */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Disciplinas
          </p>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TYPES.map((t) => {
              const on = profile.preferredTypes.includes(t.type);
              return (
                <button
                  key={t.type}
                  onClick={() => toggleType(t.type)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                    on
                      ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                  {on && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Técnicas (solo si no es simple) */}
        {profile.trainingMode !== 'simple' && (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Técnicas habilitadas
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              La app sugerirá estas técnicas en los ejercicios donde sean
              seguras.
            </p>
            <div className="space-y-2">
              {TECHNIQUES.map((t) => {
                const on = profile.enabledTechniques.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTechnique(t.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      on
                        ? 'border-cyan-500/40 bg-cyan-500/5'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            on ? 'text-cyan-200' : 'text-zinc-200'
                          }`}
                        >
                          {t.name}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                          {t.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase text-zinc-500">
                            {t.category}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${
                              t.fatigueCost === 'Alta'
                                ? 'bg-red-500/10 text-red-400'
                                : t.fatigueCost === 'Media'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            Fatiga {t.fatigueCost}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
                          on ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-700'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Interfaz */}
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Interfaz
          </p>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">
                Mostrar hints de técnica
              </p>
              <p className="text-[11px] text-zinc-500">
                Recomendaciones contextuales de protocolo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.showTechniqueHints}
              onChange={(e) =>
                onSave({ showTechniqueHints: e.target.checked })
              }
              className="h-5 w-5 shrink-0 accent-cyan-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-200">
                Mostrar panel de volumen óptimo
              </p>
              <p className="text-[11px] text-zinc-500">
                Indicadores MEV / MAV / MRV por grupo muscular.
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.showVolumePanel}
              onChange={(e) => onSave({ showVolumePanel: e.target.checked })}
              className="h-5 w-5 shrink-0 accent-cyan-500"
            />
          </label>
        </section>

        <button
          onClick={onBack}
          className="w-full rounded-2xl bg-grad-brand py-3 text-sm font-semibold text-white shadow-cta"
        >
          Guardar y volver
        </button>
      </div>
    </div>
  );
}